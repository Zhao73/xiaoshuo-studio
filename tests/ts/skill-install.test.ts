import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadModules() {
  vi.resetModules();
  return {
    installer: await import("@/lib/skills/install"),
  };
}

describe("xiaoshuo studio skill installer", () => {
  test("resolves default skill directories for codex and claude", async () => {
    const { installer } = await loadModules();
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-skill-home-"));

    expect(
      installer.resolveDefaultSkillDir({
        env: {},
        homeDir: fakeHome,
        target: "codex",
      }),
    ).toBe(path.join(fakeHome, ".codex", "skills"));

    expect(
      installer.resolveDefaultSkillDir({
        env: {},
        homeDir: fakeHome,
        target: "claude",
      }),
    ).toBe(path.join(fakeHome, ".claude", "skills"));

    expect(
      installer.resolveDefaultSkillDir({
        env: { CODEX_HOME: path.join(fakeHome, "custom-codex") },
        homeDir: fakeHome,
        target: "codex",
      }),
    ).toBe(path.join(fakeHome, "custom-codex", "skills"));
  });

  test("installs aggregator-only bundle into the resolved directory", async () => {
    const { installer } = await loadModules();
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-skill-install-"));

    const result = await installer.installStudioSkills({
      env: {},
      homeDir: fakeHome,
      mode: "aggregator-only",
      target: "codex",
    });

    expect(result.destRoot).toBe(path.join(fakeHome, ".codex", "skills"));
    expect(
      fs.existsSync(
        path.join(fakeHome, ".codex", "skills", "xiaoshuo-studio", "SKILL.md"),
      ),
    ).toBe(true);
  });
});
