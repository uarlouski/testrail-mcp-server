import { describe, test, expect } from '@jest/globals';
import { TESTRAIL_MAX_PAGE_LIMIT, TestRailUrl } from '../../src/utils/testrail_url.js';

describe('TestRailUrl', () => {
    test('reads limit and offset with URLSearchParams', () => {
        const url = TestRailUrl.parse('/api/v2/get_projects&limit=0&offset=0');

        expect(url.get('limit')).toBe('0');
        expect(url.get('missing')).toBeNull();
        expect(url.offset()).toBe(0);
        expect(TestRailUrl.parse('/index.php?/api/v2/get_cases/1&offset=250').offset()).toBe(250);
    });

    test('withValidPageLimit appends the max page size when limit is omitted', () => {
        const url = TestRailUrl.parse('/index.php?/api/v2/get_cases/1&type_id=1&priority_id=2');

        expect(url.withValidPageLimit().toString()).toBe(
            `/index.php?/api/v2/get_cases/1&type_id=1&priority_id=2&limit=${TESTRAIL_MAX_PAGE_LIMIT}`
        );
    });

    test('withValidPageLimit keeps an explicit positive limit and its encoding', () => {
        const raw = '/index.php?/api/v2/get_cases/1&status_id=1,5&refs=a%20b&limit=100';

        expect(TestRailUrl.parse(raw).withValidPageLimit().toString()).toBe(raw);
    });

    test('withValidPageLimit rewrites limit=0 without re-encoding the other parameters', () => {
        const url = TestRailUrl.parse('/api/v2/get_cases/1&limit=0&offset=250&refs=a%20b');

        expect(url.withValidPageLimit().toString()).toBe(
            '/index.php?/api/v2/get_cases/1&limit=250&offset=250&refs=a%20b'
        );
    });

    test('follow skips a limit=0 link that stays on the same offset', () => {
        const page = TestRailUrl.parse('/index.php?/api/v2/get_projects&limit=250');

        expect(page.follow('/api/v2/get_projects&limit=0&offset=0', 0, 0)).toBeNull();
    });

    test('follow rewrites a limit=0 link that advances offset', () => {
        const page = TestRailUrl.parse('/index.php?/api/v2/get_cases/1&limit=250');
        const next = page.follow('/api/v2/get_cases/1&limit=0&offset=250', 0, 250);

        expect(next?.toString()).toBe('/index.php?/api/v2/get_cases/1&limit=250&offset=250');
    });

    test('follow stops on a short page even when the next link advances', () => {
        const page = TestRailUrl.parse('/index.php?/api/v2/get_results/2&limit=250');

        expect(page.follow('/api/v2/get_results/2&limit=250&offset=250', 250, 1)).toBeNull();
    });

    test('follow returns null when the next link is missing', () => {
        const page = TestRailUrl.parse('/index.php?/api/v2/get_cases/1&limit=250');

        expect(page.follow('')).toBeNull();
    });
});
