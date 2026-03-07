export type StudioSkillGroup =
  | "canon"
  | "drafting"
  | "init"
  | "learning"
  | "planning"
  | "reference"
  | "review";

export type StudioInstallMode = "aggregator-only" | "full-bundle";

export type StudioSkillEntry = {
  group: StudioSkillGroup;
  includeInAggregator: boolean;
  installModes: StudioInstallMode[];
  skillName: string;
  triggerPhrases: string[];
  typicalTasks: string[];
};

export type AggregatorRouteResult = {
  matchedGroup: StudioSkillGroup;
  reason: string;
  targetSkills: string[];
};

export const STUDIO_SKILL_REGISTRY: StudioSkillEntry[] = [
  {
    group: "init",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-init",
    triggerPhrases: ["刷新项目", "新建项目", "更新 premise", "项目框架"],
    typicalTasks: ["lightweight-project-init"],
  },
  {
    group: "init",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "novel-init-wizard",
    triggerPhrases: ["创建一本小说", "一步步问答建书", "建书向导", "修仙小说项目"],
    typicalTasks: ["deep-project-init"],
  },
  {
    group: "reference",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-import",
    triggerPhrases: ["导入片段", "导入参考", "添加样本"],
    typicalTasks: ["excerpt-import"],
  },
  {
    group: "reference",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-import-folder",
    triggerPhrases: ["导入文件夹", "本地小说文件夹", "批量导入小说"],
    typicalTasks: ["folder-import"],
  },
  {
    group: "reference",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-scrape",
    triggerPhrases: ["抓取网页", "网页样本", "采集参考页面"],
    typicalTasks: ["web-capture"],
  },
  {
    group: "learning",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-analyze-style",
    triggerPhrases: ["分析风格", "生成风格卡", "样本分析"],
    typicalTasks: ["style-analysis"],
  },
  {
    group: "learning",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-blend-style",
    triggerPhrases: ["混合风格卡", "多书融合", "blend style"],
    typicalTasks: ["style-blend"],
  },
  {
    group: "learning",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "novel-style-learn",
    triggerPhrases: ["学习写法", "提炼技法", "风格学习"],
    typicalTasks: ["technique-study"],
  },
  {
    group: "planning",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "novel-load-context",
    triggerPhrases: ["读取 canon", "生成 brief", "加载上下文"],
    typicalTasks: ["load-brief"],
  },
  {
    group: "planning",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "novel-plan-next",
    triggerPhrases: ["下一章怎么写", "下一章规划", "next chapter"],
    typicalTasks: ["canon-plan"],
  },
  {
    group: "planning",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-plan",
    triggerPhrases: ["卷纲", "章节规划", "chapter plan"],
    typicalTasks: ["style-plan"],
  },
  {
    group: "drafting",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "novel-draft-scene",
    triggerPhrases: ["起草章节", "写这一章", "draft scene"],
    typicalTasks: ["canon-draft"],
  },
  {
    group: "drafting",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-write",
    triggerPhrases: ["写正文", "生成章节", "write chapter"],
    typicalTasks: ["style-draft"],
  },
  {
    group: "drafting",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-humanize",
    triggerPhrases: ["去 ai 味", "润色自然一点", "humanize"],
    typicalTasks: ["humanize"],
  },
  {
    group: "drafting",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "novel-anti-ai-pass",
    triggerPhrases: ["减少模板味", "anti ai", "改得不那么像 ai"],
    typicalTasks: ["anti-ai-pass"],
  },
  {
    group: "review",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "novel-continuity-review",
    triggerPhrases: ["连续性", "连续性检查", "continuity", "检查设定打架"],
    typicalTasks: ["continuity-review"],
  },
  {
    group: "review",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-review",
    triggerPhrases: ["审稿", "review 这一章", "点评这一章"],
    typicalTasks: ["draft-review"],
  },
  {
    group: "canon",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "novel-update-canon",
    triggerPhrases: ["回写 canon", "更新设定", "回收线头"],
    typicalTasks: ["canon-update"],
  },
  {
    group: "review",
    includeInAggregator: true,
    installModes: ["full-bundle"],
    skillName: "webnovel-learn",
    triggerPhrases: ["做练习", "学习笔记", "review 转训练"],
    typicalTasks: ["drill-generation"],
  },
];

const GROUP_TARGETS: Record<StudioSkillGroup, string[]> = {
  canon: ["novel-update-canon"],
  drafting: ["novel-draft-scene", "novel-anti-ai-pass"],
  init: ["novel-init-wizard"],
  learning: ["webnovel-import-folder", "webnovel-analyze-style"],
  planning: ["novel-load-context", "novel-plan-next"],
  reference: ["webnovel-import-folder"],
  review: ["novel-continuity-review", "novel-update-canon"],
};

export function classifyStudioRequest(input: string): AggregatorRouteResult {
  const normalized = input.toLowerCase();
  const scoreByGroup = new Map<StudioSkillGroup, number>();
  const reasonByGroup = new Map<StudioSkillGroup, string[]>();

  for (const entry of STUDIO_SKILL_REGISTRY) {
    for (const phrase of entry.triggerPhrases) {
      if (!normalized.includes(phrase.toLowerCase())) {
        continue;
      }

      scoreByGroup.set(entry.group, (scoreByGroup.get(entry.group) ?? 0) + 1);
      reasonByGroup.set(entry.group, [
        ...(reasonByGroup.get(entry.group) ?? []),
        `${entry.skillName}:${phrase}`,
      ]);
    }
  }

  const rankedGroups = Array.from(scoreByGroup.entries()).sort(
    (left, right) => right[1] - left[1],
  );
  const matchedGroup = rankedGroups[0]?.[0] ?? inferDefaultGroup(normalized);

  return {
    matchedGroup,
    reason:
      reasonByGroup.get(matchedGroup)?.join(", ") ??
      "default route from xiaoshuo-studio",
    targetSkills: GROUP_TARGETS[matchedGroup],
  };
}

export function buildSkillIndexMarkdown() {
  const grouped = new Map<StudioSkillGroup, StudioSkillEntry[]>();

  for (const entry of STUDIO_SKILL_REGISTRY) {
    if (!entry.includeInAggregator) {
      continue;
    }

    grouped.set(entry.group, [...(grouped.get(entry.group) ?? []), entry]);
  }

  return [
    "# Xiaoshuo Studio Skill Index",
    "",
    "This reference lets `xiaoshuo-studio` route requests even when only the aggregator skill is installed.",
    "",
    ...Array.from(grouped.entries()).flatMap(([group, entries]) => [
      `## ${group}`,
      "",
      ...entries.map(
        (entry) =>
          `- \`${entry.skillName}\`: ${entry.triggerPhrases.join(" / ")}`,
      ),
      "",
    ]),
  ].join("\n");
}

function inferDefaultGroup(input: string): StudioSkillGroup {
  if (input.includes("写") || input.includes("draft")) {
    return "drafting";
  }

  if (input.includes("导入") || input.includes("参考")) {
    return "reference";
  }

  if (input.includes("检查") || input.includes("review")) {
    return "review";
  }

  return "init";
}
