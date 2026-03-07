from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from python.engine.analyzer import analyze_text


def test_analyze_text_returns_locked_contract_metrics() -> None:
    sample = """
    # 风格样本

    “雨下大了。”他看着街口的霓虹，声音压得很低。

    我闻到潮湿铁锈味的时候，才意识到巷子里还有第三个人。

    她把刀背敲在桌沿，像是在提醒，也像是在倒数。
    """

    result = analyze_text(sample, title_hint="风格样本")

    assert result["title"] == "风格样本"
    assert set(result["metrics"]) >= {
        "sentence_count",
        "avg_sentence_length",
        "dialogue_ratio",
        "scene_breaks",
        "sensory_density",
    }
    assert isinstance(result["anti_ai_flags"], list)
    assert isinstance(result["style_summary"], str)
    assert result["metrics"]["sentence_count"] >= 3
    assert result["metrics"]["dialogue_ratio"] > 0


def test_cli_analyze_emits_json_contract(tmp_path: Path) -> None:
    sample_path = tmp_path / "sample.md"
    sample_path.write_text(
        "# 夜航样本\n\n"
        "“别回头。”他说。\n\n"
        "风从码头灌进来，带着潮湿的盐味和机油味。\n\n"
        "她没有回答，只是把脚步放得更轻。",
        encoding="utf-8",
    )

    result = subprocess.run(
        [sys.executable, "python/engine/cli.py", "analyze", str(sample_path)],
        capture_output=True,
        check=False,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    payload = json.loads(result.stdout)

    assert sorted(payload.keys()) == [
        "anti_ai_flags",
        "metrics",
        "style_summary",
        "title",
    ]
    assert payload["title"] == "夜航样本"
    assert payload["metrics"]["scene_breaks"] >= 0
