---
name: webnovel-write
description: Use when drafting a chapter in the local Codex studio from an approved plan and a selected style profile.
---

# webnovel-write

## Purpose

Draft prose from the studio plan while staying grounded in technique-derived voice guidance.

## Requirements

- Local Codex CLI available
- Active project context
- Plan summary
- Style profile with anti-AI focus items

Reference: `docs/local-codex-studio.md`

## Workflow

1. Confirm the plan is specific enough to write from.
2. Restate the active anti-AI focus list before drafting.
3. Write the draft as a local Codex execution task, not as a generic chat answer.
4. Keep the prose aligned to:
   - project premise
   - scene goal
   - hook target
   - anti-AI focus list
5. Queue `webnovel-humanize` or `webnovel-review` immediately after drafting.

## Guardrails

- Use reference-derived techniques, not named-author mimicry.
- Prefer scene-level concreteness over abstract explanation.

## Output

- A draft suitable for the Draft Queue and Review Center.
