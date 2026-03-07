import { NextResponse } from "next/server";
import { z } from "zod";

import { createBlendStyleProfile } from "@/lib/server/studio-service";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2),
  notes: z.string().default(""),
  styleProfileIds: z.array(z.number().int().positive()).min(2),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await createBlendStyleProfile(body);
  return NextResponse.json(result, { status: 201 });
}
