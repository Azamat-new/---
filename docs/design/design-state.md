# Design: "Ledger Separator" — a state-and-memory-first funnel

Angle: **resumability and zero context rot**. Every stage is a pure function
`(files in the run ledger) -> (files in the run ledger)`, runnable by a fresh
context that has read nothing but the ledger. The workflow script holds control
flow; the filesystem holds memory; the model holds nothing between stages.

## 0. Thesis: the straight line is a memory failure

`task -> error -> fix -> error -> fix` happens because the only memory is one
context window. As it fills, the agent forgets constraints it set an hour ago,
re-decides settled questions, fixes B by breaking A, and the human becomes the
memory. Adding reviewers to that line does not help: they inherit the same
rotted context or none at all.

The separator fixes the memory model, not the people:

1. **Three memories, three lifetimes.**
   - *Run ledger* (`.separator/runs/<run>/`, git-ignored): everything about
     this piece of work. Ephemeral, verbose, machine-checked.
   - *Project memory* (`.separator/memory/`, committed): zone map, decision
     records, lessons, metrics. Durable, small, pruned every run.
   - *Role memory* (`.claude/agent-memory/<role>/`): what a reviewer role has
     learned about this repo. Only context-AWARE roles get it; blind roles never.
2. **Every stage exit is a checkpoint**: `STATE.json` + `RESUME.md` regenerated,
   work committed. A crash, `/clear`, compaction, or a new day costs nothing.
3. **Fresh context per stage, by construction.** No agent continues another's
   context. A retry is a new agent given the ledger plus the previous attempt's
   notes. This turns "correcting Claude more than twice" from a smell into an
   impossibility: the context is thrown away every time.
4. **Blind review is physically blind.** The outside reviewer runs in a sandbox
   that does not contain the ledger, `CLAUDE.md`, `.claude/`, commit messages,
   or branch names, launched with `--bare` so no hook, skill, or memory loads.

## 1. Diagram

```
                       ┌──────────────────────────────────────────────┐
   WIDE MOUTH          │ S0 INTAKE  request.md -> interview -> brief.md│  H1 (brief+lane)
                       └──────────────┬───────────────────────────────┘
                                      │ lane = fast | standard | full
                       ┌──────────────▼───────────────┐
   ZONES               │ S1 ZONE MAP  memory/zones.json│  (skipped: fast, unless map stale)
                       │   impact.md                   │
                       └──────────────┬───────────────┘
                       ┌──────────────▼───────────────┐
   DECOMPOSE           │ S2 UNITS  units.json, ADR-*.md│  H2 (units+ADRs, full lane)
                       └──────────────┬───────────────┘
                       ┌──────────────▼───────────────┐
   DISTRIBUTE          │ S3 ASSIGN  assign.json        │  worktree + role + model per unit
                       └──────┬───────┬───────┬───────┘
              ┌───────────────┘       │       └───────────────┐        (units run as a
     ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐  pipeline, no barrier)
     │ S4 HYPOTHESIS   │    │ S4 HYPOTHESIS   │    │ S4 HYPOTHESIS   │
     │ spike+contract  │    │ ...             │    │ ...             │  contract.md vetted
     ├─────────────────┤    ├─────────────────┤    ├─────────────────┤  by a separate evaluator
     │ S5 EXECUTE      │    │ S5 EXECUTE      │    │ S5 EXECUTE      │  diff.patch + evidence.md
     ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
     │ S6 AWARE REVIEW │◄──►│ S6 AWARE REVIEW │◄──►│ S6 AWARE REVIEW │  send-back to S5/S4/S2
     └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  (counters in STATE.json)
              └───────────────┐      │      ┌───────────────┘
                       ┌──────▼──────▼──────▼─────┐
   INTEGRATE           │ S6.5 INTEGRATION  merge   │  unit branches -> run branch; full test run
                       │ integ-evidence.md         │
                       └──────────────┬────────────┘
                       ┌──────────────▼────────────────────────────┐
   BLIND               │ S7 BLIND  sandbox/ (archive, 2 neutral     │  --bare, no CLAUDE.md,
                       │   commits, no ledger) -> verdict-<lens>.json│  no ledger, no memory
                       │   -> refute pass -> blind.json             │
                       └──────────────┬────────────────────────────┘
                       ┌──────────────▼────────────┐
   VERDICT             │ S8 VERDICT  VERDICT.md     │  H3 (human merge decision, always)
                       │   decision table -> action │
                       └──────────────┬────────────┘
                       ┌──────────────▼────────────┐
   LEARN               │ S9 LEARN  lessons, zones,  │  prunes memory; writes metrics.jsonl
                       │   ADR promotion, metrics   │
                       └───────────────────────────┘
   Send-backs: S6->S5 (fix), S6->S4 (wrong hypothesis), S6->S2 (wrong decomposition),
               S8->S5 (blind Critical), S8->S2 (blind found scope/design error), S8->S0 (brief wrong).
   Every arrow passes through the ledger: no stage talks to another except via files.
```

## 2. Ledger layout

