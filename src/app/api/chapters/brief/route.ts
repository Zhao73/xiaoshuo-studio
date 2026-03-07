import { NextResponse } from "next/server";
import { z } from "zod";

import { generateChapterBrief } from "@/lib/server/studio-service";

export const runtime = "nodejs";

const schema = z.object({
  chapterNumber: z.coerce.number().int().positive(),
  focus: z.string().optional(),
  projectId: z.coerce.number().int().positive(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await generateChapterBrief(body);
  return NextResponse.json(result);
}
