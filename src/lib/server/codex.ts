import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CodexCommandResult {
  exitCode?: number;
  ok?: boolean;
  stderr: string;
  stdout: string;
}

export interface CodexHealth {
  authenticated: boolean;
  available: boolean;
  binaryAvailable: boolean;
  hint: string;
  message: string;
  recommendedAction: "auth" | "install" | "ready";
  version: string | null;
}

interface CodexHealthOptions {
  execCommand?: () => Promise<CodexCommandResult>;
}

function parseVersion(stdout: string, stderr: string) {
  const combined = `${stdout}\n${stderr}`;
  const match = combined.match(/codex(?:-cli)?\s+([0-9.]+)/i);
  return match?.[1] ?? null;
}

async function runCodexVersion(): Promise<CodexCommandResult> {
  try {
    const { stderr, stdout } = await execFileAsync("codex", ["--version"]);
    return {
      exitCode: 0,
      stderr,
      stdout,
    };
  } catch (error) {
    const err = error as { code?: number | string; stderr?: string; stdout?: string };
    return {
      exitCode: typeof err.code === "number" ? err.code : 127,
      stderr: err.stderr ?? String(err.code ?? "unknown error"),
      stdout: err.stdout ?? "",
    };
  }
}

export async function getCodexHealth(
  input: CodexHealthOptions | (() => Promise<CodexCommandResult>) = {},
): Promise<CodexHealth> {
  const execCommand =
    typeof input === "function" ? input : input.execCommand ?? runCodexVersion;
  const result = await execCommand();
  const ok = result.ok ?? result.exitCode === 0;
  const version = parseVersion(result.stdout, result.stderr);

  if (!ok || !version) {
    return {
      authenticated: false,
      available: false,
      binaryAvailable: false,
      hint: "install codex cli first",
      message:
        "Codex CLI is not available. Install it and run `codex login` before using writing jobs.",
      recommendedAction: "install",
      version: null,
    };
  }

  return {
    authenticated: true,
    available: true,
    binaryAvailable: true,
    hint: "ready",
    message: "Codex CLI detected. The studio can queue local writing workflows.",
    recommendedAction: "ready",
    version,
  };
}
