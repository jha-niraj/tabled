# Gmail Watch Renewal — Pub/Sub Subscription Maintenance

## Why Renewal Is Required

Gmail's `users.watch` API creates a Pub/Sub push subscription that expires after **7 days**. After expiry, Gmail stops sending notifications to your Pub/Sub topic and you stop receiving inbound email events.

There is no auto-renewal. You must call `users.watch` again before the current subscription expires.

---

## The Cron

A token-protected GET endpoint runs every 6 days (1 day before expiry):

```
Route:    GET /api/cron/gmail-watch-renewal?token={CRON_SECRET}
Schedule: "0 3 */6 * *"  (03:00 UTC, every 6 days)
Defined in: wrangler.jsonc → triggers.crons
```

The cron runs at 03:00 UTC to avoid overlap with business-hour traffic.

---

## What the Cron Does

```typescript
// src/app/api/cron/gmail-watch-renewal/route.ts

// 1. Validate the CRON_SECRET token (constant-time comparison)
// 2. SELECT all rows from user_google_gmail
// 3. For each account:
//    a. getGmailAccessToken(userId) — refreshes access token if near-expiry
//    b. new GuestoGmailAPI({ accessToken })
//    c. gmail.watchInbox(GMAIL_PUBSUB_TOPIC)
// 4. Return JSON summary: { renewed, failed, results }
```

Each call to `watchInbox()` resets the 7-day expiry for that account independently.

---

## watchInbox()

```typescript
// src/guesto/gmail/index.ts
async watchInbox(topicName: string): Promise<GmailWatchResponse> {
  return this.request('POST', `/users/${this.userId}/watch`, {
    topicName,           // "projects/YOUR_PROJECT_ID/topics/gmail-notifications"
    labelIds: ['INBOX'], // only watch INBOX changes
  });
}
```

Request body:
```json
{
  "topicName": "projects/your-project/topics/gmail-notifications",
  "labelIds": ["INBOX"]
}
```

Response:
```json
{
  "historyId": "12345678",
  "expiration": "1735689600000"   // Unix ms timestamp as string
}
```

The `expiration` field is a Unix millisecond timestamp as a string. The watch expires 7 days from the call time.

---

## Initial Watch Activation

The first watch is activated immediately after the user completes OAuth — before the cron runs for the first time.

```typescript
// src/app/api/auth/google-gmail/callback/route.ts
// Step 5 after storing tokens:
await gmail.watchInbox(env.GMAIL_PUBSUB_TOPIC);
```

Without this, there is a gap between account connection and the next cron run (up to 6 days) during which inbound emails would not be received.

---

## Access Token Refresh During Renewal

`getGmailAccessToken(userId)` handles token refresh automatically:

```typescript
// src/features/communication/logic/gmail-auth.ts
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

const nearExpiry = record.tokenExpiresAt.getTime() - EXPIRY_BUFFER_MS <= Date.now();
if (nearExpiry) {
  // POST https://oauth2.googleapis.com/token
  // grant_type=refresh_token
  // Updates accessToken + tokenExpiresAt in DB
}
return record.accessToken;
```

This means the watch renewal cron also keeps all access tokens fresh even if nothing else has triggered a refresh recently.

---

## Failure Handling

If `watchInbox()` fails for one account, the cron logs the error and continues to the next account. It does not abort. The response body lists per-account results:

```json
{
  "ok": false,
  "renewed": 2,
  "failed": 1,
  "results": [
    { "email": "sales@ayurooms.com", "ok": true, "expiration": "..." },
    { "email": "support@ayurooms.com", "ok": false, "error": "invalid_grant" }
  ]
}
```

A failed renewal means inbound emails for that account will stop arriving after the current watch expires. The Cloudflare Workers cron dashboard logs exit codes.

Common failure reasons:
- `invalid_grant` — refresh token revoked (user removed app access in Google Account settings → requires re-authorization)
- 403 Forbidden — Pub/Sub topic permissions incorrect
- 404 Not Found — `GMAIL_PUBSUB_TOPIC` env var is wrong

---

## Manual Trigger

To renew watches immediately without waiting for the cron:

```
GET /api/cron/gmail-watch-renewal?token=<CRON_SECRET>
```

Use this after:
- First deployment to production
- Fixing a `GMAIL_PUBSUB_TOPIC` misconfiguration
- Adding a new Gmail account

---

## Environment Variables Required

| Variable | Description |
|---|---|
| `CRON_SECRET` | Secret token protecting the cron endpoint |
| `GMAIL_PUBSUB_TOPIC` | Full Pub/Sub topic name: `projects/PROJECT_ID/topics/TOPIC_NAME` |

---

## Watch vs. Subscription Lifecycle

```
OAuth callback
  └─ watchInbox() called immediately           Day 0 — expiry set to Day 7

Cron: "0 3 */6 * *"
  └─ watchInbox() called again                 Day 6 — expiry reset to Day 13
  └─ watchInbox() called again                 Day 12 — expiry reset to Day 19
  ...
```

Since the cron runs every 6 days and the watch expires after 7, there is always a 1-day safety buffer before expiry.

---

## Wrangler Config

```jsonc
// wrangler.jsonc
{
  "triggers": {
    "crons": [
      "0 2 * * *",    // other daily cron
      "0 3 */6 * *"   // gmail-watch-renewal — every 6 days at 03:00 UTC
    ]
  }
}
```

Cloudflare Workers routes cron triggers to the matching route handler based on the schedule. The `gmail-watch-renewal` route is at `src/app/api/cron/gmail-watch-renewal/route.ts`.
