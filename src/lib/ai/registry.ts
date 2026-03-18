import { BflImageProvider } from "./providers/bfl";
import { GoogleImageProvider, GoogleTextProvider } from "./providers/google";
import { OpenAIImageProvider, OpenAITextProvider } from "./providers/openai";
import type {
	ImageModelDef,
	ImageProvider,
	TextModelDef,
	TextProvider,
} from "./types";

export const TEXT_MODELS: TextModelDef[] = [
	{
		providerId: "openai",
		modelId: "gpt-4.1-mini",
		label: "GPT-4.1 Mini (OpenAI)",
	},
	{
		providerId: "openai",
		modelId: "gpt-4.1-nano",
		label: "GPT-4.1 Nano (OpenAI)",
	},
	{
		providerId: "google",
		modelId: "gemini-2.0-flash",
		label: "Gemini 2.0 Flash (Google)",
	},
];

export const IMAGE_MODELS: ImageModelDef[] = [
	{
		providerId: "openai",
		modelId: "gpt-image-1.5",
		label: "GPT Image 1.5 (OpenAI)",
		supportsQuality: true,
	},
	{
		providerId: "openai",
		modelId: "gpt-image-1",
		label: "GPT Image 1 (OpenAI)",
		supportsQuality: true,
	},
	{
		providerId: "openai",
		modelId: "gpt-image-1-mini",
		label: "GPT Image 1 Mini (OpenAI)",
		supportsQuality: true,
	},
	{
		providerId: "bfl",
		modelId: "flux-pro-1.1",
		label: "Flux Pro 1.1 (BFL)",
		supportsQuality: false,
	},
	{
		providerId: "bfl",
		modelId: "flux-pro-1.1-ultra",
		label: "Flux Pro 1.1 Ultra (BFL)",
		supportsQuality: false,
	},
	{
		providerId: "google",
		modelId: "imagen-4-fast",
		label: "Imagen 4 Fast (Google)",
		supportsQuality: false,
	},
	{
		providerId: "google",
		modelId: "imagen-4",
		label: "Imagen 4 (Google)",
		supportsQuality: false,
	},
];

export function createTextProvider(
	providerId: string,
	modelId: string,
): TextProvider {
	switch (providerId) {
		case "openai":
			return new OpenAITextProvider(modelId);
		case "google":
			return new GoogleTextProvider(modelId);
		default:
			throw new Error(`Unknown text provider: ${providerId}`);
	}
}

export function createImageProvider(
	providerId: string,
	modelId: string,
): ImageProvider {
	switch (providerId) {
		case "openai":
			return new OpenAIImageProvider(modelId);
		case "bfl":
			return new BflImageProvider(modelId);
		case "google":
			return new GoogleImageProvider(modelId);
		default:
			throw new Error(`Unknown image provider: ${providerId}`);
	}
}

export interface ResolvedConfig {
	textProvider: string;
	textModel: string;
	promptEngineerProvider: string;
	promptEngineerModel: string;
	imageProvider: string;
	imageModel: string;
	imageQuality: "low" | "medium" | "high";
}

export function getDefaultConfig(): ResolvedConfig {
	return {
		textProvider: process.env.TEXT_PROVIDER ?? "openai",
		textModel: process.env.TEXT_MODEL ?? "gpt-5.4",
		promptEngineerProvider: process.env.PROMPT_ENGINEER_PROVIDER ?? "openai",
		promptEngineerModel: process.env.PROMPT_ENGINEER_MODEL ?? "gpt-5.4",
		imageProvider: process.env.IMAGE_PROVIDER ?? "openai",
		imageModel: process.env.IMAGE_MODEL ?? "gpt-image-1.5",
		imageQuality:
			(process.env.IMAGE_QUALITY as ResolvedConfig["imageQuality"]) ?? "medium",
	};
}
