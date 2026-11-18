import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { processBacklog } from "../tools/processBacklog";
import type { Developer } from "../lib/types";
import { fixture, ok, readFixture, tempDir, writeTemp } from "./helpers";

const DEV: Developer = { name: "Dev Person" };
type Opts = Parameters<typeof processBacklog>[3];
const titlesIn = async (path: string, dev: Partial<Developer> = {}, opts: Opts = {}) =>
	ok(await processBacklog(path, { ...DEV, ...dev }, "Demo", opts)).tasks.map((t) => t.Title);
const fromCsv = (csv: string, dev: Partial<Developer> = {}, opts: Opts = {}) =>
	titlesIn(writeTemp("b.csv", csv), dev, opts);
const failureFor = async (csv: string, opts: Opts = {}) => {
	const r = await processBacklog(writeTemp("b.csv", csv), DEV, "Demo", opts);
	return r.success ? null : r.error;
};

describe("processBacklog attribution", () => {
	test("credits only rows that name the developer", async () => {
		expect(await titlesIn(fixture("backlog.csv"))).toEqual(["Build login", "Build payments", "Plan sprint"]);
	});

	test("a short username does not match a longer name that contains it", async () => {
		expect(await titlesIn(fixture("backlog.csv"), { username: "dpx" })).not.toContain("Write docs");
	});

	test("ignores id columns when detecting the assignee column", async () => {
		const r = ok(await processBacklog(fixture("backlog.csv"), DEV, "Demo"));
		expect(r.metadata.assigneeColumns).toEqual(["Assigned To"]);
	});

	test("with no assignee column it fails instead of crediting every row", async () => {
		expect(await failureFor(readFixture("backlog-no-assignee.csv"))).toContain("No assignee column");
	});

	test("--column names the assignee column, in any case", async () => {
		expect(await titlesIn(fixture("backlog-no-assignee.csv"), {}, { assigneeColumn: "user" })).toEqual([
			"Build login",
		]);
	});

	test("--save writes the matched rows", async () => {
		const dir = tempDir();
		await processBacklog(fixture("backlog.csv"), DEV, "Demo", { saveToFile: true, outputDir: dir });
		const saved = JSON.parse(readFileSync(join(dir, "dev-person-demo-backlog-data.json"), "utf8"));
		expect(saved.tasks).toHaveLength(3);
	});
});

describe("processBacklog columns and cells", () => {
	test("skips columns that name someone other than the doer", async () => {
		expect(
			await fromCsv("Title,Assignee,Assigned By,Previous Owner\nA,Sam,Dev Person,Dev Person\nB,Dev Person,Sam,Sam\n")
		).toEqual(["B"]);
	});

	test("two candidate columns is an error, not a guess", async () => {
		expect(await failureFor("Title,Assignee,Owner\nA,Dev Person,Sam\n")).toContain(
			"Several possible assignee columns"
		);
	});

	test("reads a 'Last, First' cell as one person, but never joins two people", async () => {
		expect(await fromCsv('Title,Assignee\nA,"Person, Dev"\nB,"Dev, Person"\n')).toEqual(["A"]);
	});

	test("an @handle is a name, not an email", async () => {
		expect(await fromCsv("Title,Members\nA,@devperson\n")).toEqual(["A"]);
	});

	test("folds accents", async () => {
		expect(await fromCsv("Title,Assignee\nA,José García\n", { name: "Jose Garcia" })).toEqual(["A"]);
	});

	test("strips an Excel BOM from the first header", async () => {
		expect(await fromCsv("﻿Who,Title\nDev Person,A\n", {}, { assigneeColumn: "Who" })).toEqual(["A"]);
	});

	test("no matching row fails and lists the assignees seen", async () => {
		expect(await failureFor("Title,Assignee\nA,Dev Persson\n")).toContain("Dev Persson");
	});
});
