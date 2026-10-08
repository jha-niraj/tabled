# Taste passport 04 - the host already knows you

| | |
|---|---|
| **App / module** | `main/taste-passport` |
| **Status** | Planned - blocked on `questions.md` A1, E1-E5 |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-08 |
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

## Open questions

See `questions.md` E. Assumptions: one confirmation question max, "surprise me" can break habits,
no ordering integration, no groups yet.

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

- [ ] **4. Sign-in link on the QR page** - "I have a taste profile" in the header for anonymous
  visitors; returns to the same slug after sign-in.
  - Acceptance: round trip lands back on `/m/tuk-tuk-thai` signed in.
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
