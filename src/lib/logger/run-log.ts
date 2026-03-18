import fs from "node:fs";
import path from "node:path";
import type { ResolvedConfig } from "@/lib/ai/registry";
import type { RecentTopic } from "@/lib/db/queries";
import type { CuratedPick, NewsInput } from "@/types";
import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

const LOGS_DIR = process.env.LOGS_DIR ?? path.join(process.cwd(), "logs");
const RUNS_DIR = path.join(LOGS_DIR, "runs");
const INDEX_PATH = path.join(LOGS_DIR, "index.jsonl");

interface IndexEntry {
	id: string;
	ts: string;
	status: "success" | "error";
	error?: string;
	topic: string;
	headline: string;
	models: string;
	totalMs: number;
	dir: string;
}

interface RunSummary {
	id: string;
	timestamp: string;
	status: "success" | "error";
	error?: string;
	config: ResolvedConfig;
	headlinesCount: number;
	recentTopicsCount: number;
	chosenHeadline: string;
	reasoning: string;
	hebrewHeadline: string;
	imagePrompt: string;
	generationId: string;
	imagePath: string;
	timing: {
		totalMs: number;
		step1CurateMs: number;
		step2PromptMs: number;
		step3ImageMs: number;
	};
}

function ensureDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function safeTimestamp(): string {
	return new Date()
		.toISOString()
		.replace(/:/g, "-")
		.replace(/\.\d+Z$/, "");
}

export class RunLogger {
	readonly id: string;
	readonly runDir: string;
	readonly stepsDir: string;
	readonly startedAt: number;
	private stepTimings: {
		step1CurateMs: number;
		step2PromptMs: number;
		step3ImageMs: number;
	} = {
		step1CurateMs: 0,
		step2PromptMs: 0,
		step3ImageMs: 0,
	};

	constructor(existingRunDir?: string) {
		if (existingRunDir && fs.existsSync(existingRunDir)) {
			this.runDir = existingRunDir;
			this.id = path.basename(existingRunDir).split("_").pop() ?? ulid();
			this.startedAt = Date.now();
		} else {
			this.id = ulid();
			this.startedAt = Date.now();
			const dirName = `${safeTimestamp()}_${this.id}`;
			this.runDir = path.join(RUNS_DIR, dirName);
		}
		this.stepsDir = path.join(this.runDir, "steps");
		ensureDir(this.stepsDir);
	}

	logHeadlines(headlines: NewsInput[], recentTopics: RecentTopic[]): void {
		const data = {
			fetchedAt: new Date().toISOString(),
			headlinesCount: headlines.length,
			recentTopicsCount: recentTopics.length,
			headlines: headlines.map((h) => ({
				headline: h.headline,
				source: h.source,
				url: h.url,
			})),
			recentTopics: recentTopics.map((t) => ({
				schnitzelHeadline: t.schnitzel_headline,
				originalHeadline: t.original_headline,
				date: t.created_at,
			})),
		};
		fs.writeFileSync(
			path.join(this.stepsDir, "0_headlines.json"),
			JSON.stringify(data, null, 2),
		);
	}

	logCurateInput(systemPrompt: string, userPrompt: string): void {
		const content = `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}`;
		fs.writeFileSync(path.join(this.stepsDir, "1_curate_input.txt"), content);
	}

	logCurateOutput(curated: CuratedPick, durationMs: number): void {
		this.stepTimings.step1CurateMs = durationMs;
		const data = { ...curated, durationMs };
		fs.writeFileSync(
			path.join(this.stepsDir, "1_curate_output.json"),
			JSON.stringify(data, null, 2),
		);
	}

	logPromptInput(systemPrompt: string, userPrompt: string): void {
		const content = `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}`;
		fs.writeFileSync(path.join(this.stepsDir, "2_prompt_input.txt"), content);
	}

	logPromptOutput(imagePrompt: string, durationMs: number): void {
		this.stepTimings.step2PromptMs = durationMs;
		fs.writeFileSync(
			path.join(this.stepsDir, "2_prompt_output.txt"),
			imagePrompt,
		);
	}

	logImageMeta(meta: {
		model: string;
		quality: string;
		durationMs: number;
		fileSizeBytes: number;
	}): void {
		this.stepTimings.step3ImageMs = meta.durationMs;
		fs.writeFileSync(
			path.join(this.stepsDir, "3_image_meta.json"),
			JSON.stringify(meta, null, 2),
		);
	}

	copyImage(imageBuffer: Buffer): void {
		fs.writeFileSync(path.join(this.runDir, "image.png"), imageBuffer);
	}

	finalize(params: {
		status: "success" | "error";
		error?: string;
		config: ResolvedConfig;
		headlinesCount: number;
		recentTopicsCount: number;
		chosenHeadline?: string;
		reasoning?: string;
		hebrewHeadline?: string;
		imagePrompt?: string;
		generationId?: string;
		imagePath?: string;
	}): void {
		const totalMs = Date.now() - this.startedAt;

		const summary: RunSummary = {
			id: this.id,
			timestamp: new Date().toISOString(),
			status: params.status,
			error: params.error,
			config: params.config,
			headlinesCount: params.headlinesCount,
			recentTopicsCount: params.recentTopicsCount,
			chosenHeadline: params.chosenHeadline ?? "",
			reasoning: params.reasoning ?? "",
			hebrewHeadline: params.hebrewHeadline ?? "",
			imagePrompt: params.imagePrompt ?? "",
			generationId: params.generationId ?? "",
			imagePath: params.imagePath ?? "",
			timing: {
				totalMs,
				...this.stepTimings,
			},
		};

		fs.writeFileSync(
			path.join(this.runDir, "run.json"),
			JSON.stringify(summary, null, 2),
		);

		const indexEntry: IndexEntry = {
			id: this.id,
			ts: summary.timestamp,
			status: params.status,
			error: params.error,
			topic: params.chosenHeadline ?? "",
			headline: params.hebrewHeadline ?? "",
			models: `${params.config.textModel}/${params.config.promptEngineerModel}/${params.config.imageModel}`,
			totalMs,
			dir: path.basename(this.runDir),
		};

		ensureDir(LOGS_DIR);
		fs.appendFileSync(INDEX_PATH, `${JSON.stringify(indexEntry)}\n`);
	}
}
