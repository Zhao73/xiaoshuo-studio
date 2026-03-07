import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadStorageModules() {
  vi.resetModules();
  return {
    db: await import("@/lib/server/db"),
    paths: await import("@/lib/server/paths"),
  };
}

describe("local storage bootstrap", () => {
  test("creates the sqlite database and persists projects", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-storage-"));
    process.env.XIAOSHUO_HOME = home;

    const { db, paths } = await loadStorageModules();

    expect(paths.getPlatformPaths().rootDir).toBe(home);

    db.ensureDatabase();
    const created = db.createProject({
      title: "雾海列车",
      genre: "悬疑",
      premise: "一列永不停靠的列车上，乘客不断丢失记忆。",
    });

    const projects = db.listProjects();

    expect(fs.existsSync(paths.getPlatformPaths().dbFile)).toBe(true);
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      id: created.id,
      title: "雾海列车",
      genre: "悬疑",
      status: "active",
    });
  });
});
