# Email Thread Management

## How Gmail Threading Works

Gmail groups messages into threads (conversations) based on email headers, not subject lines alone. Two messages are in the same thread when they share a chain of `Message-ID`, `In-Reply-To`, and `References` headers.

---

## The Three Headers

### Message-ID
Every email must have a globally unique `Message-ID`. Generate it yourself when sending:
```
Message-ID: <uuid@yourdomain.com>
```
Store this in your database — it's the key for routing inbound replies back to the original message.

### In-Reply-To
Set by the **replying client** to the `Message-ID` of the message being replied to:
```
In-Reply-To: <original-message-id@yourdomain.com>
```
This is the primary signal Gmail uses to determine thread membership.

### References
A space-separated chain of all `Message-ID` values in the thread history. Each reply appends its own `In-Reply-To` to the parent's `References`:
```
References: <msg1@domain.com> <msg2@domain.com>
```
Clients use this for full thread reconstruction even if individual messages are missing.

---

## Starting a Fresh Thread

Omit `In-Reply-To` and `References` entirely when sending. Gmail will create a new thread regardless of subject line or prior history with that email address.

```typescript
// Fresh thread — no threading headers
await gmail.sendMessage({
  from: senderEmail,
  to: recipientEmail,
  subject: "Your proposal",
  html: htmlBody,
  // inReplyTo: omitted
  // references: omitted
});
```

Also omit `threadId` from the API request body.

---

## Replying in an Existing Thread

Set `In-Reply-To` to the `Message-ID` of the previous message, and include `threadId` in the API request body:

```typescript
await gmail.sendMessage({
  from: senderEmail,
  to: recipientEmail,
  subject: "Re: Your proposal",
  html: htmlBody,
  inReplyTo: "<previous-message-id@yourdomain.com>",
  references: "<previous-message-id@yourdomain.com>",
  threadId: "gmail-thread-id-from-previous-message",
});
```

---

## Database Thread Model

Your `communication_log_entry` table stores a `thread_id` column. This is NOT Gmail's `threadId` — it is your own application-level thread identifier.

When sending a first email, use `trackingId` as the `thread_id`. When chaining replies, reuse the existing `thread_id` from the previous entry.

```
First send:
  thread_id = trackingId  (new UUID)

Reply to existing thread:
  thread_id = existing communicationLogEntry.threadId

Fresh email to same person (new inquiry):
  thread_id = trackingId  (new UUID — different thread)
```

All messages sharing the same `thread_id` are displayed as a single card in the communication log UI.

---

## Inbound Reply Routing

When a reply arrives from a recipient, route it to the correct thread using the `In-Reply-To` header:

```
1. Extract In-Reply-To header from the inbound Gmail message
   e.g. In-Reply-To: <uuid@yourdomain.com>

2. Look up communication_log_entry WHERE message_id = '<uuid@yourdomain.com>'
                                          AND direction = 'outbound'

3. The matching row gives you:
   - lead_id  → which person/record this belongs to
   - thread_id → which conversation thread to append to
```

This approach is precise: even if the same email address has multiple open conversations (different thread IDs), the reply is routed to the exact conversation being replied to.

**Fallback** (no In-Reply-To, or message ID not found):
- Look up by `from` email address
- Pick the most recently active record using stage priority

---

## Thread ID Divergence: Your DB vs Gmail's

Your application has two distinct thread concepts:

| Concept | Column | Value |
|---|---|---|
| App thread ID | `communication_log_entry.thread_id` | UUID you generate on first send |
| Gmail thread ID | returned by `gmail.users.messages.send` response | Opaque string like `"18abc000"` |

The Gmail thread ID is only needed when calling the Gmail API to chain a reply (pass it in the `threadId` field of the send request). Your app thread ID is what groups messages in your own UI.

---

## Preventing Accidental Thread Merging

Gmail's conversation view can visually merge separate threads that share an identical subject line (a known Gmail behavior). This happens in Gmail's UI only — the underlying `threadId` values remain different.

To minimise this risk when sending multiple separate proposals to the same recipient:
- Vary the subject line slightly per proposal
- Ensure `In-Reply-To` / `References` are omitted (no threading headers)

The messages will have separate Gmail `threadId` values and your application will always show them as separate cards.
