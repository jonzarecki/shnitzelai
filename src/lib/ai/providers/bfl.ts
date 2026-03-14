import type { ImageOptions } from "@/types";
import type { ImageProvider } from "../types";
import { logger } from "@/lib/logger";

const BFL_API_BASE = "https://api.bfl.ml/v1";

function getApiKey(): string {
	const apiKey = process.env.BFL_API_KEY;
	if (!apiKey) {
		throw new Error("BFL_API_KEY is required for BFL/Flux provider");
	}
	return apiKey;
}

interface BflTaskResponse {
	id: string;
}

interface BflResultResponse {
	status: "Ready" | "Pending" | "Error" | "Content Moderated";
	result?: {
		sample: string;
	};
}

export class BflImageProvider implements ImageProvider {
	readonly providerId = "bfl";
	readonly modelId: string;

	constructor(modelId = "flux-pro-1.1") {
		this.modelId = modelId;
	}

	async generateImage(
		prompt: string,
		_options?: ImageOptions,
	): Promise<Buffer> {
		const apiKey = getApiKey();

		logger.info(`[BFL Image] Generating with ${this.modelId}`, {
			promptLength: prompt.length,
		});

		const taskResponse = await fetch(`${BFL_API_BASE}/${this.modelId}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Key": apiKey,
			},
			body: JSON.stringify({
				prompt,
				width: 1024,
				height: 1024,
			}),
		});

		if (!taskResponse.ok) {
			const errText = await taskResponse.text();
			throw new Error(`BFL task creation failed (${taskResponse.status}): ${errText}`);
		}

		const task = (await taskResponse.json()) as BflTaskResponse;

		const imageUrl = await this.pollForResult(task.id, apiKey);
		const imgResponse = await fetch(imageUrl);
		if (!imgResponse.ok) {
			throw new Error(`Failed to download BFL image: ${imgResponse.status}`);
		}
		return Buffer.from(await imgResponse.arrayBuffer());
	}

	private async pollForResult(taskId: string, apiKey: string): Promise<string> {
		const maxAttempts = 60;
		const pollIntervalMs = 2000;

		for (let i = 0; i < maxAttempts; i++) {
			await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

			const response = await fetch(`${BFL_API_BASE}/get_result?id=${taskId}`, {
				headers: { "X-Key": apiKey },
			});

			if (!response.ok) {
				throw new Error(`BFL poll failed (${response.status})`);
			}

			const result = (await response.json()) as BflResultResponse;

			switch (result.status) {
				case "Ready":
					if (!result.result?.sample) {
						throw new Error("BFL result missing sample URL");
					}
					return result.result.sample;
				case "Error":
					throw new Error("BFL image generation failed");
				case "Content Moderated":
					throw new Error("BFL image was content moderated");
				case "Pending":
					break;
			}
		}

		throw new Error("BFL image generation timed out");
	}
}
