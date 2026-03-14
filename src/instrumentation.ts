export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.READONLY_MODE) {
		const { startCronScheduler } = await import("@/lib/cron/scheduler");
		startCronScheduler();
	}
}