```
.separator/
  config.yml                 # committed: commands {test, lint, build, typecheck}, lane thresholds, caps
  ACTIVE                     # git-ignored: id of the active run (one line)
  memory/                    # committed, durable, size-capped, pruned in S9
    zones.json               # zone map: {zone: {paths[], invariants[], tests[], owner_role, forbidden_deps[]}}
    decisions/ADR-0001.md    # promoted decisions (ADR-lite: Context / Decision / Consequences / Status)
    lessons.md               # <= 80 lines; each line = a recurring finding turned into a rule or a hook
    metrics.jsonl            # one line per finished run
  runs/<run-id>/             # git-ignored; run-id = <yyyymmdd>-<slug> passed in via args
    STATE.json               # machine state (see 2.1). JSON on purpose: models mangle JSON less than MD
    RESUME.md                # <= 60 lines, regenerated at every checkpoint; the ONLY thing a new session reads first
    sessions.jsonl           # appended by SessionStart/SessionEnd hooks: {session_id, source, stage, ts}
    00-intake/request.md     # verbatim user request, never edited
    00-intake/interview.md   # Q&A transcript (questions + answers only)
    00-intake/brief.md       # goal, non-goals, constraints, acceptance criteria, risk class, lane
    00-intake/ACCEPTANCE.md  # user-visible acceptance criteria ONLY (fed to black-box blind reviewer)
    10-zones/impact.md       # zones touched, invariants at risk, tests that must stay green
    20-plan/units.json       # decomposition: units[{id, zone, deps[], files_allowed[], acceptance[], size}]
    20-plan/ADR-*.md         # run-local decisions; promoted to memory/decisions in S9 if durable
    30-assign/assign.json    # unit -> {role, model, worktree, branch, budget}
    40-units/<unit>/
      H.md                   # hypothesis: claim, cheapest falsifying check, result, verdict
      contract.md            # what "done" means + runnable check; status: proposed|vetted|rejected
      attempt-<n>/notes.md   # what the builder learned; read by the NEXT attempt, never by the same context
      diff.patch             # git diff of the unit branch against run base
      evidence.md            # commands run + outputs (tests, lint, screenshots); assertions are not evidence
      review-r<n>.json       # aware review findings, round n
    50-integration/integ-evidence.md
    60-blind/
      sandbox-manifest.json  # base sha, head sha, stripped paths, tree hash of sandbox (audit of blindness)
      verdict-blackbox.json  # lens A: sandbox + ACCEPTANCE.md
      verdict-zero.json      # lens B: sandbox only
      refute-<i>.json        # per-finding refutation attempts
      blind.json             # merged, deduped, refuted-filtered
    70-verdict/VERDICT.md    # decision-table output, human decision, merge sha
    metrics.jsonl            # per-stage: tokens, wall_ms, sendbacks, findings by severity
```

Ephemeral run data is git-ignored (`.separator/runs/`, `.separator/ACTIVE`),
so it never appears in any worktree or archive; durable memory is committed and
therefore stripped explicitly by the sandbox builder (section 7).

### 2.1 STATE.json (the state machine)

```json
{ "run": "20260926-billing-retry", "lane": "full", "stage": "S5",
  "base_sha": "…", "run_branch": "sep/20260926-billing-retry",
  "units": { "U1": { "stage": "S6", "attempt": 2, "sendbacks": {"S5": 1, "S4": 0, "S2": 0},
                     "branch": "sep/…/U1", "last_evidence_sha": "…" } },
  "sendbacks_total": 1, "escalations": [], "human_gates": {"H1": "approved", "H2": "approved"},
  "workflow_runs": {"sep-build": "run_…"}, "updated_by": "session_…" }
```

Invariants enforced by `gate.sh` (run by agents and by hooks, never trusted from
memory): every unit branch named in STATE.json exists; `last_evidence_sha` equals
the branch head, else evidence is stale and S5 is reopened; counters never
decrease; `stage` advances only via `checkpoint.sh`.

## 3. Stages

