# Gmail OAuth 2.0 — Authorization Flow

## Overview

Gmail uses OAuth 2.0 Authorization Code Flow with offline access. The app never handles a Gmail password — Google issues access tokens (short-lived, ~1 hour) and refresh tokens (long-lived, until revoked).

---

## Required Scopes

```
https://www.googleapis.com/auth/gmail.send       — send emails
https://www.googleapis.com/auth/gmail.readonly    — read messages + history
https://www.googleapis.com/auth/gmail.modify      — mark messages read/unread
```

The `offline` access type and `consent` prompt must be requested to receive a refresh token on first authorization:

```
access_type=offline
prompt=consent
```

Without `prompt=consent`, Google will not issue a new refresh token if the user has previously authorized the app — you'll get an access token only, which expires in 1 hour and cannot be renewed without the user re-authorizing.

---

## Authorization Code Flow — Step by Step

### Step 1: Build the Authorization URL

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id={GOOGLE_OAUTH_CLIENT_ID}
  &redirect_uri={APP_URL}/api/auth/google-gmail/callback
  &response_type=code
  &scope=https://www.googleapis.com/auth/gmail.send
         https://www.googleapis.com/auth/gmail.readonly
         https://www.googleapis.com/auth/gmail.modify
  &access_type=offline
  &prompt=consent
  &state={signed_state_token}
```

The `state` parameter should be a signed token (HMAC-SHA256) containing the user ID and a timestamp. This prevents CSRF attacks — verify the signature in the callback before trusting the state.

### Step 2: User Authorizes in Google

Google shows a consent screen listing the requested scopes. After approval, Google redirects to the `redirect_uri` with `?code=...&state=...`.

### Step 3: Exchange Code for Tokens

```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code={authorization_code}
client_id={GOOGLE_OAUTH_CLIENT_ID}
client_secret={GOOGLE_OAUTH_CLIENT_SECRET}
redirect_uri={exact same redirect_uri as step 1}
grant_type=authorization_code
```

Response:
```json
{
  "access_token": "ya29.xxx",
  "refresh_token": "1//xxx",
  "expires_in": 3599,
  "scope": "...",
  "token_type": "Bearer"
}
```

### Step 4: Store Tokens in Database

Store in `user_google_gmail` table:
- `accessToken` — use for all Gmail API calls
- `refreshToken` — use to get new access tokens when expired
- `tokenExpiresAt` — `now + expires_in seconds`
- `googleEmail` — fetched from `GET https://gmail.googleapis.com/gmail/v1/users/me/profile`

### Step 5: Activate Gmail Watch

Immediately after storing tokens, call `gmail.users.watch()` to start receiving Pub/Sub push notifications. See `05-watch-renewal.md` for details.

---

## Token Refresh Logic

Access tokens expire in ~1 hour. Before making any Gmail API call, check if the token is within 5 minutes of expiry:

```typescript
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
const nearExpiry = record.tokenExpiresAt.getTime() - EXPIRY_BUFFER_MS <= Date.now();

if (nearExpiry) {
  // Refresh the token
  POST https://oauth2.googleapis.com/token
  grant_type=refresh_token
  refresh_token={stored_refresh_token}
  client_id=...
  client_secret=...
}
```

On success, update `accessToken` and `tokenExpiresAt` in the database. The refresh token itself does not change (unless Google rotates it, which is rare).

---

## State Parameter (CSRF Protection)

The `state` parameter is a signed JWT-like token:

```
state = base64url(JSON.stringify({userId, ts})) + "." + HMAC_SHA256_hex(base64url_part)
```

In the callback:
1. Split on `.`
2. Verify the HMAC using `GOOGLE_OAUTH_CLIENT_SECRET` as the key
3. Decode the base64url part, check `ts` is within 10 minutes
4. Extract `userId`

If verification fails, fall back to the session cookie to identify the user.

---

## Database Schema (user_google_gmail)

```sql
CREATE TABLE user_google_gmail (
  id            TEXT PRIMARY KEY,
  user_id       TEXT UNIQUE NOT NULL REFERENCES users(id),
  google_email  TEXT NOT NULL,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scope         TEXT NOT NULL,
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

One row per app user. `UNIQUE` on `user_id` — upsert on reconnect using `onConflictDoUpdate`.
