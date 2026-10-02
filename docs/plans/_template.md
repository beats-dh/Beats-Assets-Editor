# Plan: <name>

> Copy this file to `docs/plans/<name>.md` to start a new plan, then follow
> [`../claude/execution-protocol.md`](../claude/execution-protocol.md).
> Keep the checklist updated; the task is done only when it's zeroed and
> validation passes. Files named `_*.md` are templates/drafts, not active plans.

## Goal

<One or two sentences: what changes and **why**.>

## Scope — affected files (exhaustive)

<Every file/call site from grep — no "etc.". Include the decision criteria for
repetitive changes and a sensible (topological) order.>

- `path/to/file_a.rs` — <what changes>
- `path/to/file_b.svelte` — <what changes>

## Checklist

- [ ] Phase 1: <...>
- [ ] Phase 2: <...>
- [ ] Validate: `cargo check` + `cargo test --lib` + `npx tsc --noEmit` + `cargo fmt`
- [ ] No stub / TODO left; checklist zeroed

## Notes & decisions

<Trade-offs, alternatives considered, open questions for the user.>
