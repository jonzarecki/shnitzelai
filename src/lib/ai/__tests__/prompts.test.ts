import { describe, expect, it } from "vitest";
import { SCHNITZEL_SYSTEM_PROMPT, buildUserPrompt } from "../prompts";

describe("SCHNITZEL_SYSTEM_PROMPT", () => {
	it("mentions schnitzel and JSON format", () => {
		expect(SCHNITZEL_SYSTEM_PROMPT).toContain("schnitzel");
		expect(SCHNITZEL_SYSTEM_PROMPT).toContain("imagePrompt");
		expect(SCHNITZEL_SYSTEM_PROMPT).toContain("hebrewHeadline");
		expect(SCHNITZEL_SYSTEM_PROMPT).toContain("caption");
	});

	it("instructs Hebrew output", () => {
		expect(SCHNITZEL_SYSTEM_PROMPT).toContain("Hebrew");
	});
});

describe("buildUserPrompt", () => {
	it("includes headline", () => {
		const result = buildUserPrompt("Test headline", "");
		expect(result).toContain("Test headline");
	});

	it("includes summary when provided", () => {
		const result = buildUserPrompt("Headline", "Some summary");
		expect(result).toContain("Summary: Some summary");
	});

	it("excludes summary line when empty", () => {
		const result = buildUserPrompt("Headline", "");
		expect(result).not.toContain("Summary:");
	});
});
