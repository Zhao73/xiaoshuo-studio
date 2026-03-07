"use client";

import Link from "next/link";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

type WizardChoice = {
  id: string;
  label: string;
  value: string;
};

type WizardQuestion = {
  allowCustom?: boolean;
  choices?: WizardChoice[];
  id: string;
  kind: "single-choice" | "text";
  prompt: string;
  title: string;
};

type WizardSession = {
  answers: Record<string, { choiceId?: string; customValue?: string; value?: string }>;
  currentQuestionId: string | null;
  id: string;
  preview?: {
    canonSeed: {
      characters: Array<{ name: string; role: string }>;
    };
    chapterOneBrief: {
      chapterGoal: string;
      hookTarget?: string;
    };
    projectSeed: {
      genreLabel: string;
      premise: string;
      title: string;
    };
    volumeOutline: {
      milestones: string[];
    };
  };
  status: "completed" | "in_progress" | "ready";
};

type WizardStepResult = {
  isComplete?: boolean;
  preview?: WizardSession["preview"];
  question?: WizardQuestion;
  session: WizardSession;
};

const SESSION_KEY = "xiaoshuo:init-wizard-session";

export function NovelInitWizard() {
  const [answerText, setAnswerText] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [finishedProjectId, setFinishedProjectId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<WizardQuestion | null>(null);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [session, setSession] = useState<WizardSession | null>(null);

  const resumeOrStart = useEffectEvent(async () => {
    setLoading(true);
    setError(null);

    try {
      const storedSessionId =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem(SESSION_KEY);

      if (storedSessionId) {
        const response = await fetch(
          `/api/wizard/session?sessionId=${encodeURIComponent(storedSessionId)}`,
        );

        if (response.ok) {
          const data = (await response.json()) as {
            question?: WizardQuestion;
            session: WizardSession;
          };
          setSession(data.session);
          setQuestion(data.question ?? null);
          return;
        }
      }

      await startNewSession();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "向导启动失败。",
      );
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void resumeOrStart();
  }, []);

  async function startNewSession() {
    const response = await fetch("/api/wizard/start", {
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("无法启动建书向导。");
    }

    const data = (await response.json()) as WizardStepResult;
    persistSessionId(data.session.id);
    setSession(data.session);
    setQuestion(data.question ?? null);
    resetAnswerFields();
    setFinishedProjectId(null);
  }

  async function submitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session || !question) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload =
        question.kind === "text"
          ? {
              questionId: question.id,
              sessionId: session.id,
              value: answerText,
            }
          : {
              choiceId: selectedChoice,
              customValue,
              questionId: question.id,
              sessionId: session.id,
            };

      const response = await fetch("/api/wizard/answer", {
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("答案提交失败。");
      }

      const data = (await response.json()) as WizardStepResult;
      startTransition(() => {
        setSession(data.session);
        setQuestion(data.question ?? null);
        resetAnswerFields();
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "答案提交失败。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function finishWizard() {
    if (!session) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/wizard/finish", {
        body: JSON.stringify({ sessionId: session.id }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("生成项目失败。");
      }

      const data = (await response.json()) as { project: { id: number } };
      setFinishedProjectId(data.project.id);
      clearSessionId();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "生成项目失败。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function persistSessionId(sessionId: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, sessionId);
    }
  }

  function clearSessionId() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }

  function resetAnswerFields() {
    setAnswerText("");
    setCustomValue("");
    setSelectedChoice("");
  }

  const answeredCount = Object.keys(session?.answers ?? {}).length;
  const preview = session?.preview;

  if (loading) {
    return <p className="wizard-meta">正在准备建书向导...</p>;
  }

  return (
    <section className="wizard-shell">
      <div className="wizard-header">
        <div>
          <p className="eyebrow">Deep Planning Wizard</p>
          <h1>像 Plan Mode 一样，把一本小说从零问出来。</h1>
          <p className="hero-summary">
            这个向导会逐步收集题材、主角、世界壳子、冲突、首卷目标和开篇钩子，
            最后自动生成项目、初始 canon、首卷方案和第 1 章 brief。
          </p>
        </div>
        <div className="wizard-status">
          <strong>{answeredCount} / 12</strong>
          <span>已完成问题</span>
        </div>
      </div>

      {error ? <p className="wizard-error">{error}</p> : null}

      {finishedProjectId ? (
        <div className="wizard-preview">
          <h2>项目已创建</h2>
          <p>项目 ID：{finishedProjectId}</p>
          <div className="wizard-actions">
            <Link className="studio-link" href="/">
              返回首页
            </Link>
            <button className="studio-button" onClick={() => void startNewSession()} type="button">
              再建一本
            </button>
          </div>
        </div>
      ) : null}

      {!finishedProjectId && preview && !question ? (
        <div className="wizard-preview">
          <h2>{preview.projectSeed.title}</h2>
          <p>{preview.projectSeed.genreLabel}</p>
          <p>{preview.projectSeed.premise}</p>

          <div className="wizard-preview-grid">
            <div>
              <h3>关键角色</h3>
              <ul>
                {preview.canonSeed.characters.map((item) => (
                  <li key={item.name}>
                    {item.name} · {item.role}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>首卷节点</h3>
              <ul>
                {preview.volumeOutline.milestones.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>第 1 章目标</h3>
              <p>{preview.chapterOneBrief.chapterGoal}</p>
              <small>钩子：{preview.chapterOneBrief.hookTarget}</small>
            </div>
          </div>

          <div className="wizard-actions">
            <button
              className="studio-button"
              disabled={isSubmitting}
              onClick={() => void finishWizard()}
              type="button"
            >
              {isSubmitting ? "生成中..." : "确认并创建项目"}
            </button>
            <button
              className="studio-button ghost-button"
              onClick={() => {
                clearSessionId();
                void startNewSession();
              }}
              type="button"
            >
              重新开始
            </button>
          </div>
        </div>
      ) : null}

      {!finishedProjectId && question ? (
        <form className="wizard-card" onSubmit={submitAnswer}>
          <p className="eyebrow">Current Question</p>
          <h2>{question.title}</h2>
          <p className="wizard-meta">{question.prompt}</p>

          {question.kind === "text" ? (
            <label className="wizard-field">
              <span>你的答案</span>
              <input
                onChange={(event) => setAnswerText(event.target.value)}
                placeholder="直接输入"
                value={answerText}
              />
            </label>
          ) : null}

          {question.kind === "single-choice" ? (
            <div className="wizard-choice-grid">
              {question.choices?.map((choice) => (
                <button
                  className={
                    selectedChoice === choice.id
                      ? "wizard-choice selected"
                      : "wizard-choice"
                  }
                  key={choice.id}
                  onClick={() => setSelectedChoice(choice.id)}
                  type="button"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : null}

          {question.allowCustom && selectedChoice === "custom" ? (
            <label className="wizard-field">
              <span>自定义答案</span>
              <textarea
                onChange={(event) => setCustomValue(event.target.value)}
                placeholder="补充你的版本"
                rows={4}
                value={customValue}
              />
            </label>
          ) : null}

          <div className="wizard-actions">
            <button className="studio-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "提交中..." : "下一题"}
            </button>
            <button
              className="studio-button ghost-button"
              onClick={() => {
                clearSessionId();
                void startNewSession();
              }}
              type="button"
            >
              重开向导
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
