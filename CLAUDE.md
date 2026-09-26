@AGENTS.md

# Claude Code notes for this repository

- Run any non-trivial change through the funnel: `/sep "<request>"` (driver skill) or the `sep-run` workflow.
  Single-file edits the human asks for directly are fine to do by hand; then `/sep-blind` gives a context-free check.
- Do not edit files under `.separator/epics/` by hand; use `node .separator/bin/sep.cjs` commands.
- Hooks in `.claude/settings.json` enforce write-sets, frozen tests and no-push for agents; they never restrict the human.
- After changing `.separator/bin/sep.cjs`, `.claude/settings.json` or any agent card: `node .separator/bin/sep.cjs lint && node .separator/bin/sep.cjs selftest`.
- On context compaction preserve: the current epic id, unit id and the gate commands.

@.separator/lessons.md
