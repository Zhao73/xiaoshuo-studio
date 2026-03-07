# Contributing

## Setup

```bash
npm install
```

If you touch the Python analyzer, make sure `pytest` is available in your environment.

## Local verification

Run the full local gate before opening a PR:

```bash
npm run lint
npm test
npm run build
pytest tests/python -q
```

## Change guidelines

- Keep the fiction workflow grounded in local-first execution.
- Preserve the rule that style learning is for technique transfer, not author cloning.
- Route new writing features through canon and brief generation instead of raw prompt memory.
- When adding skills, update the skill registry and export/install flows together.

## Pull requests

- Keep PRs focused and small when possible.
- Include verification results.
- Call out any changes to install/export behavior or public APIs.
