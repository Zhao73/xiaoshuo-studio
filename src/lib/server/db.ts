import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import { ensurePlatformDirectories, getPlatformPaths } from "./paths";

type ProjectInput = {
  genre: string;
  premise: string;
  title: string;
};

type ReferenceWorkInput = {
  creatorLabel: string;
  projectId?: number | null;
  sourceLabel: string;
  sourceType: string;
  title: string;
};

type StyleProfileInput = {
  antiPatterns?: string[];
  metrics: Record<string, number>;
  name: string;
  referenceWorkId: number;
  summary: string;
};

type ReferenceChapterInput = {
  chapterIndex: number;
  referenceWorkId: number;
  snippet: string;
  title: string;
  wordCount: number;
};

type BlendProfileInput = {
  antiPatterns: string[];
  metrics: Record<string, number>;
  name: string;
  notes?: string;
  sourceStyleProfileIds: number[];
  summary: string;
};

type DraftJobInput = {
  jobType: string;
  payload: Record<string, unknown>;
  projectId: number;
  status: string;
};

type ProjectCanonDocumentInput = {
  content: unknown;
  kind: string;
  markdownPath: string;
  projectId: number;
  title: string;
};

type ProjectChapterInput = {
  canonUpdate?: Record<string, unknown>;
  chapterNumber: number;
  draftText: string;
  projectId: number;
  summary: string;
  title: string;
};

type WizardSessionInput = {
  answers: Record<string, unknown>;
  currentQuestionId: string | null;
  id: string;
  status: string;
};

type ProjectArtifactInput = {
  content: Record<string, unknown>;
  kind: string;
  markdownPath: string;
  projectId: number;
  title: string;
};

let database: Database.Database | null = null;

type StyleProfileRow = {
  antiPatternsJson: string;
  id: number;
  metricsJson: string;
  name: string;
  summary: string;
};

type DraftJobRow = {
  createdAt: string;
  id: number;
  jobType: string;
  payloadJson: string;
  projectId: number;
  status: string;
};

type BlendProfileRow = {
  antiPatternsJson: string;
  createdAt: string;
  id: number;
  metricsJson: string;
  name: string;
  notes: string | null;
  sourceStyleProfileIdsJson: string;
  summary: string;
};

type ProjectCanonRow = {
  contentJson: string;
  createdAt: string;
  kind: string;
  markdownPath: string;
  projectId: number;
  title: string;
  updatedAt: string;
};

type ProjectChapterRow = {
  canonUpdateJson: string;
  chapterNumber: number;
  createdAt: string;
  draftText: string;
  id: number;
  projectId: number;
  summary: string;
  title: string;
  updatedAt: string;
};

type WizardSessionRow = {
  answersJson: string;
  createdAt: string;
  currentQuestionId: string | null;
  id: string;
  status: string;
  updatedAt: string;
};

type ProjectArtifactRow = {
  contentJson: string;
  createdAt: string;
  id: number;
  kind: string;
  markdownPath: string;
  projectId: number;
  title: string;
  updatedAt: string;
};

export function createStudioDatabase(dbPath: string) {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      genre TEXT NOT NULL,
      premise TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reference_works (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author_hint TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_path TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS style_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_ids_json TEXT NOT NULL,
      summary TEXT NOT NULL,
      anti_ai_focus_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS draft_jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  return db;
}

function getRawDatabase() {
  if (database) {
    return database;
  }

  const paths = ensurePlatformDirectories();
  database = new Database(paths.dbFile);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      genre TEXT NOT NULL,
      premise TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reference_works (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_label TEXT NOT NULL,
      creator_label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS style_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_work_id INTEGER NOT NULL REFERENCES reference_works(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      summary TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      anti_patterns_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reference_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_work_id INTEGER NOT NULL REFERENCES reference_works(id) ON DELETE CASCADE,
      chapter_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      snippet TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blend_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      summary TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      anti_patterns_json TEXT NOT NULL DEFAULT '[]',
      source_style_profile_ids_json TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS draft_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      job_type TEXT NOT NULL,
      status TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_canons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      markdown_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, kind)
    );

    CREATE TABLE IF NOT EXISTS project_chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      draft_text TEXT NOT NULL,
      canon_update_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, chapter_number)
    );

    CREATE TABLE IF NOT EXISTS wizard_sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      current_question_id TEXT,
      answers_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_artifacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      markdown_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return database;
}

