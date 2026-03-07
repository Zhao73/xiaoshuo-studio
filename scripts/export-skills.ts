import path from "node:path";

import { exportStudioSkills } from "../src/lib/skills/export";

type ExportTarget = "claude" | "codex";
type ExportMode = "aggregator-only" | "full-bundle";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = (args.target as ExportTarget | undefined) ?? "codex";
  const mode = (args.mode as ExportMode | undefined) ?? "full-bundle";
  const destRoot =
    args.dest ??
    path.resolve(process.cwd(), "dist", "skills", target, mode);

  const result = await exportStudioSkills({
    destRoot,
    mode,
    target,
  });

  console.log(
    JSON.stringify(
      {
        ...result,
        note: "Point --dest at your Codex or Claude Code skills directory to install directly.",
      },
      null,
      2,
    ),
  );
}

function parseArgs(args: string[]) {
  const parsed: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const value = args[index + 1];

    if (!value || value.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = value;
    index += 1;
  }

  return parsed;
}

void main();
