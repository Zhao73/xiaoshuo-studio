import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  ChapterBrief,
  NovelBlueprint,
  OpenThread,
  ProjectCanon,
  WizardChoice,
  WizardQuestion,
  WizardSession,
} from "@/lib/models/studio";
import {
  createProject,
  createProjectArtifact,
  createWizardSession,
  getWizardSession as getStoredWizardSession,
  listProjectArtifacts,
  updateWizardSession,
} from "./db";
import { getProjectCanon, saveProjectCanon } from "./canon";
import { ensurePlatformDirectories, getPlatformPaths } from "./paths";

type AnswerRecord = {
  choiceId?: string;
  customValue?: string;
  value?: string;
};

type AnswerMap = Record<string, AnswerRecord>;

type AnswerWizardInput = {
  choiceId?: string;
  customValue?: string;
  questionId: string;
  sessionId: string;
  value?: string;
};

type WizardStepResult = {
  isComplete: boolean;
  preview?: NovelBlueprint;
  question?: WizardQuestion;
  session: WizardSession;
};

type GenreKey = "mystery-adventure" | "urban-modern" | "xianxia";

type GenreConfig = {
  archetypes: WizardChoice[];
  label: string;
  locations: Record<string, { base: string; pressure: string }>;
  openingHooks: WizardChoice[];
  powerCores: WizardChoice[];
  volumeGoals: WizardChoice[];
  worldShells: WizardChoice[];
};

const QUESTION_ORDER = [
  "book-title",
  "primary-genre",
  "world-shell",
  "protagonist-name",
  "protagonist-archetype",
  "power-core",
  "central-drive",
  "ally-name",
  "antagonist-name",
  "writing-style",
  "first-volume-goal",
  "opening-hook",
] as const;

const COMMON_DRIVES: WizardChoice[] = [
  { id: "protect-home", label: "先保住身边的地盘或宗门", value: "protect-home" },
  { id: "rise-fast", label: "快速崛起，先抢第一阶段优势", value: "rise-fast" },
  { id: "solve-truth", label: "先追到一条决定性的真相线", value: "solve-truth" },
  { id: "custom", label: "自定义", value: "custom" },
];

const WRITING_STYLES: WizardChoice[] = [
  { id: "high-pressure", label: "高压推进，短句强钩子", value: "high-pressure" },
  { id: "cinematic-tense", label: "镜头化推进，悬压感强", value: "cinematic-tense" },
  { id: "warm-fast", label: "爽感快节奏，但保留人物温度", value: "warm-fast" },
];