| # | Stage | Runs it (context it MUST NOT have) | Reads | Writes | Objective exit gate | Send-back targets | Skipped when |
|---|---|---|---|---|---|---|---|
| S0 | Intake (wide mouth) | `sep-intake` interviewer; no code edits. Must not see prior runs' ledgers (only memory/) | request.md, memory/zones.json, lessons.md | interview.md, brief.md, ACCEPTANCE.md, STATE.json(lane) | brief.md has all 6 headings non-empty; ACCEPTANCE.md has >=1 criterion phrased as a runnable or observable check; lane chosen by rule table | none (it is the beginning) | never (fast lane: interview capped at 3 questions) |
| S1 | Zone map | `sep-zone-mapper`, read-only; must not see brief's proposed solution (only goal/non-goals) | repo, zones.json | zones.json (updated), impact.md | every path in the repo matches exactly one zone or `_unzoned`; impact.md lists >=1 zone with invariants + tests | S0 (goal touches no known zone and is ambiguous) | lane=fast AND zones.json younger than N commits |
| S2 | Decomposition | `sep-planner`, read-only on code, write-only in ledger; must not see S4+ artifacts of any previous attempt except `notes.md` on a send-back | brief, impact, zones, lessons | units.json, ADR-*.md | units.json validates; DAG acyclic; every unit has files_allowed within its zone, >=1 acceptance check, size <= cap; every "why X not Y" has an ADR | S0 (brief contradictory), S1 (zone map wrong) | lane=fast (single implicit unit generated from brief) |
| S3 | Distribution | script (no model) + `sep-assigner` for model/role choice | units.json, assign rules in config.yml | assign.json, worktrees/branches created | every unit has branch + worktree + role + budget; branches based on base_sha | S2 (unit unsplittable within budget) | lane=fast (defaults) |
| S4 | Hypothesis check | `sep-spiker` in throwaway worktree (maxTurns, cannot commit); then `sep-contract-evaluator` read-only, separate agent, must not see the spiker's reasoning, only H.md + contract.md | unit spec, impact, ADRs | H.md, contract.md(status=vetted) | H.md verdict in {supported, refuted}; contract.md vetted by evaluator; contract contains a runnable check that FAILS on base_sha (proof the check tests something) | S2 (hypothesis refuted -> unit redefined) | unit.size=S AND zone has no `risk:high` invariant AND lane!=full |
| S5 | Execute | `sep-builder`, isolation: worktree, writes restricted to files_allowed by hook; must not see other units' diffs or review histories, only its own `attempt-<n-1>/notes.md` | contract.md, unit spec, zone invariants, lessons.md (path-scoped) | diff.patch, evidence.md, attempt-n/notes.md, commit on unit branch | contract check passes with output captured in evidence.md; lint/typecheck pass; diff touches only files_allowed; `last_evidence_sha == HEAD` | S4 (contract unimplementable), S2 (scope wrong) | never |
| S6 | Aware review | `sep-reviewer` fresh context, read-only + test command; sees contract, diff, evidence, zone invariants, lessons; must NOT see builder notes/transcript; has role memory | contract, diff, evidence, zones, lessons | review-r<n>.json | zero findings with severity in {Critical, Important} after refutation OR round cap reached (-> escalate) | S5 (fix), S4 (hypothesis wrong), S2 (decomposition wrong) | never (fast lane: 1 lens, 1 round) |
| S6.5 | Integration | script + `sep-integrator` (merge conflicts only) | unit branches | run_branch merged, integ-evidence.md | full test/lint/build on run branch green; no unit's contract check regressed | S5 (of the unit whose check regressed) | single-unit runs (merge is trivial, tests still run) |
| S7 | Blind review | `sep-blind-blackbox` + `sep-blind-zero` via `claude --bare -p` inside sandbox; NO ledger, CLAUDE.md, .claude/, memory, hooks, commit messages, branch names; then `sep-refuter` (also sandboxed) | sandbox tree + (blackbox only) ACCEPTANCE.md | verdict-*.json, refute-*.json, blind.json, sandbox-manifest.json | both verdict files validate; every finding either refuted or confirmed with file:line evidence; manifest hash matches a fresh rebuild | S8 decides (S7 itself never sends back) | never on full/standard; fast lane runs zero-lens only |
| S8 | Verdict | script applies decision table; `sep-judge` only writes the human-readable VERDICT.md; human decides | STATE, review-r*.json, blind.json, integ-evidence | VERDICT.md, merge sha, `.push-approved` token | VERDICT.md action recorded; if MERGE: human approval line present; push/merge hook unlocked | S5, S2, S0 (per table) | never |
| S9 | Learn | `sep-librarian`; must not edit code | whole ledger, memory/ | lessons.md, zones.json, memory/decisions/, memory/metrics.jsonl | memory size caps hold (lessons <= 80 lines, zones.json valid); every recurring finding (>=2 runs) has a lesson, rule, or hook | none | never (fast lane: metrics only) |

### 3.1 Lanes (the "skip_when" column, decided once in S0)

| Signal (from brief + zone map) | Lane | Stages that run |
|---|---|---|
| one zone, <= 2 files, no `risk:high` invariant, diff describable in one sentence | **fast** | S0(3 questions) -> S5 -> S6(1 lens, 1 round) -> S7(zero lens) -> S8 -> S9(metrics) |
| <= 3 units, one or two zones, no public interface change | **standard** | all except H2; S4 only for units flagged risky |
| >3 units, or public API/schema/migration, or `_unzoned` paths, or `risk:high` | **full** | everything, H1+H2+H3 |

Lane can only be *raised* mid-run (S1/S2 may raise fast->standard->full when
they discover scope); it is never lowered. The raise is an ADR.

### 3.2 Stage detail that the table cannot carry

**S0 Intake.** The interviewer asks until brief.md's six headings are filled:
Goal, Non-goals, Constraints, Acceptance (observable), Unknowns, Risk class.
`ACCEPTANCE.md` is extracted verbatim from Acceptance and frozen: it is the only
artifact allowed to cross into the blind sandbox, so it must contain no
implementation words ("use a queue", "add a column"). A gate greps it for
verbs from a deny list (`refactor|extract|use|add table|migrate`) and rejects.

**S1 Zone map.** Zones are the "areas of responsibility". The map is durable
project memory: `{zone: {paths, invariants, tests, owner_role, forbidden_deps}}`.
It is rebuilt only when stale (paths unmatched or N commits old). `impact.md`
names, for this run, which invariants are at risk and which tests are the
tripwires. Each zone's `owner_role` picks the builder/reviewer persona and the
path-scoped rule file `.claude/rules/zone-<name>.md` that loads only there.

**S2 Decomposition + ADR-lite.** A unit is the largest piece one fresh context
can finish and prove in one sitting (size cap in config: files, lines, and
"one contract check"). `ADR-NNNN.md` has four lines minimum: Context, Decision,
Consequences, Status. Every fork in the road that a later reviewer might
re-litigate gets one, so the review stage reads the ADR instead of arguing. ADRs
are what make a 20-session feature consistent: session 14 cannot silently undo
session 3's decision because the decision is a file the gate checks against.

