import { runCronGeneration } from "@/lib/cron/scheduler";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
	const secret =
		request.headers.get("x-cron-secret") ??
		new URL(request.url).searchParams.get("secret");

	const expectedSecret = process.env.CRON_SECRET;
	if (!expectedSecret || secret !== expectedSecret) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		logger.info("[API Cron] Manual trigger");
		const result = await runCronGeneration();
		return NextResponse.json(result);
	} catch (err) {
		logger.error("[API Cron] Error", {
			error: err instanceof Error ? err.message : String(err),
		});
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : "Cron failed" },
			{ status: 500 },
		);
	}
}
