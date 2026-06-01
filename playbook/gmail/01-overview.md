# Gmail Integration — Architecture Overview

## What This Is

A full Gmail integration built on Next.js (App Router) + Drizzle + PostgreSQL that covers:

- **Sending email** via the Gmail API on behalf of an authenticated user
- **Receiving email** via Gmail Push Notifications (Google Cloud Pub/Sub webhook)
- **Threading** replies into existing Gmail conversations or starting fresh threads
- **Open tracking** via a 1×1 transparent GIF pixel embedded in outbound HTML emails

No third-party email service (SendGrid, Postmark, etc.) is involved. Gmail itself is the transport.

---

## High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  OUTBOUND (you → recipient)                                     │
│                                                                 │
│  App Server                                                     │
│    │                                                            │
│    ├─ compile HTML email (tracking pixel injected)              │
│    ├─ get access token (refresh if near-expiry)                 │
│    ├─ POST gmail.users.messages.send (RFC 2822 MIME, base64url) │
│    ├─ write communicationLogEntry (direction=outbound)          │
│    └─ return { messageId, threadId }                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  INBOUND (recipient → you)                                      │
│                                                                 │
│  Gmail detects new inbox message                                │
│    │                                                            │
│    └─ publishes notification to Google Cloud Pub/Sub topic      │
│         │                                                       │
│         └─ Pub/Sub push → POST /api/webhooks/gmail?token=...    │
│              │                                                  │
│              ├─ deduplicate by Pub/Sub message ID               │
│              ├─ return 200 immediately                          │
│              └─ async: fetchHistory → ingestMessage             │
│                   │                                             │
│                   ├─ resolve lead via In-Reply-To header        │
│                   ├─ write communicationLogEntry (direction=inbound) │
│                   └─ trigger stage transition                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  OPEN TRACKING                                                  │
│                                                                 │
│  Recipient's email client loads pixel image                     │
│    │                                                            │
│    └─ GET /api/track/open/{trackingId}                          │
│         │                                                       │
│         ├─ return 1×1 transparent GIF immediately               │
│         └─ async: set firstOpenAt, increment openCount          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components

| Component | Location | Purpose |
|---|---|---|
| OAuth callback | `src/app/api/auth/google-gmail/callback/route.ts` | Exchange auth code for tokens, store, start watch |
| Token manager | `src/features/communication/logic/gmail-auth.ts` | Return valid access token, auto-refresh |
| Email dispatch | `src/features/communication/logic/dispatch-email.ts` | Compile + send email, write log entry |
| Payload compiler | `src/features/communication/logic/compile-payload.ts` | Build HTML/plaintext, inject pixel, generate messageId |
| Webhook handler | `src/app/api/webhooks/gmail/route.ts` | Receive Pub/Sub push, deduplicate, fire async worker |
| History processor | `src/features/email-events/logic/process-gmail-history.ts` | Fetch Gmail history, filter INBOX messages |
| Message ingester | `src/features/email-events/logic/ingest-inbound-message.ts` | Resolve lead, write inbound log entry, trigger transition |
| Open tracker | `src/app/api/track/open/[trackingId]/route.ts` | Record pixel loads, update firstOpenAt + openCount |
| Watch renewal | `src/app/api/cron/gmail-watch-renewal/route.ts` | Keep Gmail watch subscription alive (runs every 6 days) |

---

## Database Tables Involved

- `user_google_gmail` — OAuth tokens per user
- `communication_log_entry` — every sent and received email message
- `email_events` — per-open event rows (one row per pixel load)
- `processed_webhook_events` — deduplication guard for Pub/Sub messages

---

## Environment Variables Required

```env
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GMAIL_PUBSUB_TOPIC=projects/{project}/topics/{topic}
GMAIL_WEBHOOK_SECRET=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://your-domain.com
```
