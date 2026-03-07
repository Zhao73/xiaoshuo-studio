"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createBlendStyleProfile,
  createStudioProject,
  ingestReferenceExcerpt,
  importReferenceFolder,
  ingestReferenceUrl,
  queueStudioJob,
} from "@/lib/server/studio-service";

const projectSchema = z.object({
  genre: z.string().min(2),
  premise: z.string().min(10),
  title: z.string().min(2),
});

const excerptSchema = z.object({
  authorHint: z.string().min(1),
  notes: z.string().default(""),
  text: z.string().min(80),
  title: z.string().min(2),
});

const urlSchema = z.object({
  authorHint: z.string().min(1),
  notes: z.string().default(""),
  title: z.string().min(2),
  url: z.url(),
});

const folderSchema = z.object({
  collectionName: z.string().min(2),
  creatorLabel: z.string().min(1),
  folderPath: z.string().min(2),
  notes: z.string().default(""),
});

const blendSchema = z.object({
  name: z.string().min(2),
  notes: z.string().default(""),
  styleProfileIds: z.array(z.coerce.number().int().positive()).min(2),
});

const queueSchema = z.object({
  chapter: z.coerce.number().int().positive(),
  jobType: z.enum(["analyze-style", "humanize", "plan", "review", "write"]),
  projectId: z.coerce.number().int().positive(),
});

export async function createProjectAction(formData: FormData) {
  const input = projectSchema.parse({
    genre: formData.get("genre"),
    premise: formData.get("premise"),
    title: formData.get("title"),
  });

  createStudioProject(input);
  revalidatePath("/");
}

export async function ingestExcerptAction(formData: FormData) {
  const input = excerptSchema.parse({
    authorHint: formData.get("authorHint"),
    notes: formData.get("notes"),
    text: formData.get("text"),
    title: formData.get("title"),
  });

  await ingestReferenceExcerpt(input);
  revalidatePath("/");
}

export async function ingestUrlAction(formData: FormData) {
  const input = urlSchema.parse({
    authorHint: formData.get("authorHint"),
    notes: formData.get("notes"),
    title: formData.get("title"),
    url: formData.get("url"),
  });

  await ingestReferenceUrl(input);
  revalidatePath("/");
}

export async function importFolderAction(formData: FormData) {
  const input = folderSchema.parse({
    collectionName: formData.get("collectionName"),
    creatorLabel: formData.get("creatorLabel"),
    folderPath: formData.get("folderPath"),
    notes: formData.get("notes"),
  });

  await importReferenceFolder(input);
  revalidatePath("/");
}

export async function createBlendStyleAction(formData: FormData) {
  const input = blendSchema.parse({
    name: formData.get("name"),
    notes: formData.get("notes"),
    styleProfileIds: formData.getAll("styleProfileIds"),
  });

  await createBlendStyleProfile(input);
  revalidatePath("/");
}

export async function queueJobAction(formData: FormData) {
  const input = queueSchema.parse({
    chapter: formData.get("chapter"),
    jobType: formData.get("jobType"),
    projectId: formData.get("projectId"),
  });

  queueStudioJob({
    jobType: input.jobType,
    payload: { chapter: input.chapter },
    projectId: input.projectId,
  });
  revalidatePath("/");
}
