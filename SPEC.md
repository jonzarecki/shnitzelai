# ShnitzelAI — Product Spec

**שניצל.ai** — an AI-powered humor website that generates schnitzel-themed versions of current news and world events.

"The Onion" meets AI image generation — but everything is schnitzel.

## Vision

Take real, trending news topics (politics, world events, pop culture) and reimagine them as schnitzel-themed content. An AI model generates absurdist images: current events presented as, or through the lens of, schnitzels.

The phrase that captures it: **"שניצל בצורה של החדשות"** — schnitzel in the form of the news.

## Authors

- Jonathan Zarecki
- Matan Kalp
- Yoav Halperin

## MVP Scope

### 1. News Ingestion

Fetch trending news headlines from one or more sources:

- **Option A** (simplest): Google News RSS feed — free, no API key, returns trending headlines
- **Option B**: NewsAPI.org — free tier (100 req/day), structured JSON, category filtering
- **Option C**: Manual curation — admin enters a headline/topic, system generates from it

MVP starts with **Option C** (manual input) with a stretch goal of **Option A** (RSS).

**Data extracted per news item:**
- Headline (string)
- Summary / description (1–2 sentences)
- Source name
- Category (politics, world, tech, culture, etc.)
- Original URL

### 2. Prompt Engineering Pipeline

Transform a news headline + summary into an image generation prompt:

1. Take the news item (headline + summary)
2. Use an LLM (GPT-4o or similar) to generate:
   - A **schnitzel-themed image prompt** — describe the news event but replace key elements with schnitzels
   - A **funny Hebrew headline** — the news rewritten in schnitzel terms
   - An optional **short caption** (1–2 sentences of absurdist commentary)
3. The prompt should be specific enough for high-quality image generation

**Example:**
- Input: "Trump announces new tariffs on European imports"
- Image prompt: "A golden crispy schnitzel wearing a red tie standing at a presidential podium, announcing sanctions on a group of worried-looking European schnitzels, photorealistic editorial cartoon style"
- Headline: "שניצל טראמפ מטיל מכסים על שניצלי אירופה"

### 3. Image Generation

Use OpenAI's image generation API to produce the schnitzel news images.

- **Model**: gpt-image-1 (or DALL-E 3, whichever is current)
- **Style**: Consistent visual style across all images — photorealistic with editorial cartoon flair
- **Size**: 1024x1024 (square, good for social sharing)
- **Storage**: Save generated images to local filesystem (`public/generated/`) with metadata

### 4. Frontend — News Feed

A single-page feed displaying generated schnitzel news items:

- **Layout**: Responsive grid/masonry of cards
- **Each card shows**:
  - Generated schnitzel image
  - Funny Hebrew headline
  - Optional caption
  - Original news source attribution (small, below)
  - Timestamp
- **Sorting**: Newest first
- **No auth required** — public site

### 5. Admin / Generation Trigger

A simple way to trigger content generation:

- **MVP**: A dev-only route (`/admin/generate`) with a text input for a news headline
- **Later**: Automated pipeline with RSS ingestion + cron scheduling

### 6. Data Storage

Keep it simple for MVP:

- **SQLite** via better-sqlite3 (synchronous, no ORM overhead)
- **Schema**:
  - `news_items` table: id, original_headline, original_summary, original_source, original_url, category, created_at
  - `generations` table: id, news_item_id, image_path, schnitzel_headline, caption, prompt_used, model_used, created_at

## Domain

- **Preferred**: שניצל.ai (Hebrew IDN + .ai TLD) — expensive (~$80+/year)
- **Alternatives**: שניצל.com, שניצל.net (has a retro vibe)
- **Decision**: TBD — purchase after MVP is working

## Language & Locale

- Primary language: **Hebrew** (RTL)
- Headlines and captions generated in Hebrew
- UI chrome in Hebrew
- English support is a nice-to-have, not MVP

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Package manager**: pnpm
- **Database**: SQLite via better-sqlite3
- **AI APIs**: OpenAI (GPT-4o for prompt engineering, gpt-image-1 for image generation)
- **Deployment**: Vercel (with serverless function limitations considered)
- **Styling**: Tailwind CSS

## Non-Functional Requirements

- Page load < 2s (images lazy-loaded)
- Mobile-first responsive design
- RTL layout support throughout
- Rate limiting on generation endpoint
- Error handling for API failures (OpenAI downtime, rate limits)

## Open Questions

1. Which domain to actually purchase?
2. Automated news ingestion frequency — hourly? daily?
3. Content moderation — should generated content be reviewed before publishing?
4. Monetization — just for fun, or explore ads/merch if it goes viral?
5. Social sharing — auto-post to Twitter/Instagram?
6. Image style — should there be a signature visual style or vary per topic?

## Out of Scope (Post-MVP)

- User accounts / auth
- Comments or social features
- Multi-language support
- Custom image editing
- Mobile app
- Merch store
- Automated social media posting
