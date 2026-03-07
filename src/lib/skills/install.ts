import os from "node:os";
import path from "node:path";

import { exportStudioSkills } from "./export";
import type { StudioInstallMode } from "./registry";

type InstallTarget = "claude" | "codex";

type ResolveDefaultSkillDirInput = {
  env?: NodeJS.ProcessEnv | Record<string, string>;
  homeDir?: string;
  target: InstallTarget;
};

type InstallStudioSkillsInput = {
  destRoot?: string;
  env?: NodeJS.ProcessEnv | Record<string, string>;
  homeDir?: string;
  mode: StudioInstallMode;
  target: InstallTarget;
};

export function resolveDefaultSkillDir(input: ResolveDefaultSkillDirInput) {
  const env = input.env ?? process.env;
  const homeDir = input.homeDir ?? os.homedir();

  if (input.target === "codex") {
    return env.CODEX_HOME
      ? path.resolve(String(env.CODEX_HOME), "skills")
      : path.join(homeDir, ".codex", "skills");
  }

  return env.CLAUDE_HOME
    ? path.resolve(String(env.CLAUDE_HOME), "skills")
    : path.join(homeDir, ".claude", "skills");
}

export async function installStudioSkills(input: InstallStudioSkillsInput) {
  const destRoot =
    input.destRoot ??
    resolveDefaultSkillDir({
      env: input.env,
      homeDir: input.homeDir,
      target: input.target,
    });

  return exportStudioSkills({
    destRoot,
    mode: input.mode,
    target: input.target,
  });
}
