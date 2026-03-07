---
name: novel-continuity-review
description: Use when a fiction draft may contain character-state, timeline, location, or rule conflicts and must be checked against canon before approval.
---

# novel-continuity-review

## Purpose

Detect blocking canon conflicts before a draft is accepted.

Reference API: `POST /api/chapters/continuity-check`

## Workflow

1. Load canon context for the active project.
2. Run the continuity check route on the latest draft.
3. Sort issues into:
   - fatal
   - warning
4. Quote the exact canon fact the draft conflicts with.
5. Recommend the smallest fix that restores continuity.

## Guardrails

- Blocking continuity issues outrank style improvements.
- Do not say "looks fine" without checking the canon route.
- If no issues appear, still confirm which canon areas were checked.
