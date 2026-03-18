"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Headline {
	headline: string;
	source: string;
	url: string;
}

interface RecentTopic {
	schnitzelHeadline: string;
	originalHeadline: string;
	date: string;
}

interface PreviewData {
	headlines: Headline[];
	recentTopics: RecentTopic[];
	curate: {
		theme: string;
		relatedHeadlines?: number[];
		reasoning: string;
		tagline: string;
		model: string;
	};
	imagePrompt: {
		prompt: string;
		essence: string;
		model: string;
	};
	runLogId: string;
	runLogDir: string;
}

interface GenerationData {
	id: string;
	image_path: string;
	schnitzel_headline: string;
}

type Phase = "idle" | "previewing" | "previewed" | "generating" | "done";
type TweetStatus = "idle" | "posting" | "posted" | "error";

function StepReveal({
	delay,
	children,
}: { delay: number; children: React.ReactNode }) {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setVisible(true), delay);
		return () => clearTimeout(t);
	}, [delay]);

	if (!visible) return null;
	return <div className="animate-fadeIn">{children}</div>;
}

export function GenerateForm() {
	const [phase, setPhase] = useState<Phase>("idle");
	const [preview, setPreview] = useState<PreviewData | null>(null);
	const [generation, setGeneration] = useState<GenerationData | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [revealKey, setRevealKey] = useState(0);
	const [tweetStatus, setTweetStatus] = useState<TweetStatus>("idle");
	const [tweetUrl, setTweetUrl] = useState<string | null>(null);
	const [tweetError, setTweetError] = useState<string | null>(null);

	async function handlePostToTwitter() {
		if (!generation) return;
		setTweetStatus("posting");
		setTweetError(null);

		try {
			const res = await fetch("/api/twitter/post", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ generationId: generation.id }),
			});

			const data = (await res.json()) as {
				tweetId?: string;
				tweetUrl?: string;
				error?: string;
			};

			if (!res.ok) {
				setTweetError(data.error ?? `Error ${res.status}`);
				setTweetStatus("error");
				return;
			}

			if (data.tweetUrl) setTweetUrl(data.tweetUrl);
			setTweetStatus("posted");
		} catch (err) {
			setTweetError(err instanceof Error ? err.message : "Network error");
			setTweetStatus("error");
		}
	}

	async function handlePreview() {
		setPhase("previewing");
		setError(null);
		setPreview(null);
		setGeneration(null);
		setTweetStatus("idle");
		setTweetUrl(null);
		setTweetError(null);

		try {
			const res = await fetch("/api/generate/preview", { method: "POST" });
			const data = (await res.json()) as PreviewData & {
				error?: string;
				message?: string;
			};

			if (!res.ok) {
				setError(data.error ?? `שגיאה ${res.status}`);
				setPhase("idle");
				return;
			}
			if (data.message) {
				setError(data.message);
				setPhase("idle");
				return;
			}

			setPreview(data);
			setRevealKey((k) => k + 1);
			setPhase("previewed");
		} catch (err) {
			setError(err instanceof Error ? err.message : "שגיאת רשת");
			setPhase("idle");
		}
	}

	async function handleGenerate() {
		if (!preview) return;
		setPhase("generating");
		setError(null);

		try {
			const res = await fetch("/api/generate/confirm", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					curate: preview.curate,
					imagePrompt: preview.imagePrompt.prompt,
					essence: preview.imagePrompt.essence,
					headlines: preview.headlines.map((h) => ({
						headline: h.headline,
						summary: "",
						source: h.source,
						url: h.url,
						category: "general",
					})),
					recentTopicsCount: preview.recentTopics.length,
					runLogId: preview.runLogId,
					runLogDir: preview.runLogDir,
				}),
			});

			const data = (await res.json()) as {
				generation: GenerationData;
				error?: string;
			};

			if (!res.ok) {
				setError(data.error ?? `שגיאה ${res.status}`);
				setPhase("previewed");
				return;
			}

			setGeneration(data.generation);
			setPhase("done");
		} catch (err) {
			setError(err instanceof Error ? err.message : "שגיאת רשת");
			setPhase("previewed");
		}
	}

	return (
		<div className="space-y-5">
			{/* Main action button */}
			{(phase === "idle" || phase === "done") && (
				<button
					type="button"
					onClick={handlePreview}
					className="w-full rounded-xl bg-amber-500 px-6 py-4 text-xl font-bold text-stone-900 transition hover:bg-amber-400"
				>
					🍗 מה השניצל של היום?
				</button>
			)}

			{phase === "previewing" && (
				<div className="rounded-xl bg-stone-800 px-6 py-4 text-center">
					<p className="text-lg font-bold text-amber-400 animate-pulse">
						שולף כותרות ובוחר נושא...
					</p>
					<p className="mt-1 text-xs text-stone-500">
						קריאת חדשות → בחירת נושא → כתיבת prompt (10-15 שניות)
					</p>
				</div>
			)}

			{error && (
				<div className="rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-300">
					{error}
				</div>
			)}

			{/* Steps revealed progressively */}
			{preview && phase !== "idle" && (
				<div className="space-y-4" key={revealKey}>
					{/* Step A: Previous schnitzels */}
					<StepReveal delay={0}>
						{preview.recentTopics.length > 0 ? (
							<div className="rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3">
								<p className="text-xs font-medium text-stone-400 mb-2">
									שניצלים קודמים השבוע:
								</p>
								<ul className="space-y-0.5">
									{preview.recentTopics.map((t, i) => (
										<li key={i} className="text-xs text-stone-500 py-0.5">
											<span className="text-stone-600">
												{new Date(t.date).toLocaleDateString("he-IL", {
													weekday: "short",
													day: "numeric",
													month: "numeric",
												})}
											</span>{" "}
											<span className="text-amber-400/60">
												{t.schnitzelHeadline}
											</span>
										</li>
									))}
								</ul>
							</div>
						) : (
							<div className="rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3">
								<p className="text-xs text-stone-500">
									אין שניצלים קודמים השבוע — זה הראשון!
								</p>
							</div>
						)}
					</StepReveal>

					{/* Step B: Headlines fetched */}
					<StepReveal delay={300}>
						<div className="rounded-lg border border-stone-800 bg-stone-900/50 px-4 py-3">
							<p className="text-xs font-medium text-stone-400 mb-2">
								📰 נשלפו {preview.headlines.length} כותרות מ-Google News
							</p>
							<details>
								<summary className="cursor-pointer text-xs text-stone-500">
									הצג כותרות
								</summary>
								<ul className="max-h-48 overflow-y-auto mt-2 space-y-0.5">
									{preview.headlines.map((h, i) => {
										const related = preview.curate.relatedHeadlines ?? [];
										const isRelated = related.includes(i + 1);
										return (
											<li
												key={i}
												className={`text-xs py-0.5 ${isRelated ? "font-bold text-amber-400" : "text-stone-500"}`}
											>
												<span className="text-stone-600">
													{i + 1}. [{h.source}]
												</span>{" "}
												{h.headline}
											</li>
										);
									})}
								</ul>
							</details>
						</div>
					</StepReveal>

					{/* Step C: Theme chosen */}
					<StepReveal delay={600}>
						<div className="rounded-lg border border-amber-500/30 bg-stone-900 p-4 space-y-2">
							<p className="text-xs font-medium text-stone-400">
								🧠 הנושא שנבחר{" "}
								<span className="text-stone-600">({preview.curate.model})</span>
							</p>
							<p className="text-sm text-stone-200">{preview.curate.theme}</p>
							<p className="text-xs text-stone-500">
								{preview.curate.reasoning}
							</p>
						</div>
					</StepReveal>

					{/* Step D: Tagline */}
					<StepReveal delay={900}>
						<div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-center">
							<p className="text-xl font-bold text-amber-400">
								{preview.curate.tagline}
							</p>
						</div>
					</StepReveal>

					{/* Step E: Source article link */}
					<StepReveal delay={1050}>
						{(() => {
							const related = preview.curate.relatedHeadlines ?? [];
							const idx = related[0];
							const linked =
								typeof idx === "number" && idx > 0
									? preview.headlines[idx - 1]
									: null;
							return linked?.url ? (
								<div className="rounded-lg border border-stone-700 bg-stone-900/50 px-4 py-3 space-y-1">
									<p className="text-xs font-medium text-stone-400">
										🔗 כתבת המקור שתצורף לציוץ
									</p>
									<p className="text-xs text-stone-500">
										<span className="text-stone-600">[{linked.source}]</span>{" "}
										{linked.headline}
									</p>
									<a
										href={linked.url}
										target="_blank"
										rel="noopener noreferrer"
										className="block truncate text-xs text-sky-500 hover:text-sky-400"
									>
										{linked.url}
									</a>
								</div>
							) : (
								<div className="rounded-lg border border-stone-700 bg-stone-900/50 px-4 py-3">
									<p className="text-xs text-stone-500">
										⚠ לא נמצאה כתבת מקור לצירוף
									</p>
								</div>
							);
						})()}
					</StepReveal>

					{/* Step F: Image prompt */}
					<StepReveal delay={1350}>
						<div className="rounded-lg border border-stone-700 bg-stone-900 p-4 space-y-3">
							<p className="text-xs font-medium text-stone-400">
								🎨 הפרומפט לתמונה{" "}
								<span className="text-stone-600">
									({preview.imagePrompt.model})
								</span>
							</p>

							<div className="rounded-md bg-stone-800 border border-stone-700 p-3">
								<p className="text-xs font-medium text-stone-300 mb-1">
									מה תהיה בתמונה:
								</p>
								<p className="text-sm text-stone-400 leading-relaxed">
									{preview.imagePrompt.essence}
								</p>
							</div>

							<details>
								<summary className="cursor-pointer text-xs text-stone-500">
									הפרומפט המלא
								</summary>
								<p
									className="mt-2 text-xs leading-relaxed text-stone-500 font-mono bg-stone-800 rounded-md p-3 max-h-48 overflow-y-auto"
									dir="ltr"
								>
									{preview.imagePrompt.prompt}
								</p>
							</details>
						</div>
					</StepReveal>

					{/* Generate button */}
					<StepReveal delay={1650}>
						<>
							{phase === "previewed" && (
								<button
									type="button"
									onClick={handleGenerate}
									className="w-full rounded-xl bg-green-600 px-6 py-4 text-xl font-bold text-white transition hover:bg-green-500"
								>
									✅ ייצר תמונה
								</button>
							)}

							{phase === "generating" && (
								<div className="rounded-xl bg-stone-800 border border-green-500/30 px-6 py-4 text-center">
									<p className="text-lg font-bold text-green-400 animate-pulse">
										🍳 מייצר תמונה...
									</p>
									<p className="mt-1 text-xs text-stone-500">
										יצירת תמונה לוקחת 30-60 שניות
									</p>
								</div>
							)}

							{/* Generated image */}
							{generation && (
								<div className="rounded-lg border border-green-500/30 bg-stone-900 overflow-hidden">
									<div className="relative aspect-square w-full">
										<Image
											src={generation.image_path}
											alt={generation.schnitzel_headline}
											fill
											className="object-cover"
										/>
									</div>
									<div className="p-4 text-center">
										<p className="text-lg font-bold text-amber-400">
											{generation.schnitzel_headline}
										</p>
									</div>
								</div>
							)}

							{phase === "done" && generation && (
								<div className="space-y-3">
									{tweetStatus === "idle" && (
										<button
											type="button"
											onClick={handlePostToTwitter}
											className="w-full rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-500"
										>
											Post to X
										</button>
									)}

									{tweetStatus === "posting" && (
										<div className="rounded-xl bg-stone-800 border border-sky-500/30 px-6 py-3 text-center">
											<p className="text-sm font-bold text-sky-400 animate-pulse">
												Posting to X...
											</p>
										</div>
									)}

									{tweetStatus === "posted" && tweetUrl && (
										<a
											href={tweetUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="block w-full rounded-xl bg-sky-600/20 border border-sky-500/30 px-6 py-3 text-center text-sm font-medium text-sky-400 hover:bg-sky-600/30"
										>
											View tweet on X
										</a>
									)}

									{tweetError && (
										<div className="rounded-lg border border-red-800 bg-red-950 p-3 text-xs text-red-300">
											{tweetError}
										</div>
									)}

									<button
										type="button"
										onClick={handlePreview}
										className="w-full rounded-xl bg-stone-700 px-6 py-3 text-sm font-medium text-stone-300 transition hover:bg-stone-600"
									>
										🔄 נסה שוב
									</button>
								</div>
							)}
						</>
					</StepReveal>
				</div>
			)}
		</div>
	);
}
