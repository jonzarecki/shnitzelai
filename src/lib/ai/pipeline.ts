import {
	getRecentPrompts,
	getRecentTopics,
	insertGeneration,
	insertNewsItem,
} from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { RunLogger } from "@/lib/logger/run-log";
import type { CuratedPick, Generation, NewsInput } from "@/types";
import {
	CURATOR_SYSTEM_PROMPT,
	PROMPT_ENGINEER_SYSTEM_PROMPT,
	buildCuratorPrompt,
	buildPromptEngineerInput,
} from "./prompts";
import {
	type ResolvedConfig,
	createImageProvider,
	createTextProvider,
} from "./registry";
import { saveImage } from "./save-image";

export interface PreviewResult {
	curate: CuratedPick;
	imagePrompt: string;
	essence: string;
	headlines: NewsInput[];
	recentTopicsCount: number;
	config: ResolvedConfig;
	runLogId: string;
	runLogDir: string;
}

export interface GenerateResult {
	generation: Generation;
	newsItemId: string;
}

/**
 * Step 1+2: Fetch theme + craft image prompt. Cheap LLM calls only.
 * Returns a preview the user can review before committing to image generation.
 */
export async function runPreview(
	headlines: NewsInput[],
	config: ResolvedConfig,
): Promise<PreviewResult> {
	const runLog = new RunLogger();
	const recentTopics = getRecentTopics(7);

	logger.info("[Pipeline] Preview: curating theme", {
		headlines: headlines.length,
		recentTopics: recentTopics.length,
		runId: runLog.id,
	});

	runLog.logHeadlines(headlines, recentTopics);

	const headlinePairs = headlines.map((h) => ({
		headline: h.headline,
		source: h.source,
	}));
	const curatorUserPrompt = buildCuratorPrompt(headlinePairs, recentTopics);
	runLog.logCurateInput(CURATOR_SYSTEM_PROMPT, curatorUserPrompt);

	const textProvider = createTextProvider(
		config.textProvider,
		config.textModel,
	);

	const step1Start = Date.now();
	let curated: CuratedPick;
	try {
		curated = await textProvider.curate(headlinePairs, recentTopics);
	} catch (err) {
		runLog.finalize({
			status: "error",
			error: err instanceof Error ? err.message : String(err),
			config,
			headlinesCount: headlines.length,
			recentTopicsCount: recentTopics.length,
		});
		throw err;
	}
	runLog.logCurateOutput(curated, Date.now() - step1Start);

	logger.info("[Pipeline] Preview: theme identified", {
		theme: curated.theme.slice(0, 80),
		tagline: curated.tagline,
	});

	const recentPrompts = getRecentPrompts(7);
	logger.info("[Pipeline] Loaded recent prompts for variation", {
		count: recentPrompts.length,
	});

	const promptInput = buildPromptEngineerInput(
		curated.theme,
		curated.tagline,
		recentPrompts,
	);
	runLog.logPromptInput(PROMPT_ENGINEER_SYSTEM_PROMPT, promptInput);

	const promptEngineer = createTextProvider(
		config.promptEngineerProvider,
		config.promptEngineerModel,
	);

	const step2Start = Date.now();
	let promptResult: { prompt: string; essence: string };
	try {
		promptResult = await promptEngineer.craftImagePrompt(
			curated.theme,
			curated.tagline,
			recentPrompts,
		);
	} catch (err) {
		runLog.finalize({
			status: "error",
			error: err instanceof Error ? err.message : String(err),
			config,
			headlinesCount: headlines.length,
			recentTopicsCount: recentTopics.length,
			chosenHeadline: curated.theme,
			reasoning: curated.reasoning,
			hebrewHeadline: curated.tagline,
		});
		throw err;
	}
	runLog.logPromptOutput(promptResult.prompt, Date.now() - step2Start);

	logger.info("[Pipeline] Preview ready", {
		essence: promptResult.essence.slice(0, 100),
		promptLength: promptResult.prompt.length,
	});

	return {
		curate: curated,
		imagePrompt: promptResult.prompt,
		essence: promptResult.essence,
		headlines,
		recentTopicsCount: recentTopics.length,
		config,
		runLogId: runLog.id,
		runLogDir: runLog.runDir,
	};
}

/**
 * Step 3: Generate image from a previewed prompt. The expensive call.
 */
export async function runGenerate(
	preview: PreviewResult,
): Promise<GenerateResult> {
	const { config, curate: curated, imagePrompt } = preview;

	logger.info("[Pipeline] Generating image", {
		imageModel: `${config.imageProvider}/${config.imageModel}`,
		runId: preview.runLogId,
	});

	const relatedIdx = curated.relatedHeadlines?.[0];
	const matchedHeadline = typeof relatedIdx === "number" && relatedIdx > 0 ? preview.headlines[relatedIdx - 1] : undefined;
	const matchedInput = matchedHeadline ?? {
		headline: curated.theme,
		summary: curated.reasoning,
		source: "",
		url: "",
		category: "general",
	};

	const newsItem = insertNewsItem({
		original_headline: matchedInput.headline,
		original_summary: matchedInput.summary || curated.reasoning,
		original_source: matchedInput.source,
		original_url: matchedInput.url,
		category: matchedInput.category,
	});

	const imageProvider = createImageProvider(
		config.imageProvider,
		config.imageModel,
	);

	const IMAGE_STYLE_PREFIX =
		"Editorial illustration, photorealistic detail, dramatic cinematic lighting, muted desaturated palette, magazine cover composition. ";
	const fullImagePrompt = IMAGE_STYLE_PREFIX + imagePrompt;

	const step3Start = Date.now();
	const imageBuffer = await imageProvider.generateImage(fullImagePrompt, {
		quality: config.imageQuality,
	});
	const step3Ms = Date.now() - step3Start;

	const runLog = new RunLogger(preview.runLogDir || undefined);
	runLog.logImageMeta({
		model: `${config.imageProvider}/${config.imageModel}`,
		quality: config.imageQuality,
		durationMs: step3Ms,
		fileSizeBytes: imageBuffer.length,
	});
	runLog.copyImage(imageBuffer);

	const imagePath = saveImage(imageBuffer);

	const generation = insertGeneration({
		news_item_id: newsItem.id,
		image_path: imagePath,
		schnitzel_headline: curated.tagline,
		caption: "",
		prompt_used: imagePrompt,
		text_provider: config.textProvider,
		text_model: config.textModel,
		image_provider: config.imageProvider,
		image_model: config.imageModel,
		image_quality: config.imageQuality,
	});

	runLog.finalize({
		status: "success",
		config,
		headlinesCount: preview.headlines.length,
		recentTopicsCount: preview.recentTopicsCount,
		chosenHeadline: curated.theme,
		reasoning: curated.reasoning,
		hebrewHeadline: curated.tagline,
		imagePrompt,
		generationId: generation.id,
		imagePath,
	});

	logger.info("[Pipeline] Generation complete", {
		generationId: generation.id,
	});

	return { generation, newsItemId: newsItem.id };
}

/** Full pipeline (for cron): preview + generate in one call. */
export async function runCuratedPipeline(
	headlines: NewsInput[],
	config: ResolvedConfig,
): Promise<{ preview: PreviewResult; result: GenerateResult }> {
	const preview = await runPreview(headlines, config);
	const result = await runGenerate(preview);
	return { preview, result };
}
