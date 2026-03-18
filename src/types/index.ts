export interface NewsItem {
	id: string;
	original_headline: string;
	original_summary: string;
	original_source: string;
	original_url: string;
	category: string;
	created_at: string;
}

export interface Generation {
	id: string;
	news_item_id: string;
	image_path: string;
	schnitzel_headline: string;
	caption: string;
	prompt_used: string;
	text_provider: string;
	text_model: string;
	image_provider: string;
	image_model: string;
	image_quality: string;
	tweet_id?: string;
	created_at: string;
}

export interface GenerationWithNewsItem extends Generation {
	original_headline: string;
	original_summary: string;
	original_source: string;
	original_url: string;
	category: string;
	news_created_at: string;
}

export interface SchnitzelContent {
	imagePrompt: string;
	hebrewHeadline: string;
	caption: string;
}

export interface CuratedPick {
	theme: string;
	relatedHeadlines?: number[];
	reasoning: string;
	tagline: string;
}

export interface CuratedContent extends SchnitzelContent {
	chosenHeadline: string;
	reasoning: string;
}

export interface ImageOptions {
	quality?: "low" | "medium" | "high";
}

export type TextProviderName = "openai" | "google";
export type ImageProviderName = "openai" | "bfl" | "google";

export interface NewsInput {
	headline: string;
	summary: string;
	source: string;
	url: string;
	category: string;
}
