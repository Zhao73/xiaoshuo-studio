import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadDemoModules() {
  vi.resetModules();
  return {
    dashboard: await import("@/lib/server/dashboard"),
    db: await import("@/lib/server/db"),
    demoSeed: await import("@/lib/server/demo-seed"),
  };
}

describe("demo seed data", () => {
  afterEach(async () => {
    const { db } = await loadDemoModules();
    db.resetDatabaseForTests();
    delete process.env.XIAOSHUO_HOME;
  });

  test("creates an idempotent first-run project, style card, and queued job", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-demo-seed-"));
    process.env.XIAOSHUO_HOME = home;

    const { dashboard, demoSeed } = await loadDemoModules();

    const first = demoSeed.seedDemoData();
    const second = demoSeed.seedDemoData();
    const snapshot = dashboard.getDashboardSnapshot();

    expect(first).toMatchObject({
      created: true,
      title: "雾港债火",
    });
    expect(second).toMatchObject({
      created: false,
      projectId: first.projectId,
    });
    expect(snapshot.metrics).toMatchObject({
      projects: 1,
      queuedJobs: 1,
      references: 1,
      styleProfiles: 1,
    });
    expect(snapshot.projects[0]?.title).toBe("雾港债火");
    expect(snapshot.styleProfiles[0]?.name).toBe("雾港悬压推进卡");
  });
});