export function ensureDatabase() {
  return getRawDatabase();
}

export function resetDatabaseForTests() {
  if (database) {
    database.close();
    database = null;
  }
}

export function createProject(input: ProjectInput) {
  const db = ensureDatabase();
  const result = db
    .prepare(
      `INSERT INTO projects (title, genre, premise, status)
       VALUES (@title, @genre, @premise, 'active')`,
    )
    .run(input);

  return {
    id: Number(result.lastInsertRowid),
    status: "active",
    ...input,
  };
}

export function listProjects() {
  const db = ensureDatabase();

  return db
    .prepare(
      `SELECT id, title, genre, premise, status, created_at AS createdAt
       FROM projects
       ORDER BY id DESC`,
    )
    .all();
}

export function getProjectById(projectId: number) {
  const db = ensureDatabase();

  return (
    db
      .prepare(
        `SELECT id, title, genre, premise, status, created_at AS createdAt
         FROM projects
         WHERE id = ?`,
      )
      .get(projectId) as
      | {
          createdAt: string;
          genre: string;
          id: number;
          premise: string;
          status: string;
          title: string;
        }
      | undefined
  ) ?? null;
}

export function createReferenceWork(input: ReferenceWorkInput) {
  const db = ensureDatabase();
  const result = db
    .prepare(
      `INSERT INTO reference_works (
        project_id, title, source_type, source_label, creator_label
      ) VALUES (@projectId, @title, @sourceType, @sourceLabel, @creatorLabel)`,
    )
    .run({
      creatorLabel: input.creatorLabel,
      projectId: input.projectId ?? null,
      sourceLabel: input.sourceLabel,
      sourceType: input.sourceType,
      title: input.title,
    });

  return {
    id: Number(result.lastInsertRowid),
    ...input,
  };
}

export function createStyleProfile(input: StyleProfileInput) {
  const db = ensureDatabase();
  const result = db
    .prepare(
      `INSERT INTO style_profiles (
        reference_work_id, name, summary, metrics_json, anti_patterns_json
      ) VALUES (@referenceWorkId, @name, @summary, @metricsJson, @antiPatternsJson)`,
    )
    .run({
      antiPatternsJson: JSON.stringify(input.antiPatterns ?? []),
      metricsJson: JSON.stringify(input.metrics),
      name: input.name,
      referenceWorkId: input.referenceWorkId,
      summary: input.summary,
    });

  return {
    id: Number(result.lastInsertRowid),
    ...input,
  };
}

export function listStyleProfiles() {
  const db = ensureDatabase();

  return (db
    .prepare(
      `SELECT id, reference_work_id AS referenceWorkId, name, summary, metrics_json AS metricsJson, anti_patterns_json AS antiPatternsJson, created_at AS createdAt
       FROM style_profiles
       ORDER BY id DESC`,
    )
    .all() as Array<StyleProfileRow & { createdAt: string; referenceWorkId: number }>).map(
    (row) => ({
      antiPatterns: JSON.parse(String(row.antiPatternsJson)) as string[],
      createdAt: row.createdAt,
      id: row.id,
      metrics: JSON.parse(String(row.metricsJson)) as Record<string, number>,
      name: row.name,
      referenceWorkId: row.referenceWorkId,
      summary: row.summary,
    }),
  );
}

export function getStyleProfilesByIds(ids: number[]) {
  if (ids.length === 0) {
    return [];
  }

  const db = ensureDatabase();
  const placeholders = ids.map(() => "?").join(", ");

  return (db
    .prepare(
      `SELECT id, reference_work_id AS referenceWorkId, name, summary, metrics_json AS metricsJson, anti_patterns_json AS antiPatternsJson, created_at AS createdAt
       FROM style_profiles
       WHERE id IN (${placeholders})
       ORDER BY id ASC`,
    )
    .all(...ids) as Array<StyleProfileRow & { createdAt: string; referenceWorkId: number }>).map(
    (row) => ({
      antiPatterns: JSON.parse(String(row.antiPatternsJson)) as string[],
      createdAt: row.createdAt,
      id: row.id,
      metrics: JSON.parse(String(row.metricsJson)) as Record<string, number>,
      name: row.name,
      referenceWorkId: row.referenceWorkId,
      summary: row.summary,
    }),
  );
}

