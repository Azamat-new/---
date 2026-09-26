# SEPARATOR-C: a correctness-first funnel for AI-assisted work on large projects

Angle: **zero escaped defects**. Every stage is a Swiss-cheese layer with a *named* class of error it
catches, an *objective* exit gate (a command exit code or a schema-validated artifact, never "looks
good"), and a *bounded* send-back. Speed comes from catching each error at the cheapest layer that can
see it, from parallel lanes, and from never re-discovering the same bug twice.

Thesis in one line: **separate who writes from who tests from who reviews from who judges; let nothing
move down the funnel without evidence; let nothing move back up without a reproduction.**

---

## 1. The error taxonomy (the holes we are closing)

Straight-line vibe-coding (task -> error -> fix -> error -> fix) fails because *one* context does every
job and its blind spots line up. The workflow below is designed against this explicit list; every
layer in section 5 names which of these it catches.

| ID  | Error class                          | Typical straight-line symptom                                   |
|-----|--------------------------------------|-----------------------------------------------------------------|
| E1  | Wrong problem (intent misread)       | Feature built, user says "that's not what I meant"              |
| E2  | Ambiguous / untestable requirement   | Endless "is this done?" arguments                               |
| E3  | Wrong decomposition (gap / overlap)  | Missing piece discovered at integration; two tasks edit 1 file  |
| E4  | False assumption (API, data, env)    | Code written against an API that behaves differently           |
| E5  | Logic bug in implementation          | Test fails, patch, another fails                                |
| E6  | Fake green (test tests nothing, or test edited to pass) | "All green" yet feature broken                   |
| E7  | Scope creep / silent regression      | Unrelated file changed, unrelated behaviour altered             |
| E8  | Works alone, breaks together         | Each branch green, integrated tree red                          |
| E9  | Reviewer capture (author narrative)  | Reviewer accepts "tested manually, works" and waves it through  |
| E10 | Process drift (artifacts lie)        | Spec says X, tests say X', code does X''                        |
| E11 | Non-functional (security, perf, data migration) | Ships, then incident                                 |
| E12 | Flaky / environment defects          | Red for reasons unrelated to the change; false send-backs       |
| E13 | Non-convergence (fix loops forever)  | Same two agents ping-pong the same bug                          |
| E14 | Repeat offence (same bug class again)| The team learns nothing between features                        |

---

## 2. The separator (diagram)

```
                       RAW REQUEST (any size, any language, half-formed)
  ================================================================================  wide mouth
  |  S0 INTAKE: restate, acceptance criteria (AC), non-goals, unknowns  [BT1]   |
  |            --> H1 human confirms INTAKE.md                                   |
  ================================================================================
       \  S1 ZONES: ownership map, contracts, verify commands per zone          /
        \  S2 DECOMPOSE: tasks with contracts + coverage matrix   [BT2 audit]  /
         \ S3 PLAN: DAG -> waves -> lanes (fast / full), risk class           /
          =================================================================
            per task, in parallel lanes (git worktree per agent):
            |  S4 PROBE     assumptions -> executable probes -> evidence   |
            |  S5 RED TESTS test author (never the implementer) -> red proof|
            |  S6 IMPLEMENT implementer (may not touch tests) [BT3 first]  |
            |  S7 GATE      mechanical: test/type/lint/build/scope/mutants |
            |  S8 REVIEW    N adversarial lenses, evidence-required        |
            |               send-back -> S6 | S5 | S2 | S0  (bounded)      |
            =================================================================
                  \  S9 INTEGRATE: merge candidate, full gate again      /
                   \ S10 BLIND: code-blind judge [BT4] + intent-blind   /
                    \     judge + mechanical comparator -> verdict     /
                     =============================================
                        S11 VERDICT: decision table -> H2 -> merge
                     =============================================
                                   |  S12 LEARN: ledger, escapes -> tests + checklists
                                   v
                              MERGED, TAGGED

 Send-back arrows (all carry a reproduction, all counted in LOOP.json):
   S8  --> S6 (impl bug)   S8 --> S5 (test gap)   S8 --> S2 (decomp)   S8 --> S0 (spec)
   S10 --> S6 / S5 / S0    S9 --> S2 (zone conflict)   S4 --> S2 / S0 (refuted hypothesis)
   any --> H3 (human) when a counter is exhausted or the artifact did not change
```

BT = back-translation check (section 4.4).

---

## 3. Artifact layout (the only memory between stages)

Sub-agents start with an empty context. Every stage reads files and writes files; nothing lives only in
a prompt. One directory per run, one sub-directory per task.

```
verify.yaml                         # universality contract: commands + zones (section 9)
.work/<run-id>/
  MANIFEST.json                     # sha256 of every artifact + which inputs produced it (cascade invalidation)
  LEDGER.jsonl                      # append-only event log (send-backs, passes, escalations, costs)
  00-intake/REQUEST.md              # verbatim user request (immutable)
  00-intake/INTAKE.md               # restatement, AC-1..AC-n, non-goals, unknowns, risk hints; approved: true|false
  01-zones/OWNERSHIP.md             # zones, paths, contracts, verify cmd, critical flag
  02-decomp/TASKS.md                # task list with contracts, deps
  02-decomp/RECONSTRUCTED.md        # spec re-derived from TASKS.md only (BT2)
  02-decomp/COVERAGE.json           # AC x task matrix, audit result
  03-plan/PLAN.json                 # waves, lanes, risk class per task, budget per task
  tasks/T-001/
    TASK.md                         # contract: inputs, outputs, invariants, AC refs, zones, size budget
    ZONES.json                      # write-allowlist globs for this task (read by the zone-guard hook)
    HYPOTHESES.md                   # assumption -> probe command -> output -> verified|refuted
    probes/                         # executable probes (never shipped)
    TESTS.md                        # test ids -> AC ids; red-proof output
    BT3.md                          # implementer's reading of the tests vs TASK.md, disputes
    EVIDENCE.md                     # commands run + outputs + diff scope + mutant results
    GATE.json                       # mechanical gate result (written only by verify script)
    REVIEW-<lens>.md                # one per reviewer lens; findings with repro
    SENDBACK-<n>.json               # evidence-required send-back records
    RESPONSE-<n>.json               # receiving stage's answer per finding
    DISPUTE-<n>.json / RULING-<n>.json   # test disputes and arbiter rulings
    LOOP.json                       # counters: per target, total agent runs, wall time, artifact hashes
  04-integration/GATE.json          # full gate on the integrated tree
  05-blind/BACKTRANSLATION.md       # code-blind judge: what this change does / is for / would break it
  05-blind/INTENT-VERDICT.md        # intent-blind judge: exercised each AC from REQUEST.md only
  05-blind/COMPARE.json             # comparator: AC-by-AC match table
  06-verdict/VERDICT.md             # decision table row hit, human decision, merge sha
  07-learn/POSTMORTEM-<n>.md        # only when a defect escapes; drives skill/checklist updates
```

Branch protocol (so worktrees never fight): `base` -> `task/T-001/tests` (S5) -> `task/T-001/impl`
(S6, branched from the tests branch) -> `integration/<run-id>` (S9). Each stage that mutates code
commits to its own branch; the next stage branches *from* it (`git checkout -b`), never checks the same
branch out twice. Reviewers and judges only read (`git diff base...task/T-001/impl`).

---

## 4. Principles that make the gates objective

### 4.1 Separation of duties (who may never be who)
- The agent that writes tests (S5) is never the agent that implements (S6). The implementer cannot edit
  test files (hook-enforced, not prompt-enforced). If a test is wrong it files a DISPUTE; an arbiter rules.
- Reviewers (S8) never see each other's findings while reviewing (parallel, fresh contexts).
- Blind judges (S10) are *mechanically* blindfolded: `omitClaudeMd`, a PreToolUse hook that denies reads
  of `.work/**`, spec files, commit messages, PR bodies, `git log/show/blame`. Their only input is the
  code (and, for the intent judge, the verbatim request + a runnable build).
- The gate (S7/S9) is a script, not a model. Its output file may only be written by that script
  (hook denies `Write`/`Edit` to `GATE.json`).

### 4.2 Objective exit gates
A gate is a predicate a script can evaluate: command exit codes, JSON-schema validation of an artifact,
set equations over ids (every AC id appears in >= 1 test id), hash comparisons. Where a model must judge
(e.g. "does the restatement match the request?") the gate is a *binary checklist* filled by >= 2
independent agents with majority rule, and the checklist itself is versioned in a skill.

### 4.3 Evidence-required send-backs
No stage may send work back on opinion. A send-back record is:
```json
{ "from":"S8", "to":"S6", "task":"T-001", "class":"E5", "severity":"blocking",
  "claim":"empty list returns 500 instead of []",
  "repro": { "command":"npm test -- tests/api/list.test.ts -t empty", "expected":"[]", "actual":"HTTP 500", "exit_code":1 },
  "suggested_fix":"optional, non-binding" }
```
A finding without a `repro` that fails is downgraded to `note` and cannot block. The receiving stage must
answer every item in `RESPONSE-<n>.json` (`accepted` with fix commit, or `refuted` with its own repro).
Unresolved disagreement goes to the arbiter once, then to a human. This kills E13 (ping-pong) and the
"reviewer says something vague, implementer guesses" waste.

### 4.4 Back-translation checks (four places)
Like translating a text back into the source language to see what was lost:
- **BT1 (S0)**: the request is restated as ACs; the human confirms the restatement, not the request. Catches E1/E2.
- **BT2 (S2)**: an auditor who sees *only* TASKS.md rewrites the spec it implies; a comparator diffs it
  against INTAKE.md. Missing AC => gap; extra behaviour => scope creep. Catches E3/E7 before any code.
- **BT3 (S6, before coding)**: the implementer reads the red tests and writes what they *require*; any
  mismatch with TASK.md becomes a DISPUTE now (cost: minutes) instead of after implementation (cost: a loop).
  Catches E6/E10 early.
- **BT4 (S10)**: a judge who has never seen the spec describes what the code does; a comparator checks
  every AC is accounted for and nothing unexplained is present. Catches E7/E9/E10 at the end.

### 4.5 Cascade invalidation
`MANIFEST.json` records each artifact's hash and its input hashes. A send-back that rewrites an upstream
artifact marks every downstream artifact stale; the script re-runs from the earliest stale stage. Nothing
stale is ever reused, so "we fixed the spec but the old tests are still there" cannot happen.

---

## 5. Stages (the Swiss-cheese layers)

Summary table; details follow.

| ID  | Stage           | Catches       | Who (context it must NOT have)                                | Objective exit gate (abridged)                                   | Send-back to     | Skipped when                       |
|-----|-----------------|---------------|---------------------------------------------------------------|------------------------------------------------------------------|------------------|------------------------------------|
| S0  | Intake          | E1 E2         | intake-restater (no solution ideas, no plan)                  | every AC testable; `approved: true` by human                     | -                | never (H1 may be 10 seconds)       |
| S1  | Zones           | E3 E7 E8      | ownership-mapper (repo + INTAKE)                              | every predicted path -> exactly 1 zone; each zone has verify cmd | S0               | cached map valid (hash of tree)    |
| S2  | Decompose       | E3 E7         | decomposer; reconstructor (TASKS only); comparator            | COVERAGE full both ways; DAG acyclic; size budget met            | S0               | fast lane (single auto task)       |
| S3  | Plan            | E8            | scheduler (script + 1 agent)                                  | no two parallel tasks write same zone; lane assigned             | S2               | fast lane                          |
| S4  | Probe           | E4            | hypothesis-prober (may not write product code)                | 100% assumptions verified/refuted with command+output            | S2 / S0          | zero unknowns in TASK.md           |
| S5  | Red tests       | E6 E10        | test-author (never implementer; no implementation exists)     | tests red on baseline; every AC ref -> >= 1 test id              | S2 / S0          | never                              |
| S6  | Implement       | E5            | implementer (cannot edit tests; zone allowlist)               | task tests green; diff within ZONES.json; BT3 filed              | S5 via DISPUTE   | never                              |
| S7  | Gate            | E5 E7 E12 E6  | script (no model judgement)                                   | test+type+lint+build exit 0; scope ok; mutants killed; flake retry | S6              | never                              |
| S8  | Adversarial review | E5 E6 E7 E11 | N lens reviewers (not each other's findings); arbiter        | 0 blocking findings with passing repro                           | S6 S5 S2 S0      | fast lane: 1 lens instead of N     |
| S9  | Integrate       | E8            | integrator script + contract-test agent                       | full gate green on integrated tree; contract tests green         | S2 (conflict) S6 | single task run                    |
| S10 | Blind verdict   | E7 E9 E10 E1  | code-blind judge, intent-blind judge (no spec/process); comparator | COMPARE: all AC matched, 0 unexplained; intent sim passes    | S6 S5 S0         | hotfix lane (runs post-merge)      |
| S11 | Verdict+merge   | -             | decision table (script) + H2                                  | row hit = MERGE; merge sha recorded                              | per table        | never                              |
| S12 | Learn           | E14           | learner (LEDGER + escapes)                                    | every escape -> regression test + taxonomy + checklist diff      | -                | no escape and no send-backs        |

### S0 Intake (the wide mouth)
- Purpose: accept anything (a sentence, a rant, a bug report, a design doc) and turn it into a checkable
  contract without deciding *how*.
- Who: `intake-restater`. Sees REQUEST.md, README/CLAUDE.md, tree listing. Must NOT see prior plans or
  proposed solutions (anchoring produces E1). A second agent, `ac-checker`, verifies each AC has an
  observable check ("user sees X", "command returns Y", "p95 < Z") and no vague verbs (support, handle,
  improve) without a measure.
- Input: `00-intake/REQUEST.md`. Output: `00-intake/INTAKE.md` with: restatement (<= 10 lines), AC-1..n
  (each with `observable:` and `how_to_check:`), non-goals, unknowns (each tagged `hypothesis` or
  `question-for-human`), risk hints (touches auth? data? public API?).
- Exit gate: schema valid; `ac-checker` returns 0 vague ACs; open `question-for-human` count = 0 (answered
  in the file) ; `approved: true` written by the human (H1).
- Send-back: none (it is the top). Skipped: never; for tiny requests INTAKE.md is 8 lines and H1 is one
  keystroke.

### S1 Zones of responsibility
- Purpose: make "who owns what" explicit so parallel work cannot collide and every path has a verifier.
- Who: `ownership-mapper`. Sees repo, `verify.yaml`, INTAKE.md. Produces OWNERSHIP.md: zone id, path
  globs, public contract (exported API / schema / CLI surface), verify command, `critical` flag
  (auth, payments, migrations, crypto, CI), and the *persona* that owns it (e.g. `api-implementer` with
  the `api-conventions` skill preloaded).
- Exit gate: every path the request is predicted to touch maps to exactly one zone (script check over
  globs); every zone has a runnable verify command (script runs each once, expects exit 0 on baseline).
- Send-back: S0 if the request implies touching a zone that does not exist yet and INTAKE has no AC for
  creating it. Skipped: when the cached map's tree-hash still matches (most runs after the first).

### S2 Decomposition
- Purpose: cut the work into tasks small enough that one agent can hold one task, each with a contract.
- Who: `decomposer` (sees INTAKE + OWNERSHIP). Then BT2: `reconstructor` (sees ONLY TASKS.md, must NOT
  see INTAKE.md) writes RECONSTRUCTED.md; `comparator` (sees both) writes COVERAGE.json.
- Output: TASKS.md; each task: id, goal, zones, inputs/outputs, invariants, AC refs, dependencies,
  size budget (default <= 6 files / <= 300 lines; larger must be split), unknowns.
- Exit gate: COVERAGE.json is total in both directions (every AC -> >= 1 task; every task -> >= 1 AC or
  is an explicitly tagged `enabler` with a dependant); dependency graph acyclic; no task exceeds its size
  budget; RECONSTRUCTED.md has 0 "extra behaviour" lines.
- Send-back: S0 when reconstruction reveals an AC that cannot be decomposed (ambiguous). Skipped: fast
  lane creates one auto task straight from INTAKE.

### S3 Plan / distribution
- Purpose: turn the DAG into waves of parallel lanes and choose the lane type per task.
- Who: script computes waves (topological order), a `scheduler` agent only resolves ties; risk class is
  computed, not judged (section 6).
- Output: PLAN.json: waves, lane per task (`fast` | `full` | `hotfix`), per-task budgets (max agent runs,
  max send-backs per target, wall-clock cap).
- Exit gate: no two tasks in the same wave have write-intent on the same zone; every task has a lane.
- Send-back: S2 to split or merge tasks when zone conflicts cannot be serialised. Skipped: fast lane.

### S4 Hypothesis check (probe before build)
- Purpose: convert every assumption into an executed probe before a line of product code exists.
- Who: `hypothesis-prober` in a worktree; may write only under `tasks/T-x/probes/`; may install nothing
  permanent. Must NOT write product code (the temptation is to "just implement it").
- Input: TASK.md (unknowns), OWNERSHIP.md. Output: HYPOTHESES.md rows: assumption, probe command,
  captured output, `verified | refuted | not-probeable(reason)`.
- Exit gate: 0 rows in state `assumed`; `not-probeable` rows require a human answer (H3) or an AC change.
- Send-back: S2 if a refuted hypothesis changes the task graph; S0 if it changes what is possible at all.
  Skipped: TASK.md has zero unknowns (common for small, well-mapped zones).

### S5 Red tests (test author, separated)
- Purpose: encode the contract as failing tests before implementation, by someone who cannot be biased
  by an implementation that does not exist.
- Who: `test-author`. Sees TASK.md, HYPOTHESES.md, existing test conventions, OWNERSHIP contract. Must
  NOT see any implementation attempt and is never re-used as implementer. May add interface stubs
  (signatures that throw `NotImplemented`) so compiled languages still build.
- Output: tests on branch `task/T-x/tests`; TESTS.md mapping test id -> AC id; red-proof output.
- Exit gate (script): every AC referenced by the task has >= 1 test id; suite compiles; the new tests
  FAIL on baseline (red proof) and are the only failures; no `skip`/`only`/`todo` markers added.
- Send-back: S2 if the contract is not testable as stated; S0 if the AC is not testable at all.
  Skipped: never; this is the cheapest correctness layer in the whole funnel.

### S6 Implementation
- Purpose: make the red tests green inside the declared zones and nothing else.
- Who: `implementer` in a worktree branched from the tests branch, with the zone persona's skill
  preloaded. Hook-denied from editing files matching `test_globs`, from writing outside ZONES.json, and
  from touching `verify.yaml`, CI config, or dependency manifests unless TASK.md declares it.
- First action (BT3): read tests, write BT3.md ("these tests require ..."); any conflict with TASK.md
  becomes DISPUTE-n.json *before* coding. `arbiter` (fresh context, sees TASK, tests, dispute) rules
  once; ruling is binding for this loop.
- Output: branch `task/T-x/impl`, EVIDENCE.md (every command run with output tail, diff scope, list of
  behaviours intentionally not covered).
- Exit gate: task tests green (SubagentStop hook re-runs them and refuses to let the agent stop while
  red, bounded by `maxTurns`); full suite green; diff paths subset of ZONES.json; no new
  `skip/only/todo/TODO-later`; EVIDENCE.md schema valid.
- Send-back: S5 only via DISPUTE (a wrong test). Skipped: never.

### S7 Mechanical gate
- Purpose: a deterministic, model-free layer. What it says is true regardless of anyone's narrative.
- Who: `verify` script run by a `gate-runner` agent with `tools: Bash` and `effort: low` (it only
  relays the JSON). GATE.json is written by the script; hooks deny agents writing it.
- Checks: test, typecheck, lint, build exit codes; scope diff (touched files subset of zone allowlist);
  flake control (a failing test is re-run 2x in isolation; passes-on-retry is recorded as `flaky` and
  quarantined into LEDGER rather than blocking - E12); *mutant probes*: if a mutation tool exists it runs
  on changed lines; otherwise the script applies 3 canned mutations to the diff (flip a comparison,
  remove a branch, return a constant) and expects the task tests to fail each time - a surviving mutant
  is an E6 finding with a repro built in; secret scan and dependency audit when manifests changed (E11).
- Exit gate: all checks `pass`; mutants killed >= 100% of applied probes (or configured threshold).
- Send-back: S6 (all classes; the repro is the failing command). Skipped: never.

### S8 Independent context-aware review (adversarial, evidence-required)
- Purpose: find what tests and the gate cannot: wrong semantics that happen to pass tests, missing edge
  cases, contract violations, security and performance regressions.
- Who: N reviewers in parallel, fresh contexts, distinct lenses: `reviewer-correctness` (tries to
  construct an input that breaks an AC), `reviewer-contracts` (public surface, callers, other zones),
  `reviewer-security` (input trust, authz, secrets, injection), `reviewer-regression` (behaviour that
  changed but no test asked for it; performance on hot paths). Each is prompted to REFUTE the change and
  told a finding only counts if it ships a repro that fails now. They see TASK.md, INTAKE.md, diff,
  tests, EVIDENCE.md. They must NOT see each other's REVIEW files (independence) and are not told which
  agent implemented (there is no persona reputation to trust).
- Output: REVIEW-<lens>.md, SENDBACK-n.json for blocking items. Reviews are merged mechanically:
  duplicate repros collapse; each blocking item is classed E# which fixes its target (E5 -> S6,
  E6 -> S5, E3 -> S2, E1/E2 -> S0).
- Exit gate: 0 blocking findings whose repro fails on the branch. Notes are recorded, never block.
- Send-back: S6, S5, S2, S0 per class. Skipped: fast lane runs only `reviewer-correctness`.

### S9 Integration
- Purpose: catch E8 - tasks that are green alone and red together.
- Who: script merges all passing task branches into `integration/<run-id>`; `verify` runs the full gate;
  a `contract-tester` agent writes cross-zone contract tests for any zone whose public surface changed
  (from OWNERSHIP.md contracts) and runs them.
- Exit gate: full gate green on the integrated tree; merge has no conflicts (conflict => the plan was
  wrong: send-back S2 with the conflicting hunks as repro); contract tests green.
- Send-back: S6 for the task whose test fails on the integrated tree; S2 on merge conflict.
  Skipped: single-task runs (the impl branch is the integration branch).

### S10 Blind verdict (context-free)
- Purpose: an evaluation immune to the author's story. Two blindfolds, one comparator.
- `blind-code-judge`: sees the integrated diff and the repository only. `omitClaudeMd: true`; PreToolUse
  hook denies `.work/**`, spec/docs paths, `CHANGELOG*`, `git log|show|blame|notes`, `gh pr`. Writes
  BACKTRANSLATION.md: (1) what this change does, behaviour by behaviour; (2) what it seems to be for;
  (3) how I would break it (3 concrete inputs, executed if runnable); (4) anything that looks unrelated.
- `blind-intent-judge`: sees ONLY REQUEST.md (verbatim, not INTAKE.md) and a runnable build
  (`verify.yaml: run`) or, for libraries, the public API. Writes its own fresh tests / scripted
  interactions for each thing the request asks, runs them, writes INTENT-VERDICT.md. Must NOT see the
  diff, INTAKE, tasks, reviews, or evidence.
- `comparator` (mechanical where possible): COMPARE.json - for each AC in INTAKE.md: `matched` (a
  BACKTRANSLATION behaviour and an INTENT-VERDICT pass both account for it), `missing`, or `intent-fail`;
  plus `unexplained` behaviours from BT (4) that no AC or non-goal covers.
- Exit gate: all AC `matched`; `unexplained` = 0; intent judge's break attempts (3) all fail to break.
- Send-back: `intent-fail` -> S6 with the judge's script as repro; `missing` -> S5 + S6 (the tests were
  too weak to notice); `unexplained` -> S6 (scope creep) or arbiter if the implementer cites an AC; an AC
  the intent judge could not exercise at all -> S0 + H3 (the AC is not observable).
  Skipped: hotfix lane runs it *after* merge and can trigger an automatic revert PR.

