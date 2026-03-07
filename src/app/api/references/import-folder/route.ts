import { NextResponse } from "next/server";
import { z } from "zod";

import { importReferenceFolder } from "@/lib/server/studio-service";

export const runtime = "nodejs";

const schema = z.object({
  collectionName: z.string().min(2),
  creatorLabel: z.string().min(1),
  folderPath: z.string().min(2),
  notes: z.string().default(""),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const result = await importReferenceFolder(body);
  return NextResponse.json(result);
}
