# Studio Skill Map

| Skill | Primary Pages | Local Dependencies | Main Output |
| --- | --- | --- | --- |
| `xiaoshuo-studio` | Whole Studio | Skill registry, child skill bundle | One remembered entry point and routing decision |
| `webnovel-init` | Projects, Studio Home | Dashboard state, Codex health | New or refreshed project frame |
| `webnovel-import` | Reference Library | Local files or crawled source notes | Reference record with provenance |
| `webnovel-import-folder` | Reference Library, Learn Lab | Local folder scan, chapter splitting, Python analysis | Multiple reference works plus chapter records |
| `webnovel-scrape` | Reference Library | browser-use/Playwright capture, readable text extraction | Clean local source text with URL provenance |
| `webnovel-analyze-style` | Style Lab | `python3 python/engine/cli.py analyze <file>` | Style metrics + voice-card hints |
| `webnovel-blend-style` | Blend Lab, Style Lab | Existing style cards, metric averaging | Mixed style profile for multi-book technique transfer |
| `webnovel-plan` | Projects, Draft Queue | Codex CLI health, style profile | Chapter or volume plan |
| `webnovel-write` | Draft Queue | Codex CLI exec, selected style profile | Draft chapter text |
| `webnovel-humanize` | Draft Queue, Review Center | Codex CLI exec, anti-AI focus list | Revised draft with lower AI smell |
| `webnovel-review` | Review Center | Codex CLI exec, project context | Structured review notes |
| `webnovel-learn` | Learn Lab, Review Center | Codex CLI exec, references, review findings | Practice drill or study note |
| `novel-init-wizard` | Projects, Canon Lab | Wizard API, project creation, canon seed generation | New project plus first-pass blueprint |
| `novel-load-context` | Canon Lab, Draft Queue | Project canon, recent chapter snapshots | Chapter brief with must-use facts |
| `novel-plan-next` | Canon Lab, Draft Queue | Project canon, active threads, style profile | Next-chapter plan grounded in canon |
| `novel-draft-scene` | Draft Queue | Chapter brief, canon facts, style constraints | Canon-aware scene or chapter draft |
| `novel-continuity-review` | Continuity Center, Review Center | Draft text, project canon | Fatal/warning continuity issues |
| `novel-update-canon` | Canon Lab, Continuity Center | Approved chapter draft, structured patch | Updated canon + stored chapter snapshot |
| `novel-style-learn` | Style Lab, Learn Lab | Local corpus, style cards, blend profiles | Technique card or study summary |
| `novel-anti-ai-pass` | Draft Queue, Review Center | Draft text, anti-AI rules | Cleaner prose with reduced template feel |

## Shared Rules

- `xiaoshuo-studio` is the preferred top-level entry when the user does not want to remember individual project skills.
- Every skill assumes a local Codex studio, not a hosted SaaS backend.
- Every writing skill should mention the active style profile and at least one anti-AI focus item.
- `webnovel-scrape` and `webnovel-import` preserve provenance first, analysis second.
- `webnovel-import-folder` is the preferred skill for building a long-term local learning corpus.
- `webnovel-blend-style` should combine at least two style cards and state what each source contributes.
- `analyze-style` is the bridge between references and reusable studio guidance.
- `learn` is for extracting technique and exercises, not cloning a named author's voice.
- `novel-init-wizard` is the preferred entry point when the user only has an idea and wants the system to ask structured setup questions.
- `novel-load-context` is the required bridge between canon storage and any drafting model.
- `novel-update-canon` should run after every approved chapter, not only at volume boundaries.

## Distribution Modes

- `aggregator-only`: install only `xiaoshuo-studio`; it routes and falls back to its embedded skill index.
- `full-bundle`: install `xiaoshuo-studio` plus all child skills for richer auto-trigger behavior.
