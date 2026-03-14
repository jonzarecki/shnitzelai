import type { GenerationWithNewsItem } from "@/types";
import { NewsCard } from "./NewsCard";

interface NewsFeedProps {
	items: GenerationWithNewsItem[];
}

export function NewsFeed({ items }: NewsFeedProps) {
	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<span className="text-6xl">🍗</span>
				<h2 className="mt-6 text-2xl font-bold text-stone-300">
					עדיין אין שניצלים כאן
				</h2>
				<p className="mt-2 text-stone-500">
					השניצלים עוד בטיגון. חזרו בקרוב!
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{items.map((item) => (
				<NewsCard key={item.id} item={item} />
			))}
		</div>
	);
}
