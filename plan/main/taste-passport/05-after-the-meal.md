# Taste passport 05 - after the meal: the regret metric

| | |
|---|---|
| **App / module** | `main/taste-passport` |
| **Status** | Planned - questions answered 2026-10-09; builds after doc 04 |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-09 |
| **Files** | `apps/main/components/menu/feedback-card.tsx`, `apps/main/actions/feedback.action.ts`, `apps/main/app/(main)/taste/history/**` |

## What was asked

The original goal: "I go there to eat something, and then I come back having eaten something
else. That should not be." The only way to know whether the product does that is to ask, once,
after the meal.

## What "done" looks like

- The next time a signed-in diner opens the app after a table session, one card asks "was it
  what you expected?" with three answers and an optional note or voice line.
- The answer is stored against the session with the dishes shown and the dishes starred.
- If the answer suggests a profile change, the host proposes exactly one, with a confirm tap.
- `/taste/history` lists visits with the verdict. Nothing here is public (F3).

## Decisions (2026-10-09)

Ask on next open, three verdicts, private, at most one proposed profile change. The restaurant
sees verdicts per table and in aggregate (doc 07), never as a public rating.

---

## Tasks

- [ ] **1. Session end detection** - a session ends on explicit "done eating" or 90 minutes
  after the last message.
  - Acceptance: `endedAt` is set by a server action or a lazy check on next request.
  - Verified:

- [ ] **2. Feedback card** - shown once per ended session with no feedback, on the home page
  and on the next QR open.
  - Acceptance: dismiss or answer, it never shows again for that session.
  - Verified:

- [ ] **3. Store and propose** - write `visitFeedback`; if verdict is "off" and a note exists,
  ask the model for one profile change and show it as a confirm chip.
  - Acceptance: "the green curry was too hot" proposes lowering spice; accepting updates the row.
  - Verified:

- [ ] **4. History page** - visits, verdicts, starred dishes, per-visit delete.
  - Acceptance: renders from `tableSession` joined to `visitFeedback`.
  - Verified:

- [ ] **5. The number** - sessions, feedback rate, regret rate (share of "off"), by restaurant
  and week. In `apps/admin` for us across all restaurants, and in `apps/tableadmin` for the
  owner's own restaurant (doc 07 task 6).
  - Acceptance: numbers match a hand count on seed data.
  - Verified:

---

## Verification pass

- [ ] Typecheck and lint
- [ ] Card seen on phone width in both themes
- [ ] Niraj runs: a real visit, then the question the next day

## Notes / decisions

- Regret rate is the one number the whole product is for. It lives in the admin app from day
  one so it is looked at, not computed when someone remembers to ask.
