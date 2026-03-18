import { GenerationCard } from "@/components/GenerationCard";
import { getGenerations } from "@/lib/db/queries";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminHistoryPage() {
	if (process.env.DISABLE_ADMIN) {
		redirect("/");
	}

	const items = getGenerations(1, 100);

	return (
		<main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
			<header className="mb-8 text-center">
				<h1 className="text-3xl font-black text-amber-400">
					היסטוריית שניצלים
				</h1>
				<p className="mt-2 text-sm text-stone-500">
					כל השניצלים שנוצרו — פרסם לטוויטר
				</p>
			</header>

			{items.length === 0 ? (
				<div className="rounded-xl border border-stone-800 bg-stone-900 p-8 text-center">
					<p className="text-stone-500">עדיין אין שניצלים. לכו לייצר!</p>
				</div>
			) : (
				<div className="space-y-3">
					{items.map((item) => (
						<GenerationCard
							key={item.id}
							id={item.id}
							imagePath={item.image_path}
							tagline={item.schnitzel_headline}
							originalHeadline={item.original_headline}
							originalSource={item.original_source}
							originalUrl={item.original_url}
							createdAt={item.created_at}
							tweetId={item.tweet_id}
						/>
					))}
				</div>
			)}

			<nav className="mt-8 flex justify-center gap-4">
				<Link
					href="/admin/generate"
					className="text-sm text-stone-500 underline hover:text-stone-300"
				>
					← מטבח השניצלים
				</Link>
				<Link
					href="/"
					className="text-sm text-stone-500 underline hover:text-stone-300"
				>
					חזרה לפיד
				</Link>
			</nav>
		</main>
	);
}
