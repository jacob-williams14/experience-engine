// The bank index (artifacts/contributions/index.md) is the one file this repo regenerates inside
// brainspace, and the PR sorter merges it by rule.
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { renderIndex, validateClaims, type Claim } from "../experience-bank/buildIndex";
import { readFixture, runScript, tempDir, writeTemp } from "./helpers";

const BANK = readFixture("bank/claims.yaml");
const claimsOf = (yaml: string) => (parse(yaml) as { claims: Claim[] }).claims;
const { markdown: INDEX, warnings } = renderIndex(claimsOf(BANK));

/** The real script against a temp KB root: exit code, output, and the index it left (or null). */
function buildIndexCli(claimsYaml: string) {
	const root = tempDir();
	const dir = join(root, "artifacts", "contributions");
	mkdirSync(dir, { recursive: true });
	writeTemp("claims.yaml", claimsYaml, dir);
	const res = runScript(["run", "experience-bank/buildIndex.ts"], { BRAINSPACE_ROOT: root });
	const out = join(dir, "index.md");
	return { ...res, index: existsSync(out) ? readFileSync(out, "utf8") : null };
}

describe("renderIndex", () => {
	test("renders the fixture bank exactly as before", () => {
		expect(INDEX).toBe(readFixture("bank/index.expected.md"));
	});

	test("keeps internal fields out of the index", () => {
		// project codenames, refs, source filenames and correction notes can name clients or
		// people; the index is read as part of the bank and checked by the sorter's tripwire.
		for (const internal of ["acmeco", "courtco", "sidething", "ACME-12", "acme-app", "Pat"]) {
			expect(INDEX).not.toContain(internal);
		}
	});

	test("every line fits the PR sorter's index.md rule (600 chars)", () => {
		for (const line of INDEX.split("\n")) expect(line.length).toBeLessThanOrEqual(600);
	});

	test("warns on an unrecognized type but still renders the claim", () => {
		expect(warnings.join("\n")).toContain('unrecognized type "tech"');
		expect(INDEX).toContain("`odd-type`");
	});
});

describe("validateClaims", () => {
	const errorsFor = (yaml: string) => validateClaims(claimsOf(yaml));

	test("the fixture bank is valid", () => {
		expect(errorsFor(BANK)).toEqual([]);
	});

	test("a duplicate id", () => {
		expect(errorsFor(BANK.replace("id: retail-offline", "id: retail-checkout"))).toEqual([
			'claim "retail-checkout": duplicate id',
		]);
	});

	test("a claim with no domain", () => {
		const yaml = BANK.replace("    domain: state judicial / government finance\n", "");
		expect(errorsFor(yaml)).toEqual(['claim "courts-reports" has no domain']);
	});

	test("a scalar tech", () => {
		expect(errorsFor(BANK.replace("tech: [SQLite]", "tech: SQLite"))).toEqual([
			'claim "retail-offline": tech must be a list',
		]);
	});
});

describe("buildBankIndex CLI", () => {
	test("writes the index for a valid bank", () => {
		const { code, index } = buildIndexCli(BANK);
		expect(code).toBe(0);
		expect(index).toBe(INDEX);
	});

	test("refuses an invalid bank and leaves no index", () => {
		const { code, out, index } = buildIndexCli(BANK.replace("id: retail-offline", "id: retail-checkout"));
		expect(code).toBe(1);
		expect(out).toContain("duplicate id");
		expect(index).toBeNull();
	});

	test("refuses a file with no claims list", () => {
		const { code, index } = buildIndexCli("meta:\n  updated: x\n");
		expect(code).toBe(1);
		expect(index).toBeNull();
	});
});