const GENRE_CONFIGS: Record<GenreKey, GenreConfig> = {
  xianxia: {
    archetypes: [
      {
        id: "debt-bound-disciple",
        label: "被债务/代价系统绑定的底层弟子",
        value: "debt-bound-disciple",
      },
      { id: "ruined-heir", label: "宗门没落后的残脉继承人", value: "ruined-heir" },
      { id: "cold-sword", label: "克制型剑修，被迫入局", value: "cold-sword" },
    ],
    label: "修仙",
    locations: {
      "sect-frontier": { base: "缥缈峰", pressure: "黑水城" },
      "ruined-immortal-city": { base: "残星仙城", pressure: "锁龙井" },
      "family-borderland": { base: "陈家外寨", pressure: "云岭矿脉" },
    },
    openingHooks: [
      { id: "sect-crisis", label: "宗门危机当场压顶", value: "sect-crisis" },
      { id: "forbidden-trial", label: "禁地试炼提前失控", value: "forbidden-trial" },
      { id: "custom", label: "自定义", value: "custom" },
    ],
    powerCores: [
      { id: "debt-ledger-system", label: "债契账册系统", value: "debt-ledger-system" },
      { id: "broken-spirit-root", label: "残缺灵根反向成长", value: "broken-spirit-root" },
      { id: "ancestral-sword-script", label: "祖传剑经残卷", value: "ancestral-sword-script" },
    ],
    volumeGoals: [
      { id: "survive-midnight", label: "先活过第一轮倒计时", value: "survive-midnight" },
      { id: "rebuild-sect", label: "先稳住宗门根基", value: "rebuild-sect" },
      { id: "break-first-realm", label: "先破第一个境界关", value: "break-first-realm" },
    ],
    worldShells: [
      { id: "sect-frontier", label: "边陲宗门守线", value: "sect-frontier" },
      { id: "ruined-immortal-city", label: "废墟仙城争夺", value: "ruined-immortal-city" },
      { id: "family-borderland", label: "修仙家族边地求生", value: "family-borderland" },
    ],
  },
  "urban-modern": {
    archetypes: [
      { id: "salary-slave", label: "底层打工人被迫升级", value: "salary-slave" },
      { id: "returning-heir", label: "失势归来的隐形继承人", value: "returning-heir" },
      { id: "double-life", label: "表面普通实则双重身份", value: "double-life" },
    ],
    label: "现代都市",
    locations: {
      "corporate-battlefield": { base: "临江市", pressure: "东岚资本" },
      "nightlife-underworld": { base: "江北老城", pressure: "九号码头" },
      "small-town-rise": { base: "青禾县", pressure: "省城新区" },
    },
    openingHooks: [
      { id: "public-humiliation", label: "公开场合被打脸", value: "public-humiliation" },
      { id: "sudden-inheritance", label: "突然继承一笔麻烦资产", value: "sudden-inheritance" },
      { id: "custom", label: "自定义", value: "custom" },
    ],
    powerCores: [
      { id: "market-intuition", label: "异常准确的市场直觉", value: "market-intuition" },
      { id: "time-loop-ledger", label: "短周期回溯账本", value: "time-loop-ledger" },
      { id: "hidden-network", label: "隐秘人脉网络", value: "hidden-network" },
    ],
    volumeGoals: [
      { id: "win-first-deal", label: "拿下第一场关键交易", value: "win-first-deal" },
      { id: "save-family", label: "先保住家庭/公司底盘", value: "save-family" },
      { id: "enter-core-circle", label: "挤进更高层圈子", value: "enter-core-circle" },
    ],
    worldShells: [
      { id: "corporate-battlefield", label: "资本职场对冲局", value: "corporate-battlefield" },
      { id: "nightlife-underworld", label: "都市暗线与灰区势力", value: "nightlife-underworld" },
      { id: "small-town-rise", label: "小城起盘向上冲", value: "small-town-rise" },
    ],
  },
  "mystery-adventure": {
    archetypes: [
      {
        id: "reluctant-investigator",
        label: "不情愿入局的追查者",
        value: "reluctant-investigator",
      },
      { id: "grave-scout", label: "半懂规矩的探墓手", value: "grave-scout" },
      { id: "archivist", label: "掌握旧档案秘密的记录者", value: "archivist" },
    ],
    label: "悬疑冒险",
    locations: {
      "collapsed-tomb-city": { base: "青烛城", pressure: "雨夜古墓" },
      "mountain-expedition": { base: "乌岭驿站", pressure: "断碑山腹" },
      "island-ruins": { base: "白汐港", pressure: "沉灯群岛" },
    },
    openingHooks: [
      { id: "sealed-vault-opens", label: "封闭入口突然打开", value: "sealed-vault-opens" },
      { id: "corpse-message", label: "尸体留下新线索", value: "corpse-message" },
      { id: "custom", label: "自定义", value: "custom" },
    ],
    powerCores: [
      { id: "forbidden-map", label: "禁图/旧地图系统", value: "forbidden-map" },
      { id: "ancestral-notes", label: "失踪长辈留下的手记", value: "ancestral-notes" },
      { id: "pattern-memory", label: "异常强的图案记忆", value: "pattern-memory" },
    ],
    volumeGoals: [
      { id: "truth-before-dawn", label: "先追到第一层真相", value: "truth-before-dawn" },
      { id: "survive-expedition", label: "先活着带队出来", value: "survive-expedition" },
      { id: "recover-key", label: "先拿到关键遗物", value: "recover-key" },
    ],
    worldShells: [
      { id: "collapsed-tomb-city", label: "古墓连城的地下迷局", value: "collapsed-tomb-city" },
      { id: "mountain-expedition", label: "深山失踪与禁地勘探", value: "mountain-expedition" },
      { id: "island-ruins", label: "海岛遗址与封存真相", value: "island-ruins" },
    ],
  },
};

