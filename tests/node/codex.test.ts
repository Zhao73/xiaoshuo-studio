import { describe, expect, it } from "vitest";

import { getCodexHealth } from "../../src/lib/server/codex";

describe("getCodexHealth", () => {
  it("returns version data when codex is available", async () => {
    const health = await getCodexHealth({
      execCommand: async () => ({
        exitCode: 0,
        stderr: "",
        stdout: "codex-cli 0.0.1",
      }),
    });

    expect(health.binaryAvailable).toBe(true);
    expect(health.version).toContain("0.0.1");
    expect(health.recommendedAction).toBe("ready");
  });

  it("returns setup guidance when codex is missing", async () => {
    const health = await getCodexHealth({
      execCommand: async () => ({
        exitCode: 127,
        stderr: "command not found: codex",
        stdout: "",
      }),
    });

    expect(health.binaryAvailable).toBe(false);
    expect(health.recommendedAction).toBe("install");
    expect(health.message).toContain("Codex CLI");
  });
});