**S3 Distribution.** Mechanical. Creates `sep/<run>/<unit>` branches from
`base_sha`, one worktree per unit, and chooses model tier by unit size and risk
(cheap model for size-S mechanical units, strong model for anything touching a
`risk:high` invariant). Writes `assign.json`; the builder never chooses its own
budget.

**S4 Hypothesis check.** Two agents, deliberately separated: the *spiker* tries
the cheapest falsifying experiment for the unit's central assumption (a 20-line
throwaway, a query against real data, a call to the real API) and writes `H.md`;
the *contract evaluator* then reads only `H.md` + `contract.md` and either vets
the contract or rejects it with a reason. The contract must contain a check that
demonstrably fails on `base_sha` (the gate runs it); a check that passes before
the work is done proves nothing and is rejected. This is the stage that kills
the "error -> fix" chain at its root: wrong assumptions die at 5% of the cost.

**S5 Execute.** The builder gets: contract, unit spec, zone invariants, the
path-scoped rules, lessons, and `attempt-<n-1>/notes.md` if this is a retry.
It never gets the previous attempt's context. A PreToolUse hook blocks edits
outside `files_allowed`; the builder can request an expansion by writing
`SCOPE-REQUEST.md`, which routes to S2 (not silently allowed). A Stop hook
refuses to end the turn until `evidence.md` exists and contains the contract
check's output from the current HEAD.

**S6 Aware review.** Fresh context, correctness-only, file:line citations,
report gaps not preferences, at most 5 nits. Round 2 suppresses nits and
reports Important+ only (convergence rule). Findings are structured:
`{severity, file, line, claim, how_to_verify, send_back_target}`. Every
finding is refuted once by a separate refuter before it counts (reviewers
over-report by construction). The reviewer role has `memory: project`, so
recurring bug classes in this repo accumulate; S9 later promotes them to
lessons or hooks.

**S6.5 Integration.** Units are merged into the run branch in dependency order;
the full suite runs; each unit's contract check is re-run on the integrated
tree. A regression names the unit and sends only that unit back to S5 with the
integrated failure in its notes.

**S7 Blind review.** Section 7.

**S8 Verdict.** Section 8. The script, not a model, applies the table; the
judge agent only writes prose. Human always decides MERGE.

**S9 Learn.** The librarian promotes durable ADRs to `memory/decisions/`,
appends metrics, updates the zone map for any path the run created, and adds
lessons *only* for findings that appeared in >= 2 runs (single occurrences stay
in role memory). It then prunes: lessons.md <= 80 lines, oldest low-frequency
first. Memory that grows without bound reproduces context rot in a new place.

## 4. Loop control (send-backs cannot cycle forever)

1. **Counters live in STATE.json, incremented by `checkpoint.sh`, never by an
   agent's judgement.** Caps (config.yml defaults): per unit `S6->S5: 2`,
   `S6->S4: 1`, `->S2: 1`; per run `S8->S5: 1`, `S8->S2: 1`, `S8->S0: 1`; total
   send-backs per unit `4`, per run `8`. Reaching a cap writes `ESCALATION.md`
   and stops the workflow; a human reads a one-page summary and chooses
   (override, redefine, abandon).
2. **Monotonic information rule.** A send-back must carry a `delta` (the new
   fact the retry will act on). The script hashes `delta`; an identical delta
   twice in a row is thrash and escalates immediately, regardless of caps.
3. **Fresh agent per attempt.** Retries are new contexts with the previous
   `notes.md`; the failed context is discarded, so a retry cannot inherit the
   confusion that caused the failure.
4. **Round-2 convergence.** Second aware-review round reports Important+ only;
   a blind re-run after fixes (S8->S5->S7) happens at most once, then the
   remaining findings go to the human as "known, unresolved".
5. **Budget ceiling.** Each workflow reads `budget.remaining()`; a run also has
   a token cap in STATE.json; crossing it escalates rather than trims quality
   silently (the drop is logged, never hidden).
6. **Stop-hook cap.** Builder Stop hooks check `stop_hook_active` and converge;
   the platform's 8-block cap is a backstop, not the mechanism.

## 5. Session boundaries: how a 3-day feature survives 20 sessions

Walkthrough (full lane, 6 units, 20 sessions over 3 days):

- **Session 1.** `/sep-start "<request>"` creates the run dir, writes
  `request.md`, sets `ACTIVE`. Runs workflow `sep-intake` (S0+S1). Ends at H1:
  `RESUME.md` says "awaiting H1: read brief.md, then run /sep-approve H1".
- **Session 2 (next morning).** SessionStart hook prints RESUME.md. Human
  approves H1 in one line. `/sep-resume` sees `human_gates.H1=approved`,
  launches `sep-plan` (S2+S3). Ends at H2.
- **Sessions 3-15.** `/sep-resume` launches `sep-build` with
  `args:{run, now}`. `sep-build` pipelines units through S4->S5->S6. It is
  resumable: if the laptop closes in session 7, session 8 relaunches with
  `resumeFromRunId`; the journal returns finished units' results instantly and
  only the interrupted agent reruns. Because the script has no filesystem
  access, every agent's final act is `checkpoint.sh <unit> <stage>`, and every
  agent's first act is `gate.sh <unit>`; the ledger is authoritative even if
  the journal is lost (fallback: `/sep-resume` re-derives the work-list from
  STATE.json and launches a continuation script for unfinished units only).
