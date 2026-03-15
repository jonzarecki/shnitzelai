import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SchnitzelContent, CuratedPick, ImageOptions } from "@/types";
import type { RecentTopic, RecentPrompt } from "@/lib/db/queries";
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

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
	if (_client) return _client;
	const apiKey = process.env.GOOGLE_API_KEY;
	if (!apiKey) {
		throw new Error("GOOGLE_API_KEY is required for Google provider");
	}
	_client = new GoogleGenerativeAI(apiKey);
	return _client;
}

export class GoogleTextProvider implements TextProvider {
	readonly providerId = "google";
	readonly modelId: string;

	constructor(modelId = "gemini-2.0-flash") {
		this.modelId = modelId;
	}

	async generateSchnitzelContent(
		headline: string,
		summary: string,
	): Promise<SchnitzelContent> {
		const client = getClient();
		logger.info(`[Google Text] Generating with ${this.modelId}`, { headline });

		const model = client.getGenerativeModel({
			model: this.modelId,
			generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
			systemInstruction: SCHNITZEL_SYSTEM_PROMPT,
		});

		const result = await model.generateContent(buildUserPrompt(headline, summary));
		const raw = result.response.text();
		if (!raw) throw new Error("Google returned empty response");

		const parsed = JSON.parse(raw) as SchnitzelContent;
		if (!parsed.imagePrompt || !parsed.hebrewHeadline) {
			throw new Error(`Google response missing required fields: ${raw}`);
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
		logger.info(`[Google Curator] Curating ${headlines.length} headlines with ${this.modelId}`, {
			recentTopics: recentTopics.length,
		});

		const model = client.getGenerativeModel({
			model: this.modelId,
			generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
			systemInstruction: CURATOR_SYSTEM_PROMPT,
		});

		const result = await model.generateContent(buildCuratorPrompt(headlines, recentTopics));
		const raw = result.response.text();
		if (!raw) throw new Error("Google curator returned empty response");

		const parsed = JSON.parse(raw) as CuratedPick & { hebrewHeadline?: string };
		const tagline = parsed.tagline ?? parsed.hebrewHeadline ?? "";
		const theme = parsed.theme ?? "";

		if (!tagline || !theme) {
			throw new Error(`Google curator response missing required fields: ${raw}`);
		}

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
		recentPrompts: RecentPrompt[],
	): Promise<{ prompt: string; essence: string }> {
		const client = getClient();
		logger.info(`[Google PromptEngineer] Crafting image prompt with ${this.modelId}`, {
			recentPrompts: recentPrompts.length,
		});

		const model = client.getGenerativeModel({
			model: this.modelId,
			generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
			systemInstruction: PROMPT_ENGINEER_SYSTEM_PROMPT,
		});

		const result = await model.generateContent(buildPromptEngineerInput(theme, tagline, recentPrompts));
		const raw = result.response.text()?.trim();
		if (!raw) throw new Error("Google prompt engineer returned empty response");

		const parsed = JSON.parse(raw) as { prompt: string; essence: string };
		if (!parsed.prompt) throw new Error(`Prompt engineer missing 'prompt' field: ${raw}`);

		logger.info("[Google PromptEngineer] Crafted prompt", { length: parsed.prompt.length });
		return { prompt: parsed.prompt, essence: parsed.essence ?? "" };
	}
}

export class GoogleImageProvider implements ImageProvider {
	readonly providerId = "google";
	readonly modelId: string;

	constructor(modelId = "imagen-4-fast") {
		this.modelId = modelId;
	}

	async generateImage(
		prompt: string,
		_options?: ImageOptions,
	): Promise<Buffer> {
		const client = getClient();
		logger.info(`[Google Image] Generating with ${this.modelId}`, { promptLength: prompt.length });

		const model = client.getGenerativeModel({ model: this.modelId });
		const result = await model.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			generationConfig: { responseModalities: ["image", "text"] } as Record<string, unknown>,
		});

		const parts = result.response.candidates?.[0]?.content?.parts;
		if (!parts) throw new Error("Google image generation returned no parts");

		for (const part of parts) {
			if (part.inlineData?.data) {
				return Buffer.from(part.inlineData.data, "base64");
			}
		}

		throw new Error("Google image response contained no image data");
	}
}