### S11 Verdict and merge
- Purpose: one decision from the decision table (section 8), one human look (H2), merge, tag.
- Who: script applies the table; human reads VERDICT.md (one page: table row hit, AC matrix, diff stats,
  notes). Merge is `--no-ff` with the run id; LEDGER gets a `merged` event.
- Exit gate: row = MERGE or MERGE-WITH-NOTES and H2 approved (auto-approved for fast lane).

### S12 Learn (closing the loop on E14)
- Purpose: turn every send-back and every escape into a permanent layer improvement.
- Who: `learner`, sees LEDGER.jsonl and any post-merge defect report.
- Output: for a post-merge escape: POSTMORTEM-n.md with (a) regression test added to the project,
  (b) taxonomy class, (c) "which layer should have caught it and why it did not", (d) a concrete diff to
  that layer's checklist skill. Metrics recomputed: escape rate, catch-depth histogram, send-back rate
  per layer, false-send-back rate (refuted by arbiter), loop exhaustion rate, cycle time per task.
- Exit gate: every escape has all four parts; the checklist diff is committed.

### Swiss-cheese view: holes and who covers them
| Layer | Its known hole                                          | Covered by                  |
|-------|---------------------------------------------------------|-----------------------------|
| S0    | Human confirms a restatement that still hides ambiguity | S5 (untestable -> S0), S10 intent judge |
| S5    | Tests encode the test-author's own misreading            | BT3 dispute, S8 correctness lens, S10 |
| S7    | Green tests that test the wrong thing                    | mutant probes, S8, BT4      |
| S8    | Reviewers share the author's context and framing         | S10 blindfolds              |
| S10   | Blind judges misread intent (false FAIL)                 | comparator classes `unexplained` vs `missing`; arbiter |
| all   | Correlated model blind spots                             | S7 is model-free; S12 feeds escapes back as tests |

