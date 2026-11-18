import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
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
