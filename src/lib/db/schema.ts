export const CREATE_NEWS_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS news_items (
    id TEXT PRIMARY KEY,
    original_headline TEXT NOT NULL,
    original_summary TEXT NOT NULL DEFAULT '',
    original_source TEXT NOT NULL DEFAULT '',
    original_url TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'general',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const CREATE_GENERATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    news_item_id TEXT NOT NULL REFERENCES news_items(id),
    image_path TEXT NOT NULL,
    schnitzel_headline TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    prompt_used TEXT NOT NULL,
    text_provider TEXT NOT NULL,
    text_model TEXT NOT NULL,
    image_provider TEXT NOT NULL,
    image_model TEXT NOT NULL,
    image_quality TEXT NOT NULL DEFAULT 'medium',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const CREATE_GENERATIONS_NEWS_ITEM_IDX = `
  CREATE INDEX IF NOT EXISTS idx_generations_news_item_id
  ON generations(news_item_id)
`;

export const CREATE_GENERATIONS_CREATED_AT_IDX = `
  CREATE INDEX IF NOT EXISTS idx_generations_created_at
  ON generations(created_at DESC)
`;
