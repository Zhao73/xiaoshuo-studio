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

describe("blend profile", () => {
  test("builds a multi-book blended style profile from existing style cards", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-blend-"));
    process.env.XIAOSHUO_HOME = home;

    const { dashboard, db, service } = await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const refA = db.createReferenceWork({
      creatorLabel: "样本A",
      sourceLabel: "a.md",
      sourceType: "import",
      title: "A书",
    });
    const refB = db.createReferenceWork({
      creatorLabel: "样本B",
      sourceLabel: "b.md",
      sourceType: "import",
      title: "B书",
    });

    const styleA = db.createStyleProfile({
      antiPatterns: ["减少解释腔", "用动作承载情绪"],
      metrics: {
        averageSentenceLength: 14,
        dialogueRatio: 0.42,
        sceneBreaks: 3,
        sentenceCount: 120,
      },
      name: "A卡",
      referenceWorkId: refA.id,
      summary: "对白密集。",
    });
    const styleB = db.createStyleProfile({
      antiPatterns: ["加强章末悬压", "保留具体细节密度"],
      metrics: {
        averageSentenceLength: 18,
        dialogueRatio: 0.25,
        sceneBreaks: 5,
        sentenceCount: 100,
      },
      name: "B卡",
      referenceWorkId: refB.id,
      summary: "悬压稳定。",
    });

    const blend = await service.createBlendStyleProfile({
      name: "双书混合卡",
      notes: "主学对白与悬压",
      styleProfileIds: [styleA.id, styleB.id],
    });

    const snapshot = dashboard.getDashboardSnapshot();

    expect(blend.name).toBe("双书混合卡");
    expect(blend.sourceStyleProfileIds).toEqual([styleA.id, styleB.id]);
    expect(blend.antiPatterns).toEqual(
      expect.arrayContaining(["减少解释腔", "加强章末悬压"]),
    );
    expect(blend.metrics.averageSentenceLength).toBe(16);
    expect(snapshot.metrics.blendProfiles).toBe(1);
    expect(snapshot.blendProfiles[0]?.name).toBe("双书混合卡");
  });
});