export function createReferenceChapter(input: ReferenceChapterInput) {
  const db = ensureDatabase();
  const result = db
    .prepare(
      `INSERT INTO reference_chapters (
        reference_work_id, chapter_index, title, snippet, word_count
      ) VALUES (@referenceWorkId, @chapterIndex, @title, @snippet, @wordCount)`,
    )
    .run(input);

  return {
    id: Number(result.lastInsertRowid),
    ...input,
  };
}

export function listReferenceChapters(referenceWorkId?: number) {
  const db = ensureDatabase();

  if (typeof referenceWorkId === "number") {
    return db
      .prepare(
        `SELECT id, reference_work_id AS referenceWorkId, chapter_index AS chapterIndex, title, snippet, word_count AS wordCount, created_at AS createdAt
         FROM reference_chapters
         WHERE reference_work_id = ?
         ORDER BY chapter_index ASC`,
      )
      .all(referenceWorkId);
  }

  return db
    .prepare(
      `SELECT id, reference_work_id AS referenceWorkId, chapter_index AS chapterIndex, title, snippet, word_count AS wordCount, created_at AS createdAt
       FROM reference_chapters
       ORDER BY id DESC`,
    )
    .all();
}

export function createBlendProfile(input: BlendProfileInput) {
  const db = ensureDatabase();
  const result = db
    .prepare(
      `INSERT INTO blend_profiles (
        name, summary, metrics_json, anti_patterns_json, source_style_profile_ids_json, notes
      ) VALUES (@name, @summary, @metricsJson, @antiPatternsJson, @sourceStyleProfileIdsJson, @notes)`,
    )
    .run({
      antiPatternsJson: JSON.stringify(input.antiPatterns),
      metricsJson: JSON.stringify(input.metrics),
      name: input.name,
      notes: input.notes ?? "",
      sourceStyleProfileIdsJson: JSON.stringify(input.sourceStyleProfileIds),
      summary: input.summary,
    });

  return {
    antiPatterns: input.antiPatterns,
    id: Number(result.lastInsertRowid),
    metrics: input.metrics,
    name: input.name,
    notes: input.notes ?? "",
    sourceStyleProfileIds: input.sourceStyleProfileIds,
    summary: input.summary,
  };
}

export function listBlendProfiles() {
  const db = ensureDatabase();

  return (db
    .prepare(
      `SELECT id, name, summary, metrics_json AS metricsJson, anti_patterns_json AS antiPatternsJson,
              source_style_profile_ids_json AS sourceStyleProfileIdsJson, notes, created_at AS createdAt
       FROM blend_profiles
       ORDER BY id DESC`,
    )
    .all() as BlendProfileRow[]).map((row) => ({
    antiPatterns: JSON.parse(String(row.antiPatternsJson)) as string[],
    createdAt: row.createdAt,
    id: row.id,
    metrics: JSON.parse(String(row.metricsJson)) as Record<string, number>,
    name: row.name,
    notes: row.notes ?? "",
    sourceStyleProfileIds: JSON.parse(
      String(row.sourceStyleProfileIdsJson),
    ) as number[],
    summary: row.summary,
  }));
}

export function createDraftJob(input: DraftJobInput) {
  const db = ensureDatabase();
  const result = db
    .prepare(
      `INSERT INTO draft_jobs (project_id, job_type, status, payload_json)
       VALUES (@projectId, @jobType, @status, @payloadJson)`,
    )
    .run({
      jobType: input.jobType,
      payloadJson: JSON.stringify(input.payload),
      projectId: input.projectId,
      status: input.status,
    });

  return {
    id: Number(result.lastInsertRowid),
    ...input,
  };
}