---

## 6. Lanes and skip rules (objective, computed twice)

Risk class is computed by script from PLAN.json prediction and *again* from the actual diff after S6.
If the actual diff exceeds the fast-lane limits, the task is auto-promoted to full lane and every skipped
stage runs. This defeats "split the task tiny" and "the small change grew".

| Lane   | Criteria (all must hold)                                                                                       | Skips                                                    |
|--------|----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| fast   | 1 non-critical zone; <= 80 changed lines, <= 3 files; no public API/schema/auth/payment/migration/CI/deps; 0 unknowns | S1 (cached), S2 (auto single task), S3, S4; S8 one lens; S10 code-blind only; H2 auto |
| full   | anything else                                                                                                  | nothing                                                  |
| hotfix | production incident flag set by human at S0; fast-lane size limits still apply                                | S10 runs post-merge with auto-revert; H2 = the incident owner |

Never skipped in any lane: S0 (even 8 lines), S5 (red tests), S6, S7, S11.

---

## 7. Send-back protocol and loop control (how it cannot cycle forever)

1. **Evidence or nothing.** A send-back without a failing repro is a note. Notes go to LEDGER, never block.
2. **Counters per target.** `LOOP.json` per task: `{S6: n, S5: n, S2: n, S0: n, disputes: n, runs: n}`.
   Defaults: S6 <= 2 re-implementations, S5 <= 1, S2 <= 1, S0 <= 1, disputes <= 2, total agent runs <= 14
   per task, wall clock <= configured cap. Exhausting any counter freezes the task (`blocked`) and raises H3
   with the full ledger; the human chooses: relax a counter, change the AC, or drop the task.