- **Compaction mid-session.** SessionStart(compact) re-injects RESUME.md, and
  CLAUDE.md carries the one-line compaction instruction "preserve: active run
  id, current stage, modified files, test commands". Nothing else needs to
  survive compaction because nothing else lives in context.
- **Session 16.** `sep-integrate` (S6.5). Session 17: `sep-verdict` (S7+S8),
  builds the sandbox, runs blind lenses, writes VERDICT.md, waits at H3.
- **Session 18.** Human reads VERDICT.md, writes `approved-by` line; hook now
  allows `git merge`/`push`. Session 19: `sep-learn` (S9). Session 20: nothing
  left; `/sep-status` reports the run closed and clears `ACTIVE`.

The main session's context never contains unit details. It holds: RESUME.md
(<= 60 lines), the workflow's returned summary, and the human's one-line
decisions. That is what "no context rot" means operationally: there is no
long-lived context to rot.

`sessions.jsonl` (written by hooks, not by the model) answers "what happened in
session 11?" without transcripts: session id, `source` (startup/resume/
compact/clear), stage at start and end, checkpoint shas.

## 6. Checkpoint and gate primitives (tool-agnostic)

```
checkpoint.sh <run> <unit|-> <stage>     # validates gate, updates STATE.json, regenerates RESUME.md,
                                          # commits unit branch with NEUTRAL message "U3 change set 2",
                                          # appends metrics line; refuses if gate fails (exit 2)
gate.sh <run> <stage> [unit]              # pure checks: files exist, schemas validate, evidence sha == HEAD,
                                          # contract check fails on base / passes on head, files_allowed respected
resume.sh <run>                           # prints RESUME.md; used by SessionStart hook and /sep-resume
sandbox.sh <run>                          # builds 60-blind/sandbox (section 7), writes manifest
```

Neutral commit messages are a design rule everywhere, not just at the end:
unit commits say `U3 change set 2`, never "fix reviewer's finding about race
in retry loop". Intent lives in the ledger, not in git history, so nothing
leaks into any worktree, archive, or `git log`.

## 7. Blind reviewer isolation protocol (physically context-free)

Verified experimentally while designing: a detached worktree with
`sparse-checkout` can hide `CLAUDE.md`, `.claude/`, `.separator/`, but
`git log` in that worktree still shows every commit message. Worktrees are
therefore NOT blind. The protocol:

```
sandbox.sh:
  1. git archive <base_sha>  | tar -x -C 60-blind/sandbox           # tree only, no .git
  2. rm -rf CLAUDE.md CLAUDE.local.md AGENTS.md .claude .separator .cursor .github/copilot* docs/decisions
     (strip list from config.yml; the list is itself audited by S9)
  3. git -C sandbox init -b main && commit -m "base"                # neutral
  4. git archive <head_sha> | tar -x (same strip) && commit -m "change"   # neutral; exactly 2 commits
  5. write sandbox-manifest.json {base_sha, head_sha, stripped[], tree_hash}
  6. optional: copy ACCEPTANCE.md to sandbox/../ACCEPTANCE.md (outside the tree, blackbox lens only)
launch (per lens):
  cd 60-blind/sandbox && claude --bare -p --system-prompt-file .claude/agents/sep-blind-<lens>.md \
     --allowedTools "Read,Grep,Glob,Bash(git diff *),Bash(git log *),Bash(<test cmd>)" \
     --output-format json --json-schema "$VERDICT_SCHEMA" > ../verdict-<lens>.json
```

Why each piece: `--bare` skips CLAUDE.md, hooks, skills, agents, MCP, and auto
memory (documented); the archive has no history, so `git log` shows only
"base"/"change"; branch is `main`; the run ledger is git-ignored and was never
in the tree; durable memory is stripped by name; output goes to the parent dir,
so the sandbox stays pristine for the refuter; the manifest lets S9 (or a
human) verify the tree hash by rebuilding. If the CLI is unavailable, the
fallback is a subagent with `omitClaudeMd: true`, no `memory`, `cwd` set to the
sandbox in the prompt, same tool allow-list; it is weaker (session hooks still
run) and the manifest records which launcher was used.

Two lenses, run in parallel, different blindness levels:

- **blackbox**: sandbox + ACCEPTANCE.md. "You are inspecting a delivered
  product against its acceptance list. Run it, test it, read it. Report what a
  user would experience as broken, missing, or dangerous." Answers the
  open question "is fully blind too blind?": it gets what a customer has, which
  is not process context.
- **zero**: sandbox only. "You are handed a change with no explanation. Infer
  intent from the diff, names, and tests. Report: (a) behaviour the diff
  introduces that its own tests do not cover, (b) internal contradictions,
  (c) anything a maintainer would refuse to merge without an explanation."
  Its most valuable output is `inferred_intent`: if the zero reviewer cannot
  infer what the change is for, the change is unreadable, which is itself a
  finding (`severity: Important, kind: legibility`).

Each finding is then handed to a sandboxed refuter (also `--bare`, same
sandbox) that must reproduce or refute with a command; unreproducible findings
are kept as `unverified`, not deleted. The merged `blind.json` records, for each
finding, whether the aware review (S6) had already seen it: that difference is
the **blind escape rate**, the single most important metric of the funnel.

## 8. Verdict decision table (applied by the script; human decides MERGE)

