---
name: xiaoshuo-studio
description: Use when working anywhere inside the xiaoshuo fiction studio and you want one entry skill to route project setup, reference import, style learning, drafting, review, or canon updates to the right workflow.
---

# xiaoshuo-studio

## Purpose

Provide one remembered entry point for the entire `xiaoshuo` workflow.

Reference: `references/skill-index.md`

## Workflow

1. Classify the user's request:
   - build a new project
   - import references
   - learn or blend style
   - load canon or plan the next chapter
   - draft or humanize
   - review or update canon
2. Route to the smallest matching project skill or pair of skills.
3. If the child skills are installed, defer to them explicitly.
4. If only this aggregator skill is installed, follow the corresponding summary in `references/skill-index.md`.
5. Ask only for the missing input that blocks the routed workflow.

## Guardrails

- Do not answer as a generic writing assistant when a project workflow exists.
- Prefer routing over duplicating child-skill instructions.
- Use one or two target skills, not a long chain by default.
