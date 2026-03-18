import { getNewsItemByHeadline } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import type { NewsInput } from "@/types";
import { XMLParser } from "fast-xml-parser";
import type { RssItem } from "./types";

const GOOGLE_NEWS_RSS = "https://news.google.com/rss?hl=he&gl=IL&ceid=IL:he";
const URL_RESOLVE_TIMEOUT_MS = 5_000;

interface RssXmlItem {
	title?: string;
	link?: string;
	description?: string;
	source?: string | { "#text"?: string };
	pubDate?: string;
}

interface RssXmlFeed {
	rss?: {
		channel?: {
			item?: RssXmlItem | RssXmlItem[];
		};
	};
}

function parseSource(source: RssXmlItem["source"]): string {
	if (!source) return "Google News";
	if (typeof source === "string") return source;
	return source["#text"] ?? "Google News";
}

export function parseRssXml(xml: string): RssItem[] {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: "@_",
	});

	const feed = parser.parse(xml) as RssXmlFeed;
	const rawItems = feed?.rss?.channel?.item;

	if (!rawItems) return [];

	const items = Array.isArray(rawItems) ? rawItems : [rawItems];

	return items
		.filter((item): item is RssXmlItem & { title: string } =>
			Boolean(item.title),
		)
		.map((item) => ({
			title: item.title,
			link: item.link ?? "",
			description: item.description ?? "",
			source: parseSource(item.source),
			pubDate: item.pubDate ?? "",
		}));
}

/**
 * Extract the base64 article ID from a Google News RSS URL.
 * e.g. "https://news.google.com/rss/articles/CBMiR0FV...?oc=5" → "CBMiR0FV..."
 */
function extractArticleId(googleUrl: string): string | null {
	try {
		const url = new URL(googleUrl);
		const segments = url.pathname.split("/");
		const articlesIdx = segments.indexOf("articles");
		if (articlesIdx >= 0 && articlesIdx + 1 < segments.length) {
			return segments[articlesIdx + 1];
		}
	} catch {
		// invalid URL
	}
	return null;
}

/**
 * Step 1: Fetch the Google News article page and extract the signature + timestamp
 * from the HTML attributes (data-n-a-sg, data-n-a-ts).
 * Based on https://github.com/SSujitX/google-news-url-decoder (MIT)
 */
async function getDecodingParams(
	base64Str: string,
): Promise<{ signature: string; timestamp: string } | null> {
	const urls = [
		`https://news.google.com/articles/${base64Str}`,
		`https://news.google.com/rss/articles/${base64Str}`,
	];

	for (const pageUrl of urls) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				URL_RESOLVE_TIMEOUT_MS,
			);

			const res = await fetch(pageUrl, {
				signal: controller.signal,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
				},
			});
			clearTimeout(timeout);

			const html = await res.text();

			const sigMatch = html.match(/data-n-a-sg="([^"]+)"/);
			const tsMatch = html.match(/data-n-a-ts="([^"]+)"/);

			if (sigMatch?.[1] && tsMatch?.[1]) {
				return { signature: sigMatch[1], timestamp: tsMatch[1] };
			}
		} catch {
			continue;
		}
	}
	return null;
}

/**
 * Step 2: Use the signature + timestamp to decode via batchexecute.
 */
async function decodeWithBatchExecute(
	base64Str: string,
	signature: string,
	timestamp: string,
): Promise<string | null> {
	const innerPayload = `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${base64Str}",${timestamp},"${signature}"]`;
	const payload = JSON.stringify([
		[["Fbv4je", innerPayload, null, "generic"]],
	]);

	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		URL_RESOLVE_TIMEOUT_MS,
	);

	try {
		const res = await fetch(
			"https://news.google.com/_/DotsSplashUi/data/batchexecute",
			{
				method: "POST",
				headers: {
					"Content-Type":
						"application/x-www-form-urlencoded;charset=UTF-8",
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
				},
				body: `f.req=${encodeURIComponent(payload)}`,
				signal: controller.signal,
			},
		);
		clearTimeout(timeout);

		const text = await res.text();
		const lines = text.split("\n\n");
		if (lines.length < 2) return null;

		const parsed = JSON.parse(lines[1]);
		const innerData = JSON.parse(parsed[0][2]);
		return innerData[1] as string;
	} catch {
		return null;
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * Resolve a Google News URL to the original article URL.
 * Two-step process: fetch signature/timestamp from article page, then decode via batchexecute.
 * Falls back to the original URL on any failure.
 */
export async function resolveGoogleNewsUrl(
	googleUrl: string,
): Promise<string> {
	if (!googleUrl || !googleUrl.includes("news.google.com")) {
		return googleUrl;
	}

	const articleId = extractArticleId(googleUrl);
	if (!articleId) return googleUrl;

	const params = await getDecodingParams(articleId);
	if (!params) return googleUrl;

	const decoded = await decodeWithBatchExecute(
		articleId,
		params.signature,
		params.timestamp,
	);
	return decoded || googleUrl;
}

/** Fetch ALL headlines from Google News RSS. No filtering, no dedup -- the curator needs the full picture. */
export async function fetchRssHeadlines(): Promise<NewsInput[]> {
	logger.info("[RSS] Fetching Google News RSS");

	const response = await fetch(GOOGLE_NEWS_RSS);
	if (!response.ok) {
		throw new Error(
			`RSS fetch failed: ${response.status} ${response.statusText}`,
		);
	}

	const xml = await response.text();
	const items = parseRssXml(xml);

	logger.info(`[RSS] Parsed ${items.length} items from feed`);

	const results = await Promise.allSettled(
		items.map((item) => resolveGoogleNewsUrl(item.link)),
	);

	const resolvedUrls = results.map((r, i) =>
		r.status === "fulfilled" ? r.value : items[i].link,
	);

	const resolvedCount = results.filter(
		(r, i) => r.status === "fulfilled" && r.value !== items[i].link,
	).length;
	logger.info(
		`[RSS] Resolved ${resolvedCount}/${items.length} Google News URLs to originals`,
	);

	return items.map((item, i) => ({
		headline: item.title,
		summary: item.description,
		source: item.source,
		url: resolvedUrls[i],
		category: "general",
	}));
}