Inputs: `T` = integration suite green; `A` = aware review clean (no Important+
after refutation); `B_crit` = confirmed Critical from blind; `B_imp` =
confirmed Important from blind; `B_intent` = zero lens inferred intent matches
ACCEPTANCE (judged by script string overlap + judge agent); `U` = unverified
blind findings count.

| T | A | B_crit | B_imp | B_intent | Action | Target | Notes |
|---|---|---|---|---|---|---|---|
| no | – | – | – | – | SEND BACK | S5 (failing unit) | never reaches blind; caught in S6.5 |
| yes | no | – | – | – | SEND BACK | S5 / S4 / S2 per finding's `send_back_target` | round cap applies |
| yes | yes | >=1 | – | – | SEND BACK | S5 (unit owning file) | one blind re-run allowed after fix |
| yes | yes | 0 | >=1 | yes | HUMAN CHOICE | – | VERDICT.md lists them; human may merge with a recorded waiver ADR |
| yes | yes | 0 | >=1 | no | SEND BACK | S2 | intent illegible + important findings = design problem, not a fix |
| yes | yes | 0 | 0 | no | SEND BACK | S5 with `legibility` note | rename/doc/test until a stranger can infer intent |
| yes | yes | 0 | 0 | yes | MERGE (pending H3) | – | nits and U listed in VERDICT.md as non-blocking |
| yes | yes | 0 | 0 | yes, but blind found ACCEPTANCE contradiction | SEND BACK | S0 | the brief was wrong; rare but the only honest target |
| any | any | any | any | any, cap reached | ESCALATE | human | ESCALATION.md with counters, deltas, and the two best options |

Rules: `U > 3` downgrades MERGE to HUMAN CHOICE; a waiver is an ADR with
Status=waived so the next run's S9 can see whether waivers recur. VERDICT.md
always contains the tally line first, e.g. `MERGE-PENDING: T ok, A ok, blind 0C/0I/2U, intent ok`.

## 9. Human checkpoints

| Gate | When | Lanes | What the human reads | What they write |
|---|---|---|---|---|
| H1 | after S0/S1 | standard, full | brief.md (1 page), lane | `approved` or edits to brief.md |
| H2 | after S2/S3 | full | units.json summary + ADR list | `approved` / unit edits / ADR override |
| H3 | at S8 | all | VERDICT.md (tally + findings + evidence links) | `approved-by:` line, or a send-back choice |
| H-esc | on cap/thrash | all | ESCALATION.md | one of the options |

The workflow tool takes no mid-run input, so each gate ends a workflow and the
next one starts from the ledger. This is a feature: the human's decision is a
file, so it survives sessions and is auditable in S9. Fast lane has exactly one
human touch (H3), so a one-line fix costs the human one read.

## 10. Metrics (memory/metrics.jsonl and runs/<id>/metrics.jsonl)

Per stage: `tokens`, `wall_ms`, `agents`, `sendbacks`, `findings{C,I,nit,U}`.
Per run: `lane`, `units`, `sessions` (from sessions.jsonl), `resume_count`,
`blind_escape_rate` (blind Important+ not seen by S6 / all Important+),
`hypothesis_kill_rate` (units whose H was refuted / units spiked),
`first_pass_rate` (units merged with zero send-backs), `human_overrides`,
`cost_usd` (from `--output-format json` totals where available).

Uses: S9 tunes lanes (if fast-lane runs show blind Critical > 5%, tighten the
fast rule); a rising `blind_escape_rate` means S6 lenses or lessons are stale;
a falling `hypothesis_kill_rate` means S4 is no longer load-bearing for that
zone and can be skipped there (harness pruning, by data).

## 11. Why this is faster than the straight line

- **Rework is priced before it happens.** S4 kills wrong assumptions at spike
  cost; the straight line discovers them after implementation, then fixes them
  inside a rotted context that breaks something else.
- **No re-discovery tax.** Each straight-line error costs a re-read of the
  world; here a fresh agent reads a 60-line RESUME.md and one unit's ledger.
- **Parallel units, serialized writes.** Units run as a pipeline (no barrier)
  in separate worktrees; a slow unit does not block a fast one.
- **Crashes are free.** Workflow resume + ledger checkpoints mean session 8
  never redoes session 7.
- **Lanes.** Most changes are fast-lane: S0(3 questions) -> S5 -> S6 -> S7
  (zero) -> S8. That is one review and one blind check more than a naive
  edit, and no planning ceremony.
- **Compounding memory.** Zone map, lessons, ADRs make run N+1 cheaper: the
  interviewer asks fewer questions, the reviewer knows the repo's bug classes,
  the planner reuses decisions.
- Honest accounting: a single full-lane run is slower wall-clock than a *lucky*
  straight line and costs more tokens (multi-agent is ~15x chat). It wins on
  expected time including rework and on any horizon longer than one session.

## 12. Universality

Tool-agnostic definition: a stage = `(role prompt, input files, output files,
gate script)`. Language-agnostic: `config.yml` holds `test/lint/build/typecheck`
commands and the strip list; gates call them and never assume an ecosystem. Size-
agnostic: a tiny project has one zone and fast-lane everything; a monorepo has
dozens of zones and path-scoped rules. Runner-agnostic: any agent runner that can
spawn a fresh context, read/write files, and run shell scripts can implement it;
the Claude Code mapping below is one instantiation. Team-agnostic: human gates
are files, so a team can approve via PR comments that a hook copies into the
ledger.

