import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, setDb } from "../index";
import {
	getGenerationById,
	getGenerationCount,
	getGenerations,
	getNewsItemByHeadline,
	getNewsItemById,
	insertGeneration,
	insertNewsItem,
	updateTweetId,
} from "../queries";

beforeEach(() => {
	const testDb = new Database(":memory:");
	setDb(testDb);
});

afterEach(() => {
	closeDb();
});

describe("insertNewsItem", () => {
	it("inserts and returns a news item with generated id", () => {
		const item = insertNewsItem({
			original_headline: "Trump announces tariffs",
			original_summary: "New tariffs on European imports",
			original_source: "Reuters",
			original_url: "https://reuters.com/article/123",
			category: "politics",
		});

		expect(item.id).toBeDefined();
		expect(item.id.length).toBe(26);
		expect(item.original_headline).toBe("Trump announces tariffs");
		expect(item.created_at).toBeDefined();
	});
});

describe("insertGeneration", () => {
	it("inserts and returns a generation linked to a news item", () => {
		const newsItem = insertNewsItem({
			original_headline: "Test headline",
			original_summary: "Test summary",
			original_source: "Test",
			original_url: "https://test.com",
			category: "general",
		});

		const gen = insertGeneration({
			news_item_id: newsItem.id,
			image_path: "/generated/test.png",
			schnitzel_headline: "שניצל טסט",
			caption: "קפשן טסט",
			prompt_used: "A schnitzel doing test things",
			text_provider: "openai",
			text_model: "gpt-4.1-mini",
			image_provider: "openai",
			image_model: "gpt-image-1.5",
			image_quality: "medium",
		});

		expect(gen.id).toBeDefined();
		expect(gen.news_item_id).toBe(newsItem.id);
		expect(gen.schnitzel_headline).toBe("שניצל טסט");
	});
});

describe("getGenerations", () => {
	it("returns generations with joined news item data, newest first", () => {
		const item1 = insertNewsItem({
			original_headline: "First headline",
			original_summary: "First summary",
			original_source: "Source1",
			original_url: "https://test.com/1",
			category: "politics",
		});

		const item2 = insertNewsItem({
			original_headline: "Second headline",
			original_summary: "Second summary",
			original_source: "Source2",
			original_url: "https://test.com/2",
			category: "tech",
		});

		insertGeneration({
			news_item_id: item1.id,
			image_path: "/generated/1.png",
			schnitzel_headline: "שניצל ראשון",
			caption: "",
			prompt_used: "prompt1",
			text_provider: "openai",
			text_model: "gpt-4.1-mini",
			image_provider: "openai",
			image_model: "gpt-image-1.5",
			image_quality: "medium",
		});

		insertGeneration({
			news_item_id: item2.id,
			image_path: "/generated/2.png",
			schnitzel_headline: "שניצל שני",
			caption: "",
			prompt_used: "prompt2",
			text_provider: "openai",
			text_model: "gpt-4.1-mini",
			image_provider: "bfl",
			image_model: "flux-pro-1.1",
			image_quality: "medium",
		});

		const results = getGenerations(1, 20);
		expect(results).toHaveLength(2);
		expect(results[0].schnitzel_headline).toBe("שניצל שני");
		expect(results[0].original_headline).toBe("Second headline");
		expect(results[1].original_headline).toBe("First headline");
	});

	it("supports pagination", () => {
		const item = insertNewsItem({
			original_headline: "Paginated headline",
			original_summary: "",
			original_source: "",
			original_url: "",
			category: "general",
		});

		for (let i = 0; i < 5; i++) {
			insertGeneration({
				news_item_id: item.id,
				image_path: `/generated/${i}.png`,
				schnitzel_headline: `שניצל ${i}`,
				caption: "",
				prompt_used: `prompt${i}`,
				text_provider: "openai",
				text_model: "gpt-4.1-mini",
				image_provider: "openai",
				image_model: "gpt-image-1.5",
				image_quality: "medium",
			});
		}

		const page1 = getGenerations(1, 2);
		expect(page1).toHaveLength(2);

		const page2 = getGenerations(2, 2);
		expect(page2).toHaveLength(2);

		const page3 = getGenerations(3, 2);
		expect(page3).toHaveLength(1);
	});
});

