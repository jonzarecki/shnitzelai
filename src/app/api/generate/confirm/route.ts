import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { CuratedPick, NewsInput } from "@/types";
import { runGenerate, type PreviewResult } from "@/lib/ai/pipeline";
import { getDefaultConfig } from "@/lib/ai/registry";
import { logger } from "@/lib/logger";

interface ConfirmBody {
	curate: CuratedPick;
	imagePrompt: string;
	essence: string;
	headlines: { headline: string; summary: string; source: string; url: string; category: string }[];
	recentTopicsCount: number;
	runLogId: string;
	runLogDir: string;
}

export async function POST(request: NextRequest) {
	if (process.env.READONLY_MODE) {
		return NextResponse.json({ error: "Generation disabled in readonly mode" }, { status: 403 });
	}
	try {
		const body = (await request.json()) as ConfirmBody;
		const config = getDefaultConfig();

		logger.info("[API Confirm] Generating image", { runLogId: body.runLogId });

		const preview: PreviewResult = {
			curate: body.curate,
			imagePrompt: body.imagePrompt,
			essence: body.essence,
			headlines: body.headlines as NewsInput[],
			recentTopicsCount: body.recentTopicsCount,
			config,
			runLogId: body.runLogId,
			runLogDir: body.runLogDir ?? "",
		};

		const result = await runGenerate(preview);

		return NextResponse.json({
			generation: result.generation,
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		logger.error("[API Confirm] Error", { error: msg });
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
