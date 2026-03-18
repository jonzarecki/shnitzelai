import { runPreview } from "@/lib/ai/pipeline";
import { getDefaultConfig } from "@/lib/ai/registry";
import { getRecentTopics } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { fetchRssHeadlines } from "@/lib/news/fetcher";
import { NextResponse } from "next/server";

export async function POST() {
	if (process.env.DISABLE_ADMIN) {
		return NextResponse.json(
			{ error: "Admin disabled on this instance" },
			{ status: 403 },
		);
	}
	try {
		const config = getDefaultConfig();

		logger.info("[API Preview] Starting");

		const headlines = await fetchRssHeadlines();
		if (headlines.length === 0) {
			return NextResponse.json(
				{ message: "אין כותרות חדשות" },
				{ status: 200 },
			);
		}

		const recentTopics = getRecentTopics(7);
		const preview = await runPreview(headlines, config);

		return NextResponse.json({
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
			curate: {
				theme: preview.curate.theme,
				relatedHeadlines: preview.curate.relatedHeadlines,
				reasoning: preview.curate.reasoning,
				tagline: preview.curate.tagline,
				model: `${config.textProvider}/${config.textModel}`,
			},
			imagePrompt: {
				prompt: preview.imagePrompt,
				essence: preview.essence,
				model: `${config.promptEngineerProvider}/${config.promptEngineerModel}`,
			},
			runLogId: preview.runLogId,
			runLogDir: preview.runLogDir,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		logger.error("[API Preview] Error", { error: msg });
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
