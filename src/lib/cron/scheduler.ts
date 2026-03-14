import { Cron } from "croner";
import { fetchRssHeadlines } from "@/lib/news/fetcher";
import { runCuratedPipeline } from "@/lib/ai/pipeline";
import { getDefaultConfig } from "@/lib/ai/registry";
import { logger } from "@/lib/logger";

const DEFAULT_SCHEDULE = "0 9 * * *";

export async function runCronGeneration(): Promise<{ success: boolean; error?: string }> {
	const timestamp = new Date().toISOString();
	logger.info("[Cron] Starting daily schnitzel generation", { timestamp });

	try {
		const headlines = await fetchRssHeadlines();
		if (headlines.length === 0) {
			logger.warn("[Cron] No headlines found");
			return { success: false, error: "No headlines available" };
		}

		const config = getDefaultConfig();
		const { preview, result } = await runCuratedPipeline(headlines, config);

		logger.info("[Cron] Daily schnitzel generated", {
			theme: preview.curate.theme.slice(0, 60),
			tagline: preview.curate.tagline,
			generationId: result.generation.id,
		});

		return { success: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		logger.error("[Cron] Failed", { error: msg });
		return { success: false, error: msg };
	}
}

let _scheduled = false;

export function startCronScheduler(): void {
	if (_scheduled) return;
	_scheduled = true;

	const schedule = process.env.CRON_SCHEDULE ?? DEFAULT_SCHEDULE;
	logger.info("[Cron] Starting scheduler", { schedule });

	new Cron(schedule, () => {
		runCronGeneration().catch((err) => {
			logger.error("[Cron] Unhandled error", {
				error: err instanceof Error ? err.message : String(err),
			});
		});
	});
}
