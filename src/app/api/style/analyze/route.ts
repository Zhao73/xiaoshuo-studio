import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeInlineExcerpt } from "@/lib/server/studio-service";

export const runtime = "nodejs";

const schema = z.object({
  text: z.string().min(80),
  title: z.string().min(2),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await analyzeInlineExcerpt(body);
  return NextResponse.json(result);
}
