import { NextResponse } from "next/server";
import { z } from "zod";

import { startWizardSession } from "@/lib/server/wizard";

export const runtime = "nodejs";

const schema = z.object({
  seedGenre: z.enum(["mystery-adventure", "urban-modern", "xianxia"]).optional(),
});

export async function POST(request: Request) {
  const raw = await request.text();
  const body = schema.parse(raw ? JSON.parse(raw) : {});
  const result = await startWizardSession(body);
  return NextResponse.json(result);
}