const GENRE_CHOICES: WizardChoice[] = [
  { id: "xianxia", label: "修仙", value: "xianxia" },
  { id: "urban-modern", label: "现代都市", value: "urban-modern" },
  { id: "mystery-adventure", label: "悬疑冒险", value: "mystery-adventure" },
];

export async function startWizardSession(input: { seedGenre?: GenreKey } = {}) {
  const answers: AnswerMap = {};

  if (input.seedGenre) {
    answers["primary-genre"] = {
      choiceId: input.seedGenre,
      value: input.seedGenre,
    };
  }

  const firstQuestionId = answers["primary-genre"] ? "book-title" : "book-title";
  const session = createWizardSession({
    answers,
    currentQuestionId: firstQuestionId,
    id: randomUUID(),
    status: "in_progress",
  });

  return {
    question: getQuestion(firstQuestionId, answers),
    session: sessionToPublic(session),
  };
}

export async function answerWizardSession(
  input: AnswerWizardInput,
): Promise<WizardStepResult> {
  const session = requireWizardSession(input.sessionId);

  if (session.status === "completed") {
    throw new Error("Wizard session is already completed.");
  }

  if (session.currentQuestionId !== input.questionId) {
    throw new Error(
      `Expected question ${session.currentQuestionId}, received ${input.questionId}.`,
    );
  }

  const answers = session.answers as AnswerMap;
  const question = getQuestion(input.questionId, answers);
  const normalizedAnswer = normalizeAnswer(question, input);
  const nextAnswers = {
    ...answers,
    [input.questionId]: normalizedAnswer,
  };
  const nextQuestionId = findNextQuestionId(nextAnswers, input.questionId);

  if (!nextQuestionId) {
    const updated = updateWizardSession({
      answers: nextAnswers,
      currentQuestionId: null,
      id: session.id,
      status: "ready",
    });

    return {
      isComplete: true,
      preview: buildBlueprint(nextAnswers),
      session: sessionToPublic(updated),
    };
  }

  const updated = updateWizardSession({
    answers: nextAnswers,
    currentQuestionId: nextQuestionId,
    id: session.id,
    status: "in_progress",
  });

  return {
    isComplete: false,
    question: getQuestion(nextQuestionId, nextAnswers),
    session: sessionToPublic(updated),
  };
}

export async function getWizardSession(sessionId: string) {
  const session = requireWizardSession(sessionId);
  const publicSession = sessionToPublic(session);

  return {
    preview: publicSession.preview,
    question:
      session.currentQuestionId === null
        ? undefined
        : getQuestion(session.currentQuestionId, session.answers as AnswerMap),
    session: publicSession,
  };
}

export async function finishWizardSession(sessionId: string) {
  const session = requireWizardSession(sessionId);
  const answers = session.answers as AnswerMap;

  if (!isWizardComplete(answers)) {
    throw new Error("Wizard session is not complete.");
  }

  const blueprint = buildBlueprint(answers);
  const project = createProject({
    genre: blueprint.projectSeed.genreLabel,
    premise: blueprint.projectSeed.premise,
    title: blueprint.projectSeed.title,
  });

  await saveProjectCanon({
    ...blueprint.canonSeed,
    projectId: project.id,
  });

  const artifactPaths = writeWizardArtifacts(project.id, blueprint);
  const artifacts = [
    createProjectArtifact({
      content: blueprint as unknown as Record<string, unknown>,
      kind: "novel-blueprint",
      markdownPath: artifactPaths.blueprintPath,
      projectId: project.id,
      title: "Novel Blueprint",
    }),
    createProjectArtifact({
      content: blueprint.volumeOutline as unknown as Record<string, unknown>,
      kind: "volume-outline",
      markdownPath: artifactPaths.volumeOutlinePath,
      projectId: project.id,
      title: "Volume One Outline",
    }),
    createProjectArtifact({
      content: blueprint.chapterOneBrief as unknown as Record<string, unknown>,
      kind: "chapter-brief",
      markdownPath: artifactPaths.chapterBriefPath,
      projectId: project.id,
      title: "Chapter One Brief",
    }),
  ];

  updateWizardSession({
    answers,
    currentQuestionId: null,
    id: session.id,
    status: "completed",
  });

  return {
    artifacts,
    blueprint,
    project,
  };
}

