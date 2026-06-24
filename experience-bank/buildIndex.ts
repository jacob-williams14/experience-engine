#!/usr/bin/env bun
/**
 * Bank index renderer (deterministic, no AI).
 *
 * Reads the bank's claims.yaml and writes index.md alongside it — a human-browsable view of the
 * bank grouped by domain. The bank lives in the knowledge base at artifacts/contributions/.
 * Regenerate whenever claims change:
 *
 *   bun run buildBankIndex
 *
 * This is a read-only VIEW. claims.yaml is the source of truth.
 */

import { join } from "path";
import { parse } from "yaml";
import { KB } from "../lib/config.js";

type Kind = "technical" | "non-technical";

interface Claim {
	id: string;
	kind?: Kind;
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
const KIND_ORDER: Kind[] = ["technical", "non-technical"];
const KIND_LABEL: Record<Kind, string> = { technical: "Technical", "non-technical": "Non-technical" };

function firstSentence(text: string, maxWords = 22): string {
	const flat = text.replace(/\s+/g, " ").trim();
	const words = flat.split(" ");
	const clipped = words.length > maxWords ? words.slice(0, maxWords).join(" ") + "…" : flat;
	return clipped.replace(/\.…$/, "…").replace(/\.$/, "");
}

const raw = await Bun.file(SRC).text();
const doc = parse(raw) as { meta?: Record<string, unknown>; claims: Claim[] };
const claims = doc.claims ?? [];

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

// Group by kind first (technical / non-technical), domains nested under each. Map is string-keyed
// because YAML can carry a value outside the Kind union (a typo like `kind: tech`); those claims are
// surfaced with a warning rather than silently dropped from the index.
const byKind = new Map<string, Claim[]>();
for (const c of claims) {
	const k = c.kind ?? "technical";
	const arr = byKind.get(k) ?? [];
	arr.push(c);
	byKind.set(k, arr);
}

// Known kinds first (in order), then any unrecognized ones — warned, but still rendered.
const knownKinds = KIND_ORDER.filter((k) => byKind.get(k)?.length);
const unknownKinds = [...byKind.keys()].filter((k) => !KIND_ORDER.includes(k as Kind));
for (const k of unknownKinds) {
	const ids = byKind.get(k)!.map((c) => c.id).join(", ");
	console.warn(
		`⚠️  unrecognized kind "${k}" on ${byKind.get(k)!.length} claim(s) — expected ${KIND_ORDER.join(" | ")}: ${ids}`
	);
}
const orderedKinds = [...knownKinds, ...unknownKinds];

const total = claims.length;
const featured = claims.filter((c) => c.strength === "featured").length;
const hooks = claims.filter((c) => c.hook).length;
const domainCount = new Set(claims.map((c) => c.domain)).size;
const kindSummary = orderedKinds.map((k) => `${byKind.get(k)!.length} ${k}`).join(" · ");

const lines: string[] = [];
lines.push("# Experience Bank — Index");
lines.push("");
lines.push(
	"> Generated view of `claims.yaml` (the source of truth). Do not edit by hand — run " +
		"`bun run buildBankIndex`. ★ = featured · ⚓ = hook."
);
lines.push("");
lines.push(
	`**${total} claims** across ${domainCount} domains (${kindSummary}) — ${featured} featured, ${hooks} hooks.`
);
lines.push("");

for (const kind of orderedKinds) {
	const list = byKind.get(kind)!;
	const label = KIND_ORDER.includes(kind as Kind)
		? KIND_LABEL[kind as Kind]
		: `${kind} (unrecognized kind)`;
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
			lines.push(`- ${marks}${firstSentence(c.keyword_rich ?? c.id)}${tech}  \`${c.id}\``);
		}
		lines.push("");
	}
}

// Bun.write auto-creates the parent dir; and reading SRC above already requires it to exist.
await Bun.write(OUT, lines.join("\n"));
console.log(`✅ Wrote ${OUT} — ${total} claims (${kindSummary}).`);
