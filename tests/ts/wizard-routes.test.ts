import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadModules() {
  vi.resetModules();
  return {
    answerRoute: await import("@/app/api/wizard/answer/route"),
    db: await import("@/lib/server/db"),
    finishRoute: await import("@/app/api/wizard/finish/route"),
    sessionRoute: await import("@/app/api/wizard/session/route"),
    startRoute: await import("@/app/api/wizard/start/route"),
  };
}

describe("novel init wizard routes", () => {
  test("starts the wizard even when the request body is empty", async () => {
    const home = fs.mkdtempSync(
      path.join(os.tmpdir(), "xiaoshuo-wizard-routes-empty-"),
    );
    process.env.XIAOSHUO_HOME = home;

    const { db, startRoute } = await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const startResponse = await startRoute.POST(
      new Request("http://localhost/api/wizard/start", {
        method: "POST",
      }),
    );

    expect(startResponse.status).toBe(200);
    const started = await startResponse.json();
    expect(started.question.id).toBe("book-title");
  });

  test("supports start, answer, session preview, and finish", async () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "xiaoshuo-wizard-routes-"));
    process.env.XIAOSHUO_HOME = home;

    const { answerRoute, db, finishRoute, sessionRoute, startRoute } =
      await loadModules();
    db.resetDatabaseForTests();
    db.ensureDatabase();

    const startResponse = await startRoute.POST(
      new Request("http://localhost/api/wizard/start", {
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(startResponse.status).toBe(200);
    const started = await startResponse.json();
    const sessionId = started.session.id as string;

    const answers = [
      { questionId: "book-title", value: "债火登仙" },
      { choiceId: "xianxia", questionId: "primary-genre" },
      { choiceId: "sect-frontier", questionId: "world-shell" },
      { questionId: "protagonist-name", value: "陈渊" },
      { choiceId: "debt-bound-disciple", questionId: "protagonist-archetype" },
      { choiceId: "debt-ledger-system", questionId: "power-core" },
      { choiceId: "protect-home", questionId: "central-drive" },
      { questionId: "ally-name", value: "宁小棠" },
      { questionId: "antagonist-name", value: "岳临川" },
      { choiceId: "high-pressure", questionId: "writing-style" },
      { choiceId: "survive-midnight", questionId: "first-volume-goal" },
      { choiceId: "sect-crisis", questionId: "opening-hook" },
    ];

    for (const answer of answers) {
      const response = await answerRoute.POST(
        new Request("http://localhost/api/wizard/answer", {
          body: JSON.stringify({
            ...answer,
            sessionId,
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        }),
      );

      expect(response.status).toBe(200);
    }

    const sessionResponse = await sessionRoute.GET(
      new Request(`http://localhost/api/wizard/session?sessionId=${sessionId}`),
    );

    expect(sessionResponse.status).toBe(200);
    const sessionPayload = await sessionResponse.json();
    expect(sessionPayload.session.preview.projectSeed.title).toBe("债火登仙");

    const finishResponse = await finishRoute.POST(
      new Request("http://localhost/api/wizard/finish", {
        body: JSON.stringify({ sessionId }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(finishResponse.status).toBe(201);
    const finished = await finishResponse.json();
    expect(finished.project.title).toBe("债火登仙");
    expect(finished.blueprint.chapterOneBrief.chapterGoal).toContain("缥缈峰");
  });
});
