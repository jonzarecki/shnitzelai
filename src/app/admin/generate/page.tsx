import { GenerateForm } from "@/components/GenerateForm";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminGeneratePage() {
	if (process.env.DISABLE_ADMIN) {
		redirect("/");
	}

	return (
		<main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
			<header className="mb-8 text-center">
				<h1 className="text-3xl font-black text-amber-400">מטבח השניצלים</h1>
				<p className="mt-2 text-sm text-stone-500">
					שולף 3 כותרות מ-Google News, מייצר שניצלים, מפרסם לפיד
				</p>
			</header>
			<GenerateForm />
			<nav className="mt-8 flex justify-center gap-4">
				<Link
					href="/admin/history"
					className="text-sm text-stone-500 underline hover:text-stone-300"
				>
					היסטוריה →
				</Link>
				<Link
					href="/"
					className="text-sm text-stone-500 underline hover:text-stone-300"
				>
					← חזרה לפיד
				</Link>
			</nav>
		</main>
	);
}
