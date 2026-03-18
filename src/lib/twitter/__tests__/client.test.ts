import { describe, expect, it } from "vitest";
import { composeTweetText } from "../client";

describe("composeTweetText", () => {
	it("composes tweet with tagline, URL, and hashtag", () => {
		const text = composeTweetText(
			"טראמפ הכריז שהביסו את איראן",
			"https://www.maariv.co.il/news/123",
		);

		expect(text).toBe(
			"טראמפ הכריז שהביסו את איראן\n\nhttps://www.maariv.co.il/news/123\n\n#ShnitzelAI",
		);
	});

	it("handles empty URL gracefully", () => {
		const text = composeTweetText("שניצל של היום", "");

		expect(text).toBe("שניצל של היום\n\n#ShnitzelAI");
	});

	it("includes the #ShnitzelAI hashtag", () => {
		const text = composeTweetText("כותרת", "https://example.com");
		expect(text).toContain("#ShnitzelAI");
	});

	it("stays within Twitter's 280 character limit for reasonable inputs", () => {
		const text = composeTweetText(
			"כותרת קצרה בעברית",
			"https://www.ynet.co.il/article/12345",
		);
		expect(text.length).toBeLessThanOrEqual(280);
	});
});
