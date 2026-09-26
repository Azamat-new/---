# Candidate design: "Separator" (orchestrator's first-principles draft)

Angle: the user's own metaphor taken literally — a milk separator. Raw input goes in at a wide mouth; centrifugal stages
separate by risk/size; only the "cream" (verified changes) reaches the merge. Everything else is spun back to the stage
that can fix it. Priorities in order: (1) no defect escapes, (2) net acceleration vs. a single straight-line chat,
(3) universality (any language, any tool; Claude Code is the reference implementation).

## 0. The core problem being solved

A single-thread chat on a large project degrades into task → error → fix → error because:
- one context carries planning, coding, and judging, so the judge shares every wrong assumption of the coder
  (self-preference / shared-blind-spot problem);
- context fills with stale detail (context rot), the model drifts from the original intent;
- there is no explicit "definition of done" so the loop has no exit condition;
- errors are found late (after implementation) where they are most expensive;
- nothing is recorded, so every session restarts the same discoveries.

Hence the four load-bearing ideas of this design:
1. **Artifacts, not memory.** Every stage reads files and writes files. Any stage can be re-run by a *fresh* context.
2. **Separation of duties.** Planner ≠ implementer ≠ reviewer ≠ blind judge. Never the same context.
3. **Tiered rigor (the separator).** Rigor scales with risk class. Trivial work takes a fast lane; risky work takes every stage. This is what makes it faster, not slower.
4. **Bounded loops.** Every send-back names the target stage and a reason; counters cap loops; humans are pulled in on escalation, not on every step.

## 1. Stages (the funnel, wide → narrow)

```
[0 Intake] → [1 Zones] → [2 Decompose] → [3 Dispatch] → [4 Hypothesis gate] → [5 Execute]
   → [6 Context review (send-back allowed)] → [7 Blind review (no context)] → [8 Verdict & merge] → [9 Learn]
```

### Stage 0 — Intake ("wide mouth")
Input: anything — a sentence, a bug, a screenshot description, a 3-page feature.
Output: `intake.md` (Intake Card):
- Goal (1 sentence), Non-goals, Constraints, Success criteria (observable, testable), Unknowns/questions,
- Risk class: **S** (trivial, ≤1 file, no behavior change) / **M** (one zone, behavior change) / **L** (cross-zone or data/API change) / **XL** (architecture, migration, security).
- Affected zones (guess), Rollback plan need (y/n).
Rules: questions to the human are batched and asked once; if not blocking, proceed with stated assumptions listed in the card. Fast lane: S tasks skip stages 1–4 and 7 (still get 5, 6-lite, 8).

### Stage 1 — Zones of responsibility
A persistent `zones.yaml` maps the repository into bounded areas: name, paths, owner-agent persona, invariants, how to test, contact points (interfaces to other zones). Built once (on first run, by a mapper agent that reads the repo), updated in stage 9. A task touching ≥2 zones must define an **interface contract** first (what crosses the boundary), and each zone's work is a separate sub-task.

### Stage 2 — Decompose
Output: `plan.json` — a DAG of atomic tasks. Each task: id, zone, goal, inputs, outputs, acceptance test(s) (concrete commands or test names), files it may touch, dependencies, size (fits one context window: rule of thumb ≤ ~300 changed lines, ≤ ~8 files), risk. Rules: a task without an acceptance test is invalid; a task touching files in two zones is split; the hardest/most uncertain task is ordered first (risk-first).

### Stage 3 — Dispatch
Compute waves from the DAG: tasks with no unmet dependencies and disjoint file sets run in parallel (isolated worktrees/branches); others wait. WIP limit (e.g. 3 concurrent) to keep integration tractable. Each task gets a **Task Packet**: its plan entry + relevant zone entry + intake card summary + explicit list of what it must NOT touch.

### Stage 4 — Hypothesis gate (before code)
For M/L/XL tasks, an agent lists the assumptions the task rests on (API exists and behaves as believed, library version supports X, data shape, performance budget, existing test harness works) and verifies each *cheaply*: grep/read, run a 10-line spike, call the real API in a sandbox, write the failing acceptance test. Output: `hypotheses.md` with each assumption → verified / refuted / unverifiable (+ how). Any refuted assumption → send back to stage 2 with the evidence (the plan was wrong, not the code). Unverifiable ones become explicit risks in the packet.

### Stage 5 — Execute
Implementer works from the packet only, in an isolated worktree, TDD style: acceptance test red → implement → green → run the zone's checks (lint/type/tests). Small commits. Output: `handoff.md` — what changed, what was not done, how to verify, known trade-offs — plus the diff. Implementer must not weaken/delete tests or widen scope; if the packet is wrong, it stops and sends back to stage 2 (does not "improvise").

