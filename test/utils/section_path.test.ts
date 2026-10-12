import { jest, describe, test, expect } from '@jest/globals';
import { TestRailClient } from '../../src/client/testrail.js';
import { Section } from '../../src/tools/sections/types.js';
import {
    createSectionLookup,
    formatSectionPath,
    MAX_SECTION_DEPTH,
    resolveSectionPath,
    SectionLookup,
} from '../../src/utils/section_path.js';

const section = (id: number, name: string, parent_id: number | null): Section => ({ id, name, parent_id, suite_id: 1 });

const lookupFrom = (sections: Section[]): SectionLookup => {
    const map = new Map(sections.map(s => [s.id, s]));
    return async (id: number) => map.get(id) ?? null;
};

describe('section_path utils', () => {
    describe('createSectionLookup', () => {
        test('serves preloaded sections without calling getSection', async () => {
            const getSection = jest.fn<(id: number) => Promise<Section>>();
            const client = { getSection } as unknown as TestRailClient;
            const lookup = createSectionLookup(client, [section(1, 'A', null)]);

            expect(await lookup(1)).toEqual(section(1, 'A', null));
            expect(getSection).not.toHaveBeenCalled();
        });

        test('fetches missing sections lazily and memoizes them', async () => {
            const getSection = jest.fn<(id: number) => Promise<Section>>().mockResolvedValue(section(2, 'B', null));
            const client = { getSection } as unknown as TestRailClient;
            const lookup = createSectionLookup(client);

            await lookup(2);
            await lookup(2);
            expect(getSection).toHaveBeenCalledTimes(1);
        });

        test('resolves to null when getSection fails', async () => {
            const getSection = jest.fn<(id: number) => Promise<Section>>().mockRejectedValue(new Error('404'));
            const client = { getSection } as unknown as TestRailClient;
            expect(await createSectionLookup(client)(99)).toBeNull();
        });
    });

    describe('resolveSectionPath', () => {
        test('returns root-to-leaf names', async () => {
            const lookup = lookupFrom([section(1, 'A', null), section(2, 'B', 1), section(3, 'C', 2)]);
            expect(await resolveSectionPath(3, lookup)).toEqual(['A', 'B', 'C']);
        });

        test('returns [] when the leaf cannot be resolved or has no name', async () => {
            expect(await resolveSectionPath(1, lookupFrom([]))).toEqual([]);
            expect(await resolveSectionPath(1, lookupFrom([section(1, '', null)]))).toEqual([]);
        });

        test('falls back to leaf when an ancestor is missing', async () => {
            const lookup = lookupFrom([section(2, 'B', 1), section(3, 'C', 2)]);
            expect(await resolveSectionPath(3, lookup)).toEqual(['C']);
        });

        test('falls back to leaf on cycles (including self-reference)', async () => {
            expect(await resolveSectionPath(1, lookupFrom([section(1, 'Self', 1)]))).toEqual(['Self']);
            const lookup = lookupFrom([section(1, 'A', 2), section(2, 'B', 1)]);
            expect(await resolveSectionPath(1, lookup)).toEqual(['A']);
        });

        test('falls back to leaf when depth exceeds MAX_SECTION_DEPTH', async () => {
            const sections: Section[] = [];
            const total = MAX_SECTION_DEPTH + 5;
            for (let i = 1; i <= total; i++) {
                sections.push(section(i, `S${i}`, i === 1 ? null : i - 1));
            }
            expect(await resolveSectionPath(total, lookupFrom(sections))).toEqual([`S${total}`]);
        });

        test('resolves a hierarchy exactly at MAX_SECTION_DEPTH', async () => {
            const sections: Section[] = [];
            for (let i = 1; i <= MAX_SECTION_DEPTH; i++) {
                sections.push(section(i, `S${i}`, i === 1 ? null : i - 1));
            }
            const result = await resolveSectionPath(MAX_SECTION_DEPTH, lookupFrom(sections));
            expect(result).toHaveLength(MAX_SECTION_DEPTH);
            expect(result[0]).toBe('S1');
        });
    });

    describe('formatSectionPath', () => {
        test('joins with " > " and escapes literal >', () => {
            expect(formatSectionPath(['A', 'B', 'C'])).toBe('A > B > C');
            expect(formatSectionPath(['x > y', 'z'])).toBe('x \\> y > z');
            expect(formatSectionPath([])).toBe('');
        });
    });
});
