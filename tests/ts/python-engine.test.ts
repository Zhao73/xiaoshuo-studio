import { parseAnalyzeResult } from "@/lib/server/python-engine";

describe("python engine contract", () => {
  test("accepts the locked analyze payload shape", () => {
    const parsed = parseAnalyzeResult(
      JSON.stringify({
        anti_ai_flags: ["减少解释腔", "避免抽象抒情"],
        metrics: {
          avg_sentence_length: 15.2,
          dialogue_ratio: 0.41,
          scene_breaks: 3,
          sensory_density: 0.28,
          sentence_count: 128,
        },
        style_summary: "短句推进，场景落点清晰，章末留钩。",
        title: "夜航段落样本",
      }),
    );

    expect(parsed.title).toBe("夜航段落样本");
    expect(parsed.metrics.sentence_count).toBe(128);
    expect(parsed.anti_ai_flags).toContain("减少解释腔");
  });
});
