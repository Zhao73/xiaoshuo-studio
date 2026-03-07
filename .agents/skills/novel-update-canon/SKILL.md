---
name: novel-update-canon
description: Use when an approved fiction chapter must update project canon so later chapters inherit the right character state, timeline, and open-thread status.
---

# novel-update-canon

## Purpose

Convert a finished chapter into updated canon state.

Reference API: `POST /api/chapters/update-canon`

## Workflow

1. Extract a structured patch from the approved draft:
   - changed character states
   - new timeline events
   - newly opened threads
   - resolved thread titles
   - new foreshadowing
2. Keep the patch minimal and factual.
3. Submit the patch with the chapter title, summary, and draft text.
4. Confirm the canon update succeeded before starting the next chapter.

## Guardrails

- Only update facts justified by the chapter text.
- Do not silently rewrite old canon to make a draft fit.
- One approved chapter should produce one canon update.