export function upsertProjectCanonDocument(input: ProjectCanonDocumentInput) {
  const db = ensureDatabase();

  db.prepare(
    `INSERT INTO project_canons (
      project_id, kind, title, content_json, markdown_path
    ) VALUES (@projectId, @kind, @title, @contentJson, @markdownPath)
    ON CONFLICT(project_id, kind) DO UPDATE SET
      title = excluded.title,
      content_json = excluded.content_json,
      markdown_path = excluded.markdown_path,
      updated_at = CURRENT_TIMESTAMP`,
  ).run({
    contentJson: JSON.stringify(input.content),
    kind: input.kind,
    markdownPath: input.markdownPath,
    projectId: input.projectId,
    title: input.title,
  });

  return getProjectCanonDocument(input.projectId, input.kind);
}

export function getProjectCanonDocument(projectId: number, kind: string) {
  const db = ensureDatabase();
  const row = db
    .prepare(
      `SELECT project_id AS projectId, kind, title, content_json AS contentJson, markdown_path AS markdownPath,
              created_at AS createdAt, updated_at AS updatedAt
       FROM project_canons
       WHERE project_id = ? AND kind = ?`,
    )
    .get(projectId, kind) as ProjectCanonRow | undefined;

  if (!row) {
    return null;
  }

  return {
    content: JSON.parse(String(row.contentJson)) as unknown,
    createdAt: row.createdAt,
    kind: row.kind,
    markdownPath: row.markdownPath,
    projectId: row.projectId,
    title: row.title,
    updatedAt: row.updatedAt,
  };
}

export function listProjectCanonDocuments(projectId: number) {
  const db = ensureDatabase();

  return (db
    .prepare(
      `SELECT project_id AS projectId, kind, title, content_json AS contentJson, markdown_path AS markdownPath,
              created_at AS createdAt, updated_at AS updatedAt
       FROM project_canons
       WHERE project_id = ?
       ORDER BY kind ASC`,
    )
    .all(projectId) as ProjectCanonRow[]).map((row) => ({
    content: JSON.parse(String(row.contentJson)) as unknown,
    createdAt: row.createdAt,
    kind: row.kind,
    markdownPath: row.markdownPath,
    projectId: row.projectId,
    title: row.title,
    updatedAt: row.updatedAt,
  }));
}

export function upsertProjectChapter(input: ProjectChapterInput) {
  const db = ensureDatabase();

  db.prepare(
    `INSERT INTO project_chapters (
      project_id, chapter_number, title, summary, draft_text, canon_update_json
    ) VALUES (@projectId, @chapterNumber, @title, @summary, @draftText, @canonUpdateJson)
    ON CONFLICT(project_id, chapter_number) DO UPDATE SET
      title = excluded.title,
      summary = excluded.summary,
      draft_text = excluded.draft_text,
      canon_update_json = excluded.canon_update_json,
      updated_at = CURRENT_TIMESTAMP`,
  ).run({
    canonUpdateJson: JSON.stringify(input.canonUpdate ?? {}),
    chapterNumber: input.chapterNumber,
    draftText: input.draftText,
    projectId: input.projectId,
    summary: input.summary,
    title: input.title,
  });

  return getProjectChapter(input.projectId, input.chapterNumber);
}

export function getProjectChapter(projectId: number, chapterNumber: number) {
  const db = ensureDatabase();
  const row = db
    .prepare(
      `SELECT id, project_id AS projectId, chapter_number AS chapterNumber, title, summary, draft_text AS draftText,
              canon_update_json AS canonUpdateJson, created_at AS createdAt, updated_at AS updatedAt
       FROM project_chapters
       WHERE project_id = ? AND chapter_number = ?`,
    )
    .get(projectId, chapterNumber) as ProjectChapterRow | undefined;

  if (!row) {
    return null;
  }

  return {
    canonUpdate: JSON.parse(String(row.canonUpdateJson)) as Record<string, unknown>,
    chapterNumber: row.chapterNumber,
    createdAt: row.createdAt,
    draftText: row.draftText,
    id: row.id,
    projectId: row.projectId,
    summary: row.summary,
    title: row.title,
    updatedAt: row.updatedAt,
  };
}

