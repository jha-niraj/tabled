# <Title of the job>

| | |
|---|---|
| **App / module** | `<app>/<module>` |
| **Status** | Planned |
| **Opened** | YYYY-MM-DD |
| **Last updated** | YYYY-MM-DD |
| **Files** | the files this touches, once known |

## What was asked

The request in plain terms, close to how it was actually said. Not a rewrite of it into what
would have been convenient to build.

## What "done" looks like

The observable end state. Written so that someone who was not in the conversation could check it
without asking a question. If this section is vague, the work will be too.

## Open questions

Anything ambiguous, and the assumption being worked under until it is answered. Delete the section
if there are none - do not leave it saying "none".

---

## Tasks

- [ ] **1. <task>**
  - Acceptance: how this one is checked.
  - Verified: _(fill in what was RUN and what it PRINTED - a command, a URL opened, a screenshot.
    Not "done" or "looks fine". Until this line is real, the box stays unticked.)_

- [ ] **2. <task>**
  - Acceptance:
  - Verified:

---

## Verification pass

Run at the end, over the whole job - not per task.

- [ ] Typecheck: `pnpm --filter <app> check-types` (or `tsc --noEmit`) -> _paste the result_
- [ ] Every changed page / screen actually opened and looked at -> _list them_
- [ ] Anything the user must run themselves (build, lint, deploy) -> _named, not run_

## Notes / decisions

Anything decided along the way that is not obvious from the code, and why. Bugs found and fixed
under this job get appended here rather than getting their own doc.
