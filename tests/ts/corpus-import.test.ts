import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadModules() {
  vi.resetModules();
  return {
    dashboard: await import("@/lib/server/dashboard"),
    db: await import("@/lib/server/db"),
    service: await import("@/lib/server/studio-service"),
  };
}

describe("folder corpus import", () => {
  test("imports multiple local novels and records reference chapters", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-corpus-"));
    const corpusDir = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-novels-"));
    process.env.XIAOSHUO_HOME = home;

    fs.writeFileSync(
      path.join(corpusDir, "book-one.md"),
      [
        "# 烬城样本",
        "",
        "第1章 雨夜",
        "“门没锁。”他说。",
        "雨点沿着铁皮棚滑下，砸出密集的回声。",
        "",
        "第2章 余烬",
        "她没有回答，只把火柴折断。",
      ].join("\n"),
      "utf8",
    );

    fs.writeFileSync(
      path.join(corpusDir, "book-two.txt"),
      [
        "第1章 开局",
        "她把行李箱拖过空旷的站台，鞋跟敲得很急。",
        "",
        "第2章 回声",
        "“别装作不认识我。”他说。",
      ].join("\n"),
      "utf8",
    );

    const { dashboard, db, service } = await loadModules();
    db.resetDatabaseForTests();

    const result = await service.importReferenceFolder({
      collectionName: "都市双样本",
      creatorLabel: "本地下载",
      folderPath: corpusDir,
      notes: "测试批量导入",
    });

    const snapshot = dashboard.getDashboardSnapshot();

    expect(result.importedCount).toBe(2);
    expect(result.chapterCount).toBeGreaterThanOrEqual(4);
    expect(snapshot.metrics.references).toBe(2);
    expect(snapshot.metrics.referenceChapters).toBeGreaterThanOrEqual(4);
    expect(snapshot.styleProfiles).toHaveLength(2);
  });
});
