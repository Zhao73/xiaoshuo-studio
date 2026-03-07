import { buildVoiceCard } from "@/lib/server/style-card";

describe("style card", () => {
  test("turns raw metrics into abstract style direction and anti-ai focus", () => {
    const card = buildVoiceCard({
      aiSmellScore: 0.71,
      averageSentenceLength: 26.8,
      dialogueRatio: 0.43,
      expositionRatio: 0.55,
      hookIntensity: 0.82,
      sceneBreakRate: 0.14,
    });

    expect(card.directionTags).toEqual(
      expect.arrayContaining(["对白驱动", "长句叙述", "强钩子"]),
    );
    expect(card.antiAiFocus).toEqual(
      expect.arrayContaining(["减少解释腔", "用动作承载情绪"]),
    );
    expect(card.summary).toContain("不模仿具体作者");
  });
});
