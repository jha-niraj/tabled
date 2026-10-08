# Taste passport 03 - the pre-arrival note (visit intent)

| | |
|---|---|
| **App / module** | `main/taste-passport` |
| **Status** | Planned - questions answered 2026-10-09; builds after docs 01, 04, 05 |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-09 |
| **Files** | `apps/main/app/(main)/going/**`, `apps/main/actions/intent.action.ts`, `apps/main/lib/menu/intent.ts` |

## What was asked

"Before leaving home, before leaving the office for lunch, they choose a restaurant from the
mobile, start a voice note, and record: I wanted to eat something like this, this, this. In the
background we process all those things. When they reach the restaurant and open the mobile, the
menu is there and what they would like is already there."

## What "done" looks like

- `/going` lists restaurants on the platform (one today) with search.
- Tapping one opens a mic. A 20-second note is transcribed, the situational layer is extracted,
  and a `visitIntent` row is written. Notes are kept forever as text.
- The diner sees "Noi will have a shortlist ready at Tuk Tuk Thai" and can re-record or cancel.
- When `/m/tuk-tuk-thai` opens for that diner, the host uses the newest note for that restaurant
  that no visit has consumed yet (doc 04). Older notes stay as history on `/taste/history`.

## Decisions (2026-10-09)

Notes live forever (Niraj: "it's the user telling something they want, it's just text, store
it"). No expiry column; `consumedAt` marks the visit that used it. No push, no background job.

---

## Tasks

- [ ] **1. Restaurant registry** - `lib/menu/knowledge.ts` already lists slugs; add name,
  neighbourhood, cuisine, and a cover image to a `listRestaurants()` for the picker.
  - Acceptance: `/going` renders the list from the JSON files.
  - Verified:

- [ ] **2. Intent extraction prompt** - transcript in, `situational` out: mood, hunger, company
  (alone, two, group, kids), budget hint, time, explicit wants and avoids, "surprise me" flag.
  - Acceptance: five sample notes produce valid JSON; "going with my parents, nothing spicy"
  yields company=family and spice=mild.
  - Verified:

- [ ] **3. `/going/[slug]` record screen** - mic, transcript shown back, "sounds right" and
  "re-record".
  - Acceptance: a row appears in `visitIntent`; the newest unconsumed one is what the host reads.
  - Verified:

- [ ] **4. Voice clip to R2** - stored under `voice/<userId>/<intentId>`, key saved on the row.
  - Acceptance: object exists; lifecycle rule from doc 01 applies.
  - Verified:

- [ ] **5. Active intents on the home page** - "Heading to Tuk Tuk Thai, shortlist ready",
  with cancel.
  - Acceptance: cancel sets `consumedAt` and the card disappears.
  - Verified:

- [ ] **6. Consumed notes** - a note is marked consumed when a table session for that
  restaurant uses it; it then drops off the home card and stays in history.
  - Acceptance: after a QR open the home card disappears; `/taste/history` lists the note.
  - Verified:

- [-] **7. Background processing with Durable Objects** - not in phase 2. Extraction takes two
  seconds inline. Listed so it is not re-argued; see `06-cloudflare-deploy.md`.

---

## Verification pass

- [ ] Typecheck and lint
- [ ] `/going`, `/going/tuk-tuk-thai`, home card opened on phone width
- [ ] Niraj runs: a real note from the office, then the table page within the hour

## Notes / decisions

- "In the background" in the original thought is satisfied by inline extraction at record time.
  The thing the diner cares about is that the shortlist is ready when they arrive, not where the
  computation ran.
