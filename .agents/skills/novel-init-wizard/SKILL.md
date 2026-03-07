---
name: novel-init-wizard
description: Use when creating a new fiction project through a deep planning interview, especially when the model should ask staged questions about genre, protagonist, world setup, conflict, and first-volume direction before creating the project.
---

# novel-init-wizard

## Purpose

Create a new novel project by walking the user through a staged planning interview instead of asking for one flat premise.

Reference: `docs/local-codex-studio.md`

## Workflow

1. Start a wizard session with `POST /api/wizard/start`.
2. Ask one question at a time.
3. Prefer short options first; allow custom input when the user's answer does not fit.
4. Continue through the full session until the wizard returns a preview.
5. Show the preview summary:
   - title
   - genre
   - premise
   - key roles
   - volume one direction
   - chapter one brief
6. Only after confirmation, call `POST /api/wizard/finish`.

## Guardrails

- Do not skip ahead and invent unanswered fields.
- Do not collapse the whole interview into one giant prompt.
- The wizard creates project seed, canon seed, volume outline, and chapter one brief; it does not directly draft chapter one.
