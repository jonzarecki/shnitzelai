# System Patterns

## General Conventions
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Strict typing everywhere — no `any`
- Update `.context/progress.md` after completing tasks
- Reference `SPEC.md` for product requirements
- No `console.log` in committed code

## Naming
- Pages: `src/app/<route>/page.tsx` (Next.js App Router convention)
- API routes: `src/app/api/<resource>/route.ts`
- Library code: `src/lib/<domain>/<module>.ts`
- Components: `src/components/<ComponentName>.tsx` (PascalCase)
- Types: `src/types/index.ts` for shared types
- DB queries: `src/lib/db/queries.ts` — all database access centralized here

## Database
- All DB access through `src/lib/db/` — no direct SQLite usage elsewhere
- Synchronous API (better-sqlite3) — no async/await for DB calls
- ULID for primary keys

## Content Pipeline
- Manual trigger (MVP): admin form → API route → prompt engineering → image generation → save
- Future: RSS feed → automated pipeline → scheduled generation

## RTL / Hebrew
- Root layout sets `dir="rtl"` and `lang="he"`
- Tailwind RTL utilities where needed
- Hebrew fonts loaded via Next.js font optimization
