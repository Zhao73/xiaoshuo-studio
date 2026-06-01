# xiaoshuo

[![CI](https://github.com/Zhao73/xiaoshuo-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/Zhao73/xiaoshuo-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![简体中文](https://img.shields.io/badge/语言-简体中文-red.svg)](./README.md)
[![English](https://img.shields.io/badge/Language-English-blue.svg)](./README.en.md)

Local fiction studio for long-form novel planning, canon memory, style learning, and skill-based writing workflows for Codex and Claude Code.

`xiaoshuo` helps you:

- bootstrap a novel through a guided planning wizard
- keep canon memory stable across long serial writing
- import private reference novels for technique transfer
- run the full workflow through one top-level skill: `xiaoshuo-studio`
- export or install skill bundles for Codex and Claude Code

## Screenshots

### Home

![Homepage screenshot](./docs/images/homepage.png)

### Novel Init Wizard

![Wizard screenshot](./docs/images/wizard.png)

## Architecture

```mermaid
flowchart LR
    U[Writer / Agent] --> A[Next.js Studio UI]
    U --> S[xiaoshuo-studio skill]
    S --> R[Skill registry]
    R --> C1[Init / Import / Style skills]
    R --> C2[Plan / Draft / Review skills]
    A --> API[Local API routes]
    C1 --> API
    C2 --> API
    API --> CANON[Canon memory layer]
    API --> CORPUS[Reference corpus + style analysis]
    CANON --> DB[(SQLite index)]
    CANON --> MD[Markdown canon snapshots]
    CORPUS --> PY[Python analyzer]
```

## Workflow

```mermaid
flowchart TD
    I[Idea or existing project] --> W[Novel init wizard]
    W --> P[Project + canon seed]
    P --> R1[Import references]
    R1 --> S1[Analyze / blend style]
    S1 --> B[Generate chapter brief]
    B --> D[Draft chapter]
    D --> Q[Continuity review]
    Q --> U[Update canon]
    U --> H[Humanize / polish]
    H --> L[Learn from review and drills]
```

## Install Matrix

| Goal | Command |
| --- | --- |
| Run locally | `npm install && npm run dev` |
| Seed a playable demo | `npm run demo:seed && npm run dev` |
| Verify locally | `npm run lint && npm test && npm run build && pytest tests/python -q` |
| Export one remembered entry skill for Codex | `npm run skills:export -- --target codex --mode aggregator-only` |
| Export full bundle for Codex | `npm run skills:export -- --target codex --mode full-bundle` |
| Export full bundle for Claude Code | `npm run skills:export -- --target claude --mode full-bundle` |
| Install one remembered entry skill for Codex | `npm run skills:install -- --target codex --mode aggregator-only` |
| Install full bundle for Codex | `npm run skills:install -- --target codex --mode full-bundle` |
| Install full bundle for Claude Code | `npm run skills:install -- --target claude --mode full-bundle` |

Defaults:

- Codex installs to `~/.codex/skills` unless `CODEX_HOME` is set
- Claude installs to `~/.claude/skills` unless `CLAUDE_HOME` is set

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, or the local port printed by Next.js.

To see the studio with useful first-run content:

```bash
npm run demo:seed
npm run dev
```

The seed command creates one idempotent local demo project, reference sample,
style card, and queued planning job. Running it again will not duplicate the
same demo.

## Top-level Skill

If you only want to remember one skill name, use:

```text
xiaoshuo-studio
```

Typical requests:

- “Help me create a xianxia novel step by step”
- “Import this local novel folder and analyze style”
- “Continue chapter 12”
- “Check continuity and update canon”

## Canon API

- `GET /api/canon?projectId=<id>`
- `POST /api/canon/refresh`
- `POST /api/chapters/brief`
- `POST /api/chapters/continuity-check`
- `POST /api/chapters/update-canon`

Wizard routes:

- `POST /api/wizard/start`
- `POST /api/wizard/answer`
- `GET /api/wizard/session?sessionId=<id>`
- `POST /api/wizard/finish`

## Guardrail

This project is for **technique transfer, not author cloning**.

## Docs

- Local workflow: [docs/local-codex-studio.md](./docs/local-codex-studio.md)
- Skill map: [docs/skills-map.md](./docs/skills-map.md)
- Chinese tutorial: [docs/tutorial-zh.md](./docs/tutorial-zh.md)
- Style analyzer contract: [docs/style-analysis-contract.md](./docs/style-analysis-contract.md)
