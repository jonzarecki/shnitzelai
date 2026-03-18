import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveGoogleNewsUrl } from "../fetcher";

describe("resolveGoogleNewsUrl", () => {
	const originalFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("returns original URL for non-Google-News URLs", async () => {
		const url = "https://www.maariv.co.il/news/123";
		const result = await resolveGoogleNewsUrl(url);
		expect(result).toBe(url);
	});

	it("returns original URL for empty string", async () => {
		const result = await resolveGoogleNewsUrl("");
		expect(result).toBe("");
	});

	it("falls back to original URL on fetch error", async () => {
		const googleUrl = "https://news.google.com/rss/articles/CBMi789";

		globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

		const result = await resolveGoogleNewsUrl(googleUrl);
		expect(result).toBe(googleUrl);
	});

	it("falls back when HTML has no decoding params", async () => {
		const googleUrl = "https://news.google.com/rss/articles/CBMi000";

		globalThis.fetch = vi.fn().mockResolvedValue({
			text: () =>
				Promise.resolve("<html><body>no params here</body></html>"),
		});

		const result = await resolveGoogleNewsUrl(googleUrl);
		expect(result).toBe(googleUrl);
	});

	it("returns original URL for non-articles path", async () => {
		const url = "https://news.google.com/topics/something";
		const result = await resolveGoogleNewsUrl(url);
		expect(result).toBe(url);
	});
});
