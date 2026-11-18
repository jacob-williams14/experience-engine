import { mkdtempSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export const REPO = join(import.meta.dir, "..");
export const FIXTURES = join(import.meta.dir, "fixtures");
export const fixture = (name: string) => join(FIXTURES, name);
export const readFixture = (name: string) => readFileSync(fixture(name), "utf8");
export const tempDir = () => mkdtempSync(join(tmpdir(), "ee-test-"));

/** Runs a repo script as a subprocess, so the tests exercise the real CLI (and its env handling). */
export function run(args: string[], env: Record<string, string> = {}) {
	const p = Bun.spawnSync(["bun", ...args], {
		cwd: REPO,
		env: { ...process.env, ...env },
		stdout: "pipe",
		stderr: "pipe",
	});
	return { code: p.exitCode, out: p.stdout.toString() + p.stderr.toString() };
}
