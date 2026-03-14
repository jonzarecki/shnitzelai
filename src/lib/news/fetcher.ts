import { XMLParser } from "fast-xml-parser";
import type { NewsInput } from "@/types";
import { getNewsItemByHeadline } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import type { RssItem } from "./types";

const GOOGLE_NEWS_RSS = "https://news.google.com/rss?hl=he&gl=IL&ceid=IL:he";

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
		.filter((item): item is RssXmlItem & { title: string } => Boolean(item.title))
		.map((item) => ({
			title: item.title,
			link: item.link ?? "",
			description: item.description ?? "",
			source: parseSource(item.source),
			pubDate: item.pubDate ?? "",
		}));
}

/** Fetch ALL headlines from Google News RSS. No filtering, no dedup -- the curator needs the full picture. */
export async function fetchRssHeadlines(): Promise<NewsInput[]> {
	logger.info("[RSS] Fetching Google News RSS");

	const response = await fetch(GOOGLE_NEWS_RSS);
	if (!response.ok) {
		throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);
	}

	const xml = await response.text();
	const items = parseRssXml(xml);

	logger.info(`[RSS] Parsed ${items.length} items from feed`);

	return items.map((item) => ({
		headline: item.title,
		summary: item.description,
		source: item.source,
		url: item.link,
		category: "general",
	}));
}