export { getProjectCanon, listProjectArtifacts };

function requireWizardSession(sessionId: string) {
  const session = getStoredWizardSession(sessionId);

  if (!session) {
    throw new Error(`Wizard session ${sessionId} not found.`);
  }

  return session;
}

function sessionToPublic(
  session: ReturnType<typeof getStoredWizardSession>,
): WizardSession {
  if (!session) {
    throw new Error("Wizard session missing.");
  }

  const answers = session.answers as AnswerMap;

  return {
    answers,
    createdAt: session.createdAt,
    currentQuestionId: session.currentQuestionId,
    id: session.id,
    preview: isWizardComplete(answers) ? buildBlueprint(answers) : undefined,
    status: session.status as WizardSession["status"],
    updatedAt: session.updatedAt,
  };
}

function isWizardComplete(answers: AnswerMap) {
  return QUESTION_ORDER.every((questionId) => Boolean(answers[questionId]));
}

function findNextQuestionId(answers: AnswerMap, currentQuestionId: string) {
  const currentIndex = QUESTION_ORDER.findIndex((item) => item === currentQuestionId);

  for (const questionId of QUESTION_ORDER.slice(currentIndex + 1)) {
    if (!answers[questionId]) {
      return questionId;
    }
  }

  return null;
}

function getQuestion(questionId: string, answers: AnswerMap): WizardQuestion {
  switch (questionId) {
    case "book-title":
      return {
        id: "book-title",
        kind: "text",
        prompt: "先定书名，后面所有问题都围绕这本书展开。",
        title: "这本小说叫什么？",
      };
    case "primary-genre":
      return {
        choices: GENRE_CHOICES,
        id: "primary-genre",
        kind: "single-choice",
        prompt: "先锁题材，后面的问题会按题材分支变化。",
        title: "你这本书主类型是什么？",
      };
    case "world-shell":
      return {
        choices: getGenreConfig(answers).worldShells,
        id: "world-shell",
        kind: "single-choice",
        prompt: "选一个最像你开局场域的世界壳子。",
        title: "小说主要发生在什么样的世界壳子里？",
      };
    case "protagonist-name":
      return {
        id: "protagonist-name",
        kind: "text",
        prompt: "先定主角名，后面角色关系和 brief 会直接引用。",
        title: "主角叫什么？",
      };
    case "protagonist-archetype":
      return {
        choices: getGenreConfig(answers).archetypes,
        id: "protagonist-archetype",
        kind: "single-choice",
        prompt: "选主角的开局模板。",
        title: "主角最像哪种开局模板？",
      };
    case "power-core":
      return {
        choices: getGenreConfig(answers).powerCores,
        id: "power-core",
        kind: "single-choice",
        prompt: "这里决定爽点来源、规则压力和后续卷纲走向。",
        title: "主角最核心的能力/抓手是什么？",
      };
    case "central-drive":
      return {
        allowCustom: true,
        choices: COMMON_DRIVES,
        id: "central-drive",
        kind: "single-choice",
        prompt: "主角最先被什么驱动，不是终局理想，而是眼下必须做的事。",
        title: "这本书最先推动主角行动的动力是什么？",
      };
    case "ally-name":
      return {
        id: "ally-name",
        kind: "text",
        prompt: "这是首卷最关键的同伴/牵引角色。",
        title: "首卷最关键的同伴叫什么？",
      };
    case "antagonist-name":
      return {
        id: "antagonist-name",
        kind: "text",
        prompt: "先定阶段性反派，便于自动生成卷纲矛盾。",
        title: "首卷阶段性反派叫什么？",
      };
    case "writing-style":
      return {
        choices: WRITING_STYLES,
        id: "writing-style",
        kind: "single-choice",
        prompt: "这会直接映射成初始 writing rules。",
        title: "希望默认写法更偏哪种节奏？",
      };
    case "first-volume-goal":
      return {
        choices: getGenreConfig(answers).volumeGoals,
        id: "first-volume-goal",
        kind: "single-choice",
        prompt: "这决定第一卷的终点状态。",
        title: "第一卷最少要打到什么结果？",
      };
    case "opening-hook":
      return {
        allowCustom: true,
        choices: getGenreConfig(answers).openingHooks,
        id: "opening-hook",
        kind: "single-choice",
        prompt: "这会直接变成第 1 章的导火索和 hook 目标。",
        title: "开篇最适合用什么钩子把故事炸开？",
      };
    default:
      throw new Error(`Unknown wizard question: ${questionId}`);
  }
}

