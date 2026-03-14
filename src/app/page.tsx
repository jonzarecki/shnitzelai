import { getGenerations } from "@/lib/db/queries";
import { NewsFeed } from "@/components/NewsFeed";

export const dynamic = "force-dynamic";

export default function Home() {
	const items = getGenerations(1, 30);

	return (
		<main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<header className="mb-10 text-center">
				<h1 className="text-5xl font-black tracking-tight text-amber-400 sm:text-6xl">
					שניצל.ai
				</h1>
				<p className="mt-3 text-lg text-stone-400">
					שניצל בצורה של החדשות
				</p>
			</header>
			<NewsFeed items={items} />
		</main>
	);
}