3. **Monotone progress.** After a send-back, the re-run must produce a different hash for the addressed
   artifact and the finding's repro must now pass. Same hash, or the same repro failing again, counts as
   non-convergence and raises H3 immediately (no second try on an identical state).
4. **One arbiter, then a human.** A dispute between test-author and implementer, or reviewer and
   implementer, is ruled once by a fresh `arbiter`; the ruling binds. A second dispute on the same finding
   goes to H3.
5. **Cascade invalidation** (4.5) means a send-back to S0 or S2 re-runs the whole task; that is expensive
   by design and therefore counter-limited to 1.
6. **Global backstop.** The workflow script counts agent calls; a run cap (e.g. 200) and the token budget
   stop everything with a `blocked` state and a ledger summary. Nothing merges from a blocked run.

---

## 8. Verdict decision table (applied by script at S11; also used per task at S8)

Inputs: G = mechanical gate (S7/S9), R = context-aware review, B = blind back-translation compare,
I = intent-blind judge, L = loop counters.

| # | G    | R                    | B                    | I           | L         | Decision                       |
|---|------|----------------------|----------------------|-------------|-----------|--------------------------------|
| 1 | pass | 0 blocking           | all matched, 0 unexplained | all pass | ok     | MERGE (H2; auto on fast lane)  |
| 2 | pass | notes only           | all matched, 0 unexplained | all pass | ok     | MERGE-WITH-NOTES (notes -> LEDGER backlog) |
| 3 | fail | -                    | not run              | not run     | -         | SEND-BACK S6 (repro = failing command) |
| 4 | pass | blocking, class E5   | -                    | -           | ok        | SEND-BACK S6                   |
| 5 | pass | blocking, class E6   | -                    | -           | ok        | SEND-BACK S5 (then S6 re-runs) |
| 6 | pass | blocking, class E3   | -                    | -           | ok        | SEND-BACK S2 (cascade)         |
| 7 | pass | blocking, class E1/E2| -                    | -           | ok        | SEND-BACK S0 + H3              |
| 8 | pass | 0 blocking           | `unexplained` > 0    | pass        | ok        | SEND-BACK S6 (scope creep) or ARBITER if implementer cites an AC |
| 9 | pass | 0 blocking           | `missing` AC         | -           | ok        | SEND-BACK S5 + S6 (tests too weak) |
| 10| pass | 0 blocking           | matched              | `intent-fail` | ok      | SEND-BACK S6 (behaviour beats description) |
| 11| pass | 0 blocking           | -                    | AC not exercisable | ok | SEND-BACK S0 + H3 (AC unobservable) |
| 12| pass | 0 blocking           | -                    | cannot run (env) | ok   | ESCALATE H3 (environment), not a code failure |
| 13| any  | any                  | any                  | any         | exhausted | ESCALATE H3 with ledger; task `blocked` |
| 14| pass | refuted by arbiter   | -                    | -           | ok        | finding closed; continue table from row 1 |

