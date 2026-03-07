async function loadCodexModules() {
  vi.resetModules();
  return import("@/lib/server/codex");
}

describe("codex health", () => {
  test("marks codex available when version output is returned", async () => {
    const codex = await loadCodexModules();
    const status = await codex.getCodexHealth(async () => ({
      ok: true,
      stdout: "codex 0.34.0\n",
      stderr: "",
    }));

    expect(status).toMatchObject({
      available: true,
      authenticated: true,
      version: "0.34.0",
    });
  });

  test("surfaces actionable status when codex is missing", async () => {
    const codex = await loadCodexModules();
    const status = await codex.getCodexHealth(async () => ({
      ok: false,
      stdout: "",
      stderr: "command not found: codex",
    }));

    expect(status.available).toBe(false);
    expect(status.authenticated).toBe(false);
    expect(status.hint).toContain("install");
  });
});
