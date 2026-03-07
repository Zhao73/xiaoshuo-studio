import fs from "node:fs";
import path from "node:path";

export type PlatformPaths = {
  analysisDir: string;
  browserProfileDir: string;
  canonDir: string;
  dbFile: string;
  referencesDir: string;
  rootDir: string;
  studioFile: string;
  tempDir: string;
};

function resolveRootDir() {
  if (process.env.XIAOSHUO_HOME) {
    return path.resolve(process.env.XIAOSHUO_HOME);
  }

  return path.resolve(process.cwd(), ".xiaoshuo");
}

export function getPlatformPaths(): PlatformPaths {
  const rootDir = resolveRootDir();

  return {
    analysisDir: path.join(rootDir, "analysis"),
    browserProfileDir: path.join(rootDir, "browser-profile"),
    canonDir: path.join(rootDir, "canon"),
    dbFile: path.join(rootDir, "studio.sqlite"),
    referencesDir: path.join(rootDir, "references"),
    rootDir,
    studioFile: path.join(rootDir, "studio.json"),
    tempDir: path.join(rootDir, "tmp"),
  };
}

export function ensurePlatformDirectories(paths = getPlatformPaths()) {
  for (const dir of [
    paths.rootDir,
    paths.analysisDir,
    paths.referencesDir,
    paths.browserProfileDir,
    paths.canonDir,
    paths.tempDir,
  ]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return paths;
}