Conflict rule: when B and I disagree, I wins (observed behaviour beats a description). When R and S10
disagree, the one with a passing repro wins; two passing repros that contradict each other mean an
ambiguous AC -> row 7.

---

## 9. Universality (tool-agnostic description)

The workflow is defined purely in terms of artifacts, gates, and roles; the only project-specific part is
`verify.yaml`, which every project can supply in ten lines:

```yaml
commands:                       # any language, any runner; 'true' for a check that does not apply
  test: "make test"             # full suite
  test_filter: "make test T={tests}"
  typecheck: "make typecheck"   # dynamic languages: schema/contract validation, or 'true'
  lint: "make lint"
  build: "make build"
  mutation: "make mutate F={files}"   # optional; canned mutant probes used when absent
  run: "make run"               # for the intent-blind judge; libraries: 'none' -> judge writes tests instead
  e2e: "make e2e"               # optional
zones:
  - { id: api, paths: ["src/api/**"], tests: ["tests/api/**"], contract: "openapi.yaml", critical: true }
  - { id: ui,  paths: ["src/ui/**"],  tests: ["tests/ui/**"],  contract: "src/ui/index.ts" }
test_globs: ["tests/**", "**/*.test.*", "**/*_test.go", "**/test_*.py"]
critical_paths: ["**/auth/**", "**/migrations/**", "**/payment/**", ".github/**"]
fast_lane: { max_lines: 80, max_files: 3 }
```
- Non-code work (docs, infra, data) uses the same stages: "tests" become checks (link check, `terraform
  plan` diff, schema validation), "run" becomes rendering.
- Size: a one-line fix takes the fast lane (S0 8 lines, S5 one test, S6, S7, one reviewer, code-blind
  judge, auto-merge). A multi-week feature becomes waves of tasks with the same per-task machine.
