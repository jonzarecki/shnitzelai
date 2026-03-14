# AGENTS.md

## Learned User Preferences

- Keep the admin UI simple: one button to trigger, show results. No configuration dropdowns or model selectors in the UI.
- Show full visibility into the pipeline process: intermediate steps, headlines considered, theme chosen, prompt crafted — all visible before the expensive image generation.
- Always preview before expensive operations. The image generation step should require explicit confirmation after reviewing the prompt.
- Images must be for adults: dark, dry, understated editorial humor. Not cartoon-style, not for kids, not wacky or zany.
- Images should use real people (Trump, Bibi, Putin), country flags, landmarks, and geopolitical signifiers. Schnitzel is ONE subtle element in the scene, not the main subject.
- Tagline must be about the NEWS, not about schnitzels. Written in native colloquial Israeli Hebrew, max 8 words. The image carries the schnitzel — the text is pure news wit.
- One schnitzel per day, not many. The curator synthesizes a single dominant theme from ALL headlines, not picking one article.
- The curator must consider the previous week's topics to avoid repetition and find what's genuinely new about today.
- Use gpt-5.4 for all important LLM calls (curator and prompt engineer). Don't default to cheaper models for quality-sensitive steps.
- Consider non-OpenAI models — OpenAI are not necessarily better. The architecture supports multiple providers (OpenAI, Google, BFL/Flux).
- Logging infrastructure should be file-based and agent-queryable (directory-per-run with JSON/text files), not database-based.
- Meta-instructions in image prompts are fine (compositional intent like "the framing should feel tense"). Don't strip them.

## Learned Workspace Facts

- Pipeline is 3 steps: curator (picks theme + writes tagline) → prompt engineer (crafts image prompt) → image generation.
- Default models: gpt-5.4 for curator, gpt-5.4 for prompt engineer, gpt-image-1.5 for images.
- Run logs stored in `logs/runs/<timestamp>_<ulid>/` with per-step files (headlines, curator I/O, prompt I/O, image meta, image copy).
- Admin page at `/admin/generate` uses a 2-phase flow: preview (cheap LLM calls) → confirm (image generation).
- RSS fetches ALL headlines from Google News Hebrew feed — no filtering or dedup before curation. The curator sees the full picture.
- SQLite DB (`shnitzel.db`) with `news_items` and `generations` tables. No direct DB access outside `src/lib/db/`.
- Cron runs daily at 9am (`croner` package, initialized via Next.js `instrumentation.ts`).
- Tagline is Hebrew (max 8 words, news-first). Theme and reasoning are English (feed into prompt engineer).
- Image style: editorial illustration with real-world signifiers + one subtle schnitzel element. Style prefix injected automatically at image gen time.
- Deployment is local/VPS for now (SQLite needs persistent filesystem). Vercel migration is a follow-up.
- Feed page at `/` is a server component reading directly from DB. Dark theme, RTL Hebrew, Heebo font.
- Authors: Jonathan Zarecki, Matan Kalp, Yoav Halperin.
