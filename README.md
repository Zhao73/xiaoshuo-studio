# xiaoshuo

Local Codex studio for long-form fiction work. It combines:

- a Next.js dashboard for projects, references, style cards, and queued jobs
- a canon memory layer for story bible, characters, timeline, foreshadowing, and open threads
- a deterministic Python CLI for style analysis
- repo-local Codex skills for planning, drafting, humanizing, review, study drills, and canon-aware chapter workflow

`xiaoshuo` is designed for people who want one local writing workspace that can:

- plan a novel from scratch through a guided wizard
- build and update canon memory over long serial writing
- import private reference novels for technique study
- route Codex or Claude Code through one top-level skill instead of many scattered skill names

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify

```bash
npm test
npm run build
pytest tests/python -q
```

## Codex requirement

This studio is designed for a locally installed and locally logged-in Codex CLI:

```bash
codex --version
```

The web app checks local Codex availability. It does not replace Codex login with a custom OpenAI API flow.

## Python style-analysis contract

The entrypoint is fixed to:

```bash
python3 python/engine/cli.py analyze <file>
```

It prints a JSON object with:

- `title`
- `metrics`
- `anti_ai_flags`
- `style_summary`

`metrics` includes at least:

- `sentence_count`
- `avg_sentence_length`
- `dialogue_ratio`
- `scene_breaks`
- `sensory_density`

Reference: [docs/style-analysis-contract.md](./docs/style-analysis-contract.md)

## Repo-local skills

Skills live in `.agents/skills/`:

- `xiaoshuo-studio`
- `webnovel-init`
- `webnovel-import`
- `webnovel-import-folder`
- `webnovel-scrape`
- `webnovel-analyze-style`
- `webnovel-blend-style`
- `webnovel-plan`
- `webnovel-write`
- `webnovel-humanize`
- `webnovel-review`
- `webnovel-learn`
- `novel-load-context`
- `novel-init-wizard`
- `novel-plan-next`
- `novel-draft-scene`
- `novel-continuity-review`
- `novel-update-canon`
- `novel-style-learn`
- `novel-anti-ai-pass`

Reference: [docs/local-codex-studio.md](./docs/local-codex-studio.md)
Tutorial: [docs/tutorial-zh.md](./docs/tutorial-zh.md)

## Open-source skill bundle

If you want one remembered entry point instead of many project skills, use:

```bash
npm run skills:export -- --target codex --mode aggregator-only
```

For a full export with the aggregator plus all child skills:

```bash
npm run skills:export -- --target codex --mode full-bundle
```

Switch `codex` to `claude` for Claude Code-style exports. If you want direct installation instead of a generated `dist/skills/...` folder, pass `--dest <your-skill-dir>`.

## One-click local install

After cloning the repo:

```bash
npm install
npm run skills:install -- --target codex --mode aggregator-only
```

Install the full bundle instead:

```bash
npm run skills:install -- --target codex --mode full-bundle
```

Claude Code variant:

```bash
npm run skills:install -- --target claude --mode full-bundle
```

Defaults:

- Codex installs to `~/.codex/skills` unless `CODEX_HOME` is set
- Claude installs to `~/.claude/skills` unless `CLAUDE_HOME` is set

## Style-learning guardrail

This project is built to learn **technique**, not clone a named author voice. The intended flow is:

1. import or capture references with provenance
2. analyze them into reusable metrics
3. convert metrics into style cards and anti-AI focus items
4. write or revise using blended technique constraints
5. turn review output into drills

## Canon API

Primary local routes for long-form memory:

- `GET /api/canon?projectId=<id>`
- `POST /api/canon/refresh`
- `POST /api/chapters/brief`
- `POST /api/chapters/continuity-check`
- `POST /api/chapters/update-canon`

## Local novel learning

The studio now supports:

- importing a whole local folder of `.txt` / `.md` novels
- splitting imported files into chapter-like records
- generating one style card per imported work
- blending multiple style cards into a reusable mixed profile
- persisting project canon snapshots as Markdown plus SQLite index rows
- generating a chapter brief from canon + recent chapter summaries
- checking draft continuity against known character and location state
- updating canon after a chapter with structured patch data
- running a deep planning wizard that creates a project, canon seed, volume outline, and chapter-one brief

This is designed for **technique transfer**, not author cloning.
