import { NextResponse } from "next/server";
import { runCuratedPipeline } from "@/lib/ai/pipeline";
import { getDefaultConfig } from "@/lib/ai/registry";
import { fetchRssHeadlines } from "@/lib/news/fetcher";
import { logger } from "@/lib/logger";

/** Full pipeline in one call (used by cron). */
export async function POST() {
	if (process.env.READONLY_MODE) {
		return NextResponse.json({ error: "Generation disabled in readonly mode" }, { status: 403 });
	}
	try {
		const config = getDefaultConfig();
		const headlines = await fetchRssHeadlines();
		if (headlines.length === 0) {
			return NextResponse.json({ message: "No headlines" }, { status: 200 });
		}

		const { preview, result } = await runCuratedPipeline(headlines, config);

		logger.info("[API Generate] Complete", { generationId: result.generation.id });

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
