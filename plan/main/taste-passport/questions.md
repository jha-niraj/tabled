# Taste passport - questions before phase 2 is planned

| | |
|---|---|
| **App / module** | `main/taste-passport` |
| **Status** | Open - waiting on Niraj's answers |
| **Opened** | 2026-10-08 |
| **Last updated** | 2026-10-08 |

## What was asked

Niraj's thought, close to how he said it: a diner can have an account on the platform. The
platform knows their taste - likes, dislikes, allergies - from an onboarding. Before leaving home
or the office they pick a restaurant and record a voice note: "I want something like this, this,
this." We process it in the background. When they reach the restaurant and open the page, the
menu is there and so is what they would like, so they do not have to answer many questions at
the table. Not restricting choice, just arriving already known. Long-term: Better Auth, Neon,
R2, Cloudflare Workers with Durable Objects. Not Vercel, because of long-running processes.

## How to answer

Reply in chat, or edit this file and put the answer under each question. Every question has
the assumption I will work under if it stays unanswered, so nothing blocks. The numbered ids are
how the task docs refer back here.

---

## A. Who the diner is

**A1. Is the account optional at the table?** An anonymous QR scan still gets the three-question
flow, a signed-in diner skips them.
- Assumption: optional. Anonymous keeps working exactly as today.

