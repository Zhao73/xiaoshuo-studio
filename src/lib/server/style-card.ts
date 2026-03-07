export type StyleMetrics = {
  aiSmellScore: number;
  averageSentenceLength: number;
  dialogueRatio: number;
  expositionRatio: number;
  hookIntensity: number;
  sceneBreakRate: number;
};

export type VoiceCard = {
  antiAiFocus: string[];
  directionTags: string[];
  summary: string;
};

function pushIf(tags: string[], condition: boolean, value: string) {
  if (condition) {
    tags.push(value);
  }
}

export function buildVoiceCard(metrics: StyleMetrics): VoiceCard {
  const directionTags: string[] = [];
  const antiAiFocus: string[] = [];

  pushIf(directionTags, metrics.dialogueRatio >= 0.35, "对白驱动");
  pushIf(directionTags, metrics.averageSentenceLength >= 24, "长句叙述");
  pushIf(directionTags, metrics.hookIntensity >= 0.72, "强钩子");
  pushIf(directionTags, metrics.sceneBreakRate >= 0.2, "场景切换快");
  pushIf(directionTags, metrics.expositionRatio >= 0.45, "解释占比高");

  pushIf(antiAiFocus, metrics.expositionRatio >= 0.45, "减少解释腔");
  pushIf(antiAiFocus, metrics.aiSmellScore >= 0.55, "用动作承载情绪");
  pushIf(antiAiFocus, metrics.averageSentenceLength >= 24, "打断均匀句式");
  pushIf(antiAiFocus, metrics.hookIntensity < 0.5, "加强章末悬压");

  if (directionTags.length === 0) {
    directionTags.push("稳态叙述");
  }

  if (antiAiFocus.length === 0) {
    antiAiFocus.push("保留具体细节密度");
  }

  return {
    antiAiFocus,
    directionTags,
    summary: `该风格卡聚焦技法拆解与混合参考，不模仿具体作者；当前建议优先处理：${antiAiFocus.join("、")}。`,
  };
}
