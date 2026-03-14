# Architecture

## Overview

ShnitzelAI is a Next.js 14 application that ingests news headlines, transforms them into schnitzel-themed prompts via an LLM, generates images via OpenAI's image API, and displays the results in a public Hebrew RTL feed.

## File Tree (Planned)

```
shnitzelai/
├── IDEA.md                     # Original concept doc
├── CLAUDE.md                   # Developer guide
├── SPEC.md                     # Product spec
├── ARCH.md                     # This file
├── TASKS.md                    # Task tracking
├── .context/                   # AI memory bank
├── .claude/                    # Claude config, hooks, skills
├── .cursor/                    # Cursor rules
├── docs/
│   └── reference/              # Chat transcripts, brainstorm notes
├── public/
│   └── generated/              # Generated schnitzel images (gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (RTL, Hebrew, fonts)
│   │   ├── page.tsx            # Main feed page
│   │   ├── admin/
│   │   │   └── generate/
│   │   │       └── page.tsx    # Manual generation trigger
│   │   └── api/
│   │       ├── generate/
│   │       │   └── route.ts    # POST — run generation pipeline
│   │       └── news/
│   │           └── route.ts    # GET — fetch generated items
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts        # Database connection + setup
│   │   │   ├── schema.ts       # Table definitions
│   │   │   └── queries.ts      # Query functions
│   │   ├── openai/
│   │   │   ├── client.ts       # OpenAI client singleton
│   │   │   ├── prompts.ts      # Prompt engineering (news → schnitzel prompt)
│   │   │   └── images.ts       # Image generation wrapper
│   │   └── news/
│   │       ├── fetcher.ts      # News ingestion (RSS / manual)
│   │       └── types.ts        # News item types
│   ├── components/
│   │   ├── NewsFeed.tsx        # Grid of schnitzel cards
│   │   ├── NewsCard.tsx        # Single schnitzel news card
│   │   └── GenerateForm.tsx    # Admin generation form
│   └── types/
│       └── index.ts            # Shared type definitions
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── biome.json
```

## Components

### News Ingestion (`src/lib/news/`)
Fetches or receives news headlines. MVP: manual input via admin form. Later: Google News RSS feed parsing.

### Prompt Engineering (`src/lib/openai/prompts.ts`)
Takes a news item and generates a schnitzel-themed image prompt + funny Hebrew headline using GPT-4o. The prompt instructs the model to replace key elements of the news with schnitzels while maintaining recognizability.

### Image Generation (`src/lib/openai/images.ts`)
Calls OpenAI's image generation API (gpt-image-1) with the engineered prompt. Saves the resulting image to `public/generated/` and returns the local path.

### Database (`src/lib/db/`)
SQLite via better-sqlite3. Stores news items and their generated schnitzel versions.

### Frontend (`src/app/`, `src/components/`)
Hebrew RTL feed page showing generated content in a responsive grid. Each card displays the schnitzel image, Hebrew headline, caption, and original source attribution.

## Data Model

### `news_items`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (ULID) | Primary key |
| original_headline | TEXT | Original news headline |
| original_summary | TEXT | Short description |
| original_source | TEXT | News source name |
| original_url | TEXT | Link to original article |
| category | TEXT | politics, world, tech, culture, etc. |
| created_at | TEXT (ISO) | When ingested |

### `generations`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (ULID) | Primary key |
| news_item_id | TEXT | FK → news_items.id |
| image_path | TEXT | Path to generated image |
| schnitzel_headline | TEXT | Funny Hebrew headline |
| caption | TEXT | Optional absurdist caption |
| prompt_used | TEXT | The image generation prompt |
| model_used | TEXT | Which model generated this |
| created_at | TEXT (ISO) | When generated |

## Deployment

### Fly.io (Production)

The app deploys to Fly.io via a multi-stage Docker build (`Dockerfile`, `fly.toml`).

- **App name**: `shnitzelai`
- **Region**: `iad`
- **Persistent volume** mounted at `/data`:
  - `/data/shnitzel.db` — SQLite database
  - `/data/generated/` — generated schnitzel images
- The start script (`tooling/scripts/start.sh`) symlinks `/data/generated` into `public/generated` so Next.js serves images at `/generated/*`.
- Machines auto-stop when idle and auto-start on request.

### Local → Remote Sync

Content is generated locally and pushed to the remote Fly machine:

| Script | Command | What it does |
|--------|---------|--------------|
| `pnpm sync:images` | `sync-to-fly.sh images` | Incremental push of new images to `/data/generated/` |
| `pnpm sync:db` | `sync-to-fly.sh db` | Push SQLite DB (with WAL checkpoint) to `/data/shnitzel.db` |
| `pnpm sync:all` | `sync-to-fly.sh all` | Push both DB and images |
| `pnpm fly:deploy` | `flyctl deploy --remote-only` | Full app redeploy |

### Environment Variables (Production)

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_PATH` | `/data/shnitzel.db` | SQLite DB on persistent volume |
| `GENERATED_DIR` | `/data/generated` | Image storage on persistent volume |
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | |

### File Tree (Deployment)

```
tooling/
└── scripts/
    ├── start.sh            # Container entrypoint (symlink + exec node)
    └── sync-to-fly.sh      # Local-to-remote file sync via flyctl sftp
Dockerfile                  # Multi-stage build (deps → build → runner)
fly.toml                    # Fly.io app config
.dockerignore               # Excludes dev artifacts from Docker build
```

## External Dependencies

- **OpenAI API**: GPT-4o (prompt engineering) + gpt-image-1 (image generation)
- **News source**: Google News RSS (stretch) or manual input (MVP)
- **Deployment**: Fly.io with persistent volume for DB + images
