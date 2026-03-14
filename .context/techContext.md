# Tech Context

## Stack
- **Language**: TypeScript (strict mode)
- **Framework**: Next.js 14 (App Router)
- **Package manager**: pnpm
- **Database**: SQLite via better-sqlite3 (synchronous API)
- **Styling**: Tailwind CSS
- **Linting**: Biome
- **Testing**: Vitest
- **AI APIs**: OpenAI (GPT-4o for text, gpt-image-1 for images)
- **Deployment**: Vercel

## Key Technical Decisions Made
- Single Next.js codebase (no monorepo) — simplicity for MVP
- SQLite for storage — no external DB dependency, easy to start
- better-sqlite3 (sync API) — same pattern as validator.human
- Hebrew RTL as primary layout direction
- Images saved to `public/generated/` (gitignored)

## Key Technical Decisions Pending
- News ingestion source (Google News RSS vs. manual-only for MVP)
- Image generation model (gpt-image-1 vs. DALL-E 3 — depends on availability/quality)
- Vercel serverless timeout limits — may need to handle long image generation async
- Domain purchase and DNS configuration
