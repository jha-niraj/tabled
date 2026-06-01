# Receiving Email — Gmail Push Notifications via Pub/Sub

## Why Pub/Sub Instead of Polling

Gmail does not support traditional webhooks. Instead, it integrates with **Google Cloud Pub/Sub**. Gmail publishes a lightweight notification to a Pub/Sub topic whenever a mailbox changes (new email, label change, etc.). Pub/Sub then pushes that notification to your HTTP endpoint.

This means:
- No polling loop required
- Near-real-time delivery (typically 1–10 seconds after message arrives)
- Pub/Sub handles retries if your endpoint is down

---

## Components

```
Gmail Mailbox
    │  (new message arrives)
    ▼
Gmail API — watches mailbox, publishes to Pub/Sub topic
    │
    ▼
Google Cloud Pub/Sub Topic
    │  (push subscription)
    ▼
POST /api/webhooks/gmail?token={GMAIL_WEBHOOK_SECRET}
    │
    ▼
Your webhook handler
    │
    ├─ validate token
    ├─ parse + decode notification
    ├─ deduplicate
    ├─ return 200 immediately
    └─ async: processGmailHistoryAsync()
         │
         ├─ gmail.users.history.list(startHistoryId)
         ├─ filter INBOX messages (skip SENT)
         ├─ for each: gmail.users.messages.get(id, 'full')
         └─ ingestInboundMessage()
              │
              ├─ resolve lead via In-Reply-To header
              ├─ extract body
              └─ write communicationLogEntry (direction=inbound)
```

---

## The Pub/Sub Notification Payload

When Gmail detects a mailbox change, Pub/Sub delivers a POST to your endpoint:

```json
{
  "message": {
    "data": "eyJlbWFpbEFkZHJlc3MiOiAidXNlckBleGFtcGxlLmNvbSIsICJoaXN0b3J5SWQiOiAiMTIzNDU2NzgifQ==",
    "messageId": "2070443601311540",
    "publishTime": "2021-02-26T19:13:55.749Z"
  },
  "subscription": "projects/myproject/subscriptions/mysubscription"
}
```

`message.data` is base64-encoded JSON:
```json
{
  "emailAddress": "user@example.com",
  "historyId": "12345678"
}
```

- `emailAddress` — the Gmail account that received the notification
- `historyId` — the Gmail history sequence number at the time of the change

---

## Webhook Security

The webhook endpoint is public (no session authentication). Secure it with a secret token in the query string:

```
POST /api/webhooks/gmail?token=your_secret_here
```

Use **constant-time string comparison** to prevent timing attacks:

```typescript
if (token.length !== expected.length || token !== expected) {
  return new Response('Unauthorized', { status: 401 });
}
```

Caution: `new URL(req.url).searchParams.get('token')` silently decodes `+` as a space. If your secret contains `+` (e.g. base64-generated secrets), read the raw query string instead:

```typescript
const rawSearch = req.nextUrl.search ?? '';
const match = /[?&]token=([^&]+)/.exec(rawSearch);
const token = match ? decodeURIComponent(match[1]) : '';
```

---

## Deduplication

Pub/Sub guarantees **at-least-once delivery** — the same notification can arrive multiple times. Guard against double-processing with a `processed_webhook_events` table:

```sql
CREATE TABLE processed_webhook_events (
  event_id    TEXT PRIMARY KEY,  -- Pub/Sub message.messageId
  event_type  TEXT NOT NULL,
  history_id  TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ        -- set after async work completes
);
```

On each incoming webhook:
1. `INSERT INTO processed_webhook_events (event_id, ...) VALUES (...)`
2. If the insert fails with a unique constraint violation → duplicate → return 200 and stop
3. Return 200 immediately (Pub/Sub requires fast acknowledgement)
4. Fire async processing

---

## Return 200 Immediately

Pub/Sub will retry delivery if your endpoint does not return a 2xx within ~30 seconds. Do not do heavy work synchronously. Pattern:

```typescript
// 1. Deduplicate (fast DB write)
// 2. Construct response
const response = NextResponse.json({ ok: true });
// 3. Fire async work — do NOT await
void processGmailHistoryAsync(historyId, pubSubMessageId, emailAddress, db);
// 4. Return immediately
return response;
```

In Next.js on Cloudflare Workers, in-flight promises survive the response return — the async work continues after the response is sent.

---

## Gmail History API

The notification only tells you a historyId changed. It does NOT contain the message content. You must call `gmail.users.history.list` to find out what changed:

```
GET https://gmail.googleapis.com/gmail/v1/users/me/history
  ?startHistoryId={last_processed_history_id}
  &historyTypes=messageAdded
Authorization: Bearer {access_token}
```

Response contains an array of history records, each with a `messagesAdded` array listing the Gmail internal message IDs that were added since `startHistoryId`.

**startHistoryId** — use the historyId from the last successfully processed event (stored in `processed_webhook_events`). Do NOT use the current notification's historyId as the start — that would miss messages between the last processed event and now.

---

## Filtering Messages

For each `messagesAdded` item:

1. Fetch message metadata (headers + label IDs only — fast):
   ```
   GET .../messages/{id}?format=metadata&metadataHeaders=From,Subject,In-Reply-To,References,Date
   ```

2. Check labels:
   - If `SENT` label present → skip (this is an email you sent, not received)
   - If `INBOX` label absent → skip (drafts, spam, archived items)
   - Otherwise → fetch full message and ingest

3. Fetch full message (for body extraction):
   ```
   GET .../messages/{id}?format=full
   ```

---

## Retry on History Fetch Failure

The Gmail history API can fail transiently. Retry with exponential backoff:

```
Attempt 1: immediate
Attempt 2: wait 5s
Attempt 3: wait 10s
Attempt 4: wait 20s
Attempt 5: wait 40s
```

If all attempts fail, log the error. The message will not be lost — Gmail stores messages indefinitely and Pub/Sub will not retry the notification (since you already returned 200), but the historyId-based approach means the next notification will cover the missed range.
