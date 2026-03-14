import { describe, it, expect } from "vitest";
import { parseRssXml } from "../fetcher";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google News</title>
    <item>
      <title>Trump announces new tariffs on European imports</title>
      <link>https://news.google.com/articles/1</link>
      <description>The president announced sweeping tariffs</description>
      <source>Reuters</source>
      <pubDate>Thu, 13 Mar 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Tech stocks rally after AI breakthrough</title>
      <link>https://news.google.com/articles/2</link>
      <description>Markets surge on optimism</description>
      <source>Bloomberg</source>
      <pubDate>Thu, 13 Mar 2026 09:00:00 GMT</pubDate>
    </item>
    <item>
      <title>שניצל חדש התגלה באנטארקטיקה</title>
      <link>https://news.google.com/articles/3</link>
      <description>מדענים מופתעים</description>
      <source>Ynet</source>
      <pubDate>Thu, 13 Mar 2026 08:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const SINGLE_ITEM_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Single item headline</title>
      <link>https://example.com</link>
    </item>
  </channel>
</rss>`;

const EMPTY_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Empty Feed</title>
  </channel>
</rss>`;

describe("parseRssXml", () => {
	it("parses multiple items from RSS feed", () => {
		const items = parseRssXml(SAMPLE_RSS);
		expect(items).toHaveLength(3);
		expect(items[0].title).toBe("Trump announces new tariffs on European imports");
		expect(items[0].source).toBe("Reuters");
		expect(items[0].link).toContain("news.google.com");
	});

	it("handles Hebrew content", () => {
		const items = parseRssXml(SAMPLE_RSS);
		expect(items[2].title).toBe("שניצל חדש התגלה באנטארקטיקה");
		expect(items[2].source).toBe("Ynet");
	});

	it("handles single item (not array)", () => {
		const items = parseRssXml(SINGLE_ITEM_RSS);
		expect(items).toHaveLength(1);
		expect(items[0].title).toBe("Single item headline");
	});

	it("returns empty array for feed with no items", () => {
		const items = parseRssXml(EMPTY_RSS);
		expect(items).toHaveLength(0);
	});

	it("fills missing fields with defaults", () => {
		const items = parseRssXml(SINGLE_ITEM_RSS);
		expect(items[0].description).toBe("");
		expect(items[0].source).toBe("Google News");
	});
});
