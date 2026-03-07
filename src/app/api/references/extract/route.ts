import { z } from "zod";

import { extractReadableTextFromHtml } from "@/lib/server/reference-ingest";

const schema = z.object({
  html: z.string().min(1),
  sourceUrl: z.string().url(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const extracted = extractReadableTextFromHtml(body.html, body.sourceUrl);

  return Response.json({ extracted });
}
