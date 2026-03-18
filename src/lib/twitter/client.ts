import fs from "node:fs";
import path from "node:path";
import { getGenerationById, updateTweetId } from "@/lib/db/queries";
import { logger } from "@/lib/logger";
import { TwitterApi } from "twitter-api-v2";

interface TwitterConfig {
	appKey: string;
	appSecret: string;
	accessToken: string;
	accessSecret: string;
}

function getTwitterConfig(): TwitterConfig | null {
	const appKey = process.env.TWITTER_APP_KEY;
	const appSecret = process.env.TWITTER_APP_SECRET;
	const accessToken = process.env.TWITTER_ACCESS_TOKEN;
	const accessSecret = process.env.TWITTER_ACCESS_SECRET;

	if (!appKey || !appSecret || !accessToken || !accessSecret) {
		return null;
	}

	return { appKey, appSecret, accessToken, accessSecret };
}

function createClient(config: TwitterConfig): TwitterApi {
	return new TwitterApi({
		appKey: config.appKey,
		appSecret: config.appSecret,
		accessToken: config.accessToken,
		accessSecret: config.accessSecret,
	});
}

export function composeTweetText(tagline: string, articleUrl: string): string {
	const parts = [tagline];

	if (articleUrl) {
		parts.push("", articleUrl);
	}

	parts.push("", "#ShnitzelAI");

	return parts.join("\n");
}

export interface PostResult {
	tweetId: string;
	tweetUrl: string;
}

export async function postToTwitter(generationId: string): Promise<PostResult> {
	const config = getTwitterConfig();
	if (!config) {
		throw new Error("Twitter credentials not configured");
	}

	const generation = getGenerationById(generationId);
	if (!generation) {
		throw new Error(`Generation not found: ${generationId}`);
	}

	if (generation.tweet_id) {
		throw new Error(
			`Generation already posted as tweet ${generation.tweet_id}`,
		);
	}

	const imagePath = path.join(process.cwd(), "public", generation.image_path);
	if (!fs.existsSync(imagePath)) {
		throw new Error(`Image not found: ${imagePath}`);
	}

	const client = createClient(config);

	logger.info("[Twitter] Uploading image", {
		generationId,
		imagePath: generation.image_path,
	});
	const mediaId = await client.v1.uploadMedia(imagePath, {
		mimeType: "image/png",
	});

	const tweetText = composeTweetText(
		generation.schnitzel_headline,
		generation.original_url,
	);

	logger.info("[Twitter] Posting tweet", {
		generationId,
		textLength: tweetText.length,
	});
	const tweet = await client.v2.tweet(tweetText, {
		media: { media_ids: [mediaId] },
	});

	const tweetId = tweet.data.id;

	const username = await getUsername(client);
	const tweetUrl = `https://x.com/${username}/status/${tweetId}`;

	updateTweetId(generationId, tweetId);

	logger.info("[Twitter] Tweet posted", { generationId, tweetId, tweetUrl });

	return { tweetId, tweetUrl };
}

async function getUsername(client: TwitterApi): Promise<string> {
	try {
		const me = await client.v2.me();
		return me.data.username;
	} catch {
		return "i";
	}
}

export function isTwitterConfigured(): boolean {
	return getTwitterConfig() !== null;
}
