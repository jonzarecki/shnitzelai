import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
	subsets: ["hebrew", "latin"],
	variable: "--font-heebo",
});

export const metadata: Metadata = {
	title: "שניצל.ai — שניצל בצורה של החדשות",
	description: "חדשות העולם בצורת שניצל — הומור AI שלא ידעתם שאתם צריכים",
	openGraph: {
		title: "שניצל.ai",
		description: "חדשות העולם בצורת שניצל",
		locale: "he_IL",
		type: "website",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="he" dir="rtl" className={heebo.variable}>
			<body className="min-h-screen bg-stone-950 font-sans text-stone-100 antialiased">
				{children}
			</body>
		</html>
	);
}
