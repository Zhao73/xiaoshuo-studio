import { NextResponse } from "next/server";
import { z } from "zod";

import { getWizardSession } from "@/lib/server/wizard";

export const runtime = "nodejs";

const schema = z.object({
  sessionId: z.string().min(1),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { sessionId } = schema.parse({
    sessionId: url.searchParams.get("sessionId"),
  });

  const result = await getWizardSession(sessionId);
  return NextResponse.json(result);
}
