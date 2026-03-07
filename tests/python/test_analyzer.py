from pathlib import Path

from python.engine.analyzer import analyze_file, analyze_text


def test_analyze_text_extracts_core_metrics():
    sample = """
    “你昨晚没回来。”
    她把杯子放下，杯沿碰到木桌，发出很轻的一声。

    我望着窗外的雨线，没有马上解释。

    ---

    “先说重点，”她盯着我，“那封信是谁写的？”
    """

    result = analyze_text(sample, title="样本")

    assert result["title"] == "样本"
    assert result["metrics"]["sentence_count"] >= 3
    assert result["metrics"]["dialogue_ratio"] > 0.15
    assert result["metrics"]["scene_breaks"] == 1
    assert result["metrics"]["sensory_density"] > 0
    assert "style_summary" in result


def test_analyze_text_flags_ai_smell_patterns():
    sample = """
    他感到一种难以言说的情绪在胸口蔓延，仿佛命运的潮水正在无声地逼近。
    这种感觉让他忽然意识到，很多事情其实早已注定，只是他此前没有真正明白。
    他觉得自己必须做点什么，可到底要做什么，却又说不出来。
    """

    result = analyze_text(sample, title="抽象抒情样本")

    assert result["anti_ai_flags"]
    assert any("解释" in flag or "抽象" in flag for flag in result["anti_ai_flags"])


def test_analyze_file_reads_markdown_title(tmp_path: Path):
    file_path = tmp_path / "sample.md"
    file_path.write_text("# 雨夜样本\n\n“门开着。”\n他闻到了潮湿的铁锈味。", encoding="utf-8")

    result = analyze_file(file_path)

    assert result["title"] == "雨夜样本"
    assert result["metrics"]["sentence_count"] >= 1
