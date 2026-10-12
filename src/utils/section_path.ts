import { TestRailClient } from "../client/testrail.js";
import { Section } from "../tools/sections/types.js";

export const SECTION_PATH_SEPARATOR = " > ";
export const MAX_SECTION_DEPTH = 50;

export type SectionLookup = (sectionId: number) => Promise<Section | null>;

/**
 * Creates a memoized section lookup. Sections passed in `preloaded` (e.g. from a single
 * `getSections` call) are served from memory; anything missing is fetched lazily via
 * `client.getSection`. Failed lookups resolve to `null`.
 */
export function createSectionLookup(client: TestRailClient, preloaded: Section[] = []): SectionLookup {
    const cache = new Map<number, Section>();
    for (const section of preloaded) {
        cache.set(section.id, section);
    }

    return async (sectionId: number) => {
        const cached = cache.get(sectionId);
        if (cached) {
            return cached;
        }
        const section = await client.getSection(sectionId).catch(() => null);
        if (section) {
            cache.set(sectionId, section);
        }
        return section ?? null;
    };
}

/**
 * Resolves the section hierarchy from root to leaf by walking `parent_id`.
 *
 * - Returns `[]` if the leaf section itself cannot be resolved (or has no name).
 * - Falls back to `[leafName]` if any ancestor cannot be resolved, a cycle is detected,
 *   or the hierarchy exceeds `MAX_SECTION_DEPTH`.
 */
export async function resolveSectionPath(sectionId: number, lookup: SectionLookup): Promise<string[]> {
    const leaf = await lookup(sectionId);
    if (!leaf?.name) {
        return [];
    }

    const names = [leaf.name];
    const visited = new Set<number>([sectionId]);
    let parentId = leaf.parent_id;

    while (parentId !== null && parentId !== undefined) {
        if (visited.has(parentId) || names.length >= MAX_SECTION_DEPTH) {
            return [leaf.name];
        }
        visited.add(parentId);

        const parent = await lookup(parentId);
        if (!parent?.name) {
            return [leaf.name];
        }

        names.unshift(parent.name);
        parentId = parent.parent_id;
    }

    return names;
}

/**
 * Formats a section path for Markdown output. Literal `>` characters inside section names
 * are escaped as `\>` so they cannot be confused with the path separator.
 */
export function formatSectionPath(names: string[]): string {
    return names.map(name => name.replace(/>/g, "\\>")).join(SECTION_PATH_SEPARATOR);
}
