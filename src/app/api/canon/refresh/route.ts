import { NextResponse } from "next/server";
import { z } from "zod";

import { saveProjectCanon } from "@/lib/server/studio-service";

export const runtime = "nodejs";

const schema = z.object({
  characters: z.array(
    z.object({
      currentState: z.string().min(1),
      goals: z.array(z.string()).default([]),
      name: z.string().min(1),
      role: z.string().min(1),
      secrets: z.array(z.string()).default([]),
    }),
  ),
  foreshadowing: z.array(
    z.object({
      payoffHint: z.string().min(1),
      status: z.enum(["paid-off", "planted"]),
      title: z.string().min(1),
    }),
  ),
  locations: z.array(
    z.object({
      currentState: z.string().min(1),
      name: z.string().min(1),
    }),
  ),
  openThreads: z.array(
    z.object({
      priority: z.enum(["high", "low", "medium"]),
      status: z.enum(["open", "resolved"]),
      summary: z.string().min(1),
      title: z.string().min(1),
    }),
  ),
  projectId: z.coerce.number().int().positive(),
  storyBible: z.object({
    phaseGoal: z.string().min(1),
    summary: z.string().min(1),
    worldRules: z.array(z.string()).default([]),
  }),
  timeline: z.array(
    z.object({
      chapterNumber: z.coerce.number().int().positive(),
      detail: z.string().min(1),
      label: z.string().min(1),
    }),
  ),
  writingRules: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await saveProjectCanon(body);
  return NextResponse.json(result);
}
