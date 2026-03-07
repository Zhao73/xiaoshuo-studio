import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadModules() {
  vi.resetModules();
  return {
    db: await import("@/lib/server/db"),
    paths: await import("@/lib/server/paths"),
    service: await import("@/lib/server/studio-service"),
  };
}

describe("canon workflow", () => {
  test("builds a reusable chapter brief from canon state and recent chapters", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-canon-brief-"));
    process.env.XIAOSHUO_HOME = home;

    const { db, service } = await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const project = db.createProject({
      title: "债火登仙",
      genre: "玄幻",
      premise: "主角被债务系统绑定，必须在子时前收回灵石，否则修为清零。",
    });

    await service.saveProjectCanon({
      projectId: project.id,
      storyBible: {
        summary: "欠债修仙，主线围绕子时倒计时和缥缈峰危机展开。",
        phaseGoal: "三章内保住缥缈峰并收齐第一笔灵石。",
        worldRules: ["子时前收债失败会被系统清零", "宁小棠暂时不能离开缥缈峰"],
      },
      characters: [
        {
          name: "陈渊",
          role: "主角",
          currentState: "刚绑定债务系统，正在追索第一笔灵石",
          goals: ["保住修为", "撑住缥缈峰"],
          secrets: ["暂未公开系统存在"],
        },
        {
          name: "宁小棠",
          role: "预备徒弟",
          currentState: "受伤留在缥缈峰养伤",
          goals: ["留在缥缈峰", "证明自己有用"],
          secrets: ["体质异常尚未觉醒"],
        },
      ],
      foreshadowing: [
        {
          payoffHint: "第四章觉醒体质",
          status: "planted",
          title: "宁小棠体质异常",
        },
      ],
      locations: [
        {
          currentState: "封山，资源紧缺",
          name: "缥缈峰",
        },
        {
          currentState: "第一笔债务线索所在地",
          name: "黑水城",
        },
      ],
      openThreads: [
        {
          priority: "high",
          status: "open",
          summary: "子时前必须收回一千灵石",
          title: "第一笔债务倒计时",
        },
      ],
      timeline: [
        {
          chapterNumber: 1,
          detail: "系统绑定后，陈渊只剩一个白天追回第一笔债务。",
          label: "第一章结尾",
        },
      ],
      writingRules: [
        "减少解释腔",
        "尽量用动作承载情绪",
        "章末必须留一个明确钩子",
      ],
    });

    await service.applyCanonUpdateFromChapter({
      chapterNumber: 1,
      draftText:
        "陈渊在主殿接下系统倒计时，确认第一笔债务线索直指黑水城。宁小棠负伤留在缥缈峰。",
      patch: {
        changedCharacterStates: [
          {
            currentState: "接下倒计时，准备去黑水城追债",
            name: "陈渊",
          },
        ],
        newTimelineEvents: [
          {
            chapterNumber: 1,
            detail: "陈渊确认第一笔债务线索在黑水城。",
            label: "追债方向确定",
          },
        ],
      },
      projectId: project.id,
      summary: "系统绑定后，陈渊确认黑水城就是第一笔债务去向。",
      title: "子时之前",
    });

    const brief = await service.generateChapterBrief({
      chapterNumber: 2,
      focus: "黑水城追债冲突",
      projectId: project.id,
    });

    expect(brief.chapterGoal).toContain("黑水城");
    expect(brief.mustUseFacts).toEqual(
      expect.arrayContaining([
        expect.stringContaining("宁小棠"),
        expect.stringContaining("第一笔债务倒计时"),
      ]),
    );
    expect(brief.styleConstraints).toEqual(
      expect.arrayContaining(["减少解释腔", "章末必须留一个明确钩子"]),
    );
    expect(brief.recentChapterSummaries[0]).toContain("黑水城");
    expect(brief.optionalThreads[0]?.title).toBe("第一笔债务倒计时");
  });

  test("flags draft continuity conflicts and writes canon snapshots to disk", async () => {
    const home = fs.mkdtempSync(
      path.join(os.tmpdir(), "xiaoshuo-canon-continuity-"),
    );
    process.env.XIAOSHUO_HOME = home;

    const { db, paths, service } = await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const project = db.createProject({
      title: "债火登仙",
      genre: "玄幻",
      premise: "主角被债务系统绑定，必须在子时前收回灵石，否则修为清零。",
    });

    const canon = await service.saveProjectCanon({
      projectId: project.id,
      storyBible: {
        summary: "缥缈峰保卫战和债务倒计时并行推进。",
        phaseGoal: "第一卷先活过子时。",
        worldRules: ["宁小棠当前不能离开缥缈峰"],
      },
      characters: [
        {
          name: "宁小棠",
          role: "预备徒弟",
          currentState: "受伤留在缥缈峰养伤",
          goals: ["留在缥缈峰"],
          secrets: ["体质异常尚未觉醒"],
        },
      ],
      foreshadowing: [],
      locations: [
        {
          currentState: "封山",
          name: "缥缈峰",
        },
        {
          currentState: "外城债务线索所在地",
          name: "黑水城",
        },
      ],
      openThreads: [
        {
          priority: "high",
          status: "open",
          summary: "必须在子时前收回灵石",
          title: "第一笔债务倒计时",
        },
      ],
      timeline: [],
      writingRules: ["减少解释腔"],
    });

    const issues = await service.checkChapterContinuity({
      chapterNumber: 2,
      draftText:
        "宁小棠昨夜已经独自赶到黑水城，还陪陈渊逛完了整条夜市街。",
      projectId: project.id,
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: "character",
          severity: "fatal",
        }),
      ]),
    );
    expect(issues[0]?.message).toContain("宁小棠");
    expect(issues[0]?.message).toContain("黑水城");
    expect(canon.markdownPaths.storyBible).toBeTruthy();
    expect(fs.existsSync(canon.markdownPaths.storyBible)).toBe(true);
    expect(fs.existsSync(paths.getPlatformPaths().canonDir)).toBe(true);
  });
});
