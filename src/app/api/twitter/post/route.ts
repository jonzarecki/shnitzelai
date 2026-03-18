import { logger } from "@/lib/logger";
import { postToTwitter } from "@/lib/twitter/client";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface PostBody {
	generationId: string;
}

export async function POST(request: NextRequest) {
	if (process.env.DISABLE_ADMIN) {
		return NextResponse.json(
			{ error: "Admin disabled on this instance" },
			{ status: 403 },
		);
	}

	try {
		const body = (await request.json()) as PostBody;

		if (!body.generationId) {
			return NextResponse.json(
				{ error: "generationId is required" },
				{ status: 400 },
			);
		}

		logger.info("[API Twitter] Posting to Twitter", {
			generationId: body.generationId,
		});

		const result = await postToTwitter(body.generationId);

		return NextResponse.json(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		logger.error("[API Twitter] Error", { error: msg });
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
