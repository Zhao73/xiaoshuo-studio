import fs from "node:fs";
import path from "node:path";

import {
  applyCanonUpdateFromChapter,
  checkChapterContinuity,
  generateChapterBrief,
  getProjectCanon,
  saveProjectCanon,
} from "./canon";
import {
  createBlendProfile,
  createDraftJob,
  createProject,
  createReferenceChapter,
  createReferenceWork,
  createStyleProfile,
  getStyleProfilesByIds,
  listBlendProfiles,
} from "./db";
import { getDashboardSnapshot } from "./dashboard";
import { getPlatformPaths } from "./paths";
import { analyzeReferenceFile } from "./python-engine";
import {
  crawlReferenceUrl,
  writeReferenceTextFile,
  writeTemporaryAnalysisFile,
} from "./reference-ingest";
import { buildVoiceCard } from "./style-card";

export async function getStudioHomeData() {
  const [{ getCodexHealth }, snapshot] = await Promise.all([
    import("./codex"),
    Promise.resolve(getDashboardSnapshot()),
  ]);

  return {
    codex: await getCodexHealth(),
    paths: getPlatformPaths(),
    snapshot,
  };
}

export function getBlendProfiles() {
  return listBlendProfiles();
}

export function createStudioProject(input: {
  title: string;
  genre: string;
  premise: string;
}) {
  return createProject(input);
}

export async function ingestReferenceExcerpt(input: {
  authorHint: string;
  notes: string;
  text: string;
  title: string;
}) {
  const sourceLabel = writeReferenceTextFile(input.title, input.text);
  return persistAnalyzedReference({
    creatorLabel: input.authorHint,
    notes: input.notes,
    sourceLabel,
    sourceType: "import",
    title: input.title,
  });
}

export async function ingestReferenceUrl(input: {
  authorHint: string;
  notes: string;
  title: string;
  url: string;
}) {
  const extracted = await crawlReferenceUrl(input.url);
  const title = input.title || extracted.title;
  const sourceLabel = writeReferenceTextFile(title, extracted.text);

  return persistAnalyzedReference({
    creatorLabel: input.authorHint,
    notes: `${input.notes}\n来源: ${input.url}`.trim(),
    sourceLabel,
    sourceType: "crawl",
    title,
  });
}

export async function importReferenceFolder(input: {
  collectionName: string;
  creatorLabel: string;
  folderPath: string;
  notes: string;
}) {
  const files = listImportableFiles(input.folderPath);
  let chapterCount = 0;
  const imported = [];

  for (const filePath of files) {
    const rawText = fs.readFileSync(filePath, "utf8");
    if (rawText.trim().length < 20) {
      continue;
    }

    const title = deriveReferenceTitle(rawText, filePath);
    const importedReference = await persistAnalyzedReference({
      creatorLabel: `${input.creatorLabel} / ${input.collectionName}`,
      notes: input.notes,
      sourceLabel: filePath,
      sourceType: "folder-import",
      title,
    });

    const chapters = splitReferenceIntoChapters(rawText, title);
    chapters.forEach((chapter, index) => {
      createReferenceChapter({
        chapterIndex: index + 1,
        referenceWorkId: importedReference.reference.id,
        snippet: chapter.snippet,
        title: chapter.title,
        wordCount: chapter.wordCount,
      });
    });

    chapterCount += chapters.length;
    imported.push(importedReference.reference);
  }

  return {
    chapterCount,
    importedCount: imported.length,
    references: imported,
  };
}

export async function analyzeInlineExcerpt(input: {
  text: string;
  title: string;
}) {
  const tempFile = writeTemporaryAnalysisFile(input.title, input.text);
  const analysis = await analyzeReferenceFile(tempFile);
  const voiceCard = buildVoiceCard(mapMetricsToVoiceCard(analysis.metrics));

  return {
    analysis,
    voiceCard,
  };
}

export function queueStudioJob(input: {
  jobType: "analyze-style" | "humanize" | "plan" | "review" | "write";
  projectId: number;
  payload: Record<string, unknown>;
}) {
  return createDraftJob({
    jobType: input.jobType,
    payload: input.payload,
    projectId: input.projectId,
    status: "queued",
  });
}

