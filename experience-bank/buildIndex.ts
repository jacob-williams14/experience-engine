#!/usr/bin/env bun
/**
 * Bank index renderer (deterministic, no AI).
 *
 * Reads the bank's claims.yaml and writes index.md alongside it — a human-browsable view of the
 * bank grouped by type. The bank lives in the knowledge base at artifacts/contributions/.
 * Regenerate whenever claims change:
 *
 *   bun run buildBankIndex
 *
 * This is a read-only VIEW. claims.yaml is the source of truth.
 */

import { join } from "path";
import { parse } from "yaml";
import { KB } from "../lib/config.js";

type ClaimType = "technical" | "non-technical";

export interface Claim {
	id: string;
	type?: ClaimType;
	context?: "professional" | "personal";
	project?: string;
	domain: string;
	themes?: string[];
	tech?: string[];
	scope?: string;
	strength?: "featured" | "solid" | "filler";
	hook?: boolean;
	keyword_rich?: string;
	plain_language?: string;
}

const SRC = join(KB.CONTRIBUTIONS, "claims.yaml");
const OUT = join(KB.CONTRIBUTIONS, "index.md");

const STRENGTH_ORDER: Record<string, number> = { featured: 0, solid: 1, filler: 2 };
const TYPE_ORDER: ClaimType[] = ["technical", "non-technical"];
const TYPE_LABEL: Record<ClaimType, string> = {
	technical: "Technical",
	"non-technical": "Non-technical",
};

function clipWords(text: string, maxWords = 22): string {
	const flat = text.replace(/\s+/g, " ").trim();
	const words = flat.split(" ");
	const clipped = words.length > maxWords ? words.slice(0, maxWords).join(" ") + "…" : flat;
	return clipped.replace(/\.…$/, "…").replace(/\.$/, "");
}

// Group by domain, featured-first within each domain.
function groupByDomain(list: Claim[]): Map<string, Claim[]> {
	const byDomain = new Map<string, Claim[]>();
	for (const c of list) {
		const arr = byDomain.get(c.domain) ?? [];
		arr.push(c);
		byDomain.set(c.domain, arr);
	}
	for (const arr of byDomain.values()) {
		arr.sort(
			(a, b) => (STRENGTH_ORDER[a.strength ?? "solid"] ?? 1) - (STRENGTH_ORDER[b.strength ?? "solid"] ?? 1)
		);
	}
	return byDomain;
}

/**
 * Problems that make the index wrong rather than merely untidy: a claim with no id or no domain,
 * an id used twice (ids are the stable key renders, refs and corrections point at), or a field of
 * the wrong shape for the renderer. The index is not written while any of these stand.
 */
export function validateClaims(claims: Claim[]): string[] {
	const errors: string[] = [];
	const seen = new Set<string>();
	for (const [i, c] of claims.entries()) {
		if (!c || typeof c !== "object") {
			errors.push(`claim #${i + 1} is not a mapping`);
			continue;
		}
		const where = c.id ? `claim "${c.id}"` : `claim #${i + 1}`;
		if (!c.id) errors.push(`${where} has no id`);
		else if (typeof c.id !== "string") errors.push(`${where}: id must be a string`);
		else if (seen.has(c.id)) errors.push(`${where}: duplicate id`);
		else seen.add(c.id);
		if (!c.domain) errors.push(`${where} has no domain`);
		else if (typeof c.domain !== "string") errors.push(`${where}: domain must be a string`);
		if (c.tech !== undefined && c.tech !== null && !Array.isArray(c.tech))
			errors.push(`${where}: tech must be a list`);
		if (c.keyword_rich != null && typeof c.keyword_rich !== "string")
			errors.push(`${where}: keyword_rich must be text`);
	}
	return errors;
}

