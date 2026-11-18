import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { extractGitData } from "../tools/extractGitData";
import { fixture, run, tempDir } from "./helpers";

const LOG = fixture("git-log.txt");
const extract = (opts: Parameters<typeof extractGitData>[3] = {}) =>
	extractGitData(LOG, "Dev Person", "Demo", opts);
const messages = (r: Awaited<ReturnType<typeof extract>>) => r.data!.commits.map((c) => c.message);

describe("extractGitData attribution", () => {
	test("never credits a teammate whose name contains, or is contained in, the developer's", async () => {
		const msgs = messages(await extract());
		expect(msgs.some((m) => m.includes("different Dev"))).toBe(false); // "Dev"
		expect(msgs.some((m) => m.includes("different person"))).toBe(false); // "Dev Personson"
		expect(msgs.some((m) => m.includes("Per does"))).toBe(false); // "Per"
	});

	test("matches the developer's own name ignoring case and punctuation", async () => {
		const msgs = messages(await extract());
		expect(msgs).toContain("Add login screen with a second line");
		expect(msgs).toContain("Dev commits with a dotted name");
	});

	test("--email matches the commit author email", async () => {
		const msgs = messages(await extract({ developerEmail: "dev@example.com" }));
		expect(msgs).toContain("Dev commits under a handle, same email");
	});

	test("--alias adds a spelling", async () => {
		const msgs = messages(await extract({ developerAliases: ["dpx"] }));
		expect(msgs).toContain("Dev commits under a handle, same email");
	});

	test("parses a merge commit's author, date and message", async () => {
		const r = await extractGitData(LOG, "Dev", "Demo");
		expect(r.data!.commits).toEqual([
			{
				hash: "bbbbbbbbbbbb",
				author: "Dev",
				email: "other.dev@example.com",
				date: "Wed Nov 23 12:01:22 2022 -0500",
				message: "Merge: a different Dev builds payments",
			},
		]);
	});

	test("--save writes the parsed commits", async () => {
		const dir = tempDir();
		await extract({ saveToFile: true, outputDir: dir });
		const saved = join(dir, "dev-person-demo-git-data.json");
		expect(existsSync(saved)).toBe(true);
		expect(JSON.parse(readFileSync(saved, "utf8")).commits).toHaveLength(2);
	});
});

describe("extractGitData CLI", () => {
	test("a flag missing its value is an error, not silently ignored", () => {
		const { code, out } = run(["run", "tools/extractGitData.ts", LOG, "Dev Person", "Demo", "--email"]);
		expect(code).toBe(1);
		expect(out).toContain("--email needs a value");
	});
});
