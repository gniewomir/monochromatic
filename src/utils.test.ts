import { describe, expect, test } from "vitest";
import { normalizeDomain, normalizeDomainList, shouldApplyToHost } from "./utils";

describe("normalizeDomain", () => {
    test("extracts hostname from a full URL", () => {
        expect(normalizeDomain("https://www.youtube.com/watch?v=123")).toBe("www.youtube.com");
    });

    test("treats a bare hostname as a domain", () => {
        expect(normalizeDomain("reddit.com")).toBe("reddit.com");
    });

    test("lowercases the result", () => {
        expect(normalizeDomain("Reddit.COM")).toBe("reddit.com");
    });

    test("trims surrounding whitespace", () => {
        expect(normalizeDomain("  twitter.com  ")).toBe("twitter.com");
    });

    test("returns empty string for non-string input", () => {
        expect(normalizeDomain(42)).toBe("");
        expect(normalizeDomain(null)).toBe("");
        expect(normalizeDomain(undefined)).toBe("");
        expect(normalizeDomain({})).toBe("");
    });

    test("returns empty string for blank or empty strings", () => {
        expect(normalizeDomain("")).toBe("");
        expect(normalizeDomain("   ")).toBe("");
    });

    test("rejects unsupported protocols", () => {
        expect(normalizeDomain("ftp://files.example.com")).toBe("");
        expect(normalizeDomain("chrome://extensions")).toBe("");
    });

    test("accepts http: protocol", () => {
        expect(normalizeDomain("http://example.com")).toBe("example.com");
    });

    test("accepts https: protocol", () => {
        expect(normalizeDomain("https://example.com")).toBe("example.com");
    });
});

describe("normalizeDomainList", () => {
    test("normalizes an array of mixed inputs", () => {
        expect(normalizeDomainList(["Reddit.COM", "https://youtube.com", 42])).toEqual([
            "reddit.com",
            "youtube.com",
        ]);
    });

    test("deduplicates domains", () => {
        expect(normalizeDomainList(["reddit.com", "REDDIT.COM", "https://reddit.com"])).toEqual([
            "reddit.com",
        ]);
    });

    test("returns empty array for non-array input", () => {
        expect(normalizeDomainList("reddit.com")).toEqual([]);
        expect(normalizeDomainList(null)).toEqual([]);
        expect(normalizeDomainList(123)).toEqual([]);
    });

    test("filters out invalid entries", () => {
        expect(normalizeDomainList(["", "   ", "chrome://newtab", "valid.com"])).toEqual([
            "valid.com",
        ]);
    });
});

describe("shouldApplyToHost", () => {
    test("matches an exact domain", () => {
        expect(shouldApplyToHost("youtube.com", ["youtube.com"])).toBe(true);
    });

    test("matches a subdomain against a parent domain", () => {
        expect(shouldApplyToHost("www.youtube.com", ["youtube.com"])).toBe(true);
        expect(shouldApplyToHost("m.youtube.com", ["youtube.com"])).toBe(true);
    });

    test("does not match a parent against a subdomain entry", () => {
        expect(shouldApplyToHost("youtube.com", ["www.youtube.com"])).toBe(false);
    });

    test("does not match unrelated domains", () => {
        expect(shouldApplyToHost("reddit.com", ["youtube.com"])).toBe(false);
    });

    test("does not false-positive on suffix overlap", () => {
        expect(shouldApplyToHost("notyoutube.com", ["youtube.com"])).toBe(false);
    });

    test("returns false for empty hostname", () => {
        expect(shouldApplyToHost("", ["youtube.com"])).toBe(false);
    });

    test("returns false for empty domain list", () => {
        expect(shouldApplyToHost("youtube.com", [])).toBe(false);
    });
});
