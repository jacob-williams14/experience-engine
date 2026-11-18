/**
 * Decides whether a git author or a backlog assignee is the developer being summarized.
 *
 * Matching is exact on a compact form (accents folded, letters only, lowercased), so "Jacob
 * Williams", "jacob.williams" and "jacobwilliams3" all match (and, in a backlog cell, "Williams,
 * Jacob"), but a different
 * person whose name merely contains or is contained in the developer's ("Jacob", "Will", "Jacob
 * Williamson") does not. Crediting a teammate's work to the developer is an invented fact, so this
 * errs toward a miss: pass an alias for a spelling it doesn't catch.
 */

import type { Developer } from "./types.js";

export interface Identity {
	name?: string;
	email?: string;
}

const compact = (s: string): string =>
	s.normalize("NFD").toLowerCase().replace(/[^a-z]/g, "");

/** The developer's name, username and aliases, compacted. */
function developerKeys(developer: Developer): Set<string> {
	return new Set(
		[developer.name, developer.username, ...(developer.aliases ?? [])]
			.filter((n): n is string => !!n)
			.map(compact)
			.filter(Boolean)
	);
}

export function matchesDeveloper(who: Identity, developer: Developer): boolean {
	const email = developer.email?.trim().toLowerCase();
	if (email && who.email?.trim().toLowerCase() === email) return true;
	return !!who.name && developerKeys(developer).has(compact(who.name));
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
