/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	images: {
		remotePatterns: [],
	},
	experimental: {
		instrumentationHook: true,
		serverComponentsExternalPackages: ["better-sqlite3", "node-cron"],
	},
};

export default nextConfig;
