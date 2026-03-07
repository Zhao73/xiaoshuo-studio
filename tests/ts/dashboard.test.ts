import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadDashboardModules() {
  vi.resetModules();
  return {
    db: await import("@/lib/server/db"),
    dashboard: await import("@/lib/server/dashboard"),
  };
}

describe("dashboard snapshot", () => {
  test("summarizes projects, references, style profiles, and jobs", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-dashboard-"));
    process.env.XIAOSHUO_HOME = home;

    const { db, dashboard } = await loadDashboardModules();

    db.ensureDatabase();
    const project = db.createProject({
      title: "天火档案",
      genre: "科幻",
      premise: "彗星坠落后，旧城市开始出现会说话的火焰。",
    });
    const reference = db.createReferenceWork({
      title: "城市废墟样本",
      sourceType: "import",
      sourceLabel: "samples/city.md",
      creatorLabel: "匿名样本",
    });
    db.createStyleProfile({
      name: "废墟快节奏卡",
      referenceWorkId: reference.id,
      summary: "短句、强镜头、章末反转。",
      metrics: { dialogueRatio: 0.34, averageSentenceLength: 12.4 },
      antiPatterns: ["连用抽象情绪词", "段尾同构句式"],
    });
    db.createDraftJob({
      projectId: project.id,
      jobType: "write",
      status: "queued",
      payload: { chapter: 3 },
    });

    const snapshot = dashboard.getDashboardSnapshot();

    expect(snapshot.metrics).toMatchObject({
      projects: 1,
      references: 1,
      styleProfiles: 1,
      queuedJobs: 1,
    });
    expect(snapshot.projects[0]?.title).toBe("天火档案");
    expect(snapshot.styleProfiles[0]?.name).toBe("废墟快节奏卡");
  });
});
