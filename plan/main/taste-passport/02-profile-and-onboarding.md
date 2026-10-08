# Taste passport 02 - the profile and one-voice-note onboarding

| | |
|---|---|
| **App / module** | `main/taste-passport` |
| **Status** | Planned - blocked on `questions.md` B1-B7, C1-C6 |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-08 |
| **Files** | `apps/main/app/(main)/taste/**`, `apps/main/actions/taste.action.ts`, `apps/main/lib/menu/profile.ts`, `apps/main/components/taste/**` |

## What was asked

"The platform will know about the user's taste: what he likes, what she likes, what he or she
doesn't like, what he or she has an allergy to. That will be an onboarding process." The
onboarding should not feel like a form. One voice note, "tell me how you eat", and the platform
does the rest.

## What "done" looks like

- A signed-in diner with no profile sees one screen: a mic button, a prompt in their language,
  and a "type instead" link.
- After recording, a draft profile appears as editable cards in four layers. Hard constraints
  have an explicit confirm toggle, unchecked by default.
- Saving writes a `tasteProfile` row. The `/taste` page shows every stored fact in plain words
  with per-fact delete and a "delete my profile" action.
- The host at `/m/[slug]` greets a profiled diner by first name and skips the chilli question.

## Open questions

See `questions.md` B and C. Assumptions: four layers, hard constraints never inferred silently,
dislikes are soft, profile stored in English, Sarvam extracts behind the provider switch.

---

## Tasks

- [ ] **1. Profile shape and zod schema** - `lib/menu/profile.ts` defines the four layers, the
  words the model may use for tastes (a closed vocabulary: sour, sweet, creamy, crunchy, fried,
  soupy, herbal, smoky, light, rich, and so on), and a `toPromptText(profile)` function.
  - Acceptance: a unit test round-trips a sample profile through zod.
  - Verified:

- [ ] **2. Extraction prompt** - transcript in, JSON out: `hardConstraints[]` with
  `needsConfirmation: true`, `tastes`, `spice`, `dislikes[]`, `favourites[]`, `notes`.
  Returns the diner's language code so the UI can mirror it.
  - Acceptance: five sample transcripts (English, Hindi, Hinglish, Tamil, one rambling) produce
    valid JSON with allergies flagged for confirmation.
  - Verified:

- [ ] **3. Onboarding screen `/taste/start`** - mic (reuse `use-recorder.ts` and `MicButton`),
  25 s cap, "type instead", a progress state while extracting.
  - Acceptance: record, see draft within 5 s.
  - Verified:

- [ ] **4. Draft review cards** - one card per layer, inline edit, confirm toggles on hard
  constraints, a "this is wrong, re-record" link.
  - Acceptance: cannot save with an unconfirmed hard constraint; saving stores the row.
  - Verified:

- [ ] **5. Profile page `/taste`** - every fact as a chip with delete, spice as a selector, add a
  fact by typing, "delete my profile" with `ConfirmDialog`.
  - Acceptance: delete one fact and reload, it is gone; delete profile removes the row.
  - Verified:

- [ ] **6. Promote `remember` notes** - at the end of a table session (page hidden for 10
  minutes, or an explicit "done eating"), a signed-in diner is asked "save these to your
  profile?" with the session's notes as toggles.
  - Acceptance: notes chosen appear on `/taste`; allergies among them still require the
    confirm toggle.
  - Verified:

- [ ] **7. Export** - `/taste/export` returns the profile and history as JSON.
  - Acceptance: file downloads, validates against the zod schema.
  - Verified:

---

## Verification pass

- [ ] Typecheck and lint
- [ ] Every screen opened on a phone-width viewport in both themes
- [ ] Niraj runs: a real voice onboarding in Hindi and in English

## Notes / decisions

- Closed vocabulary for tastes is what makes the profile cuisine-agnostic (B5). A free-text
  taste cannot be matched at the next restaurant.
