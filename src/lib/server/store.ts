import { randomUUID } from "node:crypto";
import { join } from "node:path";

import type Database from "better-sqlite3";

import type {
  CreateProjectInput,
  CreateReferenceWorkInput,
  CreateStyleProfileInput,
  DashboardSnapshot,
  DraftJob,
  Project,
  QueueJobInput,
  ReferenceWork,
  StyleProfile,
} from "@/lib/models/studio";

import { createStudioDatabase } from "./db";

interface StudioStoreOptions {
  rootDir?: string;
}

interface RawStyleProfile {
  id: string;
  name: string;
  source_ids_json: string;
  summary: string;
  anti_ai_focus_json: string;
  created_at: string;
}

export function createStudioStore(options: StudioStoreOptions = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const dbPath = join(rootDir, "storage", "studio.sqlite");
  const db = createStudioDatabase(dbPath);

  return {
    createProject(input: CreateProjectInput) {
      const now = new Date().toISOString();
      const project: Project = {
        id: randomUUID(),
        title: input.title,
        genre: input.genre,
        premise: input.premise,
        status: "idea",
        createdAt: now,
        updatedAt: now,
      };

      db.prepare(
        `INSERT INTO projects (id, title, genre, premise, status, created_at, updated_at)
         VALUES (@id, @title, @genre, @premise, @status, @createdAt, @updatedAt)`,
      ).run(project);

      return project;
    },
    createReferenceWork(input: CreateReferenceWorkInput) {
      const reference: ReferenceWork = {
        id: randomUUID(),
        title: input.title,
        authorHint: input.authorHint,
        sourceType: input.sourceType,
        sourcePath: input.sourcePath,
        notes: input.notes,
        createdAt: new Date().toISOString(),
      };

      db.prepare(
        `INSERT INTO reference_works
         (id, title, author_hint, source_type, source_path, notes, created_at)
         VALUES (@id, @title, @authorHint, @sourceType, @sourcePath, @notes, @createdAt)`,
      ).run(reference);

      return reference;
    },
    createStyleProfile(input: CreateStyleProfileInput) {
      const profile: StyleProfile = {
        id: randomUUID(),
        name: input.name,
        sourceIds: input.sourceIds,
        summary: input.summary,
        antiAiFocus: input.antiAiFocus,
        createdAt: new Date().toISOString(),
      };

      db.prepare(
        `INSERT INTO style_profiles
         (id, name, source_ids_json, summary, anti_ai_focus_json, created_at)
         VALUES (@id, @name, @sourceIdsJson, @summary, @antiAiFocusJson, @createdAt)`,
      ).run({
        antiAiFocusJson: JSON.stringify(profile.antiAiFocus),
        createdAt: profile.createdAt,
        id: profile.id,
        name: profile.name,
        sourceIdsJson: JSON.stringify(profile.sourceIds),
        summary: profile.summary,
      });

      return profile;
    },
    queueJob(input: QueueJobInput) {
      const now = new Date().toISOString();
      const job: DraftJob = {
        id: randomUUID(),
        projectId: input.projectId,
        kind: input.kind,
        status: input.status,
        summary: input.summary,
        createdAt: now,
        updatedAt: now,
      };

      db.prepare(
        `INSERT INTO draft_jobs
         (id, project_id, kind, status, summary, created_at, updated_at)
         VALUES (@id, @projectId, @kind, @status, @summary, @createdAt, @updatedAt)`,
      ).run(job);

      return job;
    },
    listProjects() {
      const rows = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all() as Record<
        string,
        string
      >[];
      return rows.map(mapProject);
    },
    listReferenceWorks() {
      const rows = db
        .prepare("SELECT * FROM reference_works ORDER BY created_at DESC")
        .all() as Record<string, string>[];
      return rows.map(mapReferenceWork);
    },
    listStyleProfiles() {
      const rows = db
        .prepare("SELECT * FROM style_profiles ORDER BY created_at DESC")
        .all() as RawStyleProfile[];
      return rows.map(mapStyleProfile);
    },
    listJobs() {
      const rows = db
        .prepare("SELECT * FROM draft_jobs ORDER BY created_at DESC")
        .all() as Record<string, string>[];
      return rows.map(mapDraftJob);
    },
    getDashboardSnapshot(): DashboardSnapshot {
      const projects = this.listProjects();
      const references = this.listReferenceWorks();
      const styleProfiles = this.listStyleProfiles();
      const jobs = this.listJobs();

      return {
        counts: {
          jobs: jobs.length,
          projects: projects.length,
          references: references.length,
          styleProfiles: styleProfiles.length,
        },
        jobs,
        projects,
        references,
        styleProfiles,
      };
    },
    getDb(): Database.Database {
      return db;
    },
  };
}

function mapProject(row: Record<string, string>): Project {
  return {
    createdAt: row.created_at,
    genre: row.genre,
    id: row.id,
    premise: row.premise,
    status: row.status as Project["status"],
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function mapReferenceWork(row: Record<string, string>): ReferenceWork {
  return {
    authorHint: row.author_hint,
    createdAt: row.created_at,
    id: row.id,
    notes: row.notes,
    sourcePath: row.source_path,
    sourceType: row.source_type as ReferenceWork["sourceType"],
    title: row.title,
  };
}

function mapStyleProfile(row: RawStyleProfile): StyleProfile {
  return {
    antiAiFocus: JSON.parse(row.anti_ai_focus_json) as string[],
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    sourceIds: JSON.parse(row.source_ids_json) as string[],
    summary: row.summary,
  };
}

function mapDraftJob(row: Record<string, string>): DraftJob {
  return {
    createdAt: row.created_at,
    id: row.id,
    kind: row.kind as DraftJob["kind"],
    projectId: row.project_id,
    status: row.status as DraftJob["status"],
    summary: row.summary,
    updatedAt: row.updated_at,
  };
}
