import { describe, expect, test } from "bun:test";
import { homedir } from "os";
import { join } from "path";
import { resolveBrainspaceRoot } from "../lib/config";

describe("resolveBrainspaceRoot", () => {
	const fallback = join(homedir(), "Projects", "brainspace");

	test("unset or empty falls back to ~/Projects/brainspace, never the current directory", () => {
		expect(resolveBrainspaceRoot(undefined)).toBe(fallback);
		expect(resolveBrainspaceRoot("")).toBe(fallback);
		expect(resolveBrainspaceRoot("  ")).toBe(fallback);
	});

	test("a quoted ~ is expanded", () => {
		expect(resolveBrainspaceRoot("~/Projects/brainspace")).toBe(fallback);
	});

	test("an absolute path is used as is", () => {
		expect(resolveBrainspaceRoot("/srv/kb")).toBe("/srv/kb");
	});
});