export function listProjectChapters(projectId: number) {
  const db = ensureDatabase();

  return (db
    .prepare(
      `SELECT id, project_id AS projectId, chapter_number AS chapterNumber, title, summary, draft_text AS draftText,
              canon_update_json AS canonUpdateJson, created_at AS createdAt, updated_at AS updatedAt
       FROM project_chapters
       WHERE project_id = ?
       ORDER BY chapter_number DESC`,
    )
    .all(projectId) as ProjectChapterRow[]).map((row) => ({
    canonUpdate: JSON.parse(String(row.canonUpdateJson)) as Record<string, unknown>,
    chapterNumber: row.chapterNumber,
    createdAt: row.createdAt,
    draftText: row.draftText,
    id: row.id,
    projectId: row.projectId,
    summary: row.summary,
    title: row.title,
    updatedAt: row.updatedAt,
  }));
}

export function createWizardSession(input: WizardSessionInput) {
  const db = ensureDatabase();

  db.prepare(
    `INSERT INTO wizard_sessions (
      id, status, current_question_id, answers_json
    ) VALUES (@id, @status, @currentQuestionId, @answersJson)`,
  ).run({
    answersJson: JSON.stringify(input.answers),
    currentQuestionId: input.currentQuestionId,
    id: input.id,
    status: input.status,
  });

  return getWizardSession(input.id);
}

export function updateWizardSession(input: WizardSessionInput) {
  const db = ensureDatabase();

  db.prepare(
    `UPDATE wizard_sessions
     SET status = @status,
         current_question_id = @currentQuestionId,
         answers_json = @answersJson,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = @id`,
  ).run({
    answersJson: JSON.stringify(input.answers),
    currentQuestionId: input.currentQuestionId,
    id: input.id,
    status: input.status,
  });

  return getWizardSession(input.id);
}

export function getWizardSession(sessionId: string) {
  const db = ensureDatabase();
  const row = db
    .prepare(
      `SELECT id, status, current_question_id AS currentQuestionId, answers_json AS answersJson,
              created_at AS createdAt, updated_at AS updatedAt
       FROM wizard_sessions
       WHERE id = ?`,
    )
    .get(sessionId) as WizardSessionRow | undefined;

  if (!row) {
    return null;
  }

  return {
    answers: JSON.parse(String(row.answersJson)) as Record<string, unknown>,
    createdAt: row.createdAt,
    currentQuestionId: row.currentQuestionId,
    id: row.id,
    status: row.status,
    updatedAt: row.updatedAt,
  };
}

export function createProjectArtifact(input: ProjectArtifactInput) {
  const db = ensureDatabase();
  const result = db
    .prepare(
      `INSERT INTO project_artifacts (
        project_id, kind, title, content_json, markdown_path
      ) VALUES (@projectId, @kind, @title, @contentJson, @markdownPath)`,
    )
    .run({
      contentJson: JSON.stringify(input.content),
      kind: input.kind,
      markdownPath: input.markdownPath,
      projectId: input.projectId,
      title: input.title,
    });

  const artifact = db
    .prepare(
      `SELECT id, project_id AS projectId, kind, title, content_json AS contentJson,
              markdown_path AS markdownPath, created_at AS createdAt, updated_at AS updatedAt
       FROM project_artifacts
       WHERE id = ?`,
    )
    .get(Number(result.lastInsertRowid)) as ProjectArtifactRow | undefined;

  if (!artifact) {
    throw new Error("Failed to create project artifact.");
  }

  return {
    content: JSON.parse(String(artifact.contentJson)) as Record<string, unknown>,
    createdAt: artifact.createdAt,
    id: artifact.id,
    kind: artifact.kind,
    markdownPath: artifact.markdownPath,
    projectId: artifact.projectId,
    title: artifact.title,
    updatedAt: artifact.updatedAt,
  };
}