describe("getGenerationCount", () => {
	it("returns correct count", () => {
		expect(getGenerationCount()).toBe(0);

		const item = insertNewsItem({
			original_headline: "Count test",
			original_summary: "",
			original_source: "",
			original_url: "",
			category: "general",
		});

		insertGeneration({
			news_item_id: item.id,
			image_path: "/generated/count.png",
			schnitzel_headline: "שניצל ספירה",
			caption: "",
			prompt_used: "prompt",
			text_provider: "openai",
			text_model: "gpt-4.1-mini",
			image_provider: "openai",
			image_model: "gpt-image-1.5",
			image_quality: "medium",
		});

		expect(getGenerationCount()).toBe(1);
	});
});

describe("getNewsItemById", () => {
	it("returns the item when found", () => {
		const item = insertNewsItem({
			original_headline: "Find me",
			original_summary: "I am here",
			original_source: "Test",
			original_url: "https://test.com",
			category: "world",
		});

		const found = getNewsItemById(item.id);
		expect(found).toBeDefined();
		expect(found?.original_headline).toBe("Find me");
	});

	it("returns undefined for missing id", () => {
		expect(getNewsItemById("nonexistent")).toBeUndefined();
	});
});

describe("getNewsItemByHeadline", () => {
	it("returns the item when found by headline", () => {
		insertNewsItem({
			original_headline: "Unique headline for search",
			original_summary: "",
			original_source: "",
			original_url: "",
			category: "general",
		});

		const found = getNewsItemByHeadline("Unique headline for search");
		expect(found).toBeDefined();
		expect(found?.original_headline).toBe("Unique headline for search");
	});

	it("returns undefined for missing headline", () => {
		expect(getNewsItemByHeadline("does not exist")).toBeUndefined();
	});
});

describe("getGenerationById", () => {
	it("returns generation with news item data", () => {
		const newsItem = insertNewsItem({
			original_headline: "Test headline",
			original_summary: "Test summary",
			original_source: "Reuters",
			original_url: "https://reuters.com/123",
			category: "politics",
		});

		const gen = insertGeneration({
			news_item_id: newsItem.id,
			image_path: "/generated/test.png",
			schnitzel_headline: "שניצל טסט",
			caption: "",
			prompt_used: "test prompt",
			text_provider: "openai",
			text_model: "gpt-4.1-mini",
			image_provider: "openai",
			image_model: "gpt-image-1.5",
			image_quality: "medium",
		});

		const found = getGenerationById(gen.id);
		expect(found).toBeDefined();
		expect(found?.schnitzel_headline).toBe("שניצל טסט");
		expect(found?.original_headline).toBe("Test headline");
		expect(found?.original_url).toBe("https://reuters.com/123");
	});

	it("returns undefined for missing id", () => {
		expect(getGenerationById("nonexistent")).toBeUndefined();
	});
});

describe("updateTweetId", () => {
	it("sets tweet_id on an existing generation", () => {
		const newsItem = insertNewsItem({
			original_headline: "Tweet test",
			original_summary: "",
			original_source: "",
			original_url: "",
			category: "general",
		});

		const gen = insertGeneration({
			news_item_id: newsItem.id,
			image_path: "/generated/tweet.png",
			schnitzel_headline: "שניצל ציוץ",
			caption: "",
			prompt_used: "tweet prompt",
			text_provider: "openai",
			text_model: "gpt-4.1-mini",
			image_provider: "openai",
			image_model: "gpt-image-1.5",
			image_quality: "medium",
		});

		expect(getGenerationById(gen.id)?.tweet_id).toBeNull();

		updateTweetId(gen.id, "1234567890");

		const updated = getGenerationById(gen.id);
		expect(updated?.tweet_id).toBe("1234567890");
	});
});
