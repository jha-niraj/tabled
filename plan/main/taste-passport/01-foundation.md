# Taste passport 01 - foundation: Neon, Better Auth for diners, R2, schema

| | |
|---|---|
| **App / module** | `main/taste-passport` |
| **Status** | Planned - blocked on `questions.md` A1-A3, G1-G4 |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-08 |
| **Files** | `packages/db/src/schema.ts`, `packages/auth/*`, `apps/main/.env`, `apps/main/lib/env.ts`, `packages/storage/*` |

## What was asked

Long-term the product has diner accounts, a database, and storage. Niraj named the stack: Better
Auth, Neon for Postgres, R2 for storage, Cloudflare for deploy. This doc is the plumbing that every
later phase-2 doc stands on.

## What "done" looks like

- `DATABASE_URL` points at a Neon branch and `pnpm --filter @repo/db db:push` succeeds.
- A diner can sign up and sign in on `apps/main` with the methods chosen in A3.
- `tasteProfile`, `visitIntent`, `tableSession`, `visitFeedback` tables exist and are empty.
- The `/m/[slug]` page still works anonymously with `SKIP_ENV_VALIDATION` removed from `.env`.

## Open questions

See `questions.md` A1-A3 and G1-G4. Working assumptions: optional accounts, Google plus magic
link, Neon, menus stay as JSON, R2 for voice notes only.

---

## Tasks

- [ ] **1. Neon project and branch** - create, copy the pooled connection string into
  `apps/main/.env` and `apps/admin/.env`, remove `SKIP_ENV_VALIDATION`.
  - Acceptance: both apps boot with env validation on.
  - Verified:

- [ ] **2. Schema: `tasteProfile`** - `id`, `ownerUserId` (FK user), `label` (null for self, see
  C6), `hardConstraints` jsonb, `tastes` jsonb, `spice` int 0-4, `sourceTranscript` text,
  `language` text, `confirmedAt`, `createdAt`, `updatedAt`. Unique on (`ownerUserId`, `label`).
  - Acceptance: `db:push` applies; a Drizzle relation from `user` to profiles exists.
  - Verified:

- [ ] **3. Schema: `visitIntent`** - `id`, `userId`, `restaurantSlug`, `transcript`,
  `situational` jsonb, `audioKey` (R2, nullable), `expiresAt`, `consumedAt`, `createdAt`.
  Index on (`userId`, `restaurantSlug`, `expiresAt`).
  - Acceptance: `db:push` applies.
  - Verified:

- [ ] **4. Schema: `tableSession` and `visitFeedback`** - a session per QR open (`id`,
  `restaurantSlug`, `userId` nullable, `remember` jsonb, `shownDishIds` jsonb, `startedAt`,
  `endedAt`) and feedback (`sessionId`, `userId`, `verdict` enum exactly/close/off, `note`,
  `chosenDishIds` jsonb, `createdAt`).
  - Acceptance: `db:push` applies; anonymous sessions have null `userId`.
  - Verified:

- [ ] **5. Better Auth for diners** - enable the methods from A3; the existing email-password and
  Google config in `packages/auth` already covers two of them. Magic link needs the Better Auth
  plugin and a Resend template.
  - Acceptance: sign up, sign in, sign out from `apps/main`; session cookie readable in
    `/m/[slug]` server component via `getServerSession()`.
  - Verified:

- [ ] **6. R2 bucket for voice notes** - `generateKey('voice', userId, ...)`, 30-day lifecycle
  rule on the bucket, upload from a server action (not a presigned PUT, because the clip must be
  transcribed in the same request).
  - Acceptance: a clip uploads, a key is stored on `visitIntent.audioKey`, the object expires.
  - Verified:

- [ ] **7. LLM provider switch** - `apps/main/lib/menu/llm.ts` with `chat()` and
  `extractJson()`; Sarvam today, `LLM_PROVIDER=openai|anthropic` later. The existing
  `sarvam.ts` becomes one implementation.
  - Acceptance: the prototype still passes its curl test through the new module.
  - Verified:

- [ ] **8. Env and turbo** - new vars (`LLM_PROVIDER`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
  R2 vars already listed) in `turbo.json` and `lib/env.ts` as optional.
  - Acceptance: `eslint` with `turbo/no-undeclared-env-vars` passes.
  - Verified:

---

## Verification pass

- [ ] Typecheck: `pnpm --filter main check-types`, `pnpm --filter @repo/db check-types`
- [ ] `/m/tuk-tuk-thai` opened anonymously and signed in
- [ ] Niraj runs: Neon project creation, R2 bucket and lifecycle rule

## Notes / decisions

- Menus stay in JSON (G2). Moving them to the DB is a restaurant-side phase, not a diner-side one.
- `tableSession` exists from day one so anonymous usage is measurable and so a group feature
  later has a row to hang diners off.
