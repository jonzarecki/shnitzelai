# ShnitzelAI

AI-powered humor website that generates schnitzel-themed versions of current news. שניצל בצורה של החדשות.

## Quick start
```bash
pnpm install
pnpm dev        # starts Next.js dev server → http://localhost:3000
```

## Build & test
```bash
pnpm build      # production build
pnpm test       # run tests (vitest)
pnpm typecheck  # TypeScript strict check
pnpm lint       # biome lint
pnpm lint:fix   # auto-fix lint issues
```

## Architecture
- Next.js 14 App Router, TypeScript strict, Tailwind CSS
- SQLite via better-sqlite3 for generated content storage
- OpenAI API for prompt engineering (GPT-4o) and image generation (gpt-image-1)
- See `ARCH.md` for full architecture and file tree
- See `SPEC.md` for detailed product spec

## Key pages
| Route | Purpose |
|-------|---------|
| `/` | Main feed — grid of schnitzel news items |
| `/admin/generate` | Dev trigger for content generation |

## Key API routes
| Route | Purpose |
|-------|---------|
| `/api/generate` | Trigger news → schnitzel generation pipeline |
| `/api/news` | Fetch generated schnitzel news items |

## Non-negotiables
- TypeScript strict mode everywhere
- No `any` types
- No `console.log` in committed code (use proper logging)
- Every new module must have tests
- Reference `SPEC.md` for product requirements

## How to work here
- Small incremental commits with conventional messages (`feat:`, `fix:`, `refactor:`, etc.)
- Update `.context/progress.md` after completing tasks
- Update `.context/activeContext.md` when switching focus
- Run `/status` to see current project state
- Run `/plan` to decide what to work on next
- Run `/review` before committing

## Forbidden patterns
- No `any` types
- No `console.log` in committed code (use proper logging)
- No direct DB access outside `src/lib/db/`
- No new top-level folders without updating ARCH.md