## 13. Claude Code mapping

### 13.1 Agents (`.claude/agents/`)

| name | tools | model | notable frontmatter | job |
|---|---|---|---|---|
| sep-intake | Read, Grep, Glob, AskUserQuestion, Write | inherit | `maxTurns: 40` | interview -> brief.md/ACCEPTANCE.md |
| sep-zone-mapper | Read, Grep, Glob, Bash(git log *, git ls-files *) | sonnet-class | `memory: project` | zones.json, impact.md |
| sep-planner | Read, Grep, Glob, Write | inherit, `effort: high` | writes only under `.separator/runs/` (hook) | units.json, ADRs |
| sep-spiker | Read, Grep, Glob, Bash, Edit, Write | inherit | `isolation: worktree`, `maxTurns: 30` | H.md |
| sep-contract-evaluator | Read, Grep, Glob, Bash(test cmd) | inherit | read-only | vets contract.md |
| sep-builder | full minus Agent | per assign.json | `isolation: worktree`, `hooks:` Stop=evidence check | diff + evidence |
| sep-reviewer | Read, Grep, Glob, Bash(test cmd, git diff *) | inherit, `effort: high` | `memory: project`, `disallowedTools: Edit, Write, Agent` | review-r<n>.json |
| sep-refuter | same as reviewer | inherit | no memory | refute one finding |
| sep-integrator | Read, Edit, Bash(git *) | inherit | worktree of run branch | conflict resolution only |
| sep-blind-blackbox | Read, Grep, Glob, Bash(git diff *, git log *, test cmd) | strong | `omitClaudeMd: true`, no memory; normally launched via `--bare` | verdict-blackbox.json |
| sep-blind-zero | same | strong | same | verdict-zero.json |
| sep-judge | Read | inherit | no Bash | VERDICT.md prose |
| sep-librarian | Read, Write, Edit (memory/ only via hook) | inherit | `memory: project` | S9 |

Body of each file is the complete system prompt; the delegation prompt from the
workflow names the run id, the unit, and the exact files to read. Damping lines
in builder/planner prompts: minimum complexity; tests verify, they do not
define; do not spawn subagents for a grep.

### 13.2 Workflows (`.claude/workflows/`), one per human gate

```js
// sep-build.js  (S4 -> S5 -> S6 per unit, pipelined; S6.5 at the end)
export const meta = { name: 'sep-build', description: 'Hypothesis, build, aware review per unit',
  phases: [{title:'Hypothesis'},{title:'Build'},{title:'Review'},{title:'Integrate'}] }
const { run, now, units, caps } = args            // work-list scouted from STATE.json by /sep-resume; timestamps via args
const R = `.separator/runs/${run}`
const results = await pipeline(units,
  (u) => u.skipHypothesis ? {unit:u, contract:'vetted'} :
    agent(`Unit ${u.id} of run ${run}. Read ${R}/20-plan/units.json and ${R}/10-zones/impact.md. Spike the central
           assumption, write ${R}/40-units/${u.id}/H.md and contract.md, then run checkpoint.sh ${run} ${u.id} S4.`,
          {agentType:'sep-spiker', isolation:'worktree', schema:H_SCHEMA, phase:'Hypothesis', label:`${u.id} spike`})
      .then(h => agent(`Vet ${R}/40-units/${u.id}/contract.md against H.md only. Return vetted|rejected with reason.`,
          {agentType:'sep-contract-evaluator', schema:VET_SCHEMA, phase:'Hypothesis'})),
  async (prev, u) => {
    let attempt = 1, review = null
    while (attempt <= caps.s5) {
      await agent(`Build unit ${u.id} (attempt ${attempt}) in run ${run}. First run gate.sh ${run} S5 ${u.id}. Read
                   contract.md and attempt-${attempt-1}/notes.md if present. End with checkpoint.sh ${run} ${u.id} S5.`,
                  {agentType:'sep-builder', isolation:'worktree', schema:BUILD_SCHEMA, phase:'Build', label:`${u.id} a${attempt}`})
      const found = await agent(`Review unit ${u.id} of run ${run}: contract.md, diff.patch, evidence.md, zone invariants.
                   Round ${attempt}${attempt>1?' (Important+ only)':''}. Correctness only, file:line, <=5 nits.`,
                  {agentType:'sep-reviewer', schema:REVIEW_SCHEMA, phase:'Review'})
      const kept = (await parallel((found?.findings??[]).filter(f=>f.severity!=='nit').map(f => () =>
                  agent(`Refute or confirm: ${JSON.stringify(f)}. Default refuted if unreproducible.`,
                        {agentType:'sep-refuter', schema:VERDICT_SCHEMA, phase:'Review'})))).filter(v=>v && !v.refuted)
      review = {attempt, kept}
      if (!kept.length) break
      const deltaKey = kept.map(k=>k.file+':'+k.claim).sort().join('|')
      if (u.lastDelta === deltaKey) { log(`${u.id}: thrash detected, escalating`); return {unit:u, escalate:true, review} }
      u.lastDelta = deltaKey
      if (kept.some(k => k.send_back_target !== 'S5')) return {unit:u, sendBack: kept[0].send_back_target, review}
      attempt++
    }
    return {unit:u, review, escalate: review.kept.length > 0}
  })
phase('Integrate')
const ok = results.filter(r => r && !r.escalate && !r.sendBack)
const integ = ok.length ? await agent(`Merge units ${ok.map(r=>r.unit.id).join(',')} into run branch of ${run}, run the
             full suite, write 50-integration/integ-evidence.md, checkpoint S6.5.`, {agentType:'sep-integrator', schema:INTEG_SCHEMA}) : null
return { results, integ, now }
```

