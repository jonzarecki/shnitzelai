import OpenAI from "openai";
import type { SchnitzelContent, CuratedPick, ImageOptions } from "@/types";
import type { RecentTopic } from "@/lib/db/queries";
import type { TextProvider, ImageProvider } from "../types";
import {
	SCHNITZEL_SYSTEM_PROMPT,
	CURATOR_SYSTEM_PROMPT,
	PROMPT_ENGINEER_SYSTEM_PROMPT,
	buildUserPrompt,
	buildCuratorPrompt,
	buildPromptEngineerInput,
} from "../prompts";
import { logger } from "@/lib/logger";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
	if (_client) return _client;
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error("OPENAI_API_KEY is required for OpenAI provider");
	}
	_client = new OpenAI({ apiKey });
	return _client;
}

export class OpenAITextProvider implements TextProvider {
	readonly providerId = "openai";
	readonly modelId: string;

	constructor(modelId = "gpt-4.1-mini") {
		this.modelId = modelId;
	}

	async generateSchnitzelContent(
		headline: string,
		summary: string,
	): Promise<SchnitzelContent> {
		const client = getClient();
		logger.info(`[OpenAI Text] Generating with ${this.modelId}`, { headline });

		const response = await client.chat.completions.create({
			model: this.modelId,
			messages: [
				{ role: "system", content: SCHNITZEL_SYSTEM_PROMPT },
				{ role: "user", content: buildUserPrompt(headline, summary) },
			],
			response_format: { type: "json_object" },
			temperature: 0.9,
		});

		const raw = response.choices[0]?.message?.content;
		if (!raw) throw new Error("OpenAI returned empty response");

		const parsed = JSON.parse(raw) as SchnitzelContent;
		if (!parsed.imagePrompt || !parsed.hebrewHeadline) {
			throw new Error(`OpenAI response missing required fields: ${raw}`);
		}

		return {
			imagePrompt: parsed.imagePrompt,
			hebrewHeadline: parsed.hebrewHeadline,
			caption: parsed.caption ?? "",
		};
	}

	async curate(
		headlines: { headline: string; source: string }[],
		recentTopics: RecentTopic[],
	): Promise<CuratedPick> {
		const client = getClient();
		logger.info(`[OpenAI Curator] Curating ${headlines.length} headlines with ${this.modelId}`, {
			recentTopics: recentTopics.length,
		});

		const response = await client.chat.completions.create({
			model: this.modelId,
			messages: [
				{ role: "system", content: CURATOR_SYSTEM_PROMPT },
				{ role: "user", content: buildCuratorPrompt(headlines, recentTopics) },
			],
			response_format: { type: "json_object" },
			temperature: 0.9,
		});

		const raw = response.choices[0]?.message?.content;
		if (!raw) throw new Error("OpenAI curator returned empty response");

		const parsed = JSON.parse(raw) as CuratedPick & { hebrewHeadline?: string; caption?: string };
		const tagline = parsed.tagline ?? parsed.hebrewHeadline ?? "";
		const theme = parsed.theme ?? "";

		if (!tagline || !theme) {
			throw new Error(`OpenAI curator response missing required fields: ${raw}`);
		}

		logger.info("[OpenAI Curator] Identified theme", {
			theme: theme.slice(0, 80),
			tagline,
		});

		return {
			theme,
			relatedHeadlines: parsed.relatedHeadlines,
			reasoning: parsed.reasoning ?? "",
			tagline,
		};
	}

	async craftImagePrompt(
		theme: string,
		tagline: string,
	): Promise<{ prompt: string; essence: string }> {
		const client = getClient();
		logger.info(`[OpenAI PromptEngineer] Crafting image prompt with ${this.modelId}`);

		const response = await client.chat.completions.create({
			model: this.modelId,
			messages: [
				{ role: "system", content: PROMPT_ENGINEER_SYSTEM_PROMPT },
				{ role: "user", content: buildPromptEngineerInput(theme, tagline) },
			],
			response_format: { type: "json_object" },
			temperature: 0.8,
		});

		const raw = response.choices[0]?.message?.content?.trim();
		if (!raw) throw new Error("OpenAI prompt engineer returned empty response");

		const parsed = JSON.parse(raw) as { prompt: string; essence: string };
		if (!parsed.prompt) throw new Error(`Prompt engineer missing 'prompt' field: ${raw}`);

		logger.info("[OpenAI PromptEngineer] Crafted prompt", { length: parsed.prompt.length });
		return { prompt: parsed.prompt, essence: parsed.essence ?? "" };
	}
}

const QUALITY_MAP: Record<string, string> = {
	low: "low",
	medium: "medium",
	high: "high",
};

export class OpenAIImageProvider implements ImageProvider {
	readonly providerId = "openai";
	readonly modelId: string;

	constructor(modelId = "gpt-image-1.5") {
		this.modelId = modelId;
	}

	async generateImage(
		prompt: string,
		options?: ImageOptions,
	): Promise<Buffer> {
		const client = getClient();
		const quality = QUALITY_MAP[options?.quality ?? "medium"] ?? "medium";

		logger.info(`[OpenAI Image] Generating with ${this.modelId}`, {
			quality,
			promptLength: prompt.length,
		});

		const response = await client.images.generate({
			model: this.modelId,
			prompt,
			n: 1,
			size: "1024x1024",
			quality: quality as "low" | "medium" | "high",
		});

		const imageData = response.data?.[0];
		if (!imageData) {
			throw new Error("OpenAI image generation returned no data");
		}

		if (imageData.b64_json) {
			return Buffer.from(imageData.b64_json, "base64");
		}

		if (imageData.url) {
			const imgResponse = await fetch(imageData.url);
			if (!imgResponse.ok) {
				throw new Error(`Failed to download image: ${imgResponse.status}`);
			}
			return Buffer.from(await imgResponse.arrayBuffer());
		}

		throw new Error("OpenAI image response contained neither b64_json nor url");
	}
}
