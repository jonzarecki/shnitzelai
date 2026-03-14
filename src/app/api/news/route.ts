import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getGenerations, getGenerationCount } from "@/lib/db/queries";
import type { GenerationWithNewsItem } from "@/types";

function toPublicItem(item: GenerationWithNewsItem) {
	const { prompt_used, text_provider, text_model, image_provider, image_model, image_quality, ...rest } = item;
	return rest;
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
	const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));

	const items = getGenerations(page, limit);
	const total = getGenerationCount();

	return NextResponse.json({
		items: items.map(toPublicItem),
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
}
