# Pain validation research - is the table host a real, paid-for pain?

| | |
|---|---|
| **App / module** | `repo/research` |
| **Status** | Done 2026-10-09 - report, notes and artifact delivered |
| **Opened** | 2026-10-09 |
| **Last updated** | 2026-10-09 |
| **Files** | `reports/Tabled pain validation.md`, `reports/tabled-pain-validation.html`, `research_notes/Tabled pain validation/*.md` |

## What was asked

Niraj, 2026-10-09: "I went with my seniors to the restaurant and told him these things. He was not
really convinced. Can you please research the internet and explore all these things properly? Is
this really the pain that we are building, or is this something like 'I started it as an
experiment but I'm really into it right now because I wanted to build this'? Research and validate
this and tell me if we're going in the right direction. Create an artefact about all these things
in pure detail, using a flowchart and many other things." Objections to answer (chosen through
AskUserQuestion): diners will just Google it; restaurants will not pay; too occasional to matter;
Zomato or Google already own this. Market: India, all restaurant types, then global. Verdict:
brutally honest.

## What "done" looks like

- Six sourced research notes, one per angle, each with Takeaway, Cited Findings, Inferences and
  Gaps per question.
- One report that answers the four objections with evidence for and against, a bottom-up
  frequency estimate with every assumption shown, the Indian pricing reality, a competitive map,
  the personalisation and DPDP constraints, a scorecard, and a primary-research plan.
- One artifact page Niraj can hand to his seniors, with the flow of the table moment, the
  provenance comparison, the frequency funnel, the wedge change and the research gates drawn.

---

## Tasks

- [x] **1. Research, six tracks in parallel** - diner pain evidence; Google at the table;
  competitors and incumbents; restaurant willingness to pay; frequency and market size;
  personalisation, feedback and privacy.
  - Verified: six notes written to `research_notes/Tabled pain validation/` (diner_pain_evidence,
    google_at_the_table, competitors_and_incumbents, restaurant_willingness_to_pay,
    frequency_and_market_size, personalisation_and_outcomes). Reddit and Quora were unreachable
    from the environment, so verbatim Indian diner quotes are a stated gap, not a fabrication.

- [x] **2. Synthesis report** - `reports/Tabled pain validation.md`.
  - Verified: 9,930 words, 154 inline links, every figure tagged M (measured), V (vendor or
    commissioned poll) or I (inference). Title "Sell the table, not the confused diner".

- [x] **3. Artifact** - `reports/tabled-pain-validation.html`, published as a claude.ai artifact.
  - Verified: five inline SVG figures (table moment today vs with Tabled, provenance, frequency
    funnel, wedge before and after, research decision gates), four objection sections, 14-row
    scorecard, 9-row competitive map, 50 key sources. Light and dark tokens, phone width with
    figures in horizontal-scroll containers.

---

## Verification pass

- [x] Report read end to end before the page was written.
- [ ] Niraj reads the artifact and sends corrections or the seniors' reaction.

## Notes / decisions

- Headline verdict: direction right, wedge wrong. The unfamiliar-dish moment is the demo, not the
  unit of value. The restaurant pays for every cover (ordering into the KOT, any Indian language,
  per-venue memory, dish-level feedback); explanation wins the meeting.
- Google capability is conceded (Search Live in Hindi in India since Oct 2025, Ask Maps since
  March 2026). The defence is provenance: this kitchen's recipe, allergens, spice, portion.
- The live fast follower is Petpooja (100k+ outlets, Rs 137 crore Series C for AI, Sept 2025),
  not Zomato or Google. Integrate first.
- India's distinctive pain is linguistic and religious (10.6% English, 39% vegetarian), not
  allergenic (FSSAI allergen rules bind only 10+ outlet chains). Verified allergens are the UK and
  EU differentiator.
- Nobody, in India or anywhere, has measured "did not recognise the dish" or "ordered wrong and
  regretted it". A 300-500 person intercept survey at ten Bengaluru restaurants is the cheapest
  next step and would produce India's first number.
- The research folders `research_notes/` and `reports/` live at the repo root per the research
  workflow; `reports/` also holds the artifact HTML.
