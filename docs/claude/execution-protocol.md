# Execution Protocol — Multi-File / Multi-Phase Tasks

Follow this whenever a task touches **many files** or has **several phases**
(migrations, sweeping refactors, applying a fix across every call site, adding a
new feature module). The goal: never stop "in the middle".

> **Scope size is NEVER a valid reason to stop.** Replicating a change across all
> sites IS the task, not follow-up work.

## 1. Before the first edit

1. **Define "done"** — a concrete, checkable end state (e.g. "every `parse_*`
   returns `Option<T>` and all call sites updated; `cargo check` + `tsc` green").
2. **Discover the full surface.** Use exhaustive `grep`/glob to list **every**
   affected file and call site. No "etc.", no sampling. If you find N matches,
   you handle N.
3. **Write the repetitive-decision criteria.** When the same change repeats,
   state the rule once and in full, so applying it is mechanical and complete.
4. **Order the work (topological):**
   - shared types / helpers first, then their call sites;
   - backend before frontend when the IPC contract changes;
   - a module's `mod.rs` / registration last.
5. **Record the plan in two places:**
   - in-session `TaskCreate` todos (so progress is tracked live), **and**
   - a `docs/plans/<name>.md` file (copy [`_template.md`](../plans/_template.md))
     with a `- [ ]` checklist of phases/files and the full file list from step 2.

## 2. During

- Work the checklist top to bottom; tick items as you complete them.
- Keep the plan file in sync with reality (check items off, add discovered ones).
- **Do not leave stubs/TODOs as "follow-up."**
- **Forbidden escape-hatch phrases** (they signal an abandoned task):
  - "the rest follows the same pattern"
  - "stub for you" / "left as an exercise"
  - "applied to the main ones" / "and so on"

## 3. Done criteria (all must hold)

- [ ] Every file from the discovery step changed (checklist zeroed).
- [ ] No stub / TODO / placeholder left behind.
- [ ] `cargo check --manifest-path src-tauri/Cargo.toml` is clean.
- [ ] `cargo test --manifest-path src-tauri/Cargo.toml --lib` is green.
- [ ] `npx tsc --noEmit` is clean (for frontend changes).
- [ ] `cargo fmt` applied to touched Rust.
- [ ] The `docs/plans/<name>.md` checklist is fully `- [x]`.

## 4. Anti-patterns

- Editing before enumerating all sites → missed call sites that break the build.
- "Fixing" the project-specific gotchas documented in [`CLAUDE.md`](../../CLAUDE.md)
  (bare `.proto` imports, unquoted `Bestiary.race`, etc.) — verify against that
  list before changing parser/codegen behavior.
- Splitting a mechanical sweep into "phase 1 now, rest later" without a plan file
  and explicit user agreement.
