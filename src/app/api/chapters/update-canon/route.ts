import { NextResponse } from "next/server";
import { z } from "zod";

import { applyCanonUpdateFromChapter } from "@/lib/server/studio-service";

export const runtime = "nodejs";

const schema = z.object({
  chapterNumber: z.coerce.number().int().positive(),
  draftText: z.string().min(1),
  patch: z.object({
    changedCharacterStates: z
      .array(
        z.object({
          currentState: z.string().min(1),
          name: z.string().min(1),
        }),
      )
      .optional(),
    newForeshadowing: z
      .array(
        z.object({
          payoffHint: z.string().min(1),
          status: z.enum(["paid-off", "planted"]),
          title: z.string().min(1),
        }),
      )
      .optional(),
    newOpenThreads: z
      .array(
        z.object({
          priority: z.enum(["high", "low", "medium"]),
          status: z.enum(["open", "resolved"]),
          summary: z.string().min(1),
          title: z.string().min(1),
        }),
      )
      .optional(),
    newTimelineEvents: z
      .array(
        z.object({
          chapterNumber: z.coerce.number().int().positive(),
          detail: z.string().min(1),
          label: z.string().min(1),
        }),
      )
      .optional(),
    resolvedOpenThreadTitles: z.array(z.string()).optional(),
  }),
  projectId: z.coerce.number().int().positive(),
  summary: z.string().min(1),
  title: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await applyCanonUpdateFromChapter(body);
  return NextResponse.json(result);
}