Companion scripts: `sep-intake.js` (S0, S1), `sep-plan.js` (S2, S3),
`sep-verdict.js` (sandbox build via a `sep-sandbox` skill call from an agent,
two blind lenses in `parallel`, refuters, judge; S8 table applied in plain JS),
`sep-learn.js` (S9). Every script: no `Date.now()`, timestamps in `args`, all
state read/written by agents through `gate.sh`/`checkpoint.sh`, results
returned as JSON so `/sep-resume` can stamp them into STATE.json.

### 13.3 Skills (`.claude/skills/`)

`/sep-start "<request>"` (creates run, writes request.md, sets ACTIVE, launches
sep-intake), `/sep-resume` (prints RESUME.md via `` !`resume.sh` ``, derives the
next workflow and its `args` from STATE.json, launches it), `/sep-approve H1|H2|H3`,
`/sep-status`, `/sep-sandbox <run>` (wraps sandbox.sh), `/sep-metrics`,
`/sep-blind` (`context: fork`, `agent: sep-blind-zero` for ad-hoc blind checks).
Zone rules: `.claude/rules/zone-<name>.md` with `paths:` so invariants load only
when their files are touched.

### 13.4 Hooks (`.claude/settings.json`)

| Event | Matcher | Script | Effect |
|---|---|---|---|
| SessionStart | `startup|resume|compact|clear` | `resume.sh` | prints RESUME.md of ACTIVE run into context; appends sessions.jsonl |
| SessionEnd | * | `session-end.sh` | appends sessions.jsonl with stage + HEAD |
| PreToolUse | `Edit|Write` | `guard-scope.sh` | exit 2 if path outside `files_allowed` of `$SEP_UNIT`, or inside `.separator/memory` outside S9, or inside `60-blind/sandbox` |
| PreToolUse | `Bash` if `git push *|git merge *` | `guard-merge.sh` | exit 2 unless `70-verdict/VERDICT.md` has `approved-by:` and action MERGE |
| PostToolUse | `Edit|Write` | `lint.sh` | runs config lint/typecheck, feeds errors back |
| Stop (builder agent frontmatter) | – | `stop-evidence.sh` | exit 2 until evidence.md sha == HEAD; honours `stop_hook_active` |
| SubagentStart | `sep-blind-*` | `assert-sandbox.sh` | exit 2 (blocks) if cwd is not a manifest-verified sandbox |
| PreCompact | * | `precompact.sh` | forces a checkpoint before compaction (RESUME.md fresh) |

Hooks are the enforcement layer; CLAUDE.md is advisory and stays under 40
lines: where the ledger is, the resume ritual, the compaction-preserve line,
and "never write intent into commit messages".

## 14. Top risks (honest)

1. **Ceremony creep on the wrong lane.** If S0 misclassifies a 2-file fix as
   `standard`, the user pays 5x for nothing. Mitigation: lane rule is
   mechanical and metrics-tuned; still, misrouting is the most likely
   day-to-day annoyance.
2. **Blindness cuts both ways.** The zero lens will flag intended behaviour as
   suspicious; the refuter filters, but recall of a blind reviewer is unknown
   and probably lower than an aware one. The blackbox lens with ACCEPTANCE.md
   is the hedge; if ACCEPTANCE.md is vague, both lenses degrade.
3. **Ledger/reality drift.** An agent edits code and skips `checkpoint.sh`;
   STATE.json lies. Gates compare evidence sha to HEAD and hooks force
   checkpoints on Stop and PreCompact, but a hard crash between edit and
   checkpoint still leaves a stale ledger that the next session must reconcile
   (`/sep-resume` runs `gate.sh` first and reports drift rather than guessing).
4. **Scope hooks block legitimate cross-zone fixes.** `files_allowed` is
   strict; the SCOPE-REQUEST route to S2 adds a round trip. Necessary for
   parallel safety, annoying for the 10% of units that genuinely need it.
5. **Strip-list incompleteness.** Process context can leak through README
   sections, test names, or docs that mention the plan. The manifest makes
   leaks auditable, not impossible.
6. **Platform constraints shape the design.** No fs access in scripts and no
   mid-run input mean state flows through agents calling shell scripts and
   through five separate workflows; if a future runtime changes these rules the
   mapping changes (the tool-agnostic layer does not).
7. **Memory bloat is context rot relocated.** lessons.md, zones.json, and role
   memory grow; hard size caps and S9 pruning are the only defence, and pruning
   can drop a lesson that mattered.
8. **Human gate latency.** Full lane has three human reads; for a solo
   developer that is the real wall-clock bottleneck, not the agents.
9. **Metrics noise.** `blind_escape_rate` on a handful of runs is statistically
   meaningless; lane tuning should wait for ~20 runs, which the design cannot
   enforce.
10. **Cost.** A full-lane run is 10-20x the tokens of a chat. Fast lane keeps
    the median cheap, but the user must accept that "error-free" is bought
    with tokens, and the design cannot promise zero errors, only that every
    error is caught by a party that did not make it.
