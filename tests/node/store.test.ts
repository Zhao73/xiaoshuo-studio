import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { createStudioStore } from "../../src/lib/server/store";

const cleanupPaths: string[] = [];

afterEach(() => {
  for (const path of cleanupPaths.splice(0, cleanupPaths.length)) {
    rmSync(path, { force: true, recursive: true });
  }
});

describe("createStudioStore", () => {
  it("persists projects, references, style profiles, and jobs into a local snapshot", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "xiaoshuo-store-"));
    cleanupPaths.push(rootDir);

    const store = createStudioStore({ rootDir });

    const project = store.createProject({
      genre: "xuanhuan",
      premise: "一个靠债务系统修仙的主角。",
      title: "债火登仙",
    });

    const reference = store.createReferenceWork({
      authorHint: "匿名作者",
      notes: "节奏强，章末钩子密集。",
      sourcePath: "/tmp/reference-one.md",
      sourceType: "upload",
      title: "参考作品一",
    });

    const profile = store.createStyleProfile({
      antiAiFocus: ["减少解释腔", "增加动作承载"],
      name: "热血悬压混合",
      sourceIds: [reference.id],
      summary: "偏快节奏、低抒情、强调冲突递进。",
    });

    store.queueJob({
      kind: "webnovel-write",
      projectId: project.id,
      status: "queued",
      summary: "起草第一章",
    });

    const snapshot = store.getDashboardSnapshot();

    expect(snapshot.counts.projects).toBe(1);
    expect(snapshot.counts.references).toBe(1);
    expect(snapshot.counts.styleProfiles).toBe(1);
    expect(snapshot.counts.jobs).toBe(1);
    expect(snapshot.projects[0]?.title).toBe("债火登仙");
    expect(snapshot.references[0]?.title).toBe("参考作品一");
    expect(profile.antiAiFocus).toContain("增加动作承载");
    expect(snapshot.jobs[0]?.kind).toBe("webnovel-write");
  });
});
