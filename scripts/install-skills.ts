import { installStudioSkills } from "../src/lib/skills/install";

type InstallTarget = "claude" | "codex";
type InstallMode = "aggregator-only" | "full-bundle";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = (args.target as InstallTarget | undefined) ?? "codex";
  const mode = (args.mode as InstallMode | undefined) ?? "full-bundle";

  const result = await installStudioSkills({
    destRoot: args.dest,
    mode,
    target,
  });

  console.log(
    JSON.stringify(
      {
        ...result,
        note: "Restart your agent after installation so the new skills are loaded.",
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
