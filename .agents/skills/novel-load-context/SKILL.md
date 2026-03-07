---
name: novel-load-context
description: Use when drafting, planning, or reviewing a long-form fiction chapter and the model must load canon facts instead of relying on fragile prompt memory.
---

# novel-load-context

## Purpose

Build a minimal context pack from project canon before any chapter planning or drafting.

Reference: `docs/local-codex-studio.md`

## Workflow

1. Read the current canon with `GET /api/canon?projectId=<id>`.
2. Build a chapter brief with `POST /api/chapters/brief`.
3. Restate:
   - chapter goal
   - must-use facts
   - forbidden moves
   - style constraints
4. Stop if the canon is missing key facts. Ask for canon repair instead of improvising.

## Guardrails

- Canon facts override vague user memory.
- Treat missing data as a blocker, not an invitation to hallucinate.
- Prefer 8-12 hard facts over dumping raw history.
