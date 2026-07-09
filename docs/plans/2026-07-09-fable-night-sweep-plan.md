# Fable Night Sweep — the-construct-architecture — 2026-07-09

Scope: fleet-wide health sweep. Per the sweep brief, this repo relates to
MAI's Oracle lore (The Construct) — findings below flag doc drift vs. reality
rather than critiquing the underlying design. Node/TS repo with
`node_modules` present, so I ran the existing `npm test` (jest) — no installs,
nothing else executed.

## Health Snapshot

- `package.json` version `1.0.1`, "Reference architecture for AI
  orchestration - Code that calls AI, not AI that calls code". Working tree
  clean, `main` up to date with `origin/main`.
- **`npm test` (jest) actually run this pass: 14/14 suites, 927/927 tests
  pass, 0 failures, ~11.8s.** This matches `JOBS.md`'s claimed baseline
  exactly — the project's own "all green" claim is verified, not just quoted.
- Recent history (`git log`) is almost entirely Dependabot merges
  (`typescript-eslint`, `@types/node`, `openai`) from 2026-03-07 through
  2026-05-31, plus one README formatting fix — i.e. this repo is in
  maintenance mode, not active feature development.
- `STATE.md` and `JOBS.md` are explicitly designed as "AI-resumable" session
  state (`<!-- AI-RESUMABLE: Read this file at the start of every response
  -->`) — a nice pattern given the repo's own subject matter (AI
  orchestration), but see drift finding below.

## Working Tree State

Clean. No dirty-suspicious concerns.

## Defects Found

- **`STATE.md`/`JOBS.md` are stale relative to real repo activity.** Both
  files carry `LAST_UPDATED: 2026-02-16T00:00:00Z` and describe the most
  recent work as "Merged 4 Dependabot PRs (#22-#26)". But `git log` shows 6
  more Dependabot merges and 2 direct commits landed *after* that date, most
  recently 2026-05-31 (`dbdd6f7`, `d00008d`, `0129a0a`, `bf47cad`, `e2fe23d`,
  `2ba476f` — typescript-eslint/@types/node/openai bumps). This is exactly
  the "doc drift vs. reality" the sweep brief asked me to flag: a repo whose
  entire design premise is that an AI can resume work by trusting
  `STATE.md`/`JOBS.md` has had those files silently fall 3+ months out of
  sync with `git log` — the self-description mechanism it's meant to
  demonstrate isn't being kept current on its own terms.
- **No CI test workflow.** `.github/` contains only `dependabot.yml` — no
  GitHub Actions workflow file exists to run `npm test`/`npm run lint` on
  PRs. Combined with the finding above, this means the 6 Dependabot PRs that
  merged after 2026-02-16 did so via `gh pr merge`/"Merge pull request"
  commits with **no automated verification on record** that the 927-test
  suite still passed at each step — I verified it passes *now*, at `HEAD`,
  but there's no evidence it was checked at each intermediate merge.
- Minor: `docs/reports/` has completion reports for phases 3 and 4 only
  (`phase-3-completion.md`, `phase-4-completion.md`), while `JOBS.md` claims
  all 8 phases complete (927 tests across phases 1–8). Not a functional
  defect — the phases are clearly done given the passing suite — but the
  completion-report trail is incomplete for 6 of the 8 phases, which matters
  for a repo whose own value proposition is legible AI-orchestration history.

## Ranked Improvements

### Small (S)
1. Update `STATE.md`/`JOBS.md` to reflect the 6 additional Dependabot merges
   since 2026-02-16 and bump `LAST_UPDATED` — a 10-minute doc-sync task that
   directly restores the repo's own "AI-resumable" contract.
2. Add a minimal GitHub Actions workflow (`npm ci && npm test && npm run
   lint`) gated on PRs — given the repo already has `husky` + a pre-commit
   hook locally, mirroring that gate in CI is a small, well-understood step.

### Medium (M)
1. Backfill (or explicitly retire) the missing phase completion reports
   (phases 1, 2, 5, 6, 7, 8) under `docs/reports/` so the documented history
   matches the 8-phase/927-test claim already made in `JOBS.md` — useful
   both for future contributors and for keeping the Oracle-lore documentation
   trail coherent.

### Large (L)
- None identified — this repo is stable, fully tested, and in intentional
  maintenance mode; the gaps found are documentation/process hygiene, not
  architectural.

## Skipped / Not Run
- Did not run `npm run lint` or `npm run typecheck` separately (jest test run
  alone was the highest-signal check given the time budget, and it fully
  passed).
- Did not audit `construct/`, `examples/`, or `templates/` content in depth —
  out of scope for a health/doc-drift sweep given the passing test suite
  already covers behavior.
