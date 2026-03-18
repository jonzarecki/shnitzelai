"use client";

import Image from "next/image";
import { useState } from "react";

interface GenerationCardProps {
	id: string;
	imagePath: string;
	tagline: string;
	originalHeadline: string;
	originalSource: string;
	originalUrl: string;
	createdAt: string;
	tweetId?: string | null;
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString("he-IL", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

export function GenerationCard({
	id,
	imagePath,
	tagline,
	originalHeadline,
	originalSource,
	originalUrl,
	createdAt,
	tweetId: initialTweetId,
}: GenerationCardProps) {
	const [tweetId, setTweetId] = useState(initialTweetId ?? null);
	const [tweetUrl, setTweetUrl] = useState<string | null>(null);
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handlePost() {
		setPosting(true);
		setError(null);

		try {
			const res = await fetch("/api/twitter/post", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ generationId: id }),
			});

			const data = (await res.json()) as {
				tweetId?: string;
				tweetUrl?: string;
				error?: string;
			};

			if (!res.ok) {
				setError(data.error ?? `Error ${res.status}`);
				return;
			}

			if (data.tweetId) setTweetId(data.tweetId);
			if (data.tweetUrl) setTweetUrl(data.tweetUrl);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Network error");
		} finally {
			setPosting(false);
		}
	}

	const resolvedTweetUrl =
		tweetUrl ?? (tweetId ? `https://x.com/i/status/${tweetId}` : null);

	return (
		<div className="flex gap-4 rounded-xl border border-stone-800 bg-stone-900 p-4">
			<div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
				<Image
					src={imagePath}
					alt={tagline}
					fill
					className="object-cover"
					sizes="96px"
				/>
			</div>

			<div className="flex min-w-0 flex-1 flex-col justify-between">
				<div>
					<p className="text-sm font-bold text-amber-400 leading-tight">
						{tagline}
					</p>
					<p className="mt-1 truncate text-xs text-stone-500">
						{originalSource && (
							<span className="text-stone-600">[{originalSource}]</span>
						)}{" "}
						{originalHeadline}
					</p>
					{originalUrl && !originalUrl.includes("news.google.com") && (
						<a
							href={originalUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-0.5 block truncate text-xs text-stone-600 hover:text-stone-400"
						>
							{originalUrl}
						</a>
					)}
				</div>

				<div className="mt-2 flex items-center justify-between">
					<time dateTime={createdAt} className="text-xs text-stone-600">
						{formatDate(createdAt)}
					</time>

					<div className="flex items-center gap-2">
						{error && <span className="text-xs text-red-400">{error}</span>}

						{resolvedTweetUrl ? (
							<a
								href={resolvedTweetUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="rounded-md bg-sky-600/20 px-3 py-1 text-xs font-medium text-sky-400 hover:bg-sky-600/30"
							>
								View tweet
							</a>
						) : (
							<button
								type="button"
								onClick={handlePost}
								disabled={posting}
								className="rounded-md bg-sky-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-sky-500 disabled:opacity-50"
							>
								{posting ? "Posting..." : "Post to X"}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