- Any agent runtime can implement it: roles are prompts + allow/deny lists; gates are shell commands;
  memory is files; isolation is a VCS branch or worktree. Claude Code is the reference below, but nothing
  above names a tool.

---

## 10. Why this is faster than a straight line (not just safer)

1. **Cheapest-layer catch.** A refuted assumption costs one probe (S4, seconds) instead of implement +
   gate + review + fix (minutes to hours). A misread intent costs one H1 glance instead of a rebuilt
   feature. Cost-to-fix grows steeply with stage; the funnel moves detection left.
2. **Parallel lanes.** Independent tasks run concurrently in worktrees; reviewers run concurrently; the
   two blind judges run concurrently. A straight line is serial by construction.
3. **No re-reading, no context rot.** Each fresh agent gets a small, exact artifact set (TASK.md +
   tests) instead of a 200k-token transcript of previous failures. Short contexts are faster and more
   accurate; the per-task size budget keeps them short.
4. **Bugs become tests once.** Every send-back ships a repro that becomes a regression test, so the
   straight line's signature waste, re-discovering the same bug three sessions later, is impossible.
5. **Bounded loops.** Counters and monotone-progress checks stop ping-pong within two rounds instead of
   letting a session burn an afternoon.
6. **Fewer human interruptions.** Two checkpoints per feature (H1, H2) instead of continuous babysitting;
   H3 only on genuine impasses.
7. **Fast lane by measurement.** Small changes skip 5 stages automatically, based on the diff, not on
   optimism, and get promoted if they grow.
8. **The mechanical gate is cheap and parallel-safe.** Most rejections happen there, at CI cost, before any
   reviewer model spends tokens.

---

## 11. Human checkpoints

| Checkpoint | When                                   | What the human sees                                   | Can be auto?                         |
|------------|----------------------------------------|-------------------------------------------------------|--------------------------------------|
| H1         | after S0                               | INTAKE.md (restatement, ACs, non-goals, unknowns)      | never; but 8 lines for a small task  |
| H1b        | after S3 when > 8 tasks or critical zone touched | PLAN.json summary (waves, lanes)              | yes below thresholds                 |
| H2         | after S11 table hit                    | VERDICT.md one page: row, AC matrix, diff stats, notes | yes on fast lane                     |
| H3         | escalation                             | LOOP ledger, the disagreement with both repros, options | never                              |

Humans never read transcripts; they read artifacts. Everything a human decides is written back into the
artifact (`approved: true`, an AC edit, a counter relaxation) so the next agent sees it.

---

## 12. Claude Code mapping

### 12.1 Sub-agents (`.claude/agents/*.md`)
Frontmatter: `name`, `description`, `tools`, `disallowedTools`, `model`, `effort`, `maxTurns`,
`skills` (preloaded), `hooks` (agent-scoped PreToolUse/PostToolUse/Stop), `omitClaudeMd`, `isolation`.

| Agent                 | tools                       | key frontmatter                                                   | skills preloaded         |
|-----------------------|-----------------------------|--------------------------------------------------------------------|--------------------------|
| intake-restater       | Read, Grep, Glob            | effort: high                                                       | intake-ac-format         |
| ac-checker            | Read                        | effort: medium; model: inherit                                     | intake-ac-format         |
| ownership-mapper      | Read, Grep, Glob, Bash(ro)  |                                                                    | verify-contract          |
| decomposer            | Read, Grep, Glob            | effort: high                                                       | task-contract            |
| reconstructor         | Read                        | omitClaudeMd: true; PreToolUse deny `00-intake/**`                 | back-translate           |
| comparator            | Read                        | effort: low                                                        | back-translate           |
| scheduler             | Read                        | effort: low                                                        | risk-classify            |
| hypothesis-prober     | Read, Bash, Write           | isolation: worktree; PreToolUse deny Write outside `tasks/*/probes/**` | probe-format          |
| test-author           | Read, Grep, Glob, Edit, Write, Bash | isolation: worktree; Stop hook = red-proof; PreToolUse deny writes outside test_globs + stubs | red-proof, task-contract |
| implementer           | Read, Grep, Glob, Edit, Write, Bash | isolation: worktree; maxTurns: 60; PreToolUse zone-guard (deny tests, deny outside ZONES.json); Stop hook = task tests must be green | evidence-pack, zone persona skill |
| arbiter               | Read, Bash(ro)              | effort: high; omitClaudeMd: true                                   | sendback-format          |
| gate-runner           | Bash                        | effort: low; model: haiku-class ok                                 | verify-contract          |
| reviewer-correctness / -contracts / -security / -regression | Read, Grep, Glob, Bash | effort: xhigh; PreToolUse deny `tasks/*/REVIEW-*.md`   | sendback-format, lens checklist |
| contract-tester       | Read, Edit, Write, Bash     | isolation: worktree                                                | red-proof                |
| blind-code-judge      | Read, Grep, Glob, Bash      | omitClaudeMd: true; effort: xhigh; PreToolUse blindfold hook       | back-translate           |
| blind-intent-judge    | Read(REQUEST only), Bash, Write | omitClaudeMd: true; PreToolUse hook denies all reads except REQUEST.md and public API; denies `git diff/log` | intent-probe |
| learner               | Read, Edit, Write           |                                                                    | postmortem               |

Example (`.claude/agents/implementer.md`):
```markdown
---
name: implementer
description: Implements one task from .work/<run>/tasks/<id>/TASK.md against existing red tests. Never edits tests.
tools: Read, Grep, Glob, Edit, Write, Bash
isolation: worktree
maxTurns: 60
skills: [evidence-pack]
hooks:
  PreToolUse:
    - matcher: "Edit|Write|MultiEdit"
      hooks: [{ type: command, command: "${CLAUDE_PROJECT_DIR}/.claude/hooks/zone-guard.sh" }]
  Stop:
    - hooks: [{ type: command, command: "${CLAUDE_PROJECT_DIR}/.claude/hooks/task-green.sh", timeout: 600 }]
---
You implement exactly one task. First read the tests and write BT3.md ... (rules: no test edits, no scope
outside ZONES.json, EVIDENCE.md before you stop, file a DISPUTE instead of "fixing" a test.)
```
`zone-guard.sh` derives the task id from `git branch --show-current` (`task/T-001/impl`), loads
`ZONES.json` and `verify.yaml: test_globs`, and returns `{"hookSpecificOutput":{"hookEventName":"PreToolUse",
"permissionDecision":"deny","permissionDecisionReason":"..."}}` on violation. `task-green.sh` runs
`test_filter` for the task and exits 2 with the failure summary while red (SubagentStop keeps the agent
working; `maxTurns` bounds it).

