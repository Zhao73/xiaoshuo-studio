import { NextResponse } from "next/server";
import { z } from "zod";

import { checkChapterContinuity } from "@/lib/server/studio-service";

export const runtime = "nodejs";

const schema = z.object({
  chapterNumber: z.coerce.number().int().positive(),
  draftText: z.string().min(1),
  projectId: z.coerce.number().int().positive(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const issues = await checkChapterContinuity(body);
  return NextResponse.json({ issues });
}
