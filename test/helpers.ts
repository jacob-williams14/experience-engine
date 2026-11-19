import { mkdtempSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { ProcessingResult } from "../lib/types";

export const REPO = join(import.meta.dir, "..");
export const fixture = (name: string) => join(import.meta.dir, "fixtures", name);
export const readFixture = (name: string) => readFileSync(fixture(name), "utf8");
export const tempDir = () => mkdtempSync(join(tmpdir(), "ee-test-"));

/** Writes `content` to a fresh temp dir at `relPath` (parent dirs must exist) and returns the path. */
export function writeTemp(relPath: string, content: string, dir = tempDir()): string {
	const path = join(dir, relPath);
	writeFileSync(path, content);
	return path;
}

/** The data of a successful result; fails the test with the error otherwise. */
export function ok<T>(r: ProcessingResult<T>): T {
	if (!r.success) throw new Error(`expected success, got: ${r.error}`);
	return r.data;
}

/** Runs a repo script as a subprocess, to exercise the real CLI and its env handling. */
export function runScript(args: string[], env: Record<string, string> = {}) {
	const p = Bun.spawnSync(["bun", ...args], {
		cwd: REPO,
		env: { ...process.env, ...env },
		stdout: "pipe",
		stderr: "pipe",
	});
	return { code: p.exitCode, out: p.stdout.toString() + p.stderr.toString() };
}
