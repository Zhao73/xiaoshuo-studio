import { NextResponse } from "next/server";
import { z } from "zod";

import { getProjectCanon } from "@/lib/server/studio-service";

export const runtime = "nodejs";

const schema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { projectId } = schema.parse({
    projectId: url.searchParams.get("projectId"),
  });

  const canon = await getProjectCanon(projectId);
  return NextResponse.json({ canon, projectId });
}
