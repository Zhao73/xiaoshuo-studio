---
name: webnovel-import-folder
description: Use when importing a whole local folder of downloaded novels or reference texts into the Codex studio for long-term study.
---

# webnovel-import-folder

## Purpose

Build a local learning corpus from many `.txt` or `.md` files at once.

## Use It With

- Reference Library
- Learn Lab
- Style Lab

Reference: `docs/local-codex-studio.md`

## Workflow

1. Confirm the folder path is local and readable.
2. Scan it recursively for supported text files.
3. Create one reference record per file with provenance.
4. Split each file into chapter-like units where possible.
5. Run style analysis per imported work.
6. Recommend `webnovel-blend-style` when there are enough style cards.

## Guardrails

- Study technique, not named-author cloning.
- Preserve which file each imported style card came from.

## Output

- A corpus import summary with imported works, chapter counts, and generated style cards.
