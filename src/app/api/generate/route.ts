import { runCuratedPipeline } from "@/lib/ai/pipeline";
import { getDefaultConfig } from "@/lib/ai/registry";
import { logger } from "@/lib/logger";
import { fetchRssHeadlines } from "@/lib/news/fetcher";
import { NextResponse } from "next/server";

/** Full pipeline in one call (used by cron). */
export async function POST() {
	try {
		const config = getDefaultConfig();
		const headlines = await fetchRssHeadlines();
		if (headlines.length === 0) {
			return NextResponse.json({ message: "No headlines" }, { status: 200 });
		}

		const { preview, result } = await runCuratedPipeline(headlines, config);

		logger.info("[API Generate] Complete", {
			generationId: result.generation.id,
		});

		return NextResponse.json({
			theme: preview.curate.theme,
			tagline: preview.curate.tagline,
			generation: result.generation,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		logger.error("[API Generate] Error", { error: msg });
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
