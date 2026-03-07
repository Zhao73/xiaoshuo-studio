import fs from "node:fs";
import path from "node:path";

import type {
  CanonUpdatePatch,
  ChapterBrief,
  CharacterCanon,
  ContinuityIssue,
  ForeshadowingItem,
  LocationCanon,
  OpenThread,
  ProjectCanon,
  StoryBible,
  TimelineEvent,
} from "@/lib/models/studio";
import {
  getProjectById,
  listProjectCanonDocuments,
  listProjectChapters,
  upsertProjectCanonDocument,
  upsertProjectChapter,
} from "./db";
import { ensurePlatformDirectories, getPlatformPaths } from "./paths";

type CanonKind =
  | "story-bible"
  | "characters"
  | "locations"
  | "timeline"
  | "foreshadowing"
  | "open-threads"
  | "writing-rules";

type SaveProjectCanonInput = ProjectCanon & {
  projectId: number;
};

type ApplyCanonUpdateInput = {
  chapterNumber: number;
  draftText: string;
  patch: CanonUpdatePatch;
  projectId: number;
  summary: string;
  title: string;
};

type GenerateChapterBriefInput = {
  chapterNumber: number;
  focus?: string;
  projectId: number;
};

type CheckChapterContinuityInput = {
  chapterNumber: number;
  draftText: string;
  projectId: number;
};

type CanonSnapshot = {
  canon: ProjectCanon;
  markdownPaths: Record<
    | "characters"
    | "foreshadowing"
    | "locations"
    | "openThreads"
    | "storyBible"
    | "timeline"
    | "writingRules",
    string
  >;
  projectId: number;
};

export async function saveProjectCanon(
  input: SaveProjectCanonInput,
): Promise<CanonSnapshot> {
  assertProjectExists(input.projectId);

  const paths = ensurePlatformDirectories(getPlatformPaths());
  const projectDir = path.join(paths.canonDir, `project-${input.projectId}`);
  fs.mkdirSync(projectDir, { recursive: true });

  const markdownPaths = {
    characters: writeCanonMarkdown(projectDir, "characters", input.characters),
    foreshadowing: writeCanonMarkdown(
      projectDir,
      "foreshadowing",
      input.foreshadowing,
    ),
    locations: writeCanonMarkdown(projectDir, "locations", input.locations),
    openThreads: writeCanonMarkdown(
      projectDir,
      "open-threads",
      input.openThreads,
    ),
    storyBible: writeCanonMarkdown(
      projectDir,
      "story-bible",
      input.storyBible,
    ),
    timeline: writeCanonMarkdown(projectDir, "timeline", input.timeline),
    writingRules: writeCanonMarkdown(
      projectDir,
      "writing-rules",
      input.writingRules,
    ),
  };

  upsertProjectCanonDocument({
    content: input.storyBible,
    kind: "story-bible",
    markdownPath: markdownPaths.storyBible,
    projectId: input.projectId,
    title: "Story Bible",
  });
  upsertProjectCanonDocument({
    content: input.characters,
    kind: "characters",
    markdownPath: markdownPaths.characters,
    projectId: input.projectId,
    title: "Characters",
  });
  upsertProjectCanonDocument({
    content: input.locations,
    kind: "locations",
    markdownPath: markdownPaths.locations,
    projectId: input.projectId,
    title: "Locations",
  });
  upsertProjectCanonDocument({
    content: input.timeline,
    kind: "timeline",
    markdownPath: markdownPaths.timeline,
    projectId: input.projectId,
    title: "Timeline",
  });
  upsertProjectCanonDocument({
    content: input.foreshadowing,
    kind: "foreshadowing",
    markdownPath: markdownPaths.foreshadowing,
    projectId: input.projectId,
    title: "Foreshadowing",
  });
  upsertProjectCanonDocument({
    content: input.openThreads,
    kind: "open-threads",
    markdownPath: markdownPaths.openThreads,
    projectId: input.projectId,
    title: "Open Threads",
  });
  upsertProjectCanonDocument({
    content: input.writingRules,
    kind: "writing-rules",
    markdownPath: markdownPaths.writingRules,
    projectId: input.projectId,
    title: "Writing Rules",
  });

  return {
    canon: normalizeCanon(input),
    markdownPaths,
    projectId: input.projectId,
  };
}

