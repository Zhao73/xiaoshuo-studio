import { NextResponse } from "next/server";
import { z } from "zod";

import { finishWizardSession } from "@/lib/server/wizard";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await finishWizardSession(body.sessionId);
  return NextResponse.json(result, { status: 201 });
}
