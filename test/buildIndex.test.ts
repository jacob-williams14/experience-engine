// The bank index (artifacts/contributions/index.md) is the one file this repo regenerates inside
// brainspace, and the PR sorter merges it by rule. These run the real script against a fixture bank.
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { readFixture, run, tempDir } from "./helpers";

function buildIndex(claimsYaml: string) {
	const root = tempDir();
	const dir = join(root, "artifacts", "contributions");
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "claims.yaml"), claimsYaml);
	const res = run(["run", "experience-bank/buildIndex.ts"], { BRAINSPACE_ROOT: root });
	const out = join(dir, "index.md");
	return { ...res, index: existsSync(out) ? readFileSync(out, "utf8") : null };
}

const BANK = readFixture("bank/claims.yaml");

describe("buildBankIndex", () => {
	test("renders the fixture bank exactly as before", () => {
		const { code, index } = buildIndex(BANK);
		expect(code).toBe(0);
		expect(index).toBe(readFixture("bank/index.expected.md"));
	});

	test("keeps internal fields out of the index", () => {
		// project codenames, refs, source filenames and correction notes can name clients or
		// people; the index is published to the bank's readers and checked by the sorter's tripwire.
		const { index } = buildIndex(BANK);
		for (const internal of ["acmeco", "courtco", "sidething", "ACME-12", "acme-app", "Pat"]) {
			expect(index).not.toContain(internal);
		}
	});

	test("every line fits the PR sorter's index.md rule (600 chars)", () => {
		const { index } = buildIndex(BANK);
		for (const line of index!.split("\n")) expect(line.length).toBeLessThanOrEqual(600);
	});

	test("warns on an unrecognized type but still renders the claim", () => {
		const { code, out, index } = buildIndex(BANK);
		expect(code).toBe(0);
		expect(out).toContain('unrecognized type "tech"');
		expect(index).toContain("`odd-type`");
	});

	test("refuses a duplicate id and leaves no index", () => {
		const dup = BANK.replace("id: retail-offline", "id: retail-checkout");
		const { code, out, index } = buildIndex(dup);
		expect(code).not.toBe(0);
		expect(out).toContain("duplicate id");
		expect(index).toBeNull();
	});

	test("refuses a claim with no domain instead of filing it under 'undefined'", () => {
		const noDomain = BANK.replace("    domain: state judicial / government finance\n", "");
		const { code, out, index } = buildIndex(noDomain);
		expect(code).not.toBe(0);
		expect(out).toContain('claim "courts-reports" has no domain');
		expect(index).toBeNull();
	});

	test("refuses a file with no claims list", () => {
		const { code, index } = buildIndex("meta:\n  updated: x\n");
		expect(code).not.toBe(0);
		expect(index).toBeNull();
	});
});