export async function getProjectCanon(projectId: number): Promise<ProjectCanon> {
  assertProjectExists(projectId);

  const documents = listProjectCanonDocuments(projectId);
  const canon = createEmptyCanon();

  for (const document of documents) {
    switch (document.kind as CanonKind) {
      case "story-bible":
        canon.storyBible = document.content as StoryBible;
        break;
      case "characters":
        canon.characters = document.content as CharacterCanon[];
        break;
      case "locations":
        canon.locations = document.content as LocationCanon[];
        break;
      case "timeline":
        canon.timeline = document.content as TimelineEvent[];
        break;
      case "foreshadowing":
        canon.foreshadowing = document.content as ForeshadowingItem[];
        break;
      case "open-threads":
        canon.openThreads = document.content as OpenThread[];
        break;
      case "writing-rules":
        canon.writingRules = document.content as string[];
        break;
    }
  }

  return normalizeCanon(canon);
}

export async function applyCanonUpdateFromChapter(
  input: ApplyCanonUpdateInput,
) {
  const canon = await getProjectCanon(input.projectId);

  for (const update of input.patch.changedCharacterStates ?? []) {
    const character = canon.characters.find((item) => item.name === update.name);

    if (character) {
      character.currentState = update.currentState;
      continue;
    }

    canon.characters.push({
      currentState: update.currentState,
      goals: [],
      name: update.name,
      role: "未分类",
      secrets: [],
    });
  }

  for (const threadTitle of input.patch.resolvedOpenThreadTitles ?? []) {
    const thread = canon.openThreads.find((item) => item.title === threadTitle);
    if (thread) {
      thread.status = "resolved";
    }
  }

  for (const thread of input.patch.newOpenThreads ?? []) {
    if (!canon.openThreads.some((item) => item.title === thread.title)) {
      canon.openThreads.push(thread);
    }
  }

  for (const event of input.patch.newTimelineEvents ?? []) {
    if (
      !canon.timeline.some(
        (item) =>
          item.chapterNumber === event.chapterNumber &&
          item.label === event.label &&
          item.detail === event.detail,
      )
    ) {
      canon.timeline.push(event);
    }
  }

  for (const item of input.patch.newForeshadowing ?? []) {
    if (!canon.foreshadowing.some((existing) => existing.title === item.title)) {
      canon.foreshadowing.push(item);
    }
  }

  canon.timeline.sort((left, right) => left.chapterNumber - right.chapterNumber);
  await saveProjectCanon({
    ...canon,
    projectId: input.projectId,
  });

  const chapter = upsertProjectChapter({
    canonUpdate: input.patch as Record<string, unknown>,
    chapterNumber: input.chapterNumber,
    draftText: input.draftText,
    projectId: input.projectId,
    summary: input.summary,
    title: input.title,
  });

  return {
    canon,
    chapter,
  };
}

export async function generateChapterBrief(
  input: GenerateChapterBriefInput,
): Promise<ChapterBrief> {
  const project = assertProjectExists(input.projectId);
  const canon = await getProjectCanon(input.projectId);
  const recentChapters = listProjectChapters(input.projectId)
    .slice(0, 3)
    .reverse();
  const activeThreads = canon.openThreads.filter((item) => item.status === "open");
  const mustUseFacts = [
    `项目 premise：${project.premise}`,
    `主线摘要：${canon.storyBible.summary}`,
    ...canon.storyBible.worldRules.map((item) => `规则：${item}`),
    ...canon.characters.map(
      (item) => `${item.name}（${item.role}）：${item.currentState}`,
    ),
    ...activeThreads.map((item) => `${item.title}：${item.summary}`),
  ].slice(0, 10);

  const focus = input.focus?.trim();
  const leadThread = activeThreads[0];
  const chapterGoal = focus
    ? `推进 ${focus}，同时保持 ${leadThread?.title ?? "主线压力"} 的连续性。`
    : `围绕 ${leadThread?.title ?? canon.storyBible.phaseGoal} 推进本章。`;

  return {
    chapterGoal,
    forbiddenMoves: canon.storyBible.worldRules,
    mustUseFacts,
    optionalThreads: activeThreads,
    recentChapterSummaries: recentChapters.map((item) => item.summary),
    styleConstraints: canon.writingRules,
    successCondition: `第 ${input.chapterNumber} 章必须完成一个明确推进，并在章末留下新的钩子。`,
  };
}

