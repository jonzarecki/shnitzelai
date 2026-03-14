import { NextResponse } from "next/server";
import { getGenerationCount } from "@/lib/db/queries";

export async function GET() {
	try {
		const count = getGenerationCount();
		return NextResponse.json({
			status: "ok",
			timestamp: new Date().toISOString(),
			generations: count,
		});
	} catch (err) {
		return NextResponse.json(
			{
				status: "error",
				error: err instanceof Error ? err.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
