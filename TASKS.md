# Tasks

## Completed
- [x] Brainstorm concept with Matan and Yoav (March 10–11, 2026)
- [x] Validate Hebrew IDN domain availability
- [x] Scaffold project with AI-native cookiecutter
- [x] Initialize Next.js 14 project with TypeScript + pnpm + Tailwind
- [x] Set up biome for linting
- [x] Set up vitest for testing
- [x] Configure RTL layout and Hebrew fonts
- [x] Set up SQLite database with better-sqlite3 (schema + connection)
- [x] Build multi-provider AI layer (OpenAI, Google/Gemini, BFL/Flux)
- [x] Build prompt engineering service (news headline → schnitzel prompt + Hebrew headline)
- [x] Build image generation service (prompt → saved image)
- [x] Build RSS news ingestion (Google News)
- [x] Create `/api/generate` endpoint (POST — full pipeline)
- [x] Create `/api/news` endpoint (GET — fetch generated items)
- [x] Create `/api/cron` endpoint + node-cron scheduler
- [x] Create `/api/health` endpoint
- [x] Build `NewsCard` component (image + headline + caption + source)
- [x] Build `NewsFeed` component (responsive grid of cards)
- [x] Build main feed page (`/`)
- [x] Build admin generation page (`/admin/generate`) with model selectors
- [x] Style with Tailwind — Hebrew typography, RTL, mobile-first
- [x] Add error handling for API failures
- [x] Add loading states and empty states
- [x] Add logging utility

## In Progress
- [ ] Test pipeline end-to-end with a manual headline (needs API key)
- [ ] Deploy locally with pm2

## Backlog

### Post-MVP Polish
- [ ] Add rate limiting on generation endpoint
- [ ] Purchase domain (שניצל.com or שניצל.net)
- [ ] Deploy to Vercel (swap SQLite for Turso/LibSQL)

## Follow-up Ideas
- [ ] Social media sharing (OG images, Twitter cards)
- [ ] Hebrew text overlay on generated images
- [ ] Content moderation review queue
- [ ] Merch store
- [ ] Multi-language support (English version)
