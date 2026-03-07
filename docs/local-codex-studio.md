# Local Codex Studio

`xiaoshuo` is a repo-local Codex studio for long-form fiction work. It assumes three local execution surfaces:

1. A web dashboard for project, reference, style, queue, review, and learning pages.
2. A Python analysis CLI for deterministic style extraction.
3. A locally installed Codex CLI for health checks and execution.

## Dashboard Pages

The dashboard is the control surface. Skills should map their work to these page concepts even if the UI is still being built:

| Page | Purpose |
| --- | --- |
| Studio Home | Snapshot of projects, queued jobs, and style-profile counts |
| Projects | Create or inspect a novel project, premise, genre, and current state |
| Reference Library | Import uploaded text or crawled references and keep source notes |
| Style Lab | Generate and compare style profiles and anti-AI focus lists |
| Blend Lab | Combine multiple style profiles into a reusable mixed writing profile |
| Canon Lab | Maintain story bible, character state, timeline, foreshadowing, and open threads |
| Draft Queue | Queue `plan`, `write`, `humanize`, and `review` jobs |
| Continuity Center | Check drafts against canon facts before treating them as current truth |
| Review Center | Read review outputs and spot continuity, pacing, and AI-smell issues |
| Learn Lab | Turn references and review findings into drills and writing exercises |
| Settings | Check Codex CLI health and local runtime wiring |

## Local Runtime Contracts

### Python CLI

Style analysis must use:

```bash
python3 python/engine/cli.py analyze <file>
```

The command must return a JSON object with these top-level keys:

- `title`
- `metrics`
- `anti_ai_flags`
- `style_summary`

`metrics` must include at least:

- `sentence_count`
- `avg_sentence_length`
- `dialogue_ratio`
- `scene_breaks`
- `sensory_density`

Skills must stop and report the failure if the command is missing or exits non-zero.

### Codex CLI Health

Before queueing a Codex-driven writing task, confirm local availability:

```bash
codex --version
```

If the command is unavailable, direct the user to install Codex CLI and log in locally. Do not fall back to remote API assumptions.

### Codex CLI Execution

`plan`, `write`, `humanize`, `review`, and `learn` are local Codex execution flows. They should be framed as local repo work, not remote API orchestration.

### Reference Capture

Reference ingestion can come from local text files, cleaned exports, public pages, or pages available through the user's own logged-in browser session. Browser automation is allowed for capture, but the studio does not assume DRM bypass or anti-bot evasion.

### Folder-Based Local Corpus Import

For downloaded local novels, the studio should support importing an entire local folder of `.txt` and `.md` files. The import flow should:

1. scan the folder recursively
2. create one reference record per file
3. split files into chapter-like units using headings such as `第X章`
4. persist chapter snippets for later study
5. build one style card per imported work

### Multi-Book Blending

The studio should support selecting at least two style cards and producing a blended profile that records:

- source style-card ids
- averaged metrics
- merged anti-patterns / anti-AI focus items
- a technique summary explaining what the blend is for

## Canon Memory Layer

The studio should treat long-form fiction memory as project data, not fragile prompt residue.

### Canon Scope

Each project should maintain:

- `story_bible`: core premise, current phase goal, hard world rules
- `characters`: role, goals, secrets, current state
- `locations`: known places and current status
- `timeline`: ordered chapter events
- `foreshadowing`: planted vs paid-off setup items
- `open_threads`: unresolved conflicts and promises
- `writing_rules`: anti-AI and pacing constraints

### Storage Contract

- Canon snapshots are written to `XIAOSHUO_HOME/canon/project-<id>/`
- SQLite keeps indexed copies in `project_canons` and `project_chapters`
- Markdown is human-readable; SQLite is for the dashboard and API queries

### Canon APIs

- `GET /api/canon?projectId=<id>` returns the current canon package
- `POST /api/canon/refresh` replaces canon sections for a project
- `POST /api/chapters/brief` builds a chapter brief from canon + recent chapters
- `POST /api/chapters/continuity-check` reports continuity issues
- `POST /api/chapters/update-canon` stores a chapter and applies a structured canon patch

## Core Workflow

The end-to-end studio loop is:

1. `webnovel-init` creates or refreshes a project frame.
2. `webnovel-import` adds reference text and source notes.
3. `webnovel-import-folder` optionally batch-loads a local novel corpus.
4. `webnovel-scrape` optionally captures a public or user-authenticated page into a clean local source.
5. `webnovel-analyze-style` runs the Python CLI and builds a style profile.
6. `webnovel-blend-style` merges multiple style profiles into a mixed technique profile.
7. `webnovel-plan` turns project + style profile into a chapter or volume plan.
8. `novel-init-wizard` can replace manual setup and create the first project/canon package from a deep interview.
9. `novel-load-context` or the canon API builds the chapter brief and must-use facts.
10. `webnovel-write` or `novel-draft-scene` drafts from the plan and canon constraints.
11. `novel-continuity-review` checks the draft before it becomes current truth.
12. `novel-update-canon` records chapter state and updates open threads, timeline, and character status.
13. `webnovel-humanize` removes AI smell without imitating a named author.
14. `webnovel-review` critiques the output and feeds structured issues back.
15. `webnovel-learn` turns references and review data into drills.

## Novel Init Wizard

The studio now supports a deep planning wizard through both UI and API:

- UI: `/wizard/new-novel`
- API:
  - `POST /api/wizard/start`
  - `POST /api/wizard/answer`
  - `GET /api/wizard/session?sessionId=<id>`
  - `POST /api/wizard/finish`

The wizard should:

- ask one question at a time
- branch by genre
- prefer structured choices with optional custom input
- generate a reusable `NovelBlueprint`
- create the project, canon seed, volume outline, and chapter-one brief

## Aggregator Skill

To avoid remembering every project skill, the studio should also ship one top-level aggregator skill:

- name: `xiaoshuo-studio`
- role: classify requests and route them to the correct child skill
- export modes:
  - `aggregator-only`
  - `full-bundle`

The aggregator is the recommended public/open-source entry point. Advanced users can still invoke child skills directly.

## Guardrails

- Work from technique extraction, not author-voice cloning.
- Use at least one explicit anti-AI focus item when writing or rewriting.
- Keep source provenance attached to imported references.
- Treat the dashboard as the user-facing view and the skills as the operator-facing view of the same system.
