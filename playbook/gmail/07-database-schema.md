# Gmail — Database Schema

All Gmail-related tables are defined in Drizzle ORM and live in PostgreSQL (Neon). The Drizzle schema files are at `src/db/schema/auth.ts` and `src/db/schema/schema.ts`.

---

## user_google_gmail

Stores the OAuth tokens for each connected Gmail account. One row per app user.

```typescript
// src/db/schema/auth.ts
export const userGoogleGmail = pgTable("user_google_gmail", {
  id:             text("id").primaryKey(),
  userId:         text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  googleEmail:    text("google_email").notNull(),
  accessToken:    text("access_token").notNull(),
  refreshToken:   text("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),
  scope:          text("scope").notNull(),
  connectedAt:    timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Notes:**
- `UNIQUE` on `userId` — one Gmail account per app user
- Upsert on reconnect: `onConflictDoUpdate` so re-authorising replaces tokens instead of inserting a new row
- `accessToken` is short-lived (~1 hour); `refreshToken` is long-lived (until user revokes)
- `tokenExpiresAt` drives the 5-minute pre-expiry refresh check in `getGmailAccessToken()`
- No `watchExpiredAt` column — watch renewal is time-based (cron every 6 days), not expiry-based

---

## communication_log_entry

The central table for all email traffic — both outbound proposals and inbound replies.

```typescript
// src/db/schema/schema.ts
export const communicationLogEntries = pgTable("communication_log_entry", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId:     text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  direction:  communicationDirectionEnum("direction").notNull(),  // 'outbound' | 'inbound'

  // Threading
  threadId:              text("thread_id").notNull(),          // app-level thread UUID (groups cards in UI)
  messageId:             text("message_id"),                   // <uuid@ayurooms.com> RFC 2822 header
  trackingId:            text("tracking_id"),                  // UUID portion used for pixel lookup
  inReplyToMessageId:    text("in_reply_to_message_id"),       // In-Reply-To header value
  gmailMessageId:        text("gmail_message_id"),             // Gmail's internal message ID (for dedup)
  gmailInternalId:       text("gmail_internal_id"),            // Gmail's own sent-message ID

  // Content
  subjectLine:    text("subject_line"),
  bodySent:       text("body_sent"),       // full HTML body for outbound; full body for inbound
  bodyAiDraft:    text("body_ai_draft"),   // original AI draft (only set if team edited before sending)
  bodyFull:       text("body_full"),       // full inbound body
  bodyPreview:    text("body_preview"),    // first 200 chars of inbound body
  senderAddress:  text("sender_address"), // From header for inbound messages

  // Open tracking
  firstOpenAt:  timestamp("first_open_at"),
  openCount:    integer("open_count").default(0).notNull(),

  isRead:       boolean("is_read").default(false).notNull(),

  // Attribution
  pipelineStageAtSend:  pipelineStageEnum("pipeline_stage_at_send"),
  sentByUserId:         text("sent_by_user_id").references(() => user.id, { onDelete: "set null" }),
  resortId:             text("resort_id").references(() => resorts.id, { onDelete: "set null" }),

  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

**Indexes:**

| Index | Columns | Purpose |
|---|---|---|
| `commLog_leadId_idx` | `lead_id` | All messages for a lead |
| `commLog_threadId_idx` | `thread_id` | Thread grouping |
| `commLog_messageId_idx` | `message_id` | Inbound reply routing via In-Reply-To |
| `commLog_trackingId_idx` | `tracking_id` | Pixel open lookup |
| `commLog_isRead_direction_idx` | `is_read, direction` | Unread count |
| `commLog_leadId_direction_createdAt_idx` | `lead_id, direction, created_at` | Conversation history sort |
| `commLog_lead_gmailMessage_direction_idx` *(UNIQUE)* | `lead_id, gmail_message_id, direction` | Inbound deduplication |

**Threading columns explained:**

| Column | What it holds | Used for |
|---|---|---|
| `thread_id` | App UUID you generate on first outbound send | Groups messages in UI cards |
| `message_id` | `<uuid@ayurooms.com>` header you set | Matching inbound replies via In-Reply-To |
| `tracking_id` | The UUID portion of `message_id` | Pixel tracking URL lookup |
| `gmail_internal_id` | Gmail's `id` from send response | Gmail API operations |
| `gmail_message_id` | Gmail's `id` for inbound messages | Dedup unique index |
| `in_reply_to_message_id` | Value of In-Reply-To header (outbound) | Threading when sending replies |

---

## email_event

Per-open event log. One row per pixel hit (after bot filtering).

```typescript
export const emailEvents = pgTable("email_event", {
  id:                      text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  communicationLogEntryId: text("communication_log_entry_id")
                             .notNull()
                             .references(() => communicationLogEntries.id, { onDelete: "cascade" }),
  eventType:    emailEventTypeEnum("event_type").notNull(),  // 'open' | 'click'
  linkClicked:  text("link_clicked"),                        // URL for click events (future use)
  occurredAt:   timestamp("occurred_at").notNull(),

  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

`communication_log_entry.open_count` is the fast aggregate. `email_event` is the detailed log for per-open timestamps.

---

## processed_webhook_event

Deduplication table for Pub/Sub push notifications. Prevents double-processing when Pub/Sub retries.

```typescript
export const processedWebhookEvents = pgTable("processed_webhook_event", {
  eventId:     text("event_id").primaryKey(),   // Pub/Sub message.messageId
  eventType:   text("event_type").notNull(),
  historyId:   text("history_id").notNull(),
  receivedAt:  timestamp("received_at").notNull(),
  processedAt: timestamp("processed_at"),        // set after async work completes

  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

**How dedup works:**
1. Webhook arrives → `INSERT INTO processed_webhook_event (event_id, ...)` 
2. If the `eventId` already exists, the INSERT fails with a unique constraint violation
3. On violation → return 200 immediately and stop (already processed)
4. On success → return 200 immediately, fire async work

`processedAt` is set to `now()` when async history processing completes. If `processedAt IS NULL`, it means processing started but may not have finished (crash / timeout).

---

## Enums used by Gmail tables

```typescript
export const communicationDirectionEnum = pgEnum("communication_direction", [
  "outbound",
  "inbound",
]);

export const emailEventTypeEnum = pgEnum("email_event_type", [
  "open",
  "click",
]);
```

---

## Entity Relationship

```
user (1) ─────────────────── (1) user_google_gmail
  │                                     │ userId
  │                                     │ accessToken / refreshToken / tokenExpiresAt
  │
lead (1) ──────────────────── (N) communication_log_entry
                                         │ threadId           ← app thread grouping
                                         │ messageId          ← RFC 2822 header
                                         │ trackingId         ← pixel lookup key
                                         │ firstOpenAt
                                         │ openCount
                                         │
                                         └── (N) email_event
                                                   │ eventType = 'open'
                                                   │ occurredAt

processed_webhook_event (standalone)
  eventId = Pub/Sub messageId   ← primary key = natural dedup key
```

---

## Key Queries

**Look up thread for inbound reply:**
```sql
SELECT id, lead_id, thread_id
FROM communication_log_entry
WHERE message_id = '<uuid@ayurooms.com>'
  AND direction = 'outbound'
LIMIT 1;
```

**Find pixel tracking entry:**
```sql
SELECT id, first_open_at, open_count
FROM communication_log_entry
WHERE tracking_id = 'uuid-here'
  AND direction = 'outbound'
LIMIT 1;
```

**Check if webhook already processed:**
```sql
INSERT INTO processed_webhook_event (event_id, event_type, history_id, received_at)
VALUES ($1, 'gmail', $2, now())
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;
-- If no rows returned → already processed → stop
```
