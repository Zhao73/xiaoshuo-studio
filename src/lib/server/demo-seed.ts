import {
  createDraftJob,
  createProject,
  createReferenceWork,
  createStyleProfile,
  listProjects,
} from "./db";

const DEMO_PROJECT_TITLE = "雾港债火";

type ProjectRow = {
  id: number;
  title: string;
};

export function seedDemoData() {
  const existingProject = (listProjects() as ProjectRow[]).find(
    (project) => project.title === DEMO_PROJECT_TITLE,
  );

  if (existingProject) {
    return {
      created: false,
      message: "Demo data already exists.",
      projectId: existingProject.id,
      title: existingProject.title,
    };
  }

  const project = createProject({
    genre: "都市奇幻 / 悬疑",
    premise:
      "负债的夜班修表师在雾港听见旧钟里的亡者留言，被迫用七天查清一场债火案。",
    title: DEMO_PROJECT_TITLE,
  });

  const reference = createReferenceWork({
    creatorLabel: "demo sample",
    projectId: project.id,
    sourceLabel: "demo://fog-harbor-opening",
    sourceType: "excerpt",
    title: "雾港开场节奏样本",
  });

  const styleProfile = createStyleProfile({
    antiPatterns: ["解释动机过早", "段尾连续抽象总结", "对白缺少动作承接"],
    metrics: {
      averageSentenceLength: 15.8,
      dialogueRatio: 0.31,
      hookDensity: 0.42,
    },
    name: "雾港悬压推进卡",
    referenceWorkId: reference.id,
    summary:
      "短场景切换、物件线索推进、对白后接动作反应，章末保留一个可验证谜面。",
  });

  const job = createDraftJob({
    jobType: "plan",
    payload: {
      chapter: 1,
      focus: "建立债火案、旧钟留言和主角七天倒计时。",
      styleProfileId: styleProfile.id,
    },
    projectId: project.id,
    status: "queued",
  });

  return {
    created: true,
    jobId: job.id,
    message: "Demo data created.",
    projectId: project.id,
    referenceId: reference.id,
    styleProfileId: styleProfile.id,
    title: project.title,
  };
}
