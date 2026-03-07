---
name: webnovel-import
description: Use when adding reference material into the local Codex studio from uploaded text, cleaned files, or crawled source notes.
---

# webnovel-import

## Purpose

Bring reference material into the Reference Library with enough provenance to be learnable later.

## Use It With

- Reference Library
- Style Lab

Reference: `docs/local-codex-studio.md`

## Workflow

1. Identify the source type: upload, cleaned export, or crawled page text.
2. Preserve provenance:
   - title
   - author hint
   - source path or URL note
   - notes about why the source matters
3. Store the reference in a way the dashboard can list and later pass to style analysis.
4. For a whole local corpus, recommend `webnovel-import-folder` instead.
5. Recommend `webnovel-analyze-style` when the source is ready.

## Guardrails

- Keep source provenance attached.
- Import for technique study, not for direct cloning.

## Output

- A reference-library-ready record with source notes.
