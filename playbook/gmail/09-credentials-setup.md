# Gmail Credentials Setup — Step-by-Step

This is the complete setup guide for connecting the CRM to Gmail. Share this with the client.

---

## 1. Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name it (e.g. `ayurooms-crm`) → **Create**

---

## 2. Enable APIs

In the project, go to **APIs & Services → Library** and enable:

- **Gmail API**

---

## 3. OAuth Consent Screen

1. **APIs & Services → OAuth consent screen**
2. User Type: **External** → **Create**
3. Fill in:
   - App name: `Ayurooms CRM`
   - User support email: your email
   - Developer contact email: your email
4. **Save and Continue** through Scopes
5. Under **Test users** → Add the Gmail address that will send emails
6. **Save and Continue** → **Back to Dashboard**

---

## 4. OAuth 2.0 Credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `Ayurooms CRM Web`
4. Authorised redirect URIs — add **both**:
   ```
   http://localhost:3000/api/auth/google-gmail/callback
   https://your-production-domain.com/api/auth/google-gmail/callback
   ```
5. **Create** → copy:
   - **Client ID** → `GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## 5. Pub/Sub for Incoming Email

Pub/Sub is how Gmail notifies the CRM when a new email arrives.

### 5a. Create a Pub/Sub topic

1. Go to **Cloud Pub/Sub → Topics**
2. **Create Topic** → ID: `gmail-notifications` → **Create**
3. Copy the full topic name:
   ```
   projects/YOUR_PROJECT_ID/topics/gmail-notifications
   ```
   → this is `GMAIL_PUBSUB_TOPIC`

### 5b. Grant Gmail publish permission

1. On the topic → **Permissions → Add principal**
2. Principal: `gmail-api-push@system.gserviceaccount.com`
3. Role: **Pub/Sub Publisher** → **Save**

This allows Gmail's servers to publish notifications to your topic.

### 5c. Create a Push Subscription

1. On the topic → **Subscriptions → Create Subscription**
2. Delivery type: **Push**
3. Endpoint URL:
   ```
   https://your-production-domain.com/api/webhooks/gmail?token=YOUR_GMAIL_WEBHOOK_SECRET
   ```
4. **Create**

---

## 6. Webhook Secret

Generate a random secret for the Gmail webhook endpoint:

```bash
openssl rand -base64 32
```

Save the output as `GMAIL_WEBHOOK_SECRET`. This token is added to the Pub/Sub push endpoint URL (step 5c) and verified in the webhook handler to reject unauthenticated requests.

---

## 7. Environment Variables

Add all of the following to your `.env` / hosting secrets:

```env
# OAuth credentials (from step 4)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Pub/Sub topic (from step 5a)
GMAIL_PUBSUB_TOPIC=projects/YOUR_PROJECT_ID/topics/gmail-notifications

# Webhook security (from step 6)
GMAIL_WEBHOOK_SECRET=

# Cron protection (generate separately with: openssl rand -base64 32)
CRON_SECRET=
```

---

## 8. Authorize the Gmail Account

1. Start the app (production URL)
2. Go to **Settings → Email** in the CRM
3. Click **Connect Gmail** → sign in with the Gmail address that will send proposals
4. Grant all requested permissions (Send, Read, Modify)
5. Done — the CRM can now send and receive emails through this account

The CRM will automatically activate the Pub/Sub watch subscription as part of the OAuth callback. No manual step needed.

---

## 9. Verify the Setup

After completing steps 1–8:

1. Send a test lead form submission
2. Confirm a draft appears in the **Drafts to Send** tab in the action queue
3. Send the draft from the CRM
4. Check the sender Gmail inbox — the sent email should appear
5. Reply to the sent email from a different email account
6. Confirm the reply appears in the lead's communication log within ~10 seconds

If replies are not appearing, the most common cause is step 5b (Gmail publish permission) or step 5c (wrong endpoint URL / missing `?token=` parameter).