export async function createBlendStyleProfile(input: {
  name: string;
  notes: string;
  styleProfileIds: number[];
}) {
  const profiles = getStyleProfilesByIds(input.styleProfileIds);

  if (profiles.length < 2) {
    throw new Error("Blend style requires at least two style profiles.");
  }

  const metrics = averageMetrics(profiles.map((profile) => profile.metrics));
  const antiPatterns = Array.from(
    new Set(profiles.flatMap((profile) => profile.antiPatterns)),
  ).slice(0, 8);
  const voiceCard = buildVoiceCard(mapStoredMetricsToVoiceCard(metrics));

  return createBlendProfile({
    antiPatterns: Array.from(
      new Set([...antiPatterns, ...voiceCard.antiAiFocus]),
    ).slice(0, 10),
    metrics,
    name: input.name,
    notes: input.notes,
    sourceStyleProfileIds: profiles.map((profile) => profile.id),
    summary: [
      `混合 ${profiles.length} 张风格卡。`,
      `方向：${voiceCard.directionTags.join(" / ")}。`,
      input.notes ? `备注：${input.notes}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export {
  applyCanonUpdateFromChapter,
  checkChapterContinuity,
  generateChapterBrief,
  getProjectCanon,
  saveProjectCanon,
};

async function persistAnalyzedReference(input: {
  creatorLabel: string;
  notes: string;
  sourceLabel: string;
  sourceType: string;
  title: string;
}) {
  const reference = createReferenceWork({
    creatorLabel: input.creatorLabel,
    sourceLabel: input.sourceLabel,
    sourceType: input.sourceType,
    title: input.title,
  });
  const analysis = await analyzeReferenceFile(input.sourceLabel);
  const voiceCard = buildVoiceCard(mapMetricsToVoiceCard(analysis.metrics));

  const styleProfile = createStyleProfile({
    antiPatterns: [
      ...voiceCard.antiAiFocus,
      ...(input.notes ? [input.notes] : []),
    ].slice(0, 6),
    metrics: {
      averageSentenceLength: analysis.metrics.avg_sentence_length,
      dialogueRatio: analysis.metrics.dialogue_ratio,
      sceneBreaks: analysis.metrics.scene_breaks,
      sensoryDensity: analysis.metrics.sensory_density,
      sentenceCount: analysis.metrics.sentence_count,
    },
    name: `${input.title} 风格卡`,
    referenceWorkId: reference.id,
    summary: `${analysis.style_summary} ${voiceCard.summary}`,
  });

  return {
    analysis,
    reference,
    styleProfile,
    voiceCard,
  };
}

function mapMetricsToVoiceCard(metrics: {
  avg_sentence_length: number;
  dialogue_ratio: number;
  scene_breaks: number;
  sensory_density: number;
  sentence_count: number;
}) {
  const sceneBreakRate =
    metrics.sentence_count === 0
      ? 0
      : metrics.scene_breaks / Math.max(1, metrics.sentence_count / 12);

  return {
    aiSmellScore: Math.min(0.95, 0.28 + metrics.avg_sentence_length / 40),
    averageSentenceLength: metrics.avg_sentence_length,
    dialogueRatio: metrics.dialogue_ratio,
    expositionRatio: Math.max(
      0.12,
      1 - metrics.dialogue_ratio - metrics.sensory_density * 0.6,
    ),
    hookIntensity: Math.min(0.96, 0.3 + metrics.scene_breaks * 0.1),
    sceneBreakRate,
  };
}

function mapStoredMetricsToVoiceCard(metrics: Record<string, number>) {
  const sceneBreakRate =
    (metrics.sceneBreaks ?? 0) /
    Math.max(1, (metrics.sentenceCount ?? 1) / 12);

  return {
    aiSmellScore: Math.min(
      0.95,
      0.28 + (metrics.averageSentenceLength ?? 12) / 40,
    ),
    averageSentenceLength: metrics.averageSentenceLength ?? 12,
    dialogueRatio: metrics.dialogueRatio ?? 0.2,
    expositionRatio: Math.max(
      0.12,
      1 - (metrics.dialogueRatio ?? 0.2) - (metrics.sensoryDensity ?? 0.1) * 0.6,
    ),
    hookIntensity: Math.min(0.96, 0.3 + (metrics.sceneBreaks ?? 0) * 0.1),
    sceneBreakRate,
  };
}

function averageMetrics(metricSets: Array<Record<string, number>>) {
  const totals = new Map<string, number>();

  for (const metrics of metricSets) {
    for (const [key, value] of Object.entries(metrics)) {
      totals.set(key, (totals.get(key) ?? 0) + value);
    }
  }

  const averaged: Record<string, number> = {};
  for (const [key, total] of totals.entries()) {
    averaged[key] = Number((total / metricSets.length).toFixed(2));
  }

  return averaged;
}

function listImportableFiles(folderPath: string) {
  const target = path.resolve(folderPath);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error(`Folder not found: ${target}`);
  }

  const files: string[] = [];
  const supported = new Set([".md", ".txt"]);

  const walk = (currentPath: string) => {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const resolved = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(resolved);
        continue;
      }

      if (supported.has(path.extname(entry.name).toLowerCase())) {
        files.push(resolved);
      }
    }
  };

  walk(target);
  return files.sort();
}

function deriveReferenceTitle(text: string, filePath: string) {
  const heading = text.match(/^\s*#\s*(.+?)\s*$/m)?.[1]?.trim();
  if (heading) {
    return heading;
  }

  return path.basename(filePath, path.extname(filePath));
}

function splitReferenceIntoChapters(text: string, fallbackTitle: string) {
  const normalized = text.replace(/\r/g, "").trim();
  const headingMatches = Array.from(
    normalized.matchAll(/^(?:第.{0,30}[章节卷回].*|#{1,3}\s+.+)$/gm),
  );

  if (headingMatches.length === 0) {
    return [buildChapterRecord(fallbackTitle, normalized)];
  }

  return headingMatches.map((match, index) => {
    const start = match.index ?? 0;
    const end =
      index + 1 < headingMatches.length
        ? (headingMatches[index + 1]?.index ?? normalized.length)
        : normalized.length;
    const chunk = normalized.slice(start, end).trim();
    const title = match[1]?.replace(/^#{1,3}\s+/, "").trim() || fallbackTitle;
    return buildChapterRecord(title, chunk);
  });
}

function buildChapterRecord(title: string, chunk: string) {
  const text = chunk.replace(/\n+/g, " ").trim();
  return {
    snippet: text.slice(0, 160),
    title,
    wordCount: text.replace(/\s+/g, "").length,
  };
}