function normalizeAnswer(question: WizardQuestion, input: AnswerWizardInput) {
  if (question.kind === "text") {
    const value = input.value?.trim();

    if (!value) {
      throw new Error(`Question ${question.id} requires text input.`);
    }

    return { value };
  }

  if (!input.choiceId) {
    throw new Error(`Question ${question.id} requires a choice.`);
  }

  if (input.choiceId === "custom") {
    const customValue = input.customValue?.trim();

    if (!question.allowCustom || !customValue) {
      throw new Error(`Question ${question.id} requires customValue.`);
    }

    return {
      choiceId: input.choiceId,
      customValue,
      value: customValue,
    };
  }

  const choice = question.choices?.find((item) => item.id === input.choiceId);

  if (!choice) {
    throw new Error(`Choice ${input.choiceId} is invalid for ${question.id}.`);
  }

  return {
    choiceId: choice.id,
    value: choice.value,
  };
}

function getGenreConfig(answers: AnswerMap) {
  const genre = answers["primary-genre"]?.value as GenreKey | undefined;

  if (!genre || !GENRE_CONFIGS[genre]) {
    throw new Error("Genre must be selected before asking genre-specific questions.");
  }

  return GENRE_CONFIGS[genre];
}

function buildBlueprint(answers: AnswerMap): NovelBlueprint {
  const genre = answers["primary-genre"]?.value as GenreKey;
  const config = GENRE_CONFIGS[genre];
  const title = getAnswerText(answers, "book-title");
  const protagonistName = getAnswerText(answers, "protagonist-name");
  const allyName = getAnswerText(answers, "ally-name");
  const antagonistName = getAnswerText(answers, "antagonist-name");
  const worldShell = resolveChoiceLabel(answers, "world-shell");
  const protagonistArchetype = resolveChoiceLabel(answers, "protagonist-archetype");
  const powerCore = resolveChoiceLabel(answers, "power-core");
  const centralDrive = resolveChoiceLabel(answers, "central-drive");
  const volumeGoal = resolveChoiceLabel(answers, "first-volume-goal");
  const openingHook = resolveChoiceLabel(answers, "opening-hook");
  const locations = config.locations[answers["world-shell"]?.value ?? ""] ?? {
    base: worldShell,
    pressure: `${worldShell}外线`,
  };
  const writingRules = buildWritingRules(answers["writing-style"]?.value ?? "");
  const worldRules = buildWorldRules(genre, answers["power-core"]?.value ?? "", locations);
  const phaseGoal = `${protagonistName}必须在第一卷里完成“${volumeGoal}”，否则 ${locations.base} 的局面会彻底失控。`;
  const premise = `${protagonistName}在${worldShell}中被卷入“${openingHook}”，必须依靠${powerCore}推进“${centralDrive}”，并顶住${antagonistName}带来的反压。`;
  const openThreads: OpenThread[] = [
    {
      priority: "high",
      status: "open",
      summary: `首卷主线必须推进到：${volumeGoal}`,
      title: "第一卷主线目标",
    },
    {
      priority: "high",
      status: "open",
      summary: `开篇钩子需要在前三章持续放大：${openingHook}`,
      title: "开篇钩子回收线",
    },
  ];
  const canonSeed: ProjectCanon = {
    characters: [
      {
        currentState: `在${locations.base}被迫接下第一轮危机`,
        goals: [centralDrive, volumeGoal],
        name: protagonistName,
        role: `主角 / ${protagonistArchetype}`,
        secrets: [powerCore],
      },
      {
        currentState: `与${protagonistName}绑定在同一条首卷矛盾线上`,
        goals: [`帮助${protagonistName}挺过第一卷`],
        name: allyName,
        role: "关键同伴",
        secrets: [`知道一部分与${openingHook}有关的隐情`],
      },
      {
        currentState: `在暗中推动${locations.pressure}方向的风险升级`,
        goals: [`阻断${protagonistName}完成${volumeGoal}`],
        name: antagonistName,
        role: "阶段反派",
        secrets: [`与${openingHook}背后的真正力量有关`],
      },
    ],
    foreshadowing: [
      {
        payoffHint: `第一卷后半段揭开 ${openingHook} 背后的更大代价`,
        status: "planted",
        title: `${openingHook} 的真实来源`,
      },
    ],
    locations: [
      { currentState: "主角当前立足点，也是第一轮危机中心", name: locations.base },
      { currentState: "首卷外部压力和冲突升级地点", name: locations.pressure },
    ],
    openThreads,
    storyBible: {
      phaseGoal,
      summary: premise,
      worldRules,
    },
    timeline: [
      {
        chapterNumber: 1,
        detail: `${openingHook}，主角在${locations.base}被迫入局。`,
        label: "开篇入局",
      },
    ],
    writingRules,
  };
  const chapterOneBrief: ChapterBrief = {
    chapterGoal: `让${protagonistName}在${locations.base}当场接住“${openingHook}”，并把下一步矛头明确指向${locations.pressure}。`,
    forbiddenMoves: worldRules,
    hookTarget: openingHook,
    mustUseFacts: [
      `${protagonistName} 的当前驱动力是：${centralDrive}`,
      `${allyName} 必须在前期建立情感或利益绑定`,
      `${antagonistName} 的压力要在暗线先出现`,
      `第一卷的最低结果是：${volumeGoal}`,
    ],
    optionalThreads: openThreads,
    recentChapterSummaries: [],
    styleConstraints: writingRules,
    successCondition: `第 1 章必须完成入局、压出第一层冲突，并用“${openingHook}”作为章末钩子。`,
  };

  return {
    canonSeed,
    chapterOneBrief,
    projectSeed: {
      genreLabel: config.label,
      premise,
      title,
    },
    volumeOutline: {
      endState: `${protagonistName} 至少完成“${volumeGoal}”，并把与${antagonistName}的矛盾推到下一卷。`,
      milestones: [
        `第 1 节点：${openingHook} 把${protagonistName}压进${locations.base}的危机核心。`,
        `第 2 节点：${allyName} 与${protagonistName}共同接触${locations.pressure}方向的关键线索。`,
        `第 3 节点：${antagonistName} 逼出一次硬碰硬，让首卷主线落到“${volumeGoal}”上。`,
      ],
      summary: `${title} 是一部${config.label}故事，主角${protagonistName}必须借助${powerCore}推进“${centralDrive}”，并在第一卷内完成“${volumeGoal}”。`,
    },
  };
}

