# Plan index

One row per doc in `plan/`. Newest first. See `plan/README.md` for how this works.

| Doc | App / module | Status | Opened | Summary |
|---|---|---|---|---|
| [questions.md](main/taste-passport/questions.md) | main / taste-passport | Open - waiting on Niraj's answers | 2026-10-08 | Every question that has to be answered before phase 2 (diner accounts, taste profile, pre-arrival voice note, host that already knows you) can be planned properly. Each carries the assumption being worked under until answered. |
| [01-foundation.md](main/taste-passport/01-foundation.md) | main / taste-passport | Planned - blocked on questions | 2026-10-08 | Neon Postgres, Better Auth wired for diners, R2, the `tasteProfile` and `visitIntent` tables, env and seed. |
| [02-profile-and-onboarding.md](main/taste-passport/02-profile-and-onboarding.md) | main / taste-passport | Planned - blocked on questions | 2026-10-08 | One voice note builds the profile: Sarvam STT, model extracts four layers, user confirms, hard constraints locked. |
| [03-visit-intent.md](main/taste-passport/03-visit-intent.md) | main / taste-passport | Planned - blocked on questions | 2026-10-08 | "I'm heading to Tuk Tuk Thai" - pick a restaurant, record a 20-second note, the shortlist is waiting at the table. |
| [04-host-knows-you.md](main/taste-passport/04-host-knows-you.md) | main / taste-passport | Planned - blocked on questions | 2026-10-08 | The `/m/[slug]` page detects the session, loads profile and intent, and opens with a personalised shortlist instead of three questions. Anonymous flow unchanged. |
| [05-after-the-meal.md](main/taste-passport/05-after-the-meal.md) | main / taste-passport | Planned - blocked on questions | 2026-10-08 | One tap after eating: was it what you expected. The regret metric, and the loop that sharpens the profile. |
| [06-cloudflare-deploy.md](main/taste-passport/06-cloudflare-deploy.md) | repo / deploy | Planned - blocked on questions | 2026-10-08 | Deploy to Cloudflare Workers with Durable Objects for long-running voice and background processing; why not Vercel. |
| [prototype.md](main/menu-concierge/prototype.md) | main / menu-concierge | Built (2026-10-08) - 13 tasks verified, Niraj's test pass open | 2026-10-08 | The QR-to-host experiment at `/m/tuk-tuk-thai`: Sarvam chat and STT, 26-dish knowledge base with verified Wikimedia media, dish sheets with how-to-eat, full menu, voice input, warm premium UI. No DB, no auth. |
