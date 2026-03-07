export type ProjectStatus = "active" | "idea";
export type ReferenceSourceType = "crawl" | "upload";
export type JobKind =
  | "webnovel-analyze-style"
  | "webnovel-humanize"
  | "webnovel-plan"
  | "webnovel-review"
  | "webnovel-write";
export type JobStatus = "failed" | "queued" | "running" | "succeeded";

export interface Project {
  id: string;
  title: string;
  genre: string;
  premise: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceWork {
  id: string;
  title: string;
  authorHint: string;
  sourceType: ReferenceSourceType;
  sourcePath: string;
  notes: string;
  createdAt: string;
}

export interface StyleProfile {
  id: string;
  name: string;
  sourceIds: string[];
  summary: string;
  antiAiFocus: string[];
  createdAt: string;
}

export interface DraftJob {
  id: string;
  projectId: string;
  kind: JobKind;
  status: JobStatus;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSnapshot {
  counts: {
    jobs: number;
    projects: number;
    references: number;
    styleProfiles: number;
  };
  jobs: DraftJob[];
  projects: Project[];
  references: ReferenceWork[];
  styleProfiles: StyleProfile[];
}

export interface CreateProjectInput {
  title: string;
  genre: string;
  premise: string;
}

export interface CreateReferenceWorkInput {
  title: string;
  authorHint: string;
  sourceType: ReferenceSourceType;
  sourcePath: string;
  notes: string;
}

export interface CreateStyleProfileInput {
  name: string;
  sourceIds: string[];
  summary: string;
  antiAiFocus: string[];
}

export interface QueueJobInput {
  projectId: string;
  kind: JobKind;
  status: JobStatus;
  summary: string;
}

export interface StoryBible {
  phaseGoal: string;
  summary: string;
  worldRules: string[];
}

export interface CharacterCanon {
  currentState: string;
  goals: string[];
  name: string;
  role: string;
  secrets: string[];
}

export interface LocationCanon {
  currentState: string;
  name: string;
}

export interface TimelineEvent {
  chapterNumber: number;
  detail: string;
  label: string;
}

export interface ForeshadowingItem {
  payoffHint: string;
  status: "paid-off" | "planted";
  title: string;
}

export interface OpenThread {
  priority: "high" | "low" | "medium";
  status: "open" | "resolved";
  summary: string;
  title: string;
}

export interface ProjectCanon {
  characters: CharacterCanon[];
  foreshadowing: ForeshadowingItem[];
  locations: LocationCanon[];
  openThreads: OpenThread[];
  storyBible: StoryBible;
  timeline: TimelineEvent[];
  writingRules: string[];
}

export interface ChapterBrief {
  chapterGoal: string;
  forbiddenMoves: string[];
  hookTarget?: string;
  mustUseFacts: string[];
  optionalThreads: OpenThread[];
  recentChapterSummaries: string[];
  styleConstraints: string[];
  successCondition: string;
}

export interface ChangedCharacterState {
  currentState: string;
  name: string;
}

export interface CanonUpdatePatch {
  changedCharacterStates?: ChangedCharacterState[];
  newForeshadowing?: ForeshadowingItem[];
  newOpenThreads?: OpenThread[];
  newTimelineEvents?: TimelineEvent[];
  resolvedOpenThreadTitles?: string[];
}

export interface ContinuityIssue {
  entityId: string;
  entityType: "character" | "location" | "rule" | "thread";
  evidence: string;
  message: string;
  severity: "fatal" | "warning";
  suggestedFix: string;
}

export interface ProjectSeed {
  genreLabel: string;
  premise: string;
  title: string;
}

export interface VolumeOutline {
  endState: string;
  milestones: string[];
  summary: string;
}

export interface NovelBlueprint {
  canonSeed: ProjectCanon;
  chapterOneBrief: ChapterBrief;
  projectSeed: ProjectSeed;
  volumeOutline: VolumeOutline;
}

export interface WizardChoice {
  id: string;
  label: string;
  value: string;
}

export interface WizardQuestion {
  allowCustom?: boolean;
  choices?: WizardChoice[];
  id: string;
  kind: "single-choice" | "text";
  prompt: string;
  title: string;
}

export interface WizardSession {
  answers: Record<string, { choiceId?: string; customValue?: string; value?: string }>;
  createdAt: string;
  currentQuestionId: string | null;
  id: string;
  preview?: NovelBlueprint;
  status: "completed" | "in_progress" | "ready";
  updatedAt: string;
}

export interface ProjectArtifact {
  content: Record<string, unknown>;
  createdAt: string;
  id: number;
  kind: string;
  markdownPath: string;
  projectId: number;
  title: string;
  updatedAt: string;
}