function getAnswerText(answers: AnswerMap, questionId: string) {
  const value = answers[questionId]?.value?.trim();

  if (!value) {
    throw new Error(`Missing answer for ${questionId}.`);
  }

  return value;
}

function resolveChoiceLabel(answers: AnswerMap, questionId: string) {
  const record = answers[questionId];

  if (!record) {
    throw new Error(`Missing answer for ${questionId}.`);
  }

  if (record.choiceId === "custom") {
    return record.customValue ?? record.value ?? "";
  }

  const question = getQuestion(questionId, answers);
  const choice = question.choices?.find((item) => item.id === record.choiceId);

  return choice?.label ?? record.value ?? "";
}

function buildWritingRules(styleId: string) {
  switch (styleId) {
    case "high-pressure":
      return ["减少解释腔", "保持短句推进", "章末必须留明确钩子"];
    case "cinematic-tense":
      return ["镜头化场景推进", "减少说明性总结", "保留具体动作细节"];
    case "warm-fast":
      return ["快节奏但保留人物温度", "冲突中保留情绪落点", "少空泛抒情"];
    default:
      return ["减少解释腔", "少抽象总结", "保持冲突推进"];
  }
}

function buildWorldRules(
  genre: GenreKey,
  powerCoreId: string,
  locations: { base: string; pressure: string },
) {
  if (genre === "xianxia" && powerCoreId === "debt-ledger-system") {
    return [
      "每次债契倒计时都不能硬拖过去",
      `${locations.base} 的危机若失守，主角会直接失去第一轮立足点`,
    ];
  }

  if (genre === "mystery-adventure" && powerCoreId === "forbidden-map") {
    return [
      "禁图每次展开都会引出新的风险",
      `${locations.pressure} 的真相不能在开篇一次性说透`,
    ];
  }

  return [
    "主角的核心能力必须伴随明确代价或约束",
    `${locations.base} 和 ${locations.pressure} 必须形成双重压力`,
  ];
}

