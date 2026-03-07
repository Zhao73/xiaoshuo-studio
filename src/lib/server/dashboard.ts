import { getDashboardRows } from "./db";

export function getDashboardSnapshot() {
  const { blendProfiles, jobs, metrics, projects, references, styleProfiles } =
    getDashboardRows();

  return {
    blendProfiles,
    jobs,
    metrics,
    projects,
    references,
    styleProfiles,
  };
}
