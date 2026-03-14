import { describe, it, expect } from "vitest";
import {
	createTextProvider,
	createImageProvider,
	getDefaultConfig,
	TEXT_MODELS,
	IMAGE_MODELS,
} from "../registry";
import { OpenAITextProvider, OpenAIImageProvider } from "../providers/openai";
import { GoogleTextProvider, GoogleImageProvider } from "../providers/google";
import { BflImageProvider } from "../providers/bfl";

describe("TEXT_MODELS", () => {
	it("has at least one model defined", () => {
		expect(TEXT_MODELS.length).toBeGreaterThan(0);
	});

	it("includes gpt-4.1-mini as default", () => {
		const found = TEXT_MODELS.find((m) => m.modelId === "gpt-4.1-mini");
		expect(found).toBeDefined();
		expect(found?.providerId).toBe("openai");
	});
});

describe("IMAGE_MODELS", () => {
	it("has at least one model defined", () => {
		expect(IMAGE_MODELS.length).toBeGreaterThan(0);
	});

	it("includes gpt-image-1.5 as default", () => {
		const found = IMAGE_MODELS.find((m) => m.modelId === "gpt-image-1.5");
		expect(found).toBeDefined();
		expect(found?.providerId).toBe("openai");
	});

	it("includes flux-pro-1.1", () => {
		const found = IMAGE_MODELS.find((m) => m.modelId === "flux-pro-1.1");
		expect(found).toBeDefined();
		expect(found?.providerId).toBe("bfl");
	});
});

describe("createTextProvider", () => {
	it("creates OpenAI text provider", () => {
		const provider = createTextProvider("openai", "gpt-4.1-mini");
		expect(provider).toBeInstanceOf(OpenAITextProvider);
		expect(provider.providerId).toBe("openai");
		expect(provider.modelId).toBe("gpt-4.1-mini");
	});

	it("creates Google text provider", () => {
		const provider = createTextProvider("google", "gemini-2.0-flash");
		expect(provider).toBeInstanceOf(GoogleTextProvider);
		expect(provider.providerId).toBe("google");
	});

	it("throws for unknown provider", () => {
		expect(() => createTextProvider("unknown", "model")).toThrow("Unknown text provider");
	});
});

describe("createImageProvider", () => {
	it("creates OpenAI image provider", () => {
		const provider = createImageProvider("openai", "gpt-image-1.5");
		expect(provider).toBeInstanceOf(OpenAIImageProvider);
	});

	it("creates BFL image provider", () => {
		const provider = createImageProvider("bfl", "flux-pro-1.1");
		expect(provider).toBeInstanceOf(BflImageProvider);
	});

	it("creates Google image provider", () => {
		const provider = createImageProvider("google", "imagen-4-fast");
		expect(provider).toBeInstanceOf(GoogleImageProvider);
	});

	it("throws for unknown provider", () => {
		expect(() => createImageProvider("unknown", "model")).toThrow("Unknown image provider");
	});
});

describe("getDefaultConfig", () => {
	it("returns defaults when no env vars set", () => {
		const config = getDefaultConfig();
		expect(config.textProvider).toBe("openai");
		expect(config.textModel).toBe("gpt-4.1-mini");
		expect(config.imageProvider).toBe("openai");
		expect(config.imageModel).toBe("gpt-image-1.5");
		expect(config.imageQuality).toBe("medium");
	});
});
