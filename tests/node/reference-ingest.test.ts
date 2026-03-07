import { describe, expect, it } from "vitest";

import { extractReadableTextFromHtml } from "../../src/lib/server/reference-ingest";

describe("extractReadableTextFromHtml", () => {
  it("pulls a clean title and body text from article-like html", () => {
    const html = `
      <html>
        <body>
          <article>
            <h1>风格拆解样本</h1>
            <p>雨落下来的时候，他没有立刻说话。</p>
            <p>她把刀背轻轻敲在桌沿，像在提醒什么。</p>
          </article>
        </body>
      </html>
    `;

    const result = extractReadableTextFromHtml(html, "https://example.com/story");

    expect(result.title).toBe("风格拆解样本");
    expect(result.text).toContain("雨落下来的时候");
    expect(result.wordCount).toBeGreaterThan(10);
  });
});
