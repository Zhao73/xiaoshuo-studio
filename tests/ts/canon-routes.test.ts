import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadModules() {
  vi.resetModules();
  return {
    briefRoute: await import("@/app/api/chapters/brief/route"),
    canonRoute: await import("@/app/api/canon/route"),
    canonRefreshRoute: await import("@/app/api/canon/refresh/route"),
    continuityRoute: await import("@/app/api/chapters/continuity-check/route"),
    db: await import("@/lib/server/db"),
    updateCanonRoute: await import("@/app/api/chapters/update-canon/route"),
  };
}

describe("canon routes", () => {
  test("refreshes canon and returns chapter brief through API routes", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-canon-routes-"));
    process.env.XIAOSHUO_HOME = home;

    const { briefRoute, canonRefreshRoute, canonRoute, db } = await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const project = db.createProject({
      title: "债火登仙",
      genre: "玄幻",
      premise: "主角被债务系统绑定，必须在子时前收回灵石。",
    });

    const refreshResponse = await canonRefreshRoute.POST(
      new Request("http://localhost/api/canon/refresh", {
        body: JSON.stringify({
          characters: [],
          foreshadowing: [],
          locations: [],
          openThreads: [
            {
              priority: "high",
              status: "open",
              summary: "第一笔债务必须今天追回。",
              title: "第一笔债务倒计时",
            },
          ],
          projectId: project.id,
          storyBible: {
            phaseGoal: "第一卷先活过今晚。",
            summary: "债务系统上线，主线先围绕追债和保峰。",
            worldRules: ["陈渊不能错过子时"],
          },
          timeline: [],
          writingRules: ["减少解释腔"],
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(refreshResponse.status).toBe(200);
    const refreshPayload = await refreshResponse.json();
    expect(refreshPayload.markdownPaths.storyBible).toContain("story-bible.md");

    const briefResponse = await briefRoute.POST(
      new Request("http://localhost/api/chapters/brief", {
        body: JSON.stringify({
          chapterNumber: 2,
          focus: "黑水城追债",
          projectId: project.id,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(briefResponse.status).toBe(200);
    const briefPayload = await briefResponse.json();
    expect(briefPayload.chapterGoal).toContain("黑水城追债");
    expect(briefPayload.optionalThreads[0]?.title).toBe("第一笔债务倒计时");

    const canonResponse = await canonRoute.GET(
      new Request(
        `http://localhost/api/canon?projectId=${project.id}`,
      ),
    );

    expect(canonResponse.status).toBe(200);
    const canonPayload = await canonResponse.json();
    expect(canonPayload.canon.storyBible.summary).toContain("债务系统");
  });

  test("updates canon and runs continuity check through API routes", async () => {
    const home = fs.mkdtempSync(
      path.join(os.tmpdir(), "xiaoshuo-canon-routes-check-"),
    );
    process.env.XIAOSHUO_HOME = home;

    const { canonRefreshRoute, continuityRoute, db, updateCanonRoute } =
      await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const project = db.createProject({
      title: "债火登仙",
      genre: "玄幻",
      premise: "主角被债务系统绑定，必须在子时前收回灵石。",
    });

    await canonRefreshRoute.POST(
      new Request("http://localhost/api/canon/refresh", {
        body: JSON.stringify({
          characters: [
            {
              currentState: "受伤留在缥缈峰养伤",
              goals: ["留在缥缈峰"],
              name: "宁小棠",
              role: "预备徒弟",
              secrets: ["体质异常尚未觉醒"],
            },
          ],
          foreshadowing: [],
          locations: [
            { currentState: "封山", name: "缥缈峰" },
            { currentState: "外城", name: "黑水城" },
          ],
          openThreads: [],
          projectId: project.id,
          storyBible: {
            phaseGoal: "第一卷先活过今晚。",
            summary: "债务系统上线，主线先围绕追债和保峰。",
            worldRules: ["宁小棠当前不能离开缥缈峰"],
          },
          timeline: [],
          writingRules: ["减少解释腔"],
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    const updateResponse = await updateCanonRoute.POST(
      new Request("http://localhost/api/chapters/update-canon", {
        body: JSON.stringify({
          chapterNumber: 1,
          draftText: "陈渊确认自己必须在子时前赶去黑水城。",
          patch: {
            newTimelineEvents: [
              {
                chapterNumber: 1,
                detail: "陈渊确认黑水城是追债方向。",
                label: "追债方向确定",
              },
            ],
          },
          projectId: project.id,
          summary: "第一章确认黑水城线索。",
          title: "子时之前",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(updateResponse.status).toBe(200);

    const continuityResponse = await continuityRoute.POST(
      new Request("http://localhost/api/chapters/continuity-check", {
        body: JSON.stringify({
          chapterNumber: 2,
          draftText: "宁小棠昨夜已经独自赶到黑水城。",
          projectId: project.id,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(continuityResponse.status).toBe(200);
    const continuityPayload = await continuityResponse.json();
    expect(continuityPayload.issues[0]?.severity).toBe("fatal");
    expect(continuityPayload.issues[0]?.message).toContain("宁小棠");
  });
});
