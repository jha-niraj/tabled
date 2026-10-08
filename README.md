# Tabled

**The table host who already knows you.**

You sit down, the menu is twenty pages, and you cannot picture a single dish. Tabled is the QR
code on the table that opens a host instead of a PDF. It asks one question at a time, drops what
you do not want, shows you the dish properly - photo, video, what it tastes like compared to
something you know, how to eat it - and answers in whatever language you speak to it.

The restaurant is the customer. Guests who are not confused order faster, eat what they hoped
for, and leave better reviews.

## Status

| | |
|---|---|
| **Prototype** | Live at `/m/tuk-tuk-thai` in `apps/main`. One pure-veg Thai restaurant, 26 dishes, voice and text, no accounts. See `plan/main/menu-concierge/prototype.md`. |
| **Phase 2** | Planned in `plan/main/taste-passport/`: diner accounts that learn your taste from conversations, a note you record before you arrive, a host that greets you by name, an after-meal "was it what you expected?", and a restaurant portal with menus in the database and menu scanning. Questions and answers in `questions.md` there. |
| **Deploy** | Cloudflare Workers, planned. Runs locally today. |

## Try it

```bash
pnpm install
cp apps/main/.env.example apps/main/.env   # or create it: SARVAM_API_KEY=... and SKIP_ENV_VALIDATION=1
cd apps/main && pnpm exec next dev --port 5000
```

Open `http://localhost:5000/m/tuk-tuk-thai`. A printable table QR is at `/m/tuk-tuk-thai/qr`.
To test on a phone, open the QR page using your laptop's LAN IP so the code points there.

## How the prototype works

- **Knowledge base** - `apps/main/data/restaurants/tuk-tuk-thai.json`. Every dish carries what
  arrives at the table, what it tastes like, texture, spice, a taste profile, how to eat it,
  ingredients, allergens, dietary tags, pairings, ratings and review snippets, images and video.
  Media is Creative Commons from Wikimedia Commons, URL-verified.
- **The host** - `apps/main/lib/menu/knowledge.ts` builds one system prompt from the JSON.
  The model replies with a small JSON object: what to say, which dish ids to show, one optional
  question with tappable answers, and notes to remember. The UI renders cards and carousels from
  the ids, so the model never invents a dish or a URL.
- **Model** - Sarvam `sarvam-105b` via `apps/main/lib/menu/sarvam.ts`, JSON mode, with
  `reasoning_effort: null` (hidden reasoning otherwise consumes the whole budget). Swappable
  for OpenAI or Claude behind one file.
- **Voice** - push-to-talk in the browser, Sarvam `saaras:v4` speech-to-text with automatic
  language detection and code-mixed output. The detected language is passed back to the host so
  it replies in kind. Voice is input only; the host never talks out loud at the table.
- **Routes** - `POST /api/menu/chat`, `POST /api/menu/stt`, pages under `apps/main/app/m/`,
  components under `apps/main/components/menu/`.

## Workspace

```
apps/
  main/        -> diner-facing app, QR host at /m/[slug]       (port 3000; run on 5000 locally)
  tableadmin/  -> Tabled Admin, the restaurant owner's portal  (port 3001)
  admin/       -> Tabled Platform, internal admin for us       (port 3002)
packages/
  auth/        -> @repo/auth     Better Auth (email, Google, magic link planned)
  db/          -> @repo/db       Drizzle ORM + Postgres (Neon planned)
  storage/     -> @repo/storage  Cloudflare R2
  ui/          -> @repo/ui       Shadcn components, loaders, DataTable
```

`tableadmin` and `admin` started as the same starter admin and will diverge: one for restaurant
owners (menu, media, table QRs, insights), one for the Tabled team.

## Working here

- Every job gets a doc in `plan/` before the work starts. `plan/INDEX.md` is the list of what is
  open. `plan/README.md` has the rules.
- Questions to Niraj go through the AskUserQuestion tool with a recommended answer first.
- `CLAUDE.md` holds the stack, conventions, and the full route and action reference for all
  three apps.

---

## Starter notes (original template README)

A batteries-included monorepo starter built with Turborepo. Comes pre-wired with **Drizzle ORM**, **Better Auth**, and a full **admin panel** — so you ship features instead of boilerplate.

## What's inside

```
apps/
  main/   → customer-facing Next.js app  (port 3000)
  admin/  → admin dashboard              (port 3001)
packages/
  auth/   → @repo/auth  — Better Auth (email/password + Google OAuth)
  db/     → @repo/db    — Drizzle ORM + PostgreSQL schema
  ui/     → @repo/ui    — Shared Shadcn/ui component library
```

## Tech stack

- **Framework**: Next.js 15 (App Router, React 19)
- **ORM**: Drizzle ORM + postgres.js
- **Auth**: Better Auth
- **UI**: Shadcn/ui + Tailwind CSS v4
- **Monorepo**: Turborepo + pnpm workspaces
- **Language**: TypeScript 5.9

## Quick start

```bash
# 1. Copy env and fill in DATABASE_URL + BETTER_AUTH_SECRET
cp .env.example .env

# 2. Install dependencies
pnpm install

# 3. Push schema to the database
pnpm --filter @repo/db db:push

# 4. Run all apps
pnpm dev
```

Visit `http://localhost:3000` for the main app and `http://localhost:3001` for the admin panel.

## Environment variables

```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<random 32+ char string>

# Optional — Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App URLs (for trusted origins)
MAIN_APP_URL=http://localhost:3000
ADMIN_APP_URL=http://localhost:3001
```

## Common tasks

```bash
pnpm dev                              # run all apps
pnpm build                            # build all apps
pnpm --filter @repo/db db:push        # sync schema to DB (dev)
pnpm --filter @repo/db db:generate    # generate migration files (prod)
pnpm --filter @repo/db db:migrate     # apply migrations (prod)
pnpm --filter @repo/db db:studio      # open Drizzle Studio
```

For full documentation, see [CLAUDE.md](./CLAUDE.md).
