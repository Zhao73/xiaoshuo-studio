import { z } from "zod";

import { createProject, listProjects } from "@/lib/server/db";

const schema = z.object({
  genre: z.string().min(1),
  premise: z.string().min(10),
  title: z.string().min(2),
});

export async function GET() {
  return Response.json({
    projects: listProjects(),
  });
}

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const project = createProject(body);

  return Response.json({ project }, { status: 201 });
}
