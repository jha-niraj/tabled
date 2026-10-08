# Taste passport 04 - the host already knows you

| | |
|---|---|
| **App / module** | `main/taste-passport` |
| **Status** | Planned - questions answered 2026-10-09; first diner-facing slice after doc 01 |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-09 |
| **Files** | `apps/main/app/m/[slug]/page.tsx`, `apps/main/app/api/menu/chat/route.ts`, `apps/main/lib/menu/knowledge.ts`, `apps/main/components/menu/concierge.tsx` |

## What was asked

"When they reach the restaurant, instead of asking this many things, we already have the things
they would like." The QR page should open already knowing the diner, without taking anything away
from someone who just scans anonymously.

## What "done" looks like

- Anonymous scan: unchanged. Greeting, three loved dishes, chilli question.
- Signed-in diner with a profile: "Welcome back, Niraj", 3 to 4 dishes chosen against the
  profile, at most one confirmation question, and only when needed (E1).
- Signed-in diner with a live intent: the same, but the shortlist reflects the note, and the
  host says in one line what it heard ("you said light and not spicy, so...").
- Hard constraints are filters the host cannot cross. Everything else the diner can override at
  the table.
- The restaurant sees nothing about the person (E3).

## Decisions (2026-10-09)

One confirmation question max. "Surprise me" can break habits, hard constraints never. No
ordering integration, no groups. Accounts come from an in-chat nudge after the first shortlist,
once per session, one tap, no form. The QR URL carries the table number (`?t=12`). A diner can
opt in per restaurant to share preferences with the restaurant; hidden by default.

---

## Tasks

- [ ] **1. Server-side session on the QR page** - `page.tsx` calls `getServerSession()`, loads
  profile and the newest unexpired intent, passes a `diner` prop. Null when anonymous.
  - Acceptance: anonymous render is byte-identical to today.
  - Verified:

- [ ] **2. Personalised opening without a model call** - a deterministic `openingFor(diner,
  restaurant)` picks the shortlist from profile and intent (hard filters, then tag and taste
  scoring, then rating), writes the greeting, and decides whether a confirmation question is
  due.
  - Acceptance: a profile with peanut allergy never shows Massaman, Pad Thai, Satay, Som Tam or
  coconut ice cream; a mild profile with "noodles" intent opens on Pad See Ew.
  - Verified:

- [ ] **3. Prompt sections for profile and intent** - appended to the system prompt as "WHAT
  YOU KNOW ABOUT THIS GUEST" with the hard constraints stated as rules, and the intent as "WHAT
  THEY SAID BEFORE ARRIVING".
  - Acceptance: curl with a profile body produces a reply that respects the filter and mentions
  the intent once.
  - Verified:

- [ ] **4. The account nudge** - after the first reply that shows a shortlist, an anonymous
  session gets one soft card in the thread: "Want me to remember this for next time?" with
  Google and magic-link buttons. Dismissable, never repeated in that session, and the session's
  `remember` notes are attached to the new account so nothing said so far is lost. A small
  "I have a taste profile" link also sits in the header. Both return to the same slug and table.
  - Acceptance: round trip lands back on `/m/tuk-tuk-thai?t=12` signed in, with the thread intact
    and the notes promoted (doc 02 task 6).
  - Verified:

- [ ] **4b. Table number** - `?t=` is read on the QR page, stored on `tableSession.tableNumber`,
  and shown faintly in the header ("Table 12").
  - Acceptance: a session row carries the table; a URL without `?t=` still works.
  - Verified:

- [ ] **4c. Share with this restaurant** - a toggle on the profile page per restaurant visited,
  off by default. When on, `tableadmin` can show first name and preferences for that diner's
  sessions. Revoking hides them immediately.
  - Acceptance: toggle on, the restaurant's session view shows "mild, no peanuts"; toggle off,
    it shows only the table and verdict.
  - Verified:

- [ ] **5. Propose profile changes mid-chat** - when the host learns a hard constraint, it
  returns a `propose` field; the UI shows a one-tap "add to profile" chip (B2).
  - Acceptance: saying "I'm allergic to peanuts" shows the chip; tapping it writes the
  constraint with `confirmedAt`.
  - Verified:

- [ ] **6. Table session row** - every QR open writes a `tableSession`; `shownDishIds` and
  `remember` are updated per reply.
  - Acceptance: rows appear for anonymous and signed-in opens.
  - Verified:

- [ ] **7. "My picks" list** - the diner can star dishes in the thread; a small tray at the
  bottom lists them to read out to the waiter (E4).
  - Acceptance: stars persist in the session row; the tray shows names and prices.
  - Verified:

- [-] **8. Group tables** - not in phase 2 (E5). The `tableSession` row is the hook for it.

---

## Verification pass

- [ ] Typecheck and lint
- [ ] Three openings compared side by side: anonymous, profile only, profile plus intent
- [ ] Niraj runs: sign in on his phone, scan, confirm the greeting skips the questions

## Notes / decisions

- The opening is computed without a model call on purpose. It must be instant, it must be
  deterministic for the allergy filter, and it must not cost a request when the diner only
  wanted to glance at the menu.