### Stage 6 — Context review (independent, informed, can send back to any earlier stage)
Two or three reviewers who have the intake card, the plan, the packet, and the diff — but did **not** write the code. Distinct lenses: (a) spec conformance — every success criterion and acceptance test satisfied, nothing extra; (b) adversarial — try to break it: edge cases, concurrency, error paths, security, run the tests and add one; (c) integration — does it respect zone invariants and interface contracts, does it merge cleanly with sibling tasks. Verdict per reviewer: PASS / SEND-BACK(stage, reason, evidence). Send-back targets: 5 (code bug), 2 (plan wrong), 0 (intent misread). Majority rule; any adversarial "reproduced bug" is an automatic send-back.

### Stage 7 — Blind review (no context at all)
Reviewers who see **only** the diff (and can read the repository as it will be after the change), never the intake card, plan, chat, or reviews. Physically enforced: run in a clean worktree where run artifacts don't exist (they are git-ignored). Two questions: (1) "Describe what this change does and why you think it was made" — the **back-translation test**: if the blind description does not match the intake goal, intent leaked or the change is confusing/wrong; (2) "Would you merge this into a codebase you own? List concrete defects." Output: `blind-N.md`. Two blind reviewers with different lenses (maintainer / security-and-correctness). They cannot send back to a stage (they don't know the stages); they emit MERGE / DO-NOT-MERGE with evidence, and the verdict stage maps it.

### Stage 8 — Verdict & merge
A judge combines: objective gates (all tests green, lint/types green, no forbidden files touched, diff size within packet bounds) + stage 6 votes + stage 7 votes + back-translation match. Decision table: any failed objective gate → send back to 5; blind DO-NOT-MERGE with reproduced defect → send back to 5 (or 2 if design-level); back-translation mismatch → send back to 0/2; else MERGE. Writes `verdict.md`, merges/rebases the task branch, closes the task, unblocks dependents.

### Stage 9 — Learn
Append to `decisions.md` (ADR-lite): what was decided and why; update `zones.yaml` (new invariants, new paths); record metrics: first-pass yield per stage, send-backs by target stage, cycle time. These feed the next intake (the mapper reads decisions to avoid re-deciding).

## 2. Loop control (no infinite cycles)
- Each task carries `sendbacks: {stage: count}`; limit 2 per stage, 4 total; on breach → **escalate to human** with a one-screen summary (what was tried, what failed, options).
- A send-back must carry *evidence* (failing test, reproduction, quote of the violated criterion). "I don't like it" is not a send-back.
- Reviewers never fix; implementers never judge. Fixing in review re-couples the roles.

## 3. Human checkpoints (minimal by design)
- After intake for L/XL only: "is this what you meant?" (batched questions).
- On escalation (always).
- Before merge for XL or when `zones.yaml` marks a zone as human-approval-required (e.g. payments, auth, migrations).
Everything else runs unattended.

## 4. Why this is *faster* than a straight line
- Fast lane for S tasks: intake-lite → execute → one reviewer → merge.
- Hypothesis gate kills wrong plans before code is written (cheapest point).
- Parallel waves across zones.
- Fresh contexts per stage: no context rot, no re-reading of the whole history.
- Artifacts make resume free: a new session picks up `runs/<id>/` and continues.

## 5. Universality
- Tool-agnostic core: the stages, artifacts, and role prompts are plain markdown/JSON; any agent tool (Claude Code, Cursor, Codex, a human team) can run them.
- Language-agnostic checks: `zones.yaml` declares per-zone commands (test/lint/typecheck), the workflow just runs them.
- Reference implementation for Claude Code: `.claude/agents/*` (one persona per role, with restricted tools), `.claude/workflows/separator.js` (deterministic control flow: waves, loop counters, schemas for every artifact), `.claude/skills/separator/SKILL.md` (`/separator <task>`), hooks (block `git push` to main without a verdict file; protect tests from deletion).

## 6. Artifact layout
```
.separator/
  zones.yaml          # persistent
  decisions.md        # persistent (ADR-lite)
  metrics.jsonl       # persistent
  runs/<run-id>/      # git-ignored (so blind reviewers physically cannot see it)
    intake.md  plan.json  tasks/<task-id>/{packet.md,hypotheses.md,handoff.md,review-*.md,blind-*.md,verdict.md}
```

## 7. Known weaknesses of this draft (for judges)
- Blind reviewers still see CLAUDE.md and commit messages unless stripped; commit messages should be neutral during the run.
- Cost: an L task could spawn ~10 agent calls; needs the fast lane and clear skip rules to stay net-positive.
- Zone map on a huge legacy repo may be expensive to build; needs an incremental "map only touched areas" mode.
- Decision table in stage 8 must be exhaustive or it becomes a judgment call again.
