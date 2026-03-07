import { NextResponse } from "next/server";
import { z } from "zod";

import { answerWizardSession } from "@/lib/server/wizard";

export const runtime = "nodejs";

const schema = z.object({
  choiceId: z.string().optional(),
  customValue: z.string().optional(),
  questionId: z.string().min(1),
  sessionId: z.string().min(1),
  value: z.string().optional(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await answerWizardSession(body);
  return NextResponse.json(result);
}
