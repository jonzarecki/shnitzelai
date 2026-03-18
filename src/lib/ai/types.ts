import type { RecentPrompt, RecentTopic } from "@/lib/db/queries";
import type { CuratedPick, ImageOptions, SchnitzelContent } from "@/types";

export interface TextProvider {
	readonly providerId: string;
	readonly modelId: string;
	generateSchnitzelContent(
		headline: string,
		summary: string,
	): Promise<SchnitzelContent>;
	curate(
		headlines: { headline: string; source: string }[],
		recentTopics: RecentTopic[],
	): Promise<CuratedPick>;
	craftImagePrompt(
		theme: string,
		tagline: string,
		recentPrompts: RecentPrompt[],
	): Promise<{ prompt: string; essence: string }>;
}

export interface ImageProvider {
	readonly providerId: string;
	readonly modelId: string;
	generateImage(prompt: string, options?: ImageOptions): Promise<Buffer>;
}

export interface TextModelDef {
	providerId: string;
	modelId: string;
	label: string;
}

export interface ImageModelDef {
	providerId: string;
	modelId: string;
	label: string;
	supportsQuality: boolean;
}
