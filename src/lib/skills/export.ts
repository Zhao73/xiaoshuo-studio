import fs from "node:fs";
import path from "node:path";

import {
  buildSkillIndexMarkdown,
  STUDIO_SKILL_REGISTRY,
  type StudioInstallMode,
} from "./registry";

type ExportTarget = "claude" | "codex";

type ExportStudioSkillsInput = {
  destRoot: string;
  mode: StudioInstallMode;
  target: ExportTarget;
};

export async function exportStudioSkills(input: ExportStudioSkillsInput) {
  const sourceRoot = path.resolve(process.cwd(), ".agents/skills");
  const destRoot = path.resolve(input.destRoot);
  const aggregatorSkillName = "xiaoshuo-studio";
  const exportedSkills = [aggregatorSkillName];

  fs.mkdirSync(destRoot, { recursive: true });

  copyDirectory(
    path.join(sourceRoot, aggregatorSkillName),
    path.join(destRoot, aggregatorSkillName),
  );
  writeSkillIndex(path.join(destRoot, aggregatorSkillName), input.target);

  if (input.mode === "full-bundle") {
    for (const entry of STUDIO_SKILL_REGISTRY) {
      copyDirectory(
        path.join(sourceRoot, entry.skillName),
        path.join(destRoot, entry.skillName),
      );
      exportedSkills.push(entry.skillName);
    }
  }

  return {
    destRoot,
    exportedSkills,
    mode: input.mode,
    target: input.target,
  };
}

function writeSkillIndex(skillRoot: string, target: ExportTarget) {
  const referencesDir = path.join(skillRoot, "references");
  fs.mkdirSync(referencesDir, { recursive: true });
  fs.writeFileSync(
    path.join(referencesDir, "skill-index.md"),
    [
      `Target: ${target}`,
      "",
      buildSkillIndexMarkdown(),
    ].join("\n"),
    "utf8",
  );
}

function copyDirectory(sourceDir: string, destDir: string) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Skill source missing: ${sourceDir}`);
  }

  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
      continue;
    }

    fs.copyFileSync(sourcePath, destPath);
  }
}
