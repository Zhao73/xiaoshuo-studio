import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadModules() {
  vi.resetModules();
  return {
    db: await import("@/lib/server/db"),
    service: await import("@/lib/server/studio-service"),
    wizard: await import("@/lib/server/wizard"),
  };
}

describe("novel init wizard engine", () => {
  test("runs a deep planning wizard and materializes project, canon, and artifacts", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-wizard-engine-"));
    process.env.XIAOSHUO_HOME = home;

    const { db, wizard } = await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const started = await wizard.startWizardSession();
    expect(started.question.id).toBe("book-title");

    let step = await wizard.answerWizardSession({
      questionId: "book-title",
      sessionId: started.session.id,
      value: "债火登仙",
    });
    step = await wizard.answerWizardSession({
      choiceId: "xianxia",
      questionId: step.question.id,
      sessionId: started.session.id,
    });

    expect(step.question.id).toBe("world-shell");
    expect(step.question.choices.map((item: { id: string }) => item.id)).toContain(
      "sect-frontier",
    );

    const answers = [
      { choiceId: "sect-frontier", questionId: "world-shell" },
      { value: "陈渊", questionId: "protagonist-name" },
      { choiceId: "debt-bound-disciple", questionId: "protagonist-archetype" },
      { choiceId: "debt-ledger-system", questionId: "power-core" },
      { choiceId: "protect-home", questionId: "central-drive" },
      { value: "宁小棠", questionId: "ally-name" },
      { value: "岳临川", questionId: "antagonist-name" },
      { choiceId: "high-pressure", questionId: "writing-style" },
      { choiceId: "survive-midnight", questionId: "first-volume-goal" },
      { choiceId: "sect-crisis", questionId: "opening-hook" },
    ];

    for (const answer of answers) {
      step = await wizard.answerWizardSession({
        ...answer,
        sessionId: started.session.id,
      });
    }

    expect(step.isComplete).toBe(true);

    const finished = await wizard.finishWizardSession(started.session.id);
    const projects = db.listProjects();
    const artifacts = db.listProjectArtifacts(finished.project.id);
    const canon = await wizard.getProjectCanon(finished.project.id);

    expect(finished.project.title).toBe("债火登仙");
    expect(finished.blueprint.projectSeed.genreLabel).toBe("修仙");
    expect(finished.blueprint.volumeOutline.milestones).toHaveLength(3);
    expect(finished.blueprint.chapterOneBrief.chapterGoal).toContain("缥缈峰");
    expect(projects[0]?.title).toBe("债火登仙");
    expect(artifacts.map((item: { kind: string }) => item.kind)).toEqual(
      expect.arrayContaining(["novel-blueprint", "volume-outline", "chapter-brief"]),
    );
    expect(canon.characters.map((item: { name: string }) => item.name)).toEqual(
      expect.arrayContaining(["陈渊", "宁小棠", "岳临川"]),
    );
  });

  test("accepts custom answers and exposes completed preview before finish", async () => {
    const home = fs.mkdtempSync(
      path.join(os.tmpdir(), "xiaoshuo-wizard-custom-engine-"),
    );
    process.env.XIAOSHUO_HOME = home;

    const { db, wizard } = await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const started = await wizard.startWizardSession();

    const customFlow = [
      { questionId: "book-title", value: "雨夜古墓簿" },
      { choiceId: "mystery-adventure", questionId: "primary-genre" },
      { choiceId: "collapsed-tomb-city", questionId: "world-shell" },
      { questionId: "protagonist-name", value: "沈执" },
      { choiceId: "reluctant-investigator", questionId: "protagonist-archetype" },
      { choiceId: "forbidden-map", questionId: "power-core" },
      { choiceId: "custom", customValue: "在暴雨夜追查父亲失踪的真相", questionId: "central-drive" },
      { questionId: "ally-name", value: "黎九" },
      { questionId: "antagonist-name", value: "白魇" },
      { choiceId: "cinematic-tense", questionId: "writing-style" },
      { choiceId: "truth-before-dawn", questionId: "first-volume-goal" },
      { choiceId: "custom", customValue: "暴雨夜古墓入口被炸开", questionId: "opening-hook" },
    ];

    let state = { session: started.session, question: started.question };

    for (const answer of customFlow) {
      state = await wizard.answerWizardSession({
        ...answer,
        sessionId: started.session.id,
      });
    }

    expect(state.isComplete).toBe(true);

    const session = await wizard.getWizardSession(started.session.id);
    expect(session.preview?.projectSeed.title).toBe("雨夜古墓簿");
    expect(session.preview?.chapterOneBrief.hookTarget).toContain("暴雨夜古墓入口被炸开");
  });
});