### 12.2 Workflow scripts (`.claude/workflows/`)
Two scripts, because a workflow cannot pause for a human: `separator-intake.js` (S0, stops for H1) and
`separator-build.js` (S1-S12, first step verifies `approved: true`). The main session is the conductor
between them. Skeleton of the build script:

```js
export const meta = {
  name: 'separator-build',
  description: 'Correctness-first funnel: zones -> decompose -> plan -> per-task lanes -> integrate -> blind verdict',
  phases: [
    { title: 'Zones' }, { title: 'Decompose' }, { title: 'Plan' },
    { title: 'Tasks', detail: 'probe -> red tests -> implement -> gate -> adversarial review' },
    { title: 'Integrate' }, { title: 'Blind' }, { title: 'Verdict' }, { title: 'Learn' },
  ],
}
const RUN = args.run                       // '.work/<run-id>', run-id passed in (no Date.now in scripts)
const CAP = { S6: 2, S5: 1, S2: 1, S0: 1, disputes: 2, runs: 14 }
const LENSES = ['correctness', 'contracts', 'security', 'regression']

phase('Zones')
const zones = await agent(`Build ${RUN}/01-zones/OWNERSHIP.md per verify.yaml`, { agentType: 'ownership-mapper', schema: ZONES })
phase('Decompose')
let cov
for (let i = 0; i <= CAP.S2; i++) {
  await agent(`Write ${RUN}/02-decomp/TASKS.md from INTAKE + OWNERSHIP`, { agentType: 'decomposer', schema: TASKS })
  await agent(`Read ONLY ${RUN}/02-decomp/TASKS.md; write RECONSTRUCTED.md`, { agentType: 'reconstructor', schema: RECON })
  cov = await agent(`Compare INTAKE vs RECONSTRUCTED; write COVERAGE.json`, { agentType: 'comparator', schema: COVERAGE })
  if (cov.total_both_ways && cov.extra_behaviours === 0 && cov.acyclic) break
  log(`decomposition audit failed: ${cov.reason}`)
}
if (!cov.total_both_ways) return { status: 'blocked', at: 'S2', reason: cov.reason }
phase('Plan')
const plan = await agent(`Compute waves/lanes from TASKS.md + OWNERSHIP.md into PLAN.json`, { agentType: 'scheduler', schema: PLAN })

async function runTask(t) {
  const dir = `${RUN}/tasks/${t.id}`, loop = { S6: 0, S5: 0, disputes: 0, runs: 0 }
  const bump = () => { if (++loop.runs > CAP.runs) throw new Error('run cap') }
  if (t.unknowns > 0) {
    bump(); const hyp = await agent(`Probe every unknown in ${dir}/TASK.md; write HYPOTHESES.md`, { agentType: 'hypothesis-prober', schema: HYP, label: `${t.id} probe`, phase: 'Tasks' })
    if (hyp.refuted.length) return { id: t.id, status: 'sendback', to: hyp.changes_graph ? 'S2' : 'S0', evidence: hyp.refuted }
  }
  for (let s5 = 0; s5 <= CAP.S5; s5++) {
    bump(); const tests = await agent(`Write red tests for ${dir}/TASK.md on branch task/${t.id}/tests`, { agentType: 'test-author', schema: TESTS, label: `${t.id} red tests`, phase: 'Tasks' })
    if (!tests.red_proof) return { id: t.id, status: 'sendback', to: 'S2', evidence: tests.untestable }
    for (let s6 = 0; s6 <= CAP.S6; s6++) {
      bump(); const impl = await agent(`Implement ${dir}/TASK.md on branch task/${t.id}/impl (from tests branch). Round ${s6}. Address ${dir}/SENDBACK-*.json if present.`, { agentType: 'implementer', schema: IMPL, label: `${t.id} impl r${s6}`, phase: 'Tasks' })
      if (impl.dispute) {
        if (++loop.disputes > CAP.disputes) return { id: t.id, status: 'escalate', why: 'dispute cap', loop }
        bump(); const ruling = await agent(`Rule on ${dir}/DISPUTE-${loop.disputes}.json`, { agentType: 'arbiter', schema: RULING, phase: 'Tasks' })
        if (ruling.test_is_wrong) break                       // back to S5 loop with the ruling as input
      }
      bump(); const gate = await agent(`Run ./verify all --task ${t.id} --json > ${dir}/GATE.json; return it`, { agentType: 'gate-runner', schema: GATE, effort: 'low', phase: 'Tasks' })
      if (!gate.pass) { log(`${t.id} gate fail: ${gate.failed.join(',')}`); continue }   // repro is the failing command
      const lenses = t.lane === 'fast' ? ['correctness'] : LENSES
      const reviews = (await parallel(lenses.map(l => () => agent(`Refute task ${t.id} through the ${l} lens; findings need a failing repro`, { agentType: `reviewer-${l}`, schema: REVIEW, label: `${t.id} review ${l}`, phase: 'Tasks' })))).filter(Boolean)
      const blocking = dedupeByRepro(reviews.flatMap(r => r.findings).filter(f => f.blocking && f.repro_fails))
      if (!blocking.length) return { id: t.id, status: 'pass', branch: impl.branch, notes: reviews.flatMap(r => r.notes) }
      const target = worstTarget(blocking)                      // E5->S6, E6->S5, E3->S2, E1/E2->S0
      if (target === 'S6') { loop.S6++; continue }
      if (target === 'S5') { loop.S5++; break }
      return { id: t.id, status: 'sendback', to: target, evidence: blocking }
    }
  }
  return { id: t.id, status: 'escalate', why: 'loop exhausted', loop }
}

phase('Tasks')
const results = []
for (const wave of plan.waves) results.push(...(await parallel(wave.map(t => () => runTask(t)))).filter(Boolean))   // barrier per wave: dependencies
if (results.some(r => r.status !== 'pass')) return { status: 'blocked', results }   // H3 material

phase('Integrate')
const integ = await agent(`Merge ${results.map(r => r.branch).join(' ')} into integration/${args.runId}; run ./verify all; write contract tests for changed contracts`, { agentType: 'contract-tester', schema: GATE })
if (!integ.pass) return { status: 'sendback', to: integ.conflict ? 'S2' : 'S6', evidence: integ.failed }

phase('Blind')
const [bt, intent] = await parallel([
  () => agent(`You see only the repo at integration/${args.runId} and its diff vs base. Write ${RUN}/05-blind/BACKTRANSLATION.md`, { agentType: 'blind-code-judge', schema: BT }),
  () => agent(`You see only ${RUN}/00-intake/REQUEST.md and the running build. Exercise every ask; write INTENT-VERDICT.md`, { agentType: 'blind-intent-judge', schema: INTENT }),
])
const cmp = await agent(`Fill COMPARE.json: INTAKE ACs vs BACKTRANSLATION vs INTENT-VERDICT`, { agentType: 'comparator', schema: COMPARE })

phase('Verdict')
const row = decide({ gate: integ, reviews: results, compare: cmp, intent })   // section 8 table, plain JS
phase('Learn')
await agent(`Append LEDGER events and recompute metrics into ${RUN}/07-learn/METRICS.json`, { agentType: 'learner', effort: 'low' })
return { status: row.decision, row: row.id, verdict: `${RUN}/06-verdict/VERDICT.md` }
```
Notes: `parallel` per wave is a justified barrier (dependencies); inside a wave tasks run fully
independent chains. Send-backs to S2/S0 exit the script with `status: sendback`; the conductor session
applies cascade invalidation (MANIFEST) and re-launches with `resumeFromRunId` so the unchanged prefix is
cached. No `Date.now()`: the run id is passed in `args`.

