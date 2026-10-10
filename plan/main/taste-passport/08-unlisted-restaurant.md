# Taste passport 08 - a restaurant that is not on Tabled yet

| | |
|---|---|
| **App / module** | `main/taste-passport` + `packages/exa` + `packages/firecrawl` |
| **Status** | Planned 2026-10-09 - phase 2, after 03 (the pre-visit flow is where it is hit) |
| **Opened** | 2026-10-09 |
| **Last updated** | 2026-10-09 |
| **Files** | `packages/exa/src/index.ts`, `packages/firecrawl/src/index.ts`, `apps/main/lib/menu/discover.ts` (new), `apps/main/lib/menu/knowledge.ts` |

## What was asked

Niraj, 2026-10-09: "Whenever someone researches a restaurant, they might not find it on the
platform. In that case we should use a third-party thing, like Firecrawl or Exa, which I have
already copied into the packages. Add it as a task list for phase 2, not now."

## What "done" looks like

- A diner searching for a restaurant that has no row in `restaurant` still gets an answer:
  Tabled finds the place on the web, pulls what is public (menu page, Zomato or Google listing,
  reviews), builds a thin "shadow" restaurant the host can talk about, and marks it as
  unverified in the UI.
- The shadow record is cached so the second diner does not pay for the same crawl.
- A shadow restaurant can be claimed by its owner from `tableadmin`, which turns it into a real
  profile (doc 07) without losing the sessions and intents recorded against it.

## Open questions

- Whether the shadow host should show dish cards at all, since there are no verified images or
  allergens. Assumption: text-only answers, allergens always "not listed, ask the server", no
  cards until the restaurant claims the profile.
- Whether to search by name only or name plus city. Assumption: name plus the city from the
  diner's profile or device locale, because restaurant names collide across cities.

---

## Tasks

- [ ] **1. `@repo/errors`** - both `packages/exa` and `packages/firecrawl` import `AppError`
  from `@repo/errors`, which does not exist in this repo. Copy it from the source monorepo or
  write the minimal class here. Add the three packages to the workspace and to `apps/main`.
  - Acceptance: `pnpm --filter @repo/exa check-types` and `--filter @repo/firecrawl` pass.
  - Verified:

- [ ] **2. Discovery** - `discover.ts` calls `exaSearch` with the restaurant name and city,
  category restricted to the known listing domains (Zomato, Swiggy Dineout, Google Maps, the
  restaurant's own site), and returns the best candidate URLs with a confidence.
  - Acceptance: "Tuk Tuk Thai Bangalore" returns its Zomato page in the top three.
  - Verified:

- [ ] **3. Retrieval** - `scrape` (Firecrawl) on the chosen menu or listing page, markdown
  out, then the model (via `llm.ts`, doc 01 task 7) maps it to a draft `Restaurant` with
  sections and dishes, every field marked `unverified`.
  - Acceptance: a scraped menu page produces names, prices and sections; no images, no
    allergens.
  - Verified:

- [ ] **4. Shadow restaurant row** - `restaurant.status = 'shadow'`, `sourceUrls` jsonb,
  `discoveredAt`; the diner page shows an "Unverified, from the web" strip; the host prompt
  gets a rule to say so when asked about allergens or availability.
  - Acceptance: `/m/<shadow-slug>` works; the strip shows; an allergen question answers "not
    listed, ask the server".
  - Verified:

- [ ] **5. Claim flow** - an owner signing up in `tableadmin` can search shadow restaurants
  and claim one; status flips to `claimed`, the owner reviews every dish (doc 07 task 4 review
  screen) before anything is marked verified.
  - Acceptance: claiming keeps the shadow's `tableSession` and `visitIntent` rows.
  - Verified:

- [ ] **6. Cost and cache** - one Exa search plus at most two Firecrawl scrapes per new
  restaurant; results cached on the row; re-crawl only on owner request or after 90 days.
  - Acceptance: the second search for the same place makes zero provider calls.
  - Verified:

---

## Verification pass

- [ ] Typecheck: `pnpm --filter main check-types`, plus the three packages
- [ ] A real unlisted restaurant searched, opened, chatted with, then claimed
- [ ] Niraj runs: `EXA_API_KEY` and `FIRECRAWL_API_KEY` into `apps/main/.env`

## Notes / decisions

- Exa for finding, Firecrawl for reading. The header comment in `packages/firecrawl` records
  the measured reason: Exa lost 0/5 on discovery-by-URL but is cheaper with content, Firecrawl
  gets through bot protection and keeps tables.
- `packages/sarvamai` (document digitise) is for doc 07's menu scan, not for this doc.
