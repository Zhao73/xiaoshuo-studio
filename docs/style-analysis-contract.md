# Style Analysis Contract

The deterministic style analysis entrypoint is fixed to:

```bash
python3 python/engine/cli.py analyze <file>
```

## Input

- A single local file path.
- Typical inputs are `.txt`, `.md`, or cleaned text extracted from crawled pages.

## Expected Output

The CLI must emit a single JSON object with exactly these top-level fields:

```json
{
  "title": "夜航样本",
  "metrics": {
    "sentence_count": 128,
    "avg_sentence_length": 15.2,
    "dialogue_ratio": 0.41,
    "scene_breaks": 3,
    "sensory_density": 0.28
  },
  "anti_ai_flags": ["减少解释腔", "避免抽象抒情"],
  "style_summary": "短句推进，场景落点清晰，章末留钩。"
}
```

The web app is responsible for converting these raw metrics into dashboard-facing style cards and anti-AI focus items.

## Error Handling

- Missing file: exit non-zero and print a clear message to stderr.
- Unsupported or empty file: exit non-zero and explain the reason.
- Partial success is not valid; skills should not infer missing metrics or missing top-level keys.

## How Skills Use It

- `webnovel-analyze-style` treats this command as mandatory.
- `webnovel-plan`, `webnovel-write`, `webnovel-humanize`, and `webnovel-learn` consume the resulting metrics or derived anti-AI focus as guidance.
- The dashboard's Style Lab should surface both raw metrics and the human-facing style-card summary.
