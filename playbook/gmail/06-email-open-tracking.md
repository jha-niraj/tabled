# Email Open Tracking — Pixel Tracking

## How It Works

A 1×1 transparent GIF image is embedded in every outbound HTML email. When the recipient's email client loads the email and renders images, it makes an HTTP GET request to your server to fetch that image. Your server records the open event and returns the image.

---

## The Tracking Pixel

Generated at email compile time:

```typescript
const trackingId = crypto.randomUUID(); // e.g. "a1b2c3d4-..."
```

Injected into the HTML body:

```html
<img
  src="https://yourapp.com/api/track/open/a1b2c3d4-..."
  width="1"
  height="1"
  style="display:none;width:1px;height:1px;"
  alt=""
>
```

The `trackingId` is also stored in `communication_log_entry.tracking_id` when the email is sent.

---

## The Tracking Endpoint

```
GET /api/track/open/{trackingId}
```

This route is **public** (no authentication). The flow:

```
1. Validate trackingId is a valid UUID format
2. Return 1×1 transparent GIF immediately (200 OK, no-store cache headers)
3. Async (fire-and-forget):
   a. Filter bot user agents
   b. Look up communication_log_entry by tracking_id WHERE direction = 'outbound'
   c. If not found → log and stop
   d. Set firstOpenAt = now() WHERE firstOpenAt IS NULL (only on first open)
   e. Increment openCount = openCount + 1 (every open)
   f. Insert row into email_events (eventType = 'open', occurredAt = now())
```

The GIF is returned **before** the DB write. This prevents any DB slowness from delaying the email render for the recipient.

---

## The Transparent GIF

A pre-generated 1×1 transparent GIF, decoded from base64 at module load time:

```typescript
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);
```

Response headers:
```
Content-Type: image/gif
Cache-Control: no-store, no-cache, must-revalidate
```

`no-store` prevents the browser/email client from caching the image. Without this, subsequent opens by the same client might not generate new requests.

---

## Database Schema

```sql
-- On communication_log_entry:
tracking_id   TEXT UNIQUE,           -- UUID generated at send time
first_open_at TIMESTAMPTZ,           -- first time pixel was loaded
open_count    INTEGER DEFAULT 0,     -- total pixel load count

-- Separate event log table:
CREATE TABLE email_events (
  id                        TEXT PRIMARY KEY,
  communication_log_entry_id TEXT NOT NULL REFERENCES communication_log_entry(id),
  event_type                TEXT NOT NULL,   -- 'open'
  occurred_at               TIMESTAMPTZ NOT NULL
);
```

---

## Bot Filtering

Many email security scanners (Barracuda, Proofpoint, Mimecast) and Apple Mail Privacy Protection pre-fetch images to scan for malware. Without filtering, these generate false open events.

Filter by `User-Agent` string. Known bot patterns to match:

```typescript
const BOT_PATTERNS = [
  /barracuda/i,
  /proofpoint/i,
  /mimecast/i,
  /symantec/i,
  /trustwave/i,
  /messagelabs/i,
  /postini/i,
  /appleexchangewebservices/i,
  /apple.*mail.*privacy/i,
  /yahoo.*mail/i,      // Yahoo pre-fetches images
  /googleimageproxy/i, // Gmail image proxy (subsequent opens)
  /preview/i,
];
```

If the User-Agent matches any of these → skip recording the open.

---

## Limitations

### Gmail Image Proxy
Gmail proxies images through `googleimageproxy.appspot.com` after the first load. Subsequent opens by Gmail users will appear to come from the same proxy IP, not the recipient. Open count still increments but you cannot track per-device opens.

### Apple Mail Privacy Protection (iOS 15+)
Apple pre-fetches all email images through their relay servers before the user even opens the email. This means:
- `firstOpenAt` gets recorded even if the user never reads the email
- The User-Agent is Apple's relay agent, not the user's device

Add `appleexchangewebservices` and `apple.*mail` to bot filters to mitigate.

### Image Blocking
Recipients who have disabled automatic image loading in their email client will never trigger the pixel. Common in corporate environments (Outlook with Exchange policies).

### Localhost / Non-Public URLs
The tracking pixel URL must be publicly accessible on the internet. Emails sent while running on `localhost` will produce tracking URLs that recipients cannot reach — no opens will be recorded.

---

## Privacy Considerations

Email open tracking is subject to GDPR, CASL, and similar regulations in many jurisdictions. Consider:
- Disclosing the use of tracking pixels in your privacy policy
- Respecting `Do Not Track` browser signals where applicable
- Providing opt-out mechanisms for recipients

---

## Practical Accuracy

Given all limitations, real-world accuracy is roughly:
- **~60–70%** of actual opens are captured on average
- False positives from Apple MPP can inflate numbers for Apple Mail users
- Corporate Outlook users are largely invisible
- Gmail users get accurate first-open tracking; subsequent opens are unreliable