function writeWizardArtifacts(projectId: number, blueprint: NovelBlueprint) {
  const paths = ensurePlatformDirectories(getPlatformPaths());
  const projectDir = path.join(paths.canonDir, `project-${projectId}`, "artifacts");
  fs.mkdirSync(projectDir, { recursive: true });

  const blueprintPath = path.join(projectDir, "novel-blueprint.md");
  const volumeOutlinePath = path.join(projectDir, "volume-outline.md");
  const chapterBriefPath = path.join(projectDir, "chapter-one-brief.md");

  fs.writeFileSync(blueprintPath, renderBlueprintMarkdown(blueprint), "utf8");
  fs.writeFileSync(
    volumeOutlinePath,
    renderVolumeOutlineMarkdown(blueprint.volumeOutline),
    "utf8",
  );
  fs.writeFileSync(
    chapterBriefPath,
    renderChapterBriefMarkdown(blueprint.chapterOneBrief),
    "utf8",
  );

  return {
    blueprintPath,
    chapterBriefPath,
    volumeOutlinePath,
  };
}

function renderBlueprintMarkdown(blueprint: NovelBlueprint) {
  return [
    `# ${blueprint.projectSeed.title} Blueprint`,
    "",
    `- 类型: ${blueprint.projectSeed.genreLabel}`,
    `- premise: ${blueprint.projectSeed.premise}`,
    "",
    "## 首卷方案",
    blueprint.volumeOutline.summary,
    "",
    "## 关键节点",
    ...blueprint.volumeOutline.milestones.map((item) => `- ${item}`),
    "",
    "## 第1章 Brief",
    `- 目标: ${blueprint.chapterOneBrief.chapterGoal}`,
    `- 钩子: ${blueprint.chapterOneBrief.hookTarget ?? ""}`,
  ].join("\n");
}

function renderVolumeOutlineMarkdown(blueprint: NovelBlueprint["volumeOutline"]) {
  return [
    "# Volume One Outline",
    "",
    blueprint.summary,
    "",
    ...blueprint.milestones.map((item) => `- ${item}`),
    "",
    `结尾状态：${blueprint.endState}`,
  ].join("\n");
}

function renderChapterBriefMarkdown(brief: ChapterBrief) {
  return [
    "# Chapter One Brief",
    "",
    `- 目标: ${brief.chapterGoal}`,
    `- 钩子: ${brief.hookTarget ?? ""}`,
    "",
    "## Must Use Facts",
    ...brief.mustUseFacts.map((item) => `- ${item}`),
    "",
    "## Style Constraints",
    ...brief.styleConstraints.map((item) => `- ${item}`),
  ].join("\n");
}
