import { describe, expect, test } from "bun:test";
import { homedir } from "os";
import { join } from "path";
import { run } from "./helpers";

// config.ts reads the variable at import, so each case runs in its own process.
const rootFor = (value: string) =>
	run(["-e", "import { KB } from './lib/config.ts'; console.log(KB.CONTRIBUTIONS)"], {
		BRAINSPACE_ROOT: value,
	}).out.trim();

describe("BRAINSPACE_ROOT", () => {
	const fallback = join(homedir(), "Projects", "brainspace", "artifacts", "contributions");

	test("empty counts as unset, never the current directory", () => {
		expect(rootFor("")).toBe(fallback);
	});

	test("a quoted ~ is expanded", () => {
		expect(rootFor("~/Projects/brainspace")).toBe(fallback);
	});

	test("an absolute path is used as is", () => {
		expect(rootFor("/srv/kb")).toBe("/srv/kb/artifacts/contributions");
	});
});
