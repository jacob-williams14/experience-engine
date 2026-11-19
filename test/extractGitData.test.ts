import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { extractGitData } from "../tools/extractGitData";
import type { Developer } from "../lib/types";
import { fixture, ok, runScript, tempDir } from "./helpers";

const LOG = fixture("git-log.txt");
const DEV: Developer = { name: "Dev Person" };
const extract = (dev: Partial<Developer> = {}, opts: Parameters<typeof extractGitData>[3] = {}) =>
	extractGitData(LOG, { ...DEV, ...dev }, "Demo", opts);
const messages = async (dev: Partial<Developer> = {}) =>
	ok(await extract(dev)).commits.map((c) => c.message);

describe("extractGitData attribution", () => {
	test("never credits a teammate whose name contains, or is contained in, the developer's", async () => {
		const msgs = await messages();
		expect(msgs.some((m) => m.includes("different Dev"))).toBe(false); // "Dev"
		expect(msgs.some((m) => m.includes("different person"))).toBe(false); // "Dev Personson"
		expect(msgs.some((m) => m.includes("Per does"))).toBe(false); // "Per"
	});

	test("matches the developer's own name ignoring case and punctuation", async () => {
		const msgs = await messages();
		expect(msgs).toContain("Add login screen with a second line");
		expect(msgs).toContain("Dev commits with a dotted name");
	});

	test("an email matches the commit author email", async () => {
		expect(await messages({ email: "dev@example.com" })).toContain(
			"Dev commits under a handle, same email"
		);
	});

	test("an alias adds a spelling", async () => {
		expect(await messages({ aliases: ["dpx"] })).toContain("Dev commits under a handle, same email");
	});

	test("parses a merge commit's author, date and message", async () => {
		expect(ok(await extract({ name: "Dev" })).commits).toEqual([
			{
				hash: "bbbbbbbbbbbb",
				author: "Dev",
				email: "other.dev@example.com",
				date: "Wed Nov 23 12:01:22 2022 -0500",
				message: "Merge: a different Dev builds payments",
			},
		]);
	});

	test("no matching commit fails and lists the authors seen", async () => {
		const r = await extract({ name: "Nobody Here" });
		expect(r.success).toBe(false);
		if (!r.success) expect(r.error).toContain("Dev Personson");
	});

	test("--save writes the parsed commits", async () => {
		const dir = tempDir();
		await extract({}, { saveToFile: true, outputDir: dir });
		const saved = JSON.parse(readFileSync(join(dir, "dev-person-demo-git-data.json"), "utf8"));
		expect(saved.commits).toHaveLength(2);
	});
});

describe("extractGitData CLI", () => {
	test("a flag missing its value is an error, not silently ignored", () => {
		const { code, out } = runScript(["run", "tools/extractGitData.ts", LOG, "Dev Person", "Demo", "--email"]);
		expect(code).toBe(1);
		expect(out).toContain("--email needs a value");
	});
});
