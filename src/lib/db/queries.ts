import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();
import type {
	Generation,
	GenerationWithNewsItem,
	NewsItem,
} from "@/types";
import { getDb } from "./index";

export function insertNewsItem(item: Omit<NewsItem, "id" | "created_at">): NewsItem {
	const db = getDb();
	const id = ulid();
	const created_at = new Date().toISOString();

	db.prepare(`
    INSERT INTO news_items (id, original_headline, original_summary, original_source, original_url, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, item.original_headline, item.original_summary, item.original_source, item.original_url, item.category, created_at);

	return { id, ...item, created_at };
}

export function insertGeneration(gen: Omit<Generation, "id" | "created_at">): Generation {
	const db = getDb();
	const id = ulid();
	const created_at = new Date().toISOString();

	db.prepare(`
    INSERT INTO generations (id, news_item_id, image_path, schnitzel_headline, caption, prompt_used, text_provider, text_model, image_provider, image_model, image_quality, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
		id,
		gen.news_item_id,
		gen.image_path,
		gen.schnitzel_headline,
		gen.caption,
		gen.prompt_used,
		gen.text_provider,
		gen.text_model,
		gen.image_provider,
		gen.image_model,
		gen.image_quality,
		created_at,
	);

	return { id, ...gen, created_at };
}

export function getGenerations(
	page = 1,
	limit = 20,
): GenerationWithNewsItem[] {
	const db = getDb();
	const offset = (page - 1) * limit;

	return db.prepare(`
    SELECT
      g.*,
      n.original_headline,
      n.original_summary,
      n.original_source,
      n.original_url,
      n.category,
      n.created_at AS news_created_at
    FROM generations g
    JOIN news_items n ON g.news_item_id = n.id
    ORDER BY g.id DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset) as GenerationWithNewsItem[];
}

export function getGenerationCount(): number {
	const db = getDb();
	const row = db.prepare("SELECT COUNT(*) AS count FROM generations").get() as { count: number };
	return row.count;
}

export function getNewsItemById(id: string): NewsItem | undefined {
	const db = getDb();
	return db.prepare("SELECT * FROM news_items WHERE id = ?").get(id) as NewsItem | undefined;
}

export function getNewsItemByHeadline(headline: string): NewsItem | undefined {
	const db = getDb();
	return db.prepare("SELECT * FROM news_items WHERE original_headline = ?").get(headline) as NewsItem | undefined;
}

export interface RecentTopic {
	schnitzel_headline: string;
	original_headline: string;
	created_at: string;
}

export function getRecentTopics(days = 7): RecentTopic[] {
	const db = getDb();
	const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

	return db.prepare(`
    SELECT
      g.schnitzel_headline,
      n.original_headline,
      g.created_at
    FROM generations g
    JOIN news_items n ON g.news_item_id = n.id
    WHERE g.created_at > ?
    ORDER BY g.created_at DESC
  `).all(cutoff) as RecentTopic[];
}
