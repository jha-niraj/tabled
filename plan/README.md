# `plan/` - the task ledger

Every piece of work in this repo gets a markdown file in here **before** the work starts.

A chat scrollback is not a record. A file in the repo is. This folder exists so that anyone can
answer three questions without asking: what was asked, what is done, and what was actually verified.

## Where a doc goes

```
plan/<app>/<module>/<slug>.md
```

| Segment | Values |
|---|---|
| `<app>` | `main`, `admin`, `packages`, `repo` |
| `<module>` | the product area - `menu-concierge`, `taste-passport`, ... |
| `<slug>` | short kebab-case name of the job |

Use `repo/` for anything that is not one app: tooling, CI, deployment, conventions.

## The rules

1. **A doc is written before the work, not after.**
2. **Check `plan/` first, every time.** If a doc already covers the job, append to it.
3. **A task is `[x]` only when its Verified line says what was run and what it printed.** "Looks
   right" is not verification.
4. **Nothing gets silently dropped.** A wrong, blocked or out-of-scope task stays in the list as
   `[-]` with the reason.
5. **Update the doc as you go, not at the end.**
6. `INDEX.md` gets one row per doc, newest first.

## Starting a new doc

Copy `TEMPLATE.md`. Fill "What was asked" in the user's own words, "What done looks like" so a
stranger could check it, and the open questions with the assumption being worked under.
