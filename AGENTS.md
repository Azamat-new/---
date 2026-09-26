# AGENTS.md — facts every tool and agent must know (tool-agnostic)

This repository ships the **Separator** (Сепаратор): a risk-tiered funnel for AI-assisted work on large projects.
The protocol is files + one CLI; Claude Code is the reference driver, any other tool or a human can drive it.

- The funnel lives in `.separator/`. The state machine is `node .separator/bin/sep.cjs next <epic>`; every driver
  loops on it. Human decisions are files (`answers.md`, `MERGE_APPROVED`, `.separator/rulings.md`), never chat.
- Roles are separated physically: planner reads and writes only the plan; prober writes only acceptance tests;
  executor writes only inside its unit's write-set in an isolated worktree; inspectors re-run gates and never edit;
  blind lenses run in a sealed sandbox (two neutral commits, no history, no plan, no CLAUDE.md) as a separate process.
- Gate-owned files (`gate.json`, `decision.json`, `state.json`, `schedule.json`, `evidence.json`) are written only by
  the CLI. Counters and verdicts are never an agent's opinion.
- Evidence, not claims: a check counts only when it was run through `sep unit run` or by a gate; "tests pass" in prose
  counts for nothing.
- Tests verify, they do not define: `acc_*` and `regress_*` tests are frozen; a wrong test is reported, not edited.
- Commit messages on unit branches are neutral (`<unit> change set <n>`); intent lives in the ledger, never in git.
- Verification commands per zone are declared in `.separator/zones.json` (`null` = unknown, forces a probe).
- Rulings in `.separator/rulings.md` are law for every later stage; lessons in `.separator/lessons.md` (≤ 60 lines).
- Never push a `sep/*` branch; `sep merge` lands units on `integration`; a human promotes `integration → main`.
