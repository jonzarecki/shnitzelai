import Image from "next/image";
import type { GenerationWithNewsItem } from "@/types";

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
				<p className="text-lg font-bold leading-snug text-amber-400">
					{item.schnitzel_headline}
				</p>
				<div className="mt-3 flex items-center justify-between text-xs text-stone-500">
					<time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
				</div>
			</div>
		</article>
	);
}
