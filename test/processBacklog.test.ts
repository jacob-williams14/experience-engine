import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { processBacklog } from "../tools/processBacklog";
import { fixture, tempDir } from "./helpers";

const titles = (r: Awaited<ReturnType<typeof processBacklog>>) =>
	r.data!.tasks.map((t) => t.Title);

describe("processBacklog attribution", () => {
	test("credits only rows that name the developer", async () => {
		const r = await processBacklog(fixture("backlog.csv"), "Dev Person", "Demo");
		expect(titles(r)).toEqual(["Build login", "Build payments", "Plan sprint"]);
	});

	test("a short --username does not match a longer name that contains it", async () => {
		const r = await processBacklog(fixture("backlog.csv"), "Dev Person", "Demo", {
			developerUsername: "dpx",
		});
		expect(titles(r)).not.toContain("Write docs"); // "Sam Dpx"
	});

	test("ignores id columns when detecting the assignee column", async () => {
		const r = await processBacklog(fixture("backlog.csv"), "Dev Person", "Demo");
		expect(r.data!.metadata.assigneeColumns).toEqual(["Assigned To"]);
	});

	test("with no assignee column it fails instead of crediting every row", async () => {
		const r = await processBacklog(fixture("backlog-no-assignee.csv"), "Dev Person", "Demo");
		expect(r.success).toBe(false);
		expect(r.data).toBeUndefined();
	});

	test("--column names the assignee column", async () => {
		const r = await processBacklog(fixture("backlog-no-assignee.csv"), "Dev Person", "Demo", {
			assigneeColumn: "User",
		});
		expect(titles(r)).toEqual(["Build login"]);
	});

	test("--save writes the matched rows", async () => {
		const dir = tempDir();
		await processBacklog(fixture("backlog.csv"), "Dev Person", "Demo", {
			saveToFile: true,
			outputDir: dir,
		});
		const saved = join(dir, "dev-person-demo-backlog-data.json");
		expect(existsSync(saved)).toBe(true);
		expect(JSON.parse(readFileSync(saved, "utf8")).tasks).toHaveLength(3);
	});
});

describe("processBacklog column detection and cell parsing", () => {
	const write = (csv: string) => {
		const path = join(tempDir(), "b.csv");
		writeFileSync(path, csv);
		return path;
	};
	const run = (csv: string, opts: Parameters<typeof processBacklog>[3] = {}) =>
		processBacklog(write(csv), "Dev Person", "Demo", opts);

	test("skips columns that name someone other than the doer", async () => {
		const r = await run("Title,Assignee,Assigned By,Previous Owner\nA,Sam,Dev Person,Dev Person\nB,Dev Person,Sam,Sam\n");
		expect(r.data!.metadata.assigneeColumns).toEqual(["Assignee"]);
		expect(titles(r)).toEqual(["B"]);
	});

	test("reads a 'Last, First' cell as one person, but never joins two people", async () => {
		const r = await run('Title,Assignee\nA,"Person, Dev"\nB,"Dev, Person"\n');
		expect(titles(r)).toEqual(["A"]);
	});

	test("an @handle is a name, not an email", async () => {
		const r = await run("Title,Members\nA,@devperson\n");
		expect(titles(r)).toEqual(["A"]);
	});

	test("folds accents", async () => {
		const r = await processBacklog(write("Title,Assignee\nA,José García\n"), "Jose Garcia", "Demo");
		expect(titles(r)).toEqual(["A"]);
	});

	test("strips an Excel BOM and matches --column in any case", async () => {
		const r = await run("﻿Who,Title\nDev Person,A\n", { assigneeColumn: "who" });
		expect(titles(r)).toEqual(["A"]);
	});

	test("no matching row fails and lists the assignees seen", async () => {
		const r = await run("Title,Assignee\nA,Dev Persson\n");
		expect(r.success).toBe(false);
		expect(r.errors[0]!.message).toContain("Dev Persson");
	});
});
