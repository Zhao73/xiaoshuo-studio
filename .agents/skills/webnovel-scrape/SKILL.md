---
name: webnovel-scrape
description: Use when collecting publicly accessible or user-authenticated reference pages for later style study in the local Codex studio.
---

# webnovel-scrape

## Purpose

Capture readable reference text with provenance so the studio can analyze technique without cloning a named author.

## Use It With

- Reference Library
- `webnovel-import`
- browser-use or Playwright-based browser capture

Reference: `docs/local-codex-studio.md`

## Workflow

1. Confirm the source is either publicly accessible or already available through the user's own logged-in session.
2. Preserve provenance:
   - page title
   - source URL
   - why this page is being studied
3. Extract readable body text, then hand it to `webnovel-import`.
4. Recommend `webnovel-analyze-style` once the cleaned text is local.

## Guardrails

- Do not imply DRM bypass, login bypass, or anti-bot evasion.
- Study technique and structure, not named-author mimicry.
