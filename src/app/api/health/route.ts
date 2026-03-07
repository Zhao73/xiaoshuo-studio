import { NextResponse } from "next/server";

import { getStudioHomeData } from "@/lib/server/studio-service";

export const runtime = "nodejs";

export async function GET() {
  const data = await getStudioHomeData();

  return NextResponse.json({
    codex: data.codex,
    metrics: data.snapshot.metrics,
  });
}