### 12.3 Skills (`.claude/skills/<name>/SKILL.md`)
`intake-ac-format` (AC grammar, banned vague verbs), `verify-contract` (reading/creating `verify.yaml`),
`task-contract` (TASK.md schema + size budgets), `back-translate` (how to describe behaviour without
guessing intent), `red-proof` (stubs allowed, no skip markers, prove red), `evidence-pack` (EVIDENCE.md
schema), `sendback-format` (evidence-required JSON, E-taxonomy), `risk-classify` (lane rules),
`probe-format`, `intent-probe` (exercise a product from a raw request), `postmortem`, plus one persona
skill per zone (`api-conventions`, `ui-conventions`, ...). Reviewer lens checklists live in skills so S12
can diff them.

### 12.4 Hooks (`.claude/settings.json`, project scope)
```json
{ "hooks": {
  "PreToolUse": [
    { "matcher": "Bash", "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/deny-dangerous.sh" }] },
    { "matcher": "Edit|Write|MultiEdit", "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/protect-gate-files.sh" }] }
  ],
  "PostToolUse": [
    { "matcher": "Edit|Write|MultiEdit", "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format-and-lint-file.sh", "timeout": 60 }] }
  ],
  "Stop": [
    { "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/ledger-flush.sh" }] }
  ] } }
```
- `deny-dangerous.sh`: blocks `git push --force`, `rm -rf` outside worktrees, editing `verify.yaml` from
  non-mapper agents.
- `protect-gate-files.sh`: denies model writes to `GATE.json`, `LOOP.json`, `MANIFEST.json`, `REQUEST.md`.
- `format-and-lint-file.sh`: instant feedback on the file just written (cheapest layer for E5 typos/lint).
- Agent-scoped hooks (in frontmatter): `zone-guard.sh`, `task-green.sh` (SubagentStop, exit 2 while red),
  `red-proof.sh` (test-author SubagentStop: exit 2 if new tests pass on baseline or contain skip markers),
  `blindfold.sh` (blind judges: deny reads of `.work/**`, `docs/**`, `CHANGELOG*`, and Bash containing
  `git log|show|blame|notes` or `gh pr`).

### 12.5 CLAUDE.md
Holds the contract in 30 lines: the stage list, "artifacts are the only memory", the send-back format
rule, the branch protocol, and the instruction that the conductor never implements directly on a `full`
lane task. `omitClaudeMd: true` on blind agents keeps this file from leaking process context to them.

---

## 13. Metrics (S12) that tell you whether the funnel is working
- **Escape rate**: defects found after merge / merged tasks (target: 0; trend matters).
- **Catch depth**: histogram of which layer caught each send-back; should skew left over time.
- **False send-back rate**: blocking findings refuted by arbiter / total blocking (high => reviewer prompts too aggressive).
- **Loop exhaustion rate** and **dispute rate** (high => TASK.md contracts too vague; fix `task-contract`).
- **Fast-lane promotion rate** (high => risk classifier thresholds wrong).
- **Cycle time per task** and **agent runs per merged task** (the acceleration claim, measured).

---

## 14. Top risks (honest)

1. **Ceremony on small work if the lane classifier misfires.** Mitigated by measuring the diff twice, but
   the thresholds in `verify.yaml` will need tuning per project; the first week will feel heavy.
2. **Blind judges produce false FAILs.** Without intent, a judge can call correct behaviour "unexplained".
   The comparator separates `unexplained` from `missing`, and an arbiter can cite an AC, but this is the
   stage most likely to generate churn early. Metric: false-send-back rate from S10.
3. **Test-author without implementation over-specifies.** Tests can pin incidental details (exact error
   text, ordering) and trigger disputes. The `red-proof` skill must teach contract-level assertions; the
   dispute cap bounds the damage but not the cost.
4. **Hollow gates on projects with no tests.** Objective gates are only as good as `verify.yaml`. On a
   test-less legacy project the first run must be a bootstrap (characterisation tests per zone) or S7 is
   theatre. The design does not fix this for free.
5. **Flakiness and slow suites.** Retry-and-quarantine handles E12 but a 20-minute suite run at S6 (Stop
   hook), S7, S9 and again in S10 multiplies wall time; `test_filter` and per-zone commands are essential.
6. **Cascade invalidation throws away work.** A late send-back to S0 re-runs everything downstream. That is
   correct (stale artifacts are the E10 hole) but expensive; the counter of 1 is the only brake.
7. **Correlated model blind spots.** Four lenses from the same model family still share biases. The
   model-free gate and the escape-driven S12 loop are the counterweights; they do not eliminate it.
8. **Enforcement depends on hooks being installed and honoured.** If a project runs agents without the
   hook files (or with `bypassPermissions` misconfigured), separation of duties degrades to prompt-only.
   Ship the hooks with the workflow and have `verify` refuse to run without them.
9. **Cost.** A full-lane task spends 8-14 agent runs. The user accepted token cost is not the constraint;
   wall-clock is, and it is paid back only when the straight line would have looped more than about
   twice, which on large projects it reliably does.
10. **Human bottleneck at H3.** Early on, counters will be exhausted often and every exhaustion needs a
    person. Expect to relax caps and improve `task-contract` for the first several runs.
