import type { GenerationWithNewsItem } from "@/types";
import Image from "next/image";

interface NewsCardProps {
	item: GenerationWithNewsItem;
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString("he-IL", {
			day: "numeric",
			month: "long",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso;
	}
}

export function NewsCard({ item }: NewsCardProps) {
	const hasUrl = item.original_url && item.original_url.length > 0;

	return (
		<article className="group overflow-hidden rounded-2xl bg-stone-900 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-2xl">
			<div className="relative aspect-square w-full overflow-hidden">
				<Image
					src={item.image_path}
					alt={item.schnitzel_headline}
					fill
					className="object-cover transition-transform group-hover:scale-105"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
				/>
			</div>
			<div className="p-5">
				{hasUrl ? (
					<a
						href={item.original_url}
						target="_blank"
						rel="noopener noreferrer"
						className="block text-lg font-bold leading-snug text-amber-400 underline decoration-amber-400/30 underline-offset-2 hover:text-amber-300 hover:decoration-amber-300/60 transition"
					>
						{item.schnitzel_headline}
					</a>
				) : (
					<p className="text-lg font-bold leading-snug text-amber-400">
						{item.schnitzel_headline}
					</p>
				)}
				<div className="mt-3 flex items-center justify-between text-xs text-stone-500">
					{item.original_source && <span>{item.original_source}</span>}
					<time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
				</div>
			</div>
		</article>
	);
}