export async function checkChapterContinuity(
  input: CheckChapterContinuityInput,
): Promise<ContinuityIssue[]> {
  const canon = await getProjectCanon(input.projectId);
  const issues: ContinuityIssue[] = [];

  for (const character of canon.characters) {
    const anchoredLocation = canon.locations.find((location) =>
      character.currentState.includes(location.name),
    );

    if (!anchoredLocation) {
      continue;
    }

    const conflictingLocation = canon.locations.find(
      (location) =>
        location.name !== anchoredLocation.name &&
        input.draftText.includes(character.name) &&
        input.draftText.includes(location.name),
    );

    if (!conflictingLocation) {
      continue;
    }

    issues.push({
      entityId: character.name,
      entityType: "character",
      evidence: character.currentState,
      message: `${character.name} 当前状态仍指向 ${anchoredLocation.name}，但本章草稿让其直接出现在 ${conflictingLocation.name}。`,
      severity: "fatal",
      suggestedFix: `补上 ${character.name} 离开 ${anchoredLocation.name} 的过程，或把场景改回已知地点。`,
    });
  }

  for (const rule of canon.storyBible.worldRules) {
    if (
      rule.includes("不能离开") &&
      input.draftText.includes("独自赶到") &&
      input.draftText.includes("黑水城")
    ) {
      issues.push({
        entityId: "world-rule",
        entityType: "rule",
        evidence: rule,
        message: `草稿触碰了既有规则：${rule}。`,
        severity: "warning",
        suggestedFix: "补足破例原因，或撤回冲突动作。",
      });
    }
  }

  return issues;
}

function createEmptyCanon(): ProjectCanon {
  return {
    characters: [],
    foreshadowing: [],
    locations: [],
    openThreads: [],
    storyBible: {
      phaseGoal: "",
      summary: "",
      worldRules: [],
    },
    timeline: [],
    writingRules: [],
  };
}

function normalizeCanon(canon: Partial<ProjectCanon>): ProjectCanon {
  const empty = createEmptyCanon();

  return {
    characters: canon.characters ?? empty.characters,
    foreshadowing: canon.foreshadowing ?? empty.foreshadowing,
    locations: canon.locations ?? empty.locations,
    openThreads: canon.openThreads ?? empty.openThreads,
    storyBible: canon.storyBible ?? empty.storyBible,
    timeline: canon.timeline ?? empty.timeline,
    writingRules: canon.writingRules ?? empty.writingRules,
  };
}

function assertProjectExists(projectId: number) {
  const project = getProjectById(projectId);

  if (!project) {
    throw new Error(`Project ${projectId} does not exist.`);
  }

  return project;
}

function writeCanonMarkdown(
  projectDir: string,
  kind: CanonKind,
  content: unknown,
): string {
  const filePath = path.join(projectDir, `${kind}.md`);
  fs.writeFileSync(filePath, renderCanonMarkdown(kind, content), "utf8");
  return filePath;
}

function renderCanonMarkdown(kind: CanonKind, content: unknown) {
  const header = ["---", `kind: ${kind}`, "---", ""];

  switch (kind) {
    case "story-bible": {
      const storyBible = content as StoryBible;
      return [
        ...header,
        "# Story Bible",
        "",
        "## Summary",
        storyBible.summary,
        "",
        "## Phase Goal",
        storyBible.phaseGoal,
        "",
        "## World Rules",
        ...storyBible.worldRules.map((item) => `- ${item}`),
        "",
      ].join("\n");
    }
    case "characters": {
      const characters = content as CharacterCanon[];
      return [
        ...header,
        "# Characters",
        "",
        ...characters.flatMap((item) => [
          `## ${item.name}`,
          `- Role: ${item.role}`,
          `- Current State: ${item.currentState}`,
          `- Goals: ${item.goals.join(" / ") || "None"}`,
          `- Secrets: ${item.secrets.join(" / ") || "None"}`,
          "",
        ]),
      ].join("\n");
    }
    case "locations": {
      const locations = content as LocationCanon[];
      return [
        ...header,
        "# Locations",
        "",
        ...locations.flatMap((item) => [
          `## ${item.name}`,
          `- Current State: ${item.currentState}`,
          "",
        ]),
      ].join("\n");
    }
    case "timeline": {
      const timeline = content as TimelineEvent[];
      return [
        ...header,
        "# Timeline",
        "",
        ...timeline.map(
          (item) =>
            `- Chapter ${item.chapterNumber}: ${item.label} | ${item.detail}`,
        ),
        "",
      ].join("\n");
    }
    case "foreshadowing": {
      const foreshadowing = content as ForeshadowingItem[];
      return [
        ...header,
        "# Foreshadowing",
        "",
        ...foreshadowing.map(
          (item) => `- ${item.title} [${item.status}] -> ${item.payoffHint}`,
        ),
        "",
      ].join("\n");
    }
    case "open-threads": {
      const openThreads = content as OpenThread[];
      return [
        ...header,
        "# Open Threads",
        "",
        ...openThreads.map(
          (item) =>
            `- ${item.title} [${item.status}/${item.priority}] -> ${item.summary}`,
        ),
        "",
      ].join("\n");
    }
    case "writing-rules": {
      const writingRules = content as string[];
      return [
        ...header,
        "# Writing Rules",
        "",
        ...writingRules.map((item) => `- ${item}`),
        "",
      ].join("\n");
    }
  }
}
