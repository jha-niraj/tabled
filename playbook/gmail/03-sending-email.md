# Sending Email via Gmail API

## How It Works

Gmail's send API accepts a raw RFC 2822 MIME email message encoded as base64url. You construct the full email in code, encode it, and POST it to `gmail.users.messages.send`.

---

## Step-by-Step

### Step 1: Generate IDs

```typescript
const trackingId = crypto.randomUUID();       // for pixel tracking
const messageId = `<${trackingId}@yourdomain.com>`;  // RFC 2822 Message-ID header
```

The `Message-ID` header is set by **you**, not Gmail. This is important for threading — the recipient's reply will include `In-Reply-To: <your-message-id>`, which you use to match the reply back to the original message.

### Step 2: Compile HTML and Plain Text

Build both versions of the email body:
- **Plain text** — fallback for email clients that don't render HTML
- **HTML** — full styled version, includes the tracking pixel

Inject the tracking pixel at the bottom of the HTML body:

```html
<img
  src="https://yourapp.com/api/track/open/{trackingId}"
  width="1" height="1"
  style="display:none;width:1px;height:1px;"
  alt=""
>
```

### Step 3: Set Threading Headers

To **reply in an existing thread**:
```
In-Reply-To: <original-message-id>
References: <original-message-id>
```

To **start a fresh thread** (even when emailing the same person again):
- Omit both `In-Reply-To` and `References` headers entirely
- Gmail creates a new thread based on the absence of these headers

### Step 4: Build the Raw MIME Message

```
From: "Sender Name" <sender@gmail.com>
To: recipient@example.com
Subject: Your subject line
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="boundary_string"
Message-ID: <uuid@yourdomain.com>
In-Reply-To: <previous-message-id>   (omit for fresh thread)
References: <previous-message-id>    (omit for fresh thread)

--boundary_string
Content-Type: text/plain; charset=UTF-8

Plain text body here.

--boundary_string
Content-Type: text/html; charset=UTF-8

<html>...</html>

--boundary_string--
```

### Step 5: Encode as base64url

```typescript
const raw = btoa(mimeString)
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
```

### Step 6: Call Gmail API

```
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "raw": "{base64url_encoded_mime}",
  "threadId": "{existing_thread_id}"   // optional — only when chaining
}
```

Response:
```json
{
  "id": "18abc123",         // Gmail's internal message ID (different from Message-ID header)
  "threadId": "18abc000",   // Gmail's thread ID
  "labelIds": ["SENT"]
}
```

### Step 7: Write to Database

After a successful send, insert a row into `communication_log_entry`:

```sql
INSERT INTO communication_log_entry (
  id, lead_id, direction, thread_id, message_id, tracking_id,
  in_reply_to_message_id, gmail_internal_id, subject_line,
  body_sent, sender_address, is_read, open_count, ...
) VALUES (
  uuid, ..., 'outbound', {threadId}, {messageId}, {trackingId},
  {inReplyToMessageId}, {gmail.id}, {subject},
  {plainText}, {senderEmail}, true, 0, ...
);
```

Note: `message_id` is the RFC 2822 `Message-ID` header you generated (e.g. `<uuid@yourdomain.com>`). `gmail_internal_id` is Gmail's own opaque ID from the API response. Both are stored — `message_id` is used for threading, `gmail_internal_id` is used for Gmail API operations.

---

## Threading Logic

```
First email to a person:
  inReplyToMessageId = null
  existingThreadId   = null
  → Gmail creates new thread

Reply to an existing conversation:
  inReplyToMessageId = communicationLogEntry.messageId of the message being replied to
  existingThreadId   = communicationLogEntry.threadId of that same entry
  → Gmail appends to existing thread

New email to same person (NOT a reply — fresh inquiry):
  inReplyToMessageId = null
  existingThreadId   = null
  → Gmail creates new thread (separate from any previous conversation)
```

---

## Auto-Retry with Backoff

Gmail API calls can fail transiently (rate limits, network issues). Wrap the send call in exponential backoff:

```typescript
const RETRY_DELAYS_MS = [1_000, 3_000, 9_000];

async function withRetry(fn) {
  for (let i = 0; i <= delays.length; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === delays.length) throw err;
      await sleep(RETRY_DELAYS_MS[i]);
    }
  }
}
```

---

## From Field Display Name

Gmail's API allows setting the `From` field as `"Display Name" <email@gmail.com>`. This controls what the recipient sees in their inbox as the sender name — not the raw Gmail username. Always set this using the user's configured display name.
