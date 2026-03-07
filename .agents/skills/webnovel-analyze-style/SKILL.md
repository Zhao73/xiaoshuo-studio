---
name: webnovel-analyze-style
description: Use when converting a local reference file into reusable style metrics and anti-AI guidance for the Codex studio.
---

# webnovel-analyze-style

## Mandatory Command

```bash
python3 python/engine/cli.py analyze <file>
```

Reference: `docs/style-analysis-contract.md`

## Workflow

1. Verify the target file exists and is the exact reference to analyze.
2. Run the Python CLI.
3. If the command fails, stop and report the stderr clearly.
4. Read the JSON output and convert it into a dashboard-friendly style profile:
   - metrics
   - direction tags
   - anti-AI focus list
   - short summary
5. Recommend whether the profile is ready for planning, writing, or further reference blending.

## Guardrails

- Extract technique; do not phrase the result as “write like author X”.
- Preserve raw metrics and the human-facing summary together.

## Output

- A style profile for Style Lab.
- Anti-AI focus items that later writing skills can consume.
