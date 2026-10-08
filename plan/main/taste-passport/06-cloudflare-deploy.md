# Taste passport 06 - deploy to Cloudflare

| | |
|---|---|
| **App / module** | `repo/deploy` |
| **Status** | Planned - Cloudflare confirmed 2026-10-09; last doc in phase 2 |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-09 |
| **Files** | `apps/main/wrangler.jsonc`, `apps/main/open-next.config.ts`, `apps/main/next.config.js`, GitHub Actions workflow |

## What was asked

"Do you think we should deploy to Vercel? Vercel is easy, but the problem is long-running
processes. Workflows on Vercel need an upgrade. I think we go with Cloudflare normal Workers,
where we can create Durable Objects."

## My read

Agree on Cloudflare, for three reasons beyond long-running work: R2 is already in the stack and
has no egress cost to Workers, Neon has a serverless driver that works from Workers, and the
QR page is latency-sensitive in India where Cloudflare has more edge presence. The cost is that
Next.js on Workers runs through OpenNext, which lags the newest Next features by a few weeks
and has a 128 MB worker memory ceiling. Nothing in phase 2 needs a Durable Object; they become
necessary only for streaming voice sessions or background jobs longer than a request.

## What "done" looks like

- `apps/main` builds with `@opennextjs/cloudflare` and deploys with `wrangler deploy` to a
  `*.workers.dev` URL, then a custom domain.
- Env secrets set with `wrangler secret put`. `DATABASE_URL` uses Neon's pooled endpoint.
- `/m/tuk-tuk-thai` loads in under 1.5 s from Bengaluru on 4G, chat replies stream.
- A GitHub Action deploys `main` on push.

## Open questions

- Which apps deploy. Assumption: `main` and `tableadmin` (owners need it), `admin` stays local.
- Domain. Assumption: a `tabled.*` domain Niraj registers; until then workers.dev.

---

## Tasks

- [ ] **1. OpenNext adapter** - add `@opennextjs/cloudflare`, `wrangler.jsonc` with
  `nodejs_compat`, `open-next.config.ts`, `pnpm --filter main exec opennextjs-cloudflare build`.
  - Acceptance: local `wrangler dev` serves `/m/tuk-tuk-thai`.
  - Verified:

- [ ] **2. Neon from Workers** - switch `@repo/db` to `@neondatabase/serverless` over HTTP when
  running on Workers, keep `postgres.js` locally.
  - Acceptance: a query runs in `wrangler dev`.
  - Verified:

- [ ] **3. R2 binding** - bind the bucket in `wrangler.jsonc` so `@repo/storage` can use the
  binding instead of S3 credentials on Workers.
  - Acceptance: voice note upload works deployed.
  - Verified:

- [ ] **4. Secrets** - `SARVAM_API_KEY`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, Resend, Google.
  - Acceptance: `wrangler secret list` shows them; nothing in `wrangler.jsonc` vars.
  - Verified:

- [ ] **5. Better Auth on Workers** - trusted origins and cookie domain set for the deployed
  URL.
  - Acceptance: sign in works on the deployed URL.
  - Verified:

- [ ] **6. GitHub Action** - build and deploy on push to `main`, preview on PR.
  - Acceptance: a push deploys; the Action log shows the URL.
  - Verified:

- [ ] **7. Smoke test from a phone** - QR, chat, mic, dish sheet, sign in.
  - Acceptance: Niraj's checklist.
  - Verified:

- [-] **8. Durable Objects** - deferred. Written down: needed for (a) a streaming voice session
  that outlives a request, (b) background extraction queues, (c) a live group table. None are
  in phase 2.

---

## Verification pass

- [ ] `pnpm build` locally before the first deploy
- [ ] Deployed URL opened from a phone on mobile data
- [ ] Niraj runs: Cloudflare account, domain, GitHub secrets

## Notes / decisions

- Vercel would have worked for phase 2 as written. The decision for Cloudflare is about where
  the product is going (voice sessions, groups), not where it is.