export function listProjectArtifacts(projectId: number) {
  const db = ensureDatabase();

  return (db
    .prepare(
      `SELECT id, project_id AS projectId, kind, title, content_json AS contentJson,
              markdown_path AS markdownPath, created_at AS createdAt, updated_at AS updatedAt
       FROM project_artifacts
       WHERE project_id = ?
       ORDER BY id ASC`,
    )
    .all(projectId) as ProjectArtifactRow[]).map((row) => ({
    content: JSON.parse(String(row.contentJson)) as Record<string, unknown>,
    createdAt: row.createdAt,
    id: row.id,
    kind: row.kind,
    markdownPath: row.markdownPath,
    projectId: row.projectId,
    title: row.title,
    updatedAt: row.updatedAt,
  }));
}

export function getDashboardRows() {
  const db = ensureDatabase();

  const metricsRow = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM projects) AS projects,
        (SELECT COUNT(*) FROM reference_works) AS reference_count,
        (SELECT COUNT(*) FROM reference_chapters) AS reference_chapter_count,
        (SELECT COUNT(*) FROM style_profiles) AS styleProfiles,
        (SELECT COUNT(*) FROM blend_profiles) AS blendProfiles,
        (SELECT COUNT(*) FROM project_canons) AS canonDocuments,
        (SELECT COUNT(*) FROM project_chapters) AS chapterDrafts,
        (SELECT COUNT(*) FROM project_artifacts) AS projectArtifacts,
        (SELECT COUNT(*) FROM draft_jobs WHERE status = 'queued') AS queuedJobs`,
    )
    .get() as {
      blendProfiles: number;
      canonDocuments: number;
      chapterDrafts: number;
      projectArtifacts: number;
      projects: number;
      queuedJobs: number;
      reference_chapter_count: number;
      reference_count: number;
      styleProfiles: number;
    };

  const projects = db
    .prepare(
      `SELECT id, title, genre, premise, status, created_at AS createdAt
       FROM projects ORDER BY id DESC LIMIT 5`,
    )
    .all();

  const references = db
    .prepare(
      `SELECT id, project_id AS projectId, title, source_type AS sourceType, source_label AS sourceLabel, creator_label AS creatorLabel, created_at AS createdAt
       FROM reference_works ORDER BY id DESC LIMIT 8`,
    )
    .all();

  const styleProfiles = db
    .prepare(
      `SELECT id, name, summary, metrics_json AS metricsJson, anti_patterns_json AS antiPatternsJson
       FROM style_profiles ORDER BY id DESC LIMIT 5`,
    )
    .all() as StyleProfileRow[];
  const mappedStyleProfiles = styleProfiles.map((row) => ({
      antiPatterns: JSON.parse(String(row.antiPatternsJson)),
      id: row.id,
      metrics: JSON.parse(String(row.metricsJson)),
      name: row.name,
      summary: row.summary,
    }));

  const blendProfiles = listBlendProfiles().slice(0, 5);

  const jobs = db
    .prepare(
      `SELECT id, project_id AS projectId, job_type AS jobType, status, payload_json AS payloadJson, created_at AS createdAt
       FROM draft_jobs ORDER BY id DESC LIMIT 5`,
    )
    .all() as DraftJobRow[];
  const mappedJobs = jobs.map((row) => ({
      createdAt: row.createdAt,
      id: row.id,
      jobType: row.jobType,
      payload: JSON.parse(String(row.payloadJson)),
      projectId: row.projectId,
      status: row.status,
    }));

  return {
    blendProfiles,
    jobs: mappedJobs,
    metrics: {
      blendProfiles: metricsRow.blendProfiles,
      canonDocuments: metricsRow.canonDocuments,
      chapterDrafts: metricsRow.chapterDrafts,
      projectArtifacts: metricsRow.projectArtifacts,
      projects: metricsRow.projects,
      queuedJobs: metricsRow.queuedJobs,
      referenceChapters: metricsRow.reference_chapter_count,
      references: metricsRow.reference_count,
      styleProfiles: metricsRow.styleProfiles,
    },
    projects,
    references,
    styleProfiles: mappedStyleProfiles,
  };
}

export function getDatabasePath() {
  return getPlatformPaths().dbFile;
}
