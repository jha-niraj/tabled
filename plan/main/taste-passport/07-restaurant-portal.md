# Taste passport 07 - the restaurant profile, menus in the database, and the owner portal

| | |
|---|---|
| **App / module** | `tableadmin/restaurant` + `packages/db` + `main/menu-concierge` |
| **Status** | Planned 2026-10-09 - last diner-independent slice of phase 2, after docs 01, 04, 05, 03 |
| **Opened** | 2026-10-09 |
| **Last updated** | 2026-10-09 |
| **Files** | `packages/db/src/schema.ts`, `apps/tableadmin/app/(main)/restaurant/**`, `apps/tableadmin/actions/restaurant.action.ts`, `apps/main/lib/menu/knowledge.ts`, `apps/main/lib/menu/ingest.ts` |

## What was asked

Niraj, 2026-10-09: "In phase 2 we will move the menus into the database, linked to a restaurant
profile. There will be a profile for each restaurant and an admin view for the restaurant where
they can see and manage all these things. We will scan the menus using Sarvam document
intelligence, which can read a PNG and give us the data; we pass that to the model and it gives
us the structured things. They can upload an image or a video. There will be an admin panel for
the restaurant where they can see the ratings and reviews, from which table, and maybe a little
detail about the user if the user allows it. The order is still taken by the waiter." The
starter admin is now `apps/tableadmin` for exactly this; `apps/admin` is our platform copy.

## What "done" looks like

- A restaurant owner signs in to `tableadmin`, sees only their restaurant, and can edit its
  profile (name, story, hours, address, ambience, chef's note, spice guide).
- Menu sections and dishes are rows in the database. The Tuk Tuk Thai JSON seeds them and the
  diner page reads from the DB.
- "Scan menu" accepts photos or a PDF of a printed menu, runs Sarvam document intelligence,
  has the model fill the dish schema, and shows the result as draft dishes the owner reviews.
- Owners upload images and video per dish to R2; the diner page shows them in the carousel.
- The portal generates one QR per table (`/m/<slug>?t=<n>`), printable.
- Insights: sessions, questions asked, dishes shown and starred, verdicts, by table and week.
  Diner detail only when that diner opted in (doc 04 task 4c).

---

## Tasks

- [ ] **1. Restaurant membership and scoping** - `restaurantMember` (userId, restaurantId,
  role OWNER/STAFF). `tableadmin` resolves the current admin's restaurant and scopes every
  query; SUPER_ADMIN in `apps/admin` sees all.
  - Acceptance: two seeded owners each see only their own restaurant.
  - Verified:

- [ ] **2. Restaurant profile editor** - `/restaurant` in `tableadmin`, fields from
  `Restaurant` in `lib/menu/types.ts`, hero images via R2.
  - Acceptance: edit the chef's note, reload the diner page, the host prompt carries it.
  - Verified:

- [ ] **3. Menu editor** - sections and dishes with every field the dish sheet shows (tagline,
  what arrives, tastes like, texture, spice, profile bars, how to eat, ingredients, allergens,
  dietary tags, pairings, best for). Reorder sections. Mark a dish unavailable.
  - Acceptance: add a dish in the portal, it appears on the diner page and in the host prompt;
    unavailable dishes never show.
  - Verified:

- [ ] **4. Menu scan import** - upload up to 20 images or a PDF; Sarvam document intelligence
  extracts text per page; the model maps it to draft sections and dishes with `confidence`
  per field; owner reviews in a side-by-side screen and accepts.
  - Acceptance: a photo of a printed Thai menu produces at least the names, prices and sections
    correctly; nothing is saved until accepted.
  - Verified:

- [ ] **5. Dish media** - image and video upload to R2 per dish with a poster frame; the
  Wikimedia URLs in the seed stay as a fallback until replaced.
  - Acceptance: an uploaded clip plays in the dish sheet carousel.
  - Verified:

- [ ] **6. Insights** - per week: sessions, questions, dishes shown and starred, verdicts.
  Per table: the last sessions with verdicts. Per diner: only when shared (doc 04 task 4c).
  - Acceptance: matches a hand count on seed sessions; an unshared diner shows no name.
  - Verified:

- [ ] **7. Table QRs** - set the number of tables, generate and print one QR per table.
  - Acceptance: scanning table 12's QR opens the diner page with "Table 12" in the header.
  - Verified:

- [ ] **8. Reviews** - the restaurant's platform ratings (Google, Zomato, Swiggy Dineout) stay
  as fields the owner fills; the diner verdicts are shown separately and never published.
  - Acceptance: the diner info sheet still shows the platform ratings.
  - Verified:

- [-] **9. Ordering and POS** - not in phase 2. The waiter takes the order; the diner has the
  my-picks tray (doc 04 task 7).

- [-] **10. A separate restaurant portal app** - decided against on 2026-10-09; `tableadmin` is
  the portal and `apps/admin` is our copy.

---

## Verification pass

- [ ] Typecheck `tableadmin`, `admin`, `@repo/db`, `main`
- [ ] Owner flow walked end to end on desktop; diner page checked on phone after each edit
- [ ] Niraj runs: a real menu scan with photos of the actual Tuk Tuk Thai menu

## Notes / decisions

- The dish schema in the DB mirrors `lib/menu/types.ts` so the host prompt builder does not
  change when the source moves from JSON to rows.
- Sarvam document intelligence is the OCR; the structuring is the same LLM provider switch as
  the host, so it moves to OpenAI or Claude when the rest does.
