import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { chromium } from "playwright";

import { ensurePlatformDirectories, getPlatformPaths } from "./paths";

export type ExtractedReferenceText = {
  excerpt: string;
  text: string;
  title: string;
  wordCount: number;
};

export function extractReadableTextFromHtml(
  html: string,
  url: string,
): ExtractedReferenceText {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const title =
    article?.title?.trim() ||
    dom.window.document.querySelector("h1")?.textContent?.trim() ||
    new URL(url).hostname;
  const text = normalizeText(
    article?.textContent || dom.window.document.body.textContent || "",
  );

  return {
    excerpt: text.slice(0, 180),
    text,
    title,
    wordCount: text.replace(/\s+/g, "").length,
  };
}

export async function crawlReferenceUrl(
  url: string,
  options: { browserProfileDir?: string } = {},
) {
  const paths = ensurePlatformDirectories(getPlatformPaths());
  const browserProfileDir = options.browserProfileDir ?? paths.browserProfileDir;
  mkdirSync(browserProfileDir, { recursive: true });

  const context = await chromium.launchPersistentContext(browserProfileDir, {
    headless: true,
  });

  try {
    const page = await context.newPage();
    await page.goto(url, { timeout: 45_000, waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1_000);
    const html = await page.content();
    return extractReadableTextFromHtml(html, url);
  } finally {
    await context.close();
  }
}

export function writeReferenceTextFile(title: string, text: string) {
  const paths = ensurePlatformDirectories(getPlatformPaths());
  const filePath = path.join(
    paths.referencesDir,
    `${Date.now()}-${slugify(title)}.md`,
  );

  writeFileSync(filePath, `# ${title}\n\n${text.trim()}\n`, "utf8");
  return filePath;
}

export function writeTemporaryAnalysisFile(title: string, text: string) {
  const paths = ensurePlatformDirectories(getPlatformPaths());
  const filePath = path.join(paths.tempDir, `${Date.now()}-${slugify(title)}.md`);

  writeFileSync(filePath, `# ${title}\n\n${text.trim()}\n`, "utf8");
  return filePath;
}

function normalizeText(input: string) {
  return input.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "reference";
}
