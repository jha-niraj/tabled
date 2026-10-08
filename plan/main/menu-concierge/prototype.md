# Menu concierge prototype - the QR-to-host experiment

| | |
|---|---|
| **App / module** | `main/menu-concierge` |
| **Status** | Built 2026-10-08 - all tasks verified by Claude, Niraj's own test pass still open |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-08 |
| **Files** | `apps/main/app/m/**`, `apps/main/app/api/menu/**`, `apps/main/components/menu/**`, `apps/main/lib/menu/**`, `apps/main/data/restaurants/tuk-tuk-thai.json`, `apps/main/lib/env.ts` (escape hatch), `turbo.json` (env names) |

## What was asked

Niraj went to a pure-veg Thai place, got a 20-page menu, and could not picture a single dish. The
waiter listed names, which did not help. He wants a QR code at the table that opens one page where
a host narrows the menu by eliminating what you do not want, shows you the dish properly (photo,
video, what it tastes like, how to eat it), and answers questions by text or voice. Hybrid opening:
a warm greeting, the three most loved dishes, and one soft question. No DB, no auth, sample JSON as
the knowledge base, images and video from the internet. OpenAI had no credits, so Sarvam for both
chat and speech-to-text. Warm, premium, "not AI slop". Nothing else in the codebase removed.

## What "done" looks like

- `/m/tuk-tuk-thai` opens on a phone and shows greeting, three loved dishes, one chilli question.
- Tapping a chip or typing in any language gets a short host reply with 2 to 4 dish cards.
- Tapping a card opens a sheet with photos and video, what arrives, tastes like, how to eat,
  ingredients, allergens, pairings, reviews, and chips that ask the host about that dish.
- The mic records, Sarvam transcribes in the spoken language, and the host replies in it.
- The full menu and restaurant info (ratings, awards, hours, story) are one tap away.
- The rest of the app (auth, profile, admin) is untouched.

## Open questions

- Hinglish typed text sometimes gets an English reply. Voice turns carry a language hint, typed
  turns do not. Assumption: acceptable for the experiment, revisit when the model moves to OpenAI
  or Claude.

---

## Tasks

- [x] **1. Knowledge base JSON** - 26 dishes, 8 sections, ratings, review snippets, taste profile,
  how-to-eat steps, pairings, dietary and allergen tags, restaurant ratings by platform and awards.
  - Acceptance: every `pairsWith` and `mostLoved` id resolves; every media URL responds 200.
  - Verified: generator asserted ids; `curl -I` over 79 unique URLs, 77 x 200 and 2 x 429 from
    Wikimedia rate limiting (same originals load in the browser).

- [x] **2. Sarvam chat client** - `/v1/chat/completions`, `sarvam-105b`, JSON mode.
  - Acceptance: a Hinglish prompt returns a parsed JSON reply in under 3 s.
  - Verified: `reasoning_effort: null` returns content in 1.2 s with 0 reasoning tokens;
    `"low"` and default burned the whole 400 to 600 token budget on reasoning and returned
    `content: null`; `"none"` is rejected by the API (`Input should be 'low', 'medium' or 'high'`).

- [x] **3. Chat route** - `/api/menu/chat` with history, `remember` notes, language hint.
  - Acceptance: POST with one user turn returns `reply.say`, `dishes[]`, `ask`, `remember[]`.
  - Verified: curl, "mild, sharing with one friend, we like noodles" returned Pad See Ew and
    Khao Soi as cards, a follow-up ask, `remember: ['mild spice','sharing for 2','likes noodles']`,
    `POST /api/menu/chat 200 in 2290ms`.

- [x] **4. Speech-to-text route** - `/api/menu/stt`, `saaras:v4`, `language_code: unknown`, codemix.
  - Acceptance: Hindi and English clips transcribe with the right language code; a browser
    WebM/Opus recording is accepted.
  - Verified: `say -v Lekha` Hindi clip returned the exact Devanagari sentence with `hi-IN`;
    English clip with `en-IN`. Browser `audio/webm;codecs=opus` was rejected 400 by Sarvam
    ("Invalid file type"), fixed by re-wrapping as `application/octet-stream`; a real
    MediaRecorder WebM clip from Chrome then returned 200.

- [x] **5. Warm premium UI tokens** - `menu.css`, Fraunces display font, paper grain, light and dark.
  - Verified: screenshots in both themes in Chrome; dark via system, light by removing the
    `dark` class.

- [x] **6. Concierge page** - hero greeting, most loved rail, chips, thread, composer, mic.
  - Verified: clicked "Keep it mild", host replied with a base question and two mild cards.

- [x] **7. Dish sheet** - carousel with video slide, meta, taste bars, how-to-eat, story,
  ingredients, dietary badges, pairings, reviews, ask chips.
  - Verified: opened Massaman, scrolled all sections, tapped "How do I eat this?", host answered
    from the data and showed the card.

- [x] **8. Full menu and restaurant sheets.**
  - Verified: opened both from the header icons, screenshots taken.

- [x] **9. Typed Hinglish with an allergy.**
  - Verified: "mujhe peanuts se allergy hai, aur kuch zyada heavy nahi chahiye" dropped the
    Massaman ("off the table then") and offered Tom Kha.

- [x] **10. Boot without DB or auth** - `SKIP_ENV_VALIDATION=1` escape hatch in `lib/env.ts`.
  - Verified: `GET /m/tuk-tuk-thai 200` with only `SARVAM_API_KEY` set.

- [x] **11. Typecheck and lint** on the new code.
  - Verified: `tsc --noEmit` exit 0; `eslint --max-warnings 0` on `app/m`, `app/api/menu`,
    `components/menu`, `lib/menu`, `lib/env.ts` exit 0.

- [x] **12. Three bugs found in the browser pass and fixed** - sheets invisible (`.tt` set
  `position: relative`, overriding `fixed` on the portaled sheet), display font missing inside
  portals (variable lived on the wrapper, moved to `:root`), cached images never fading in
  (`onLoad` fired before React attached, now checked on mount).
  - Verified: re-opened sheet after each fix, screenshots.

- [x] **13. QR page** at `/m/tuk-tuk-thai/qr`.
  - Verified: route compiles; QR is generated from `window.location.origin` so it points at
    whatever host the page was opened on.

- [ ] **14. Niraj's test pass** - phone on wifi, mic in a real room, a full three-question flow.
  - Acceptance: he says it is right, or lists what is not.
  - Verified: _(open)_

---

## Verification pass

- [x] Typecheck: `pnpm --filter main exec tsc --noEmit` -> exit 0
- [x] Lint: `eslint --max-warnings 0` on the new folders -> exit 0
- [x] Pages opened: `/m/tuk-tuk-thai` (light and dark), dish sheet, full menu sheet, restaurant
  sheet. `/m/tuk-tuk-thai/qr` compiled, not opened in the browser.
- [ ] Niraj runs: phone test, mic test, `pnpm build` before any deploy.

## Notes / decisions

- Port 3000 is held by another project (`~/Documents/aly/ayudocs`). The prototype runs on 5000.
- Structured JSON instead of tool calling: one round trip, deterministic rendering, and the model
  never produces a URL. Cards and carousels render from the JSON by dish id.
- Allergens come only from the data. The prompt tells the host to say "not listed, check with
  your server" rather than guess.
- Voice is input only. Output stays visual, because nobody wants a phone talking at the table.
- Media is Wikimedia Commons (CC licensed), chosen by searching the Commons API and resolving
  thumbnail URLs with `imageinfo`. Two cooking videos are the only vegetarian Thai clips found.
- Hydration warning in dev comes from `next-themes` in the root layout, which predates this job.
