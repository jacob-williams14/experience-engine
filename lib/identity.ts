/**
 * Decides whether a git author or a backlog assignee is the developer being summarized.
 *
 * Matching is exact on a compact form (letters only, lowercased), so "Jacob Williams",
 * "jacob.williams" and "jacobwilliams3" all match, but a different person whose name merely
 * contains or is contained in the developer's ("Jacob", "Will", "Jacob Williamson") does not.
 * Crediting a teammate's work to the developer is an invented fact, so this errs toward a miss:
 * pass an alias for a spelling it doesn't catch.
 */

import type { Developer } from "./types.js";

const compact = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, "");

export function matchesDeveloper(
	who: { name?: string; email?: string },
	developer: Developer
): boolean {
	const email = developer.email?.trim().toLowerCase();
	if (email && who.email?.trim().toLowerCase() === email) return true;
	if (!who.name) return false;
	const target = compact(who.name);
	if (!target) return false;
	return [developer.name, developer.username, ...(developer.aliases ?? [])].some(
		(n) => !!n && compact(n) === target
	);
}

/** Splits a backlog assignee cell ("A, B", "Name <email>") into the people it names. */
export function parseAssignees(cell: string): { name?: string; email?: string }[] {
	return cell
		.split(/[,;|\n]/)
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => {
			const m = part.match(/^(.*?)\s*<([^>]+)>$/);
			if (m) return { name: m[1] || undefined, email: m[2] };
			return part.includes("@") ? { email: part } : { name: part };
		});
}