/** Renders index.md from the claims. Pure: warnings are returned, not printed. */
export function renderIndex(claims: Claim[]): { markdown: string; warnings: string[]; summary: string } {
	// Group by type first (technical / non-technical), domains nested under each. Map is string-keyed
	// because YAML can carry a value outside the ClaimType union (a typo like `type: tech`); those claims
	// are surfaced with a warning rather than silently dropped from the index.
	const byType = new Map<string, Claim[]>();
	for (const c of claims) {
		const t = c.type ?? "technical";
		const arr = byType.get(t) ?? [];
		arr.push(c);
		byType.set(t, arr);
	}

	// Known types first (in order), then any unrecognized ones — warned, but still rendered.
	const knownTypes = TYPE_ORDER.filter((t) => byType.get(t)?.length);
	const unknownTypes = [...byType.keys()].filter((t) => !TYPE_ORDER.includes(t as ClaimType));
	const warnings: string[] = [];
	for (const t of unknownTypes) {
		const ids = byType.get(t)!.map((c) => c.id).join(", ");
		warnings.push(
			`⚠️  unrecognized type "${t}" on ${byType.get(t)!.length} claim(s) — expected ${TYPE_ORDER.join(" | ")}: ${ids}`
		);
	}
	const orderedTypes = [...knownTypes, ...unknownTypes];

	const total = claims.length;
	const featured = claims.filter((c) => c.strength === "featured").length;
	const hooks = claims.filter((c) => c.hook).length;
	const domainCount = new Set(claims.map((c) => c.domain)).size;
	const typeSummary = orderedTypes.map((t) => `${byType.get(t)!.length} ${t}`).join(" · ");

	const lines: string[] = [];
	lines.push("# Experience Bank — Index");
	lines.push("");
	lines.push(
		"> Generated view of `claims.yaml` (the source of truth). Do not edit by hand — run " +
			"`bun run buildBankIndex`. ★ = featured · ⚓ = hook · `personal` = side project (else professional)."
	);
	lines.push("");
	lines.push(
		`**${total} claims** across ${domainCount} domains (${typeSummary}) — ${featured} featured, ${hooks} hooks.`
	);
	lines.push("");

	for (const claimType of orderedTypes) {
		const list = byType.get(claimType)!;
		const label = TYPE_ORDER.includes(claimType as ClaimType)
			? TYPE_LABEL[claimType as ClaimType]
			: `${claimType} (unrecognized type)`;
		lines.push(`## ${label} (${list.length})`);
		lines.push("");
		const byDomain = groupByDomain(list);
		for (const domain of [...byDomain.keys()].sort()) {
			const dlist = byDomain.get(domain)!;
			lines.push(`### ${domain} (${dlist.length})`);
			lines.push("");
			for (const c of dlist) {
				const marks = `${c.strength === "featured" ? "★ " : ""}${c.hook ? "⚓ " : ""}`;
				const tech = c.tech && c.tech.length ? `  _(${c.tech.join(", ")})_` : "";
				const personal = c.context === "personal" ? "  · personal" : "";
				lines.push(`- ${marks}${clipWords(c.keyword_rich ?? c.id)}${tech}  \`${c.id}\`${personal}`);
			}
			lines.push("");
		}
	}

	return { markdown: lines.join("\n"), warnings, summary: typeSummary };
}

if (import.meta.main) {
	const doc = parse(await Bun.file(SRC).text()) as { claims?: Claim[] } | null;
	const claims = doc?.claims;
	if (!Array.isArray(claims)) {
		console.error(`❌ ${SRC} has no \`claims:\` list — index not written.`);
		process.exit(1);
	}
	const errors = validateClaims(claims);
	if (errors.length > 0) {
		console.error(`❌ ${errors.length} problem(s) in ${SRC} — index not written:`);
		for (const e of errors) console.error(`   ${e}`);
		process.exit(1);
	}
	const { markdown, warnings, summary } = renderIndex(claims);
	for (const w of warnings) console.warn(w);
	// Bun.write auto-creates the parent dir; and reading SRC above already requires it to exist.
	await Bun.write(OUT, markdown);
	console.log(`✅ Wrote ${OUT} — ${claims.length} claims (${summary}).`);
}
