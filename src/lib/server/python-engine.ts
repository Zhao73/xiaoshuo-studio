import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { z } from "zod";

const execFileAsync = promisify(execFile);

const analyzeResultSchema = z.object({
  anti_ai_flags: z.array(z.string()),
  metrics: z.object({
    avg_sentence_length: z.number(),
    dialogue_ratio: z.number(),
    scene_breaks: z.number(),
    sensory_density: z.number(),
    sentence_count: z.number(),
  }),
  style_summary: z.string(),
  title: z.string(),
});

export type AnalyzeResult = z.infer<typeof analyzeResultSchema>;

export function parseAnalyzeResult(payload: string): AnalyzeResult {
  return analyzeResultSchema.parse(JSON.parse(payload));
}

export async function analyzeReferenceFile(filePath: string) {
  const cliPath = path.resolve(process.cwd(), "python/engine/cli.py");
  const { stdout } = await execFileAsync("python3", [cliPath, "analyze", filePath]);
  return parseAnalyzeResult(stdout);
}
