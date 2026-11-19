/**
 * Decides whether a git author or a backlog assignee is the developer being summarized.
 *
 * Matching is exact on a compact form (accents folded, letters only, lowercased), so "Jacob
 * Williams", "jacob.williams" and "jacobwilliams3" all match (and, in a backlog cell, "Williams,
 * Jacob"), but a different person whose name merely contains or is contained in the developer's
 * ("Jacob", "Will", "Jacob Williamson") does not. Crediting a teammate's work to the developer is
 * an invented fact, so this errs toward a miss: pass an alias for a spelling it doesn't catch.
 */

import type { Developer } from "./types.js";

export interface Identity {
	name?: string;
	email?: string;
}

const compact = (s: string): string =>
	s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}]/gu, "");

/** Returns a predicate for "is this the developer?", with the developer's keys computed once. */
export function developerMatcher(developer: Developer): (who: Identity) => boolean {
	const email = developer.email?.trim().toLowerCase();
	const keys = new Set(
		[developer.name, developer.username, ...(developer.aliases ?? [])]
			.filter((n): n is string => !!n)
			.map(compact)
			.filter(Boolean)
	);
	return (who) =>
		(!!email && who.email?.trim().toLowerCase() === email) ||
		(!!who.name && keys.has(compact(who.name)));
}

/**
 * Splits items into the developer's and the rest, and names who the rest belong to. Both parsers
 * go through this, so both fail the same way when nothing matches: by showing the names they saw,
 * never by crediting someone else's work.
 */
export function partitionByDeveloper<T>(
	items: T[],
	identitiesOf: (item: T) => Identity[],
	developer: Developer
): { mine: T[]; others: string[] } {
	const isDeveloper = developerMatcher(developer);
	const mine: T[] = [];
	const others = new Set<string>();
	for (const item of items) {
		const people = identitiesOf(item);
		if (people.some(isDeveloper)) mine.push(item);
		else for (const p of people) others.add(p.name ?? p.email ?? "");
	}
	others.delete("");
	return { mine, others: [...others] };
}

/** The message for a run where nothing matched. */
export function noMatch(what: string, developer: Developer, others: string[]): string {
	const seen = others.length ? others.slice(0, 20).join(" · ") : "(none)";
	return (
		`No ${what} by ${developer.name}. Seen instead: ${seen}. ` +
		"Pass --alias / --username / --email for the spelling that is the developer."
	);
}

const EMAIL = /^[^@\s<>]+@[^@\s<>]+$/;

/**
 * The people a backlog assignee cell names: each part of "A, B; C", "Name <email>" split out.
 * A cell of exactly "Last, First" is also read as the one person "First Last" (only in that order,
 * so a cell listing "Jacob" and "Williams" as two people never combines into "Jacob Williams").
 */
export function parseAssignees(cell: string): Identity[] {
	const parts = cell.split(/[,;|\n]/).map((p) => p.trim()).filter(Boolean);
	if (cell.includes(",") && parts.length === 2) parts.push(`${parts[1]} ${parts[0]}`);
	return parts.map((part) => {
		const m = part.match(/^(.*?)\s*<([^>]+)>$/);
		if (m) return { name: m[1] || undefined, email: m[2] };
		return EMAIL.test(part) ? { email: part } : { name: part };
	});
}