**A2. Where does the diner sign in?** On the `/m/[slug]` page itself (a small "I have a taste
profile" link), in a separate diner app at `/`, or both.
- Assumption: both. The QR page offers sign-in without leaving; the landing page becomes the
  diner's home.

**A3. Sign-in methods.** Email and password, Google, phone OTP, or magic link. Phone OTP is the
Indian default but needs an SMS provider.
- Assumption: Google plus email magic link via Resend. No phone OTP in phase 2.

**A4. Does the diner have a name and photo the host uses?** "Welcome back, Niraj" versus nothing
personal on screen.
- Assumption: first name only, used once in the greeting.

**A5. One profile per account, or per person at the table?** A parent ordering for two kids has
three sets of constraints.
- Assumption: one profile per account in phase 2. Household members and groups are a later
  phase, but the schema should not make it hard (see C6).

## B. What the profile holds

**B1. Four layers, confirm the split.** Hard constraints (allergies, Jain, vegan, religious
rules), stable tastes (spice tolerance, textures, dislikes, favourites), situational (mood,
hunger, company, budget, time), history (what was ordered and how it landed).
- Assumption: yes, exactly this split, stored as one JSON document per layer plus a few indexed
  columns.

**B2. Are hard constraints ever inferred from conversation?** For example the host hears "I am
allergic to peanuts" mid-chat.
- Assumption: never silently. The host proposes "add peanut allergy to your profile?" and the
  diner confirms with a tap. Everything else can be updated quietly.

**B3. What counts as a dislike versus a hard no?** "I do not like mushrooms" should lower
suggestions, not hide them.
- Assumption: dislikes are soft and the host can still mention a dish if it is the best fit,
  with a note. Hard constraints are filters.

**B4. Spice scale.** Keep the 0 to 4 scale from the prototype, or ask in words.
- Assumption: store 0 to 4, ask in words ("mild", "medium", "bring the heat").

**B5. Cuisine-agnostic from day one?** The profile should make sense at a Thai place, a South
Indian place, and an Italian place.
- Assumption: yes. Tastes are stored as general words (sour, creamy, crunchy, fried, soupy),
  never as dish ids. Dish history is per restaurant.

**B6. Budget.** Does the profile hold a usual budget per person, and does the host respect it?
- Assumption: optional field, off by default, never mentioned unless the diner set it.

**B7. Can the diner see and edit everything?** A profile page with every stored fact in plain
words and a delete button per fact.
- Assumption: yes, and "delete my profile" deletes everything in one action.

## C. Onboarding

**C1. One voice note or a short wizard?** The pitch is "tell me how you eat" in 60 seconds. Some
people will not talk to a phone in an office.
- Assumption: voice note first, with a "type instead" link that opens the same prompt as text.
  No multi-step wizard.

**C2. What does the model extract, and how does the diner confirm?** The note becomes a
structured draft, shown as editable cards: "Spice: medium. Avoids: mushrooms. Allergy: peanuts
(please confirm)."
- Assumption: exactly that. Hard constraints show a confirm toggle and are unchecked until
  tapped.

**C3. Which model extracts the profile?** Sarvam for now, OpenAI or Claude later.
- Assumption: Sarvam `sarvam-105b` with a JSON schema, behind one function so the swap is one
  file.

**C4. Language of the profile.** If the note is in Hindi, is the profile stored in Hindi, in
English, or both?
- Assumption: stored in English for matching, shown back in the diner's language by the model.

**C5. Can onboarding be skipped and filled later from conversations?** Sign in, scan, chat; the
host builds the profile over the first two visits.
- Assumption: yes. The `remember` notes the host already extracts are promoted to the profile
  after the diner confirms at the end of a session.

**C6. Can a diner add a household member ("my daughter, 7, no chilli")?**
- Assumption: not in phase 2, but the `tasteProfile` table carries an `ownerUserId` and a
  `label` so it can hold more than one profile per account later.

## D. The pre-arrival note (visit intent)

**D1. How does the diner pick the restaurant?** Search by name, a list of nearby places, or a
recent list. Phase 2 has one restaurant.
- Assumption: a list of restaurants on the platform with search. One entry for now.

**D2. What can the note contain?** Mood, hunger, who they are with, what they feel like,
budget, time, "surprise me".
- Assumption: anything. The model extracts a situational layer and keeps the raw transcript.

**D3. How long does an intent live?** Recorded at noon, used at 1 pm, stale by dinner.
- Assumption: 6 hours, then it expires and the host falls back to the stable profile.

**D4. Can there be more than one open intent?**
- Assumption: one active intent per restaurant per diner; a new one replaces the old one.

**D5. Does the intent trigger anything before arrival?** A push "your shortlist is ready", an
email, nothing.
- Assumption: nothing in phase 2. The shortlist is computed when the page opens, not in the
  background. Background processing becomes worth it only when the model is slow or when
  we pre-render media.

**D6. Is the shortlist computed by the same host prompt?**
- Assumption: yes, one prompt with profile and intent appended. No separate recommender.

## E. At the table

**E1. What does the opening look like for a known diner?** Greeting by first name, 3 to 4 dishes
chosen from profile plus intent, one confirmation question ("still mild tonight?") or none.
- Assumption: one confirmation question at most, and only if something in the profile is
  older than 30 days or the intent contradicts the profile.

**E2. Does the host ever ignore the profile?** "Surprise me" should be allowed to break habits.
- Assumption: yes, hard constraints always hold, everything else can be overridden by what the
  diner says at the table.

**E3. Does the restaurant see anything?** The owner, the kitchen, the waiter.
- Assumption: nothing about the diner. The restaurant gets aggregate stats later (most asked
  questions, most shown dishes), never a person's profile.

**E4. Ordering.** Does "I'll have this" do anything, or is it still the waiter.
- Assumption: still the waiter. The page can show a "my picks" list the diner reads out. No POS
  integration in phase 2.

**E5. Groups.** Several signed-in diners at one table, one order for everyone.
- Assumption: out of phase 2. Written down so the schema leaves room (a `tableSession` with
  many diners).

## F. After the meal

**F1. The feedback moment.** One tap, "was it what you expected?", an hour after the visit or
on next open.
- Assumption: on next open of the page, or a push if we add push later. Three options:
  "exactly", "close", "not what I pictured", plus optional free text or voice.

**F2. What does the answer change?** It is the regret metric and it updates the profile.
- Assumption: it writes to history with the dish ids shown and chosen, and the model may propose
  one profile change ("you said the green curry was too hot, lower your spice to mild?").

**F3. Public reviews?** Do these answers become visible ratings on the dish cards.
- Assumption: no. The dish ratings stay restaurant-provided data. Diner feedback is private.

## G. Data and infrastructure

**G1. Database.** Neon Postgres via the existing `@repo/db` Drizzle setup.
- Assumption: yes, `DATABASE_URL` points at a Neon branch, `db:push` for dev, migrations for
  prod. Table list in `01-foundation.md`.

**G2. Restaurant data.** Stays as JSON files in the repo, or moves to the database.
- Assumption: stays JSON in phase 2. Moving menus to the DB and giving restaurants an editor is
  its own phase.

**G3. R2.** What goes there: voice notes, dish media uploaded by restaurants, both.
- Assumption: voice notes only in phase 2, with a 30-day retention, because the transcript is
  what matters.

**G4. Deployment.** Cloudflare Workers with Durable Objects, via OpenNext for Next.js.
- Assumption: `@opennextjs/cloudflare`. Durable Objects are only needed once something runs
  longer than a request (background intent processing, streaming voice). Phase 2 can ship
  without them; the deploy doc lists what needs them.

**G5. Analytics.** What do we measure from day one.
- Assumption: questions asked per session, dishes shown, dishes opened, regret answers. Stored
  in our own table, no third-party analytics in phase 2.

**G6. Privacy and deletion.** India DPDP rules, account deletion, data export.
- Assumption: delete-account removes profile, intents, voice notes in R2, and history. Export is
  a JSON download from the profile page.

## H. Scope and order

**H1. What is the smallest version you would use yourself?** My proposal: sign in with Google,
one voice-note onboarding, the host greets you by name and skips the questions. No intent, no
feedback loop.
- Assumption: that is phase 2a. Intent and feedback are 2b and 2c in the same phase.

**H2. Does the admin app get anything?** A list of diners, a list of restaurants.
- Assumption: a read-only restaurants list and aggregate stats. No diner list, by E3.

**H3. Model swap timing.** When OpenAI or Claude credits exist, does the whole host move, or
only profile extraction.
- Assumption: everything behind one `lib/menu/llm.ts` with a provider switch, so it is one
  env var.
