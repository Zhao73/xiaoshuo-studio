from __future__ import annotations

import re
from collections.abc import Iterable
from pathlib import Path

SENSORY_WORDS = (
    "闻",
    "听",
    "看",
    "摸",
    "冷",
    "热",
    "潮",
    "香",
    "腥",
    "痛",
    "亮",
    "暗",
    "响",
    "影",
    "雾",
    "雨",
    "风",
    "光",
    "味",
)

EXPLANATION_MARKERS = (
    "仿佛",
    "似乎",
    "其实",
    "开始觉得",
    "显得",
    "意味着",
    "象征",
    "内心",
    "情绪",
)

SCENE_MARKERS = ("***", "---", "###")
SENTENCE_SPLIT_RE = re.compile(r"[。！？!?；;]+")
TITLE_RE = re.compile(r"^\s*#\s*(.+?)\s*$", re.MULTILINE)
QUOTE_CHARS = ('"', "'", "“", "”")


def _split_paragraphs(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]


def _split_sentences(text: str) -> list[str]:
    return [part.strip() for part in SENTENCE_SPLIT_RE.split(text) if part.strip()]


def _extract_title(text: str, title_hint: str | None = None) -> str:
    if title_hint:
        return title_hint.strip()

    matched = TITLE_RE.search(text)
    if matched:
        return matched.group(1).strip()

    for line in text.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped[:40]

    return "Untitled Reference"


def _count_dialogue_sentences(sentences: Iterable[str]) -> int:
    total = 0
    for sentence in sentences:
        if any(char in sentence for char in QUOTE_CHARS):
            total += 1
    return total


def _count_sensory_hits(text: str) -> int:
    return sum(text.count(word) for word in SENSORY_WORDS)


def _estimate_scene_breaks(text: str) -> int:
    return sum(text.count(marker) for marker in SCENE_MARKERS)


def _anti_ai_flags(
    *,
    avg_sentence_length: float,
    dialogue_ratio: float,
    sensory_density: float,
    explanation_density: float,
) -> list[str]:
    flags: list[str] = []

    if explanation_density >= 0.12:
        flags.append("减少解释腔")
    if sensory_density < 0.08:
        flags.append("补足感官锚点")
    if dialogue_ratio < 0.18:
        flags.append("增加角色交锋")
    if avg_sentence_length > 28:
        flags.append("打断均匀长句")

    if not flags:
        flags.append("保持具体动作与细节密度")

    return flags


def analyze_text(
    text: str,
    title: str | None = None,
    title_hint: str | None = None,
) -> dict[str, object]:
    paragraphs = _split_paragraphs(text)
    sentences = _split_sentences(text)
    sentence_count = max(1, len(sentences))
    total_chars = sum(len(sentence) for sentence in sentences)
    avg_sentence_length = round(total_chars / sentence_count, 2)
    dialogue_ratio = round(_count_dialogue_sentences(sentences) / sentence_count, 3)
    scene_breaks = _estimate_scene_breaks(text)
    sensory_density = round(_count_sensory_hits(text) / max(1, total_chars), 3)
    explanation_density = round(
        sum(text.count(marker) for marker in EXPLANATION_MARKERS) / max(1, sentence_count),
        3,
    )

    anti_ai_flags = _anti_ai_flags(
        avg_sentence_length=avg_sentence_length,
        dialogue_ratio=dialogue_ratio,
        sensory_density=sensory_density,
        explanation_density=explanation_density,
    )
    style_summary = (
        f"句子平均长度约 {avg_sentence_length} 字，"
        f"对白占比 {dialogue_ratio:.1%}，"
        f"场景切换 {scene_breaks} 次，"
        "建议继续做技法混合，不模仿具体作者。"
    )

    return {
        "title": _extract_title(text, title_hint=title or title_hint),
        "metrics": {
            "sentence_count": sentence_count,
            "avg_sentence_length": avg_sentence_length,
            "dialogue_ratio": dialogue_ratio,
            "scene_breaks": scene_breaks,
            "sensory_density": sensory_density,
        },
        "anti_ai_flags": anti_ai_flags,
        "style_summary": style_summary,
    }


def analyze_file(file_path: str | Path) -> dict[str, object]:
    target = Path(file_path)
    text = target.read_text(encoding="utf-8").strip()
    return analyze_text(text)
