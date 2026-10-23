const API_INDEX = "/index.php?";

/** TestRail rejects `limit` below 1 and caps a page at 250. */
export const TESTRAIL_MAX_PAGE_LIMIT = 250;

/**
 * TestRail list URL.
 *
 * The route sits after `?` and parameters follow with `&`
 * (`/index.php?/api/v2/get_cases/1&suite_id=5&limit=250`). `_links.next`
 * omits the `/index.php?` prefix. Parameter values are read with `URLSearchParams`.
 * Other parameters are left as TestRail sent them, so rewriting `limit` does
 * not re-encode the rest of the link.
 *
 * Workaround for https://github.com/uarlouski/testrail-mcp-server/issues/139:
 * some self-hosted instances answer a list call with `limit=0` and a next
 * link that repeats it. Requesting that link fails with 400 "Field :limit is
 * too small (minimum 1)". `withValidPageLimit` sends 250 when `limit` is
 * missing or below 1. `follow` skips a next link that does not advance `offset`.
 */
export class TestRailUrl {
    private constructor(
        private readonly raw: string,
        private readonly params: URLSearchParams,
    ) {}

    static parse(url: string): TestRailUrl {
        const queryAt = url.indexOf("&");
        const query = queryAt === -1 ? "" : url.slice(queryAt + 1);
        return new TestRailUrl(url, new URLSearchParams(query));
    }

    get(name: string): string | null {
        return this.params.has(name) ? this.params.get(name) : null;
    }

    offset(): number {
        return readNonNegativeInt(this.get("offset")) ?? 0;
    }

    /**
     * Returns this URL with a `limit` TestRail will accept.
     * An explicit limit of 1 or more is kept.
     */
    withValidPageLimit(limit: number = TESTRAIL_MAX_PAGE_LIMIT): TestRailUrl {
        const current = readNonNegativeInt(this.get("limit"));
        if (current !== null && current >= 1) {
            return this;
        }
        return TestRailUrl.parse(this.writeLimit(limit));
    }

    /** Request path, prefixing `/index.php?` onto a `_links.next` value. */
    toString(): string {
        if (this.raw.startsWith(API_INDEX) || this.raw.includes("://")) {
            return this.raw;
        }
        return `${API_INDEX}${this.raw}`;
    }

    /**
     * Next page to request, or `null` when there is no next link, this page is
     * already shorter than its limit, or `offset` does not move forward.
     */
    follow(nextLink: string, reportedLimit?: unknown, reportedSize?: unknown): TestRailUrl | null {
        if (!nextLink || isLastPage(reportedLimit, reportedSize)) {
            return null;
        }

        const next = TestRailUrl.parse(nextLink).withValidPageLimit();
        if (next.offset() <= this.offset() || next.toString() === this.toString()) {
            return null;
        }
        return next;
    }

    private writeLimit(limit: number): string {
        if (!this.params.has("limit")) {
            return `${this.raw}&limit=${limit}`;
        }

        const queryAt = this.raw.indexOf("&");
        if (queryAt === -1) {
            return `${this.raw}&limit=${limit}`;
        }

        const route = this.raw.slice(0, queryAt);
        const parts = this.raw.slice(queryAt + 1).split("&").map((part) => {
            const eq = part.indexOf("=");
            const key = eq === -1 ? part : part.slice(0, eq);
            return key === "limit" ? `limit=${limit}` : part;
        });
        return `${route}&${parts.join("&")}`;
    }
}

function isLastPage(reportedLimit: unknown, reportedSize: unknown): boolean {
    const limit = readNonNegativeInt(reportedLimit);
    const size = readNonNegativeInt(reportedSize);
    return limit !== null && size !== null && limit >= 1 && size > 0 && size < limit;
}

function readNonNegativeInt(value: unknown): number | null {
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
        return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value)) {
        return Number(value);
    }
    return null;
}
