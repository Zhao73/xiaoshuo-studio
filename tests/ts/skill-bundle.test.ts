import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadModules() {
  vi.resetModules();
  return {
    exporter: await import("@/lib/skills/export"),
    registry: await import("@/lib/skills/registry"),
  };
}

describe("xiaoshuo studio skill bundle", () => {
  test("classifies representative requests into the right project skills", async () => {
    const { registry } = await loadModules();

    const initRoute = registry.classifyStudioRequest(
      "帮我一步步问答创建一本修仙小说项目",
    );
    const importRoute = registry.classifyStudioRequest(
      "导入这个本地小说文件夹并分析风格",
    );
    const continuityRoute = registry.classifyStudioRequest(
      "检查这一章连续性然后回写 canon",
    );

    expect(initRoute.targetSkills).toEqual(
      expect.arrayContaining(["novel-init-wizard"]),
    );
    expect(importRoute.targetSkills).toEqual(
      expect.arrayContaining(["webnovel-import-folder"]),
    );
    expect(continuityRoute.targetSkills).toEqual(
      expect.arrayContaining(["novel-continuity-review", "novel-update-canon"]),
    );
  });

  test("exports aggregator-only and full-bundle skill packages", async () => {
    const { exporter } = await loadModules();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-skill-export-"));
    const aggregatorDest = path.join(root, "aggregator-only");
    const fullDest = path.join(root, "full-bundle");

    await exporter.exportStudioSkills({
      destRoot: aggregatorDest,
      mode: "aggregator-only",
      target: "codex",
    });

    expect(
      fs.existsSync(path.join(aggregatorDest, "xiaoshuo-studio", "SKILL.md")),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(
          aggregatorDest,
          "xiaoshuo-studio",
          "references",
          "skill-index.md",
        ),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(aggregatorDest, "novel-init-wizard", "SKILL.md")),
    ).toBe(false);
    expect(
      fs
        .readFileSync(
          path.join(
            aggregatorDest,
            "xiaoshuo-studio",
            "references",
            "skill-index.md",
          ),
          "utf8",
        )
        .includes("novel-init-wizard"),
    ).toBe(true);

    await exporter.exportStudioSkills({
      destRoot: fullDest,
      mode: "full-bundle",
      target: "claude",
    });

    expect(
      fs.existsSync(path.join(fullDest, "xiaoshuo-studio", "SKILL.md")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(fullDest, "novel-init-wizard", "SKILL.md")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(fullDest, "webnovel-write", "SKILL.md")),
    ).toBe(true);
  });
});
