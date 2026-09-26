# THROUGHPUT — the Acceleration-first Separator

Angle: **net speed on large projects**. Rigor is tiered by risk class, most work rides a fast lane,
independent work runs in parallel worktrees, every stage is a cheap kill filter placed before the next
more-expensive stage, and the human is removed from the loop for ~80% of tasks. The funnel is not "more
ceremony"; it is a machine for spending cheap agent calls to buy back expensive human minutes and to
discover failure at the cheapest possible point.

## 0. Thesis in five lines

1. The straight line (task -> error -> fix -> error -> fix) is slow for two reasons, not one: the human is inside
   every iteration (reading errors, relaying "fix it"), and the single context degrades with every iteration
   (coherence debt), so p(fix works) falls while cost per iteration rises.
2. Self-review is structurally blind: models approve their own buggy output at 5-47% rates regardless of
   capability, and fresh-context review of only the artifact removes most of that bias. So the reviewers that
   matter must be **fresh** (different context) and, at the end, **blind** (no plan, no history, no CLAUDE.md).
3. Failure discovered at stage k costs roughly the sum of all stages after k. Therefore the funnel is ordered
   so that the cheapest disproof comes first: triage (1 cheap call) -> plan validity (code, 0 calls) ->
   hypothesis spike (1 bounded call) -> execution (1 call) -> reviews (2-5 calls) -> latent defect in prod
   (6+ calls and 3 human touches).
4. Rigor is priced by **risk class (T0..T3)** and the class is set mostly by deterministic path rules, not by
   an agent's mood. T0/T1 (~80% of tasks) get 2-6 calls and zero human touches. T2/T3 pay for extra reviewers
   and a human merge card because there the cost of a latent defect is 10x.
5. Every send-back must ratchet: it carries a runnable repro that becomes a permanent test before the work is
   re-dispatched. Loops cannot cycle on the same defect; the failure space only shrinks.

## 1. Risk classes and lanes

| Class | Definition (deterministic floor from `zones.json`, agent may only RAISE) | Share of tasks (large repo, typical) | Lane |
|---|---|---|---|
| **T0** trivial | single zone, <=3 files, zone floor T0 (docs, copy, config with tests, pure refactor covered by existing tests), no schema/API/infra touch | ~30% | Fast: Execute -> Blind(low) -> auto-merge to `integration` |
| **T1** normal | single or two zones, <=8 files, no irreversible side effects, no public contract change | ~50% | Standard: [Decompose if >3 files or >1 zone] -> [Spike if unknowns] -> Execute -> Inspect -> Blind -> auto-merge |
| **T2** high-risk | any of: `migrations/**`, `auth/**`, `billing/**`, `infra/**`, public API/schema change, >8 files, >2 zones, touches a serialized resource (lockfile, generated code) | ~15% | Full: Decompose -> 2 Spikes -> Execute -> 2 Inspectors (lenses) -> 2-3 Blind (majority, cross-model) -> human merge card |
| **T3** architectural / irreversible | data deletion, external side effects that cannot be rolled back, new zone, cross-cutting refactor, anything the human marks | ~5% | Full + design panel (3 designs, 2 judges) + human design approval + human merge |

Class = `max(path_floor(zones.json), modifiers, triage_estimate)`. Modifiers: +1 per extra zone touched,
+1 if est. LOC > 400, jump to T2 on any public contract change, jump to T3 on irreversibility. An agent can never
lower the class below the path floor. Escapes (defects found after merge) raise the zone floor for the next N tasks
(Learn stage), so a leaky zone automatically gets more rigor, and a zone with 20 clean tasks gets a wider fast lane.

## 2. The separator (diagram)

```
                     ┌───────────────────────────────────────────────────────────────┐
   raw text, issues, │  S0 INTAKE (wide mouth)  triage agent, low effort, 1 call/epic  │
   screenshots, chat ├───────────────────────────────────────────────────────────────┤
   dumps, voice ───► │  request.md + triage.json {class, zones, ambiguity, questions}  │
                     └──────┬───────────────────────────────┬──────────────────┬──────┘
                            │ T0                            │ T1               │ T2/T3
                            │                               ▼                  ▼
                            │                  ┌───────────────────┐   ┌──────────────────────┐
                            │                  │ S1 ZONES (map)    │   │ S1 ZONES + [T3 design │
                            │                  │ zones.json lookup │   │ panel: 3 designs,     │
                            │                  │ 0 calls if mapped │   │ 2 judges, HUMAN ok]   │
                            │                  └─────────┬─────────┘   └──────────┬───────────┘
                            │                            ▼                        ▼
                            │                  ┌────────────────────────────────────────────┐
                            │                  │ S2 DECOMPOSE  planner (read-only tools)     │
                            │                  │ dag.json: subtasks{writes[], depends[],     │
                            │                  │ contract.json, unknowns[]}  gate = code     │
                            │                  └─────────────────────┬──────────────────────┘
                            │                                        ▼
                            │                  ┌────────────────────────────────────────────┐
                            │                  │ S3 DISTRIBUTE (pure code, 0 calls)         │
                            │                  │ waves by DAG, disjoint write-sets, model/   │
                            │                  │ effort per class, one worktree per subtask │
                            │                  └───────┬───────────┬───────────┬────────────┘
                            │              wave 1:     ▼           ▼           ▼   (parallel, cap ~10)
                            │                  ┌───────────┐ ┌───────────┐ ┌───────────┐
                            │                  │ S4 SPIKE  │ │ S4 SPIKE  │ │ S4 SPIKE  │  cheap early kill:
                            │                  │ feasible? │ │ feasible? │ │ feasible? │  infeasible -> S2
                            │                  │ writes    │ │ writes    │ │ writes    │  (never reaches S5)
                            │                  │ acc. test │ │ acc. test │ │ acc. test │
                            │                  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                            ▼                        ▼             ▼             ▼
                     ┌────────────┐          ┌────────────┐ ┌────────────┐ ┌────────────┐
                     │ S5 EXECUTE │          │ S5 EXECUTE │ │ S5 EXECUTE │ │ S5 EXECUTE │ worktree, card only,
                     │ (T0 lane)  │          │ + hooks    │ │ + hooks    │ │ + hooks    │ Stop-hook needs evidence
                     └─────┬──────┘          └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
                           │                       ▼             ▼             ▼
                           │                ┌──────────────────────────────────────────┐
                           │                │ MECHANICAL GATE (code): tests, lint,      │
                           │                │ diff ⊆ write-set, evidence.json valid     │──fail──► S5 (retry budget)
                           │                └───────────────────┬──────────────────────┘
                           │                                    ▼
                           │                ┌──────────────────────────────────────────┐
                           │                │ S6 INSPECT  fresh agent, has plan+contract │──fix────► S5
                           │                │ +diff+evidence, NOT executor transcript;   │──replan─► S2
                           │                │ re-runs gates itself. T2: 2 lenses         │──kill───► S0/human
                           │                └───────────────────┬──────────────────────┘
                           ▼                                    ▼
                     ┌──────────────────────────────────────────────────────────────────┐
                     │ S7 BLIND  outsider: ONLY diff + one-line intent. omitClaudeMd,    │──block(repro)─► S5
                     │ no plan, no inspect.json, no history, other model family if any.  │   repro -> test
                     │ Block requires runnable repro. T2: 2-3 voters, majority.          │   (ratchet)
                     └───────────────────────────────┬──────────────────────────────────┘
                                                     ▼
                     ┌──────────────────────────────────────────────────────────────────┐
                     │ S8 VERDICT & MERGE  decision table (code); judge agent only on    │──conflict─► S5 rebase
                     │ disagreement; rebase onto integration; full zone gates;           │
                     │ T0/T1 auto-merge -> integration; T2/T3 human merge-card           │
                     └───────────────────────────────┬──────────────────────────────────┘
                                                     ▼
                     ┌──────────────────────────────────────────────────────────────────┐
                     │ S9 LEARN  metrics.jsonl -> zones.json risk floors, lessons.md     │
                     │ (bounded), defect sigs -> regression tests. Tunes the lanes.      │
                     └──────────────────────────────────────────────────────────────────┘
```

Wide at the top (anything goes in), narrowing filters of increasing cost, and two independent
"cream/skim" separators at the bottom (Inspect knows the process; Blind does not). Send-backs go up, but each
one deposits a permanent test on the way, so the same defect cannot fall through twice.

## 3. Stage table (summary)

| ID | Stage | Who (agent / code) | Must NOT have | In | Out | Objective exit gate | Send-back targets | Skipped when |
|---|---|---|---|---|---|---|---|---|
| S0 | Intake | `funnel-triage` (low effort, read-only) | nothing withheld; but no write tools | raw text/files | `request.md`, `triage.json` | schema-valid; class assigned; ambiguity < 0.5 or questions batched | none (it is the top) | never (1 cheap call per epic; T0 batches many requests in one call) |
| S1 | Zones | code + `funnel-zone-mapper` only for unmapped paths | — | `triage.json`, `zones.json` | updated `zones.json`, `triage.json.zones[]` | every touched path maps to exactly one zone with gate cmds | none | all paths already mapped (the common case) |
| S2 | Decompose | `funnel-planner` (Read/Grep/Glob only) | executor tools; other epics | `request.md`, `triage.json`, `zones.json`, `lessons.md` | `dag.json`, `tasks/*/card.md`, `tasks/*/contract.json` | code check: acyclic; write-sets disjoint per wave; every subtask has >=1 executable check; size <= 8 files | S0 (needs clarification) | T0; T1 with <=3 files and 1 zone (task becomes its own single subtask) |
| S3 | Distribute | pure script code | — | `dag.json`, `zones.json` | `schedule.json` | waves computed; each subtask has worktree, model, effort, budget | S2 (if write-sets overlap and cannot be waved) | never (0 calls) |
| S4 | Spike (hypothesis) | `funnel-spiker` (worktree, maxTurns ~15) | other subtasks; executor role | `card.md`, `contract.json` | `spike.json` {feasible/infeasible/replan}, `tests/acc_*.` failing acceptance test | acceptance test exists and FAILS on base; verdict schema-valid | S2 (infeasible/replan) | T0; T1 with `unknowns=[]` |
| S5 | Execute | `funnel-executor` (worktree, hooks) | chat history; other subtasks; inspect/blind outputs of others | `card.md`, `contract.json`, `tests/acc_*`, zone rules, defect cards (on retry) | branch commit, `evidence.json` | mechanical: acceptance + zone tests pass, lint pass, `git diff --name-only` ⊆ write-set, evidence valid | none (it is the target) | never for code changes |
| S6 | Inspect | `funnel-inspector` (fresh, worktree, Bash to re-run) | executor transcript/reasoning; other subtasks' diffs | plan, contract, spike, diff, evidence | `inspect.json` (verdict + defect cards) | schema-valid; every `fix`/`block` defect has a repro | S5 fix, S2 replan, S0 kill | T0 |
| S7 | Blind | `funnel-outsider` (omitClaudeMd, worktree, other model family if configured) | plan, contract, inspect.json, spike, history, CLAUDE.md, commit messages (squashed) | diff + one-line intent + how to run tests | `blind.json` | schema-valid; a `block` without runnable repro is downgraded to `concern` | S5 (block w/ repro) | never (T0 gets one low-effort voter) |
| S8 | Verdict & Merge | code decision table; `funnel-judge` only on split; human for T2/T3 | — | `inspect.json`, `blind.json`, gate results | `merge-card.md`, merge commit on `integration` | decision table row resolved; rebase+full gates green | S5 (conflict/rebase), S2, human | never |
| S9 | Learn | `funnel-learner` (once per epic) | — | `metrics.jsonl`, `defects/*`, `zones.json` | updated `zones.json` floors, `lessons.md` (<=60 lines) | rule-based updates applied; lessons deduped by sig | none | epic had 0 defects and 0 send-backs (nothing to learn; metrics still appended by code) |

## 4. Stage specifications

### S0 Intake — the wide mouth
- **Purpose**: accept anything (a paragraph of Russian, a pasted stack trace, three screenshots, "make it faster")
  and turn it into one normalized request plus a risk class, without asking the human unless it is worth it.
- **Who**: `funnel-triage`, low effort, tools Read/Grep/Glob. Has the repo and `zones.json`. Must NOT have write
  tools (so it cannot "just fix it"; the whole point is separation).
- **Input**: raw request (verbatim, stored), optional attachments. **Output**: `epics/<id>/request.md`
  (verbatim + normalized statement + acceptance intent in one sentence — this sentence is later the ONLY context
  the blind reviewer gets), `triage.json` `{class, zones[], est_files, unknowns[], ambiguity, questions[], assumptions[]}`.
- **Exit gate**: `triage.json` validates; `class` present; if `ambiguity >= 0.5` and class >= T2 -> human question
  batch (one message with all questions); if class <= T1 -> record `assumptions[]` and proceed (assumptions are
  printed on the merge card; the human can veto later at zero cost).
- **Send-back targets**: none. **Skipped**: never, but for T0 many requests are batched into one triage call.
- **Speed trick**: the triage agent never plans. It classifies and moves on; total cost ~1 low-effort call per epic.

### S1 Zones of responsibility
- **Purpose**: the "zones" are a **map**, not a per-task meeting. `zones.json` maps path globs to
  `{name, persona, gate:{test,lint,build,format}, risk_floor, serialized_resources[]}`. Personas are the executor
  system-prompt addenda per zone (e.g. "frontend: never touch API types; run `pnpm test:ui`").
- **Who**: code lookup; `funnel-zone-mapper` (read-only) only when a path is unmapped, once per repo area.
- **Exit gate**: every path in `triage.json.est_paths` resolves to exactly one zone with a runnable test command.
- **Skipped when**: all mapped (steady state). Cost: 0 calls in steady state.
- **Universality**: the zone file is the only place language/tooling lives. A Rust crate, a Django app and a
  Terraform dir are just three zones with different gate commands.

### S2 Decompose
- **Purpose**: turn the request into a DAG of subtasks small enough to be right the first time, each with a
  disjoint write-set and an executable contract.
- **Who**: `funnel-planner`, tools Read/Grep/Glob only (cannot implement), preloads skill `funnel-contract`.
  Has `lessons.md` (bounded). Must NOT have other epics' plans (keeps it small and independent).
- **Output**: `dag.json` (`subtasks[{id, title, zone, writes[], reads[], depends_on[], class, unknowns[], est_files}]`),
  `tasks/<sub>/card.md` (the executor's entire world: goal, constraints, write-set, how to run gates),
  `tasks/<sub>/contract.json` (`checks[{kind: cmd|http|file|snapshot, cmd, expect, timeout}]`).
- **Exit gate (code, 0 calls)**: DAG acyclic; within each wave write-sets pairwise disjoint (globs intersected);
  serialized resources (lockfiles, generated code, migrations dir) appear in at most one subtask per wave;
  each subtask has >=1 check with `kind: cmd`; `est_files <= 8`; total subtasks <= 12 per epic (else split epic).
  A failed gate re-invokes the planner ONCE with the violation list; second failure -> human.
- **Send-back targets**: S0 (request contradictory -> question batch).
- **Skipped when**: T0; T1 with `est_files <= 3` and 1 zone — then code synthesizes a single card from
  `triage.json` (0 calls).

### S3 Distribute
- **Purpose**: schedule, isolate and price. Pure code.
- **Output**: `schedule.json`: topological waves; per subtask `{worktree, model, effort, maxTurns, call_budget}`
  from class: T0 `{effort:low, budget:4}`, T1 `{effort:medium, budget:12}`, T2 `{effort:high, budget:24}`,
  T3 `{effort:high, budget:40}`. Parallelism = min(wave size, harness cap ~10).
- **Exit gate**: schedule validates; no wave exceeds cap by more than queueing. **Skipped**: never (0 calls).

### S4 Hypothesis check (spike) — the cheapest kill
- **Purpose**: before paying for execution, disprove the plan cheaply. "Can this contract be satisfied the planned
  way?" A spike is a bounded probe (does the library support X, does the migration apply on a copy, does the
  endpoint exist, does the type-check pass with the intended signature change).
- **Who**: `funnel-spiker`, worktree, `maxTurns: 15`, effort medium. Has `card.md`, `contract.json`, zone gates.
  Must NOT be told to implement; its deliverable is a verdict plus a **failing acceptance test** that encodes
  the contract. That test is kept and handed to the executor (the spike is never waste: it produces the gate).
- **Output**: `spike.json` `{verdict: feasible|infeasible|replan, evidence[], risks[], acc_tests[]}`,
  `tests/acc_<sub>.*` (in the zone's test convention).
- **Exit gate**: acceptance test file exists and fails on base (`run -> nonzero`); verdict schema-valid.
  `infeasible`/`replan` -> S2 with the reason (planner gets `spike.json`).
- **Skipped when**: T0; T1 with `unknowns=[]`. T2 runs 2 spikes (feasibility + blast radius: "what else
  breaks if we do this" — greps callers, runs the zone tests of dependents).
- **Speed argument**: one bounded call kills a wrong plan before N executor calls and 2N reviewer calls are spent.

### S5 Execute
- **Purpose**: make the acceptance tests and zone gates pass, inside the write-set, nothing else.
- **Who**: `funnel-executor`, `isolation: worktree`, tools Read/Edit/Write/Bash/Grep/Glob, `permissionMode: acceptEdits`,
  `maxTurns` by class. Context: `card.md`, `contract.json`, acceptance tests, zone persona, and on retry the
  defect cards. Must NOT have: chat history, other subtasks, any reviewer output other than its own defect cards.
- **Hooks (enforced, not requested)**: PreToolUse `Edit|Write` denies paths outside the write-set (deny-by-default
  until the executor writes its `.funnel-task` marker naming its subtask); PreToolUse `Bash` denies `git push`,
  `git checkout`/`switch` to other branches, `rm -rf`, destructive DB commands; PostToolUse `Edit|Write` runs the
  zone formatter; SubagentStop for `funnel-executor` runs the gate script and refuses the stop (exit 2, stderr =
  failing output) until green or the in-agent retry budget (3) is exhausted, then lets it stop with
  `evidence.status: fail`.
- **Output**: commit(s) on the worktree branch, `evidence.json` `{commands[{cmd, exit, stdout_sha}], files_touched[],
  acceptance: pass|fail, zone_gates: pass|fail, status}`.
- **Exit gate (code)**: `evidence.status == pass` AND `git diff --name-only <base>..HEAD ⊆ writes[]` (the real
  enforcement; hooks are the fast-fail) AND acceptance tests pass when re-run by the script (not trusted from
  evidence). Fail -> one fresh-context retry (new executor, same card, plus the gate output), then send back to S2.
- **Skipped when**: never.

### S6 Independent context-aware review (Inspector)
- **Purpose**: catch "green but wrong": contract satisfied in letter not spirit, scope creep, regressions in the
  zone, faked or incomplete evidence, missed edge cases the plan called out.
- **Who**: `funnel-inspector`, fresh context, worktree checkout of the subtask branch, tools Read/Grep/Glob/Bash.
  Has: plan (`dag.json` slice), `card.md`, `contract.json`, `spike.json`, the diff, `evidence.json`.
  Must NOT have: the executor's transcript or reasoning (that is what creates "reasoning from the chosen output"),
  other subtasks' diffs, chat history. It **re-runs** the gates itself (verify, do not trust).
- **T2/T3**: two inspectors with different lenses (correctness/contract; blast-radius/security/data). Lenses,
  not clones — diversity catches what redundancy cannot.
- **Output**: `inspect.json` `{verdict: pass|fix|replan|kill, defects[{sig, severity, repro{cmd,expect,got}, note}]}`.
- **Exit gate**: schema-valid; every defect that justifies `fix` has a runnable repro (else it is downgraded to a
  `note` and cannot block). `sig = sha1(normalized repro cmd + expect)`.
- **Send-back**: S5 (`fix`, with defect cards; each repro is first written as `tests/regress_<sig>` by code),
  S2 (`replan`: the plan cannot work), S0/human (`kill`: the request itself was wrong).
- **Skipped when**: T0.

### S7 Blind review (Outsider)
- **Purpose**: the second separator: somebody who never saw the plan looks at the result and says whether they
  would ship it. This is the stage that catches "everyone agreed on the wrong thing".
- **Who**: `funnel-outsider`: `omitClaudeMd: true` (CLAUDE.md carries process context), fresh worktree with the
  branch **squashed** so commit messages leak nothing, tools Read/Grep/Glob/Bash. If the environment has another
  model family available, this agent uses it (cross-model review measurably catches more than same-model).
  Gets ONLY: the diff, the one-line intent from `request.md`, and the zone's "how to run tests" line.
  Must NOT have: plan, contract, spike, inspect.json, evidence.json, chat history, defect history.
- **Output**: `blind.json` `{verdict: approve|block|concern, defects[{sig, repro, note}], would_merge: bool}`.
- **Exit gate**: schema-valid; `block` requires a runnable repro (the outsider has Bash and must demonstrate it);
  a block without repro is stored as `concern` and forwarded to S9, never to S5. This single rule is what keeps
  blind review from becoming a noise generator that slows everything down.
- **T2/T3**: 2-3 outsiders, majority; any single `block` with a passing repro is honored regardless of majority.
- **Send-back**: S5 only (with repro -> regression test first). Cannot send to S2 directly (it has no plan to
  criticize); if its repro shows the *intent* is unmet, S8 escalates to S2.
- **Skipped when**: never. T0 gets one outsider at low effort (this is the cheapest insurance in the system).

### S8 Verdict and merge
- **Purpose**: combine the two separators mechanically, integrate, and decide who gets to press the button.
- **Who**: code (decision table below); `funnel-judge` (fresh, sees both verdict files + diff) ONLY when the table
  says "split"; human for T2/T3 via `merge-card.md` (one screen: intent, class, assumptions, evidence summary,
  inspector and outsider verdicts, diff stats, "approve / send back / kill").
- **Integration**: rebase the subtask branch onto `integration`; run the full gates of every zone touched plus the
  repo smoke gate; conflicts -> S5 (rebase task; does not consume a review round). T0/T1 auto-merge to
  `integration`. `integration -> main` is a human action at cadence (daily or per epic) with the epic's merge cards.
- **Exit gate**: table row resolved; rebase + full gates green; merge commit exists.

### S9 Learn
- **Purpose**: make the lanes self-tuning so the system gets faster with use.
- **Who**: code appends `metrics.jsonl` events at every stage (0 calls); `funnel-learner` runs once per epic only if
  there were defects/send-backs.
- **Rules (deterministic)**: an escape (defect found in S7 or later) in zone Z raises `risk_floor[Z]` by one for
  the next 10 tasks; 20 consecutive clean tasks in Z lower it by one (min: its static floor). Repro tests from
  defect cards are already permanent. `lessons.md` gets at most 3 new lines per epic, deduped by defect sig,
  capped at 60 lines (lowest-recurrence pruned). CLAUDE.md imports `lessons.md` and nothing else grows.
- **Exit gate**: `zones.json` still validates; `lessons.md` <= 60 lines.

## 5. Artifacts and directory layout

```
.funnel/
  zones.json                 # path globs -> {name, persona, gate{test,lint,build,format}, risk_floor, serialized_resources[]}
  lessons.md                 # <= 60 lines; the ONLY memory that grows; imported by CLAUDE.md
  metrics.jsonl              # {epic, sub, stage, calls, ms, verdict, sendback_to, sig}
  bin/                       # gate.sh, writeset-guard.sh, bash-guard.sh, require-evidence.sh, squash-for-blind.sh
  epics/<epic-id>/
    request.md               # verbatim input + normalized statement + ONE-LINE INTENT (blind reviewer's only context)
    triage.json              # {class, zones[], est_paths[], unknowns[], ambiguity, questions[], assumptions[]}
    design/                  # T3 only: design-*.md, judge-*.json, chosen.md
    dag.json                 # subtasks with writes/reads/depends_on/class/unknowns
    schedule.json            # waves, worktree, model, effort, budgets
    tasks/<sub-id>/
      card.md                # executor's whole world
      contract.json          # executable acceptance checks
      spike.json             # hypothesis verdict
      tests/                 # acc_*.<ext> from spiker; regress_<sig>.<ext> from defect cards
      evidence.json          # executor's gate run (re-verified by script, never trusted)
      inspect.json           # context-aware verdicts (1-2)
      blind.json             # blind verdicts (1-3)
      defects/<sig>.json     # {sig, severity, repro, origin, round, target}
      merge-card.md          # one-screen human/judge summary
      state.json             # counters: exec_retries, sendbacks{execute,decompose,intake}, calls, sigs_seen[]
```

Artifacts are the only memory between stages (subagents are fresh every time). No stage writes prose reports;
every output is either a schema-validated JSON or a card meant to be the *entire* input of a later agent.

## 6. Verdict decision table (S8)

| Mechanical gate | Inspector (S6) | Blind (S7) | Action | Counts as review round? |
|---|---|---|---|---|
| fail | not run | not run | -> S5 fresh retry (1), then -> S2 | no |
| pass | pass | approve | merge (T0/T1 auto -> `integration`; T2/T3 human merge card) | — |
| pass | pass | block (with repro) | write `regress_<sig>` test -> S5 with defect card | yes |
| pass | pass | block (no repro) | downgrade to concern; merge; concern -> S9 | no |
| pass | pass | concern | merge; concern -> S9 | no |
| pass | fix | approve | -> S5 with inspector defect cards | yes |
| pass | fix | block | -> S5 with union of cards (dedupe by sig) | yes |
| pass | replan | any | -> S2 with `inspect.json`; blind result discarded | yes (decompose) |
| pass | kill | any | -> human with kill reason; epic paused | yes (intake) |
| pass | pass (1 of 2, T2) / split | — | `funnel-judge` decides pass/fix from both files; judge cannot say "replan" | judge call |
| pass | any | split (2-3 voters, T2) | any block with a **passing repro** wins; else majority; tie -> judge | judge call |
| rebase conflict | — | — | -> S5 rebase task with `card.md` + conflict list | no |
| skipped (T0) | skipped | approve | auto-merge | — |
| skipped (T0) | skipped | block (repro) | class raised to T1; -> S5, then S6+S7 run | yes |

Rule that makes the table cheap: **nobody can block without a runnable repro**, and every repro becomes a test
before re-dispatch. Opinions become notes; notes go to Learn; only demonstrated failures cost a round.

## 7. Loop control — why send-backs cannot cycle forever

1. **Per-subtask counters** in `state.json`, enforced by the script (plain `while` with counters; never model
   judgment): `exec_retries <= 1` fresh (plus 3 in-agent via SubagentStop), `sendbacks.execute <= 2`,
   `sendbacks.decompose <= 1`, `sendbacks.intake <= 1` (always ends at a human), `calls <= budget(class)`
   (T0 4, T1 12, T2 24, T3 40). Exceeding any counter -> **stuck card** to human (what was tried, what failed,
   three options), the subtask is parked, siblings continue.
2. **Defect-signature ratchet**: every send-back carries `sig`. The script writes `tests/regress_<sig>` from the
   repro before dispatch. A `sig` already in `state.sigs_seen[]` cannot target S5 again; it escalates one level
   (S5 -> S2 -> human). The failure space is monotonically shrinking, so a cycle on the same defect is impossible
   by construction, and a cycle on *new* defects is bounded by the counters.
3. **Escalation ladder is strictly upward**: S7 can only send to S5; S6 to S5/S2/human; S2 to S0; a stage can never
   send back "sideways" or downward, so the graph of send-backs is a DAG over (stage, round).
4. **Workflow-level**: `MAX_ROUNDS_PER_EPIC = 3` waves of re-review; `budget.remaining()` guard; harness 1000-agent
   backstop. The script `log()`s every parked subtask so a partial epic never looks complete.
5. **Kills are cheap and always allowed**: S0/human can kill an epic at any time; killing costs one line in
   `metrics.jsonl`. The funnel accelerates partly because it makes giving up on a bad task cheap.

## 8. Human checkpoints (all optional except H2/H3; all designed to take < 2 minutes)

| ID | When | What the human sees | Cost |
|---|---|---|---|
| H0 | S0, only if `ambiguity >= 0.5` and class >= T2 | one batched question list; answers are appended to `request.md` | once per epic, rare |
| H1 | T3 only, after design panel | `design/chosen.md` + judges' scores; approve/redirect | once per T3 epic |
| H2 | S8 for T2/T3 | `merge-card.md` (one screen); approve / send back / kill | once per T2+ subtask |
| H3 | stuck card (any counter exceeded) | tried/failed/options | rare; this is the "the machine gave up" path |
| H4 | `integration -> main` promotion at cadence | list of merge cards since last promotion | daily / per epic |

T0/T1 (~80% of tasks): zero human touches on the happy path. The human's attention is spent only where a
latent defect is expensive (T2/T3) or where the machine has already proven it is stuck.

## 9. Cost model — agent calls and human touches per task class

Units: one **call** = one fresh subagent invocation (parallelizable, ~1-3 min). One **touch** = one human
intervention (read, decide, type; serial; ~3-5 min). `h` = touch cost in call-equivalents of wall-clock (base 6;
sensitivity at 2 and 10). `L` = cost of a latent defect that escapes to "later" (rediscover, rebuild context,
fix, verify): T0/T1 `L = 6 calls + 3 touches`; T2 `L = 20 calls + 8 touches`. Escape rates: straight line
(self-review only) `e_s = 0.30` on multi-file work (consistent with 5-47% self-approval of buggy output);
funnel `e_f = 0.05` (two independent reviewers with ~0.75 catch each, allowing correlated misses); T0 fast lane
`e = 0.03` vs straight `0.10`.

**Straight line (single long chat), T1 task**: first attempt `p = 0.45`, each fix iteration `p = 0.6` and slower
(context growth). Expected calls `≈ 1 + (1-0.45)/0.6 ≈ 2`; touches `≈ 3` (prompt, relay error, verify);
latent `0.30 × (6 + 3h)`.

**Funnel, T1 task**: triage 0.2 (amortized over ~5 subtasks), decompose 0.3 (amortized), spike 1 (when unknowns;
weight 0.6), execute 1 + 0.15 fresh retry, inspect 1, blind 1, send-back rounds `0.35 × (1 execute + 1 inspect +
0.5 blind) ≈ 0.9`, learn 0.1. Total `≈ 5.3` calls; touches `≈ 0.3` (batched questions and escalations amortized);
latent `0.05 × (6 + 3h)`.

| Class | Path | Calls | Touches | Latent (h=6) | **Total wall-clock units (h=6)** | h=2 | h=10 |
|---|---|---|---|---|---|---|---|
| T0 | straight line | 1 | 2 | 0.10×24 = 2.4 | **15.4** | 7.2 | 23.6 |
| T0 | funnel fast lane | 2.2 | 0 | 0.03×24 = 0.7 | **2.9** | 2.6 | 3.3 |
| T1 | straight line | 2 | 3 | 0.30×24 = 7.2 | **27.2** | 12.6 | 41.8 |
| T1 | funnel | 5.3 | 0.3 | 0.05×24 = 1.2 | **8.3** | 6.8 | 9.7 |
| T2 | straight line | 2.5 | 4 | 0.30×68 = 20.4 | **46.9** | 22.7 | 71.1 |
| T2 | funnel | 11 | 1 | 0.03×68 = 2.0 | **19.0** | 15.0 | 23.0 |
| T3 | straight line | unbounded wandering; typically 10+ calls, 10+ touches, high escape | — | — | **>100** | — | — |
| T3 | funnel (panel 6 + 4 subtasks × T2 lane) | ~50 | 2-3 | low | **~65** | — | — |

Reading: the funnel spends **2-4x more agent calls** and gets back **3-5x less wall-clock** on T0-T2, and it wins at
every `h` tested. The gap comes from three places, in order of size: (1) removing the human from the loop
(touches 3 -> 0.3), (2) escape-rate reduction (7.2 -> 1.2 latent units on T1; 20 -> 2 on T2), (3) parallelism,
which the per-task table does not even count: for an epic of 8 independent T1 subtasks with concurrency 8, funnel
wall-clock ≈ 1-2 chain lengths, straight line ≈ 8 serial chains.

Where the funnel would lose: `h -> 0` (unattended trivial edits) and single-file tasks with `p >= 0.85`. That is
exactly the region the T0 fast lane covers with 2.2 calls and no reviewers except one cheap outsider, so the
worst case is "about as fast as a straight line, with one extra insurance call". The tiering is what guarantees
the funnel never loses badly.

## 10. Why it is faster than a straight line (mechanisms, not hopes)

- **Human out of the loop for ~80% of tasks**: the serial resource in vibe-coding is the person. Hooks and gates
  replace "read error, say fix it".
- **Cheap kills before expensive stages**: triage (0.2 call) kills contradictions; DAG validation (0 calls) kills
  overlapping plans; spike (1 bounded call) kills infeasible plans before N executions and 2N reviews.
- **Small contexts are faster and more correct**: an executor with a 1-page card and a failing test beats a
  200k-token chat; p(first attempt) goes up and per-call latency goes down.
- **Parallel by construction**: disjoint write-sets + worktrees + `pipeline()` (no barriers between subtasks).
- **Ratchet**: every defect becomes a test, so the same class of error is never paid for twice; the fast lane
  widens as zones prove clean (Learn), so the system speeds up with use.
- **No vibes-based blocking**: reviewers cost a round only with a runnable repro; opinions are free notes.
- **Reviews are cheap because evidence is structured**: reviewers read a diff and two JSON files, not a transcript.

## 11. Universality

- Tool-agnostic vocabulary: the workflow is defined by 9 artifact types and 3 shell commands per zone
  (`test`, `lint`, `build`) plus optional `format`. Any language: the zone file is the adapter. Any project type:
  a docs-only repo has zones with `test = markdownlint` and a T0 floor; an infra repo has `test = terraform plan`
  and a T2 floor.
- Any size: a 1-file script has one zone and every task is T0/T1 (the funnel collapses to execute + blind);
  a monorepo has 30 zones and the same stages.
- Any harness: "fresh agent with only these files" and "shell gate" exist in every agent tool; hooks are optional
  (the post-hoc `git diff ⊆ write-set` check is the real gate, hooks only fail fast).
- Human team or solo: checkpoints H0-H4 are the same whether the human is one person or a team.
- Non-code work (specs, data pipelines, content): `contract.json` `kind: file|snapshot|cmd` checks still apply;
  the blind reviewer still receives only the artifact and the intent.

## 12. Claude Code mapping

### 12.1 Agents (`.claude/agents/*.md`)

| File | model / effort | tools | key frontmatter | must NOT see |
|---|---|---|---|---|
| `funnel-triage.md` | haiku or sonnet / low | Read, Grep, Glob | `maxTurns: 12` | write tools |
| `funnel-zone-mapper.md` | sonnet / low | Read, Grep, Glob, Write (only `.funnel/zones.json`) | `maxTurns: 10` | — |
| `funnel-planner.md` | inherit / medium | Read, Grep, Glob, Write (only `.funnel/epics/**`) | `skills: [funnel-contract]`, `maxTurns: 30` | executor tools, other epics |
| `funnel-spiker.md` | inherit / medium | Read, Edit, Write, Bash, Grep, Glob | `isolation: worktree`, `maxTurns: 15` | instruction to implement |
| `funnel-executor.md` | inherit / by class | Read, Edit, Write, Bash, Grep, Glob | `isolation: worktree`, `permissionMode: acceptEdits`, `maxTurns: 60`, `hooks: {Stop: [gate]}` | history, siblings, reviewer files |
| `funnel-inspector.md` | inherit / high | Read, Grep, Glob, Bash | `isolation: worktree`, `skills: [funnel-defect-card]`, `maxTurns: 25` | executor transcript |
| `funnel-outsider.md` | **other family if available** / high | Read, Grep, Glob, Bash | `omitClaudeMd: true`, `isolation: worktree`, `skills: [funnel-defect-card]`, `maxTurns: 25` | plan, contract, inspect.json, evidence, history, CLAUDE.md |
| `funnel-judge.md` | inherit / high | Read, Grep, Glob, Bash | `maxTurns: 15` | — |
| `funnel-learner.md` | sonnet / low | Read, Write (only `.funnel/`) | `maxTurns: 15` | — |
| `funnel-designer.md` (T3) | inherit / high | Read, Grep, Glob, Write (`design/`) | `maxTurns: 40` | other designers' outputs |

Example (blind reviewer):

```markdown
---
name: funnel-outsider
description: Context-free blind reviewer. Receives only a diff and a one-line intent; returns approve/block with a runnable repro. Never given plans, history or CLAUDE.md.
tools: Read, Grep, Glob, Bash
omitClaudeMd: true
isolation: worktree
effort: high
maxTurns: 25
skills:
  - funnel-defect-card
---
You are reviewing a change you know nothing about. You get: (1) `DIFF.patch`, (2) one sentence of intent,
(3) one line telling you how to run tests. Decide: would you merge this to production?
Rules: a `block` verdict is valid only with a repro (`cmd`, `expect`, `got`) that you have actually run and that
fails on this branch. Anything you cannot demonstrate is a `concern`, not a block. Do not guess the plan;
judge the artifact. Return `blind.json` via StructuredOutput.
```

### 12.2 Workflow script (`.claude/workflows/funnel.js`, invoked with `args: {epic, text, ts}`)

```js
export const meta = {
  name: 'funnel',
  description: 'Risk-tiered separator: intake -> decompose -> spike -> execute -> inspect -> blind -> merge -> learn',
  phases: [
    { title: 'Intake' }, { title: 'Decompose' }, { title: 'Spike' }, { title: 'Execute' },
    { title: 'Inspect' }, { title: 'Blind' }, { title: 'Merge' }, { title: 'Learn' },
  ],
}
const E = `.funnel/epics/${args.epic}`
phase('Intake')
const triage = await agent(`Triage ${E}/request.md; write ${E}/triage.json`, {agentType: 'funnel-triage', schema: TRIAGE, effort: 'low'})
if (triage.ambiguity >= 0.5 && triage.class >= 2) return {ask: triage.questions}   // H0: main loop asks the human, re-invokes with answers
phase('Decompose')
let dag = needsDecompose(triage)
  ? await agent(`Plan ${E}`, {agentType: 'funnel-planner', schema: DAG})
  : singleTaskDag(triage)                                                           // 0 calls on the fast lane
let v = validateDag(dag); if (!v.ok) { dag = await agent(`Fix plan: ${v.errors}`, {agentType: 'funnel-planner', schema: DAG}); if (!validateDag(dag).ok) return {stuck: 'plan'} }
const waves = topoWaves(dag)                                                        // S3 in plain code
const parked = [], merged = []
for (const wave of waves) {                                                         // barrier only between waves (real dependency)
  const results = await pipeline(wave, async (sub) => {                             // pipeline: no barrier inside a wave
    const st = {execRetries: 0, sb: {execute: 0, decompose: 0}, calls: 0, sigs: new Set()}
    if (sub.class >= 1 && sub.unknowns.length) {
      const spike = await agent(spikePrompt(sub), {agentType: 'funnel-spiker', schema: SPIKE, phase: 'Spike'}); st.calls++
      if (!spike || spike.verdict !== 'feasible') return {sub, sendback: 'decompose', why: spike}
    }
    let cards = []
    for (let round = 0; round <= 2; round++) {                                     // bounded review rounds
      const ev = await agent(execPrompt(sub, cards), {agentType: 'funnel-executor', schema: EVIDENCE, phase: 'Execute', effort: effortFor(sub.class)}); st.calls++
      if (!ev || ev.status !== 'pass') { if (st.execRetries++ < 1) { round--; continue } return {sub, sendback: 'decompose', why: ev} }
      const ins = sub.class >= 1
        ? await parallel(lensesFor(sub.class).map(l => () => agent(inspectPrompt(sub, l), {agentType: 'funnel-inspector', schema: INSPECT, phase: 'Inspect'})))
        : [{verdict: 'pass', defects: []}]
      const bl  = await parallel(votersFor(sub.class).map(i => () => agent(blindPrompt(sub, i), {agentType: 'funnel-outsider', schema: BLIND, phase: 'Blind', effort: sub.class ? 'high' : 'low'})))
      const d = decide(ins.filter(Boolean), bl.filter(Boolean), st)                // section 6 table, pure code
      if (d.action === 'merge') return {sub, merge: true, card: mergeCard(sub, ins, bl)}
      if (d.action === 'judge') { const j = await agent(judgePrompt(sub, ins, bl), {agentType: 'funnel-judge', schema: JUDGE}); if (j.verdict === 'pass') return {sub, merge: true}; d.cards = j.defects }
      if (d.action !== 'execute' || st.sb.execute++ >= 2) return {sub, sendback: d.action, why: d}
      cards = ratchet(d.cards, st)                                                  // repro -> regress test, sig dedupe; repeated sig escalates
      if (cards.escalate) return {sub, sendback: 'decompose', why: cards}
    }
    return {sub, stuck: true}
  })
  for (const r of results.filter(Boolean)) r.merge ? merged.push(r) : parked.push(r)
  log(`wave done: ${merged.length} merged, ${parked.length} parked`)
  if (parked.some(p => p.sendback === 'decompose') ) break                          // main loop re-plans and re-invokes (resume caches the rest)
}
phase('Learn')
if (parked.length || anyDefects(merged)) await agent(`Update zones/lessons for ${E}`, {agentType: 'funnel-learner', effort: 'low'})
return {merged, parked}   // main loop: T2/T3 merge cards -> human (H2); stuck -> H3
```

Gotchas honored: no `Date.now()` (timestamp in `args.ts`); `pipeline()` inside a wave, `parallel()` only where
a barrier is real (wave boundary; majority vote); every send-back and park is `log()`ged; resume via
`resumeFromRunId` after the human answers H0/H2/H3 so nothing green is re-run.

### 12.3 Skills (`.claude/skills/*/SKILL.md`)
- `funnel/SKILL.md` — entrypoint `/funnel "<request>"`: creates the epic dir, writes `request.md`, runs the
  workflow, presents merge cards / stuck cards, promotes `integration -> main` on request.
- `funnel-contract/SKILL.md` — how to write `contract.json` checks (kinds, timeouts, "observable, not structural").
  Preloaded into planner and spiker.
- `funnel-defect-card/SKILL.md` — defect card schema; "no repro, no block". Preloaded into inspector, outsider, judge.
- `funnel-merge-card/SKILL.md` — the one-screen human format.
- `funnel-zones/SKILL.md` — how to author `zones.json` for a new repo (a 1-call bootstrap for any language).

### 12.4 Hooks (`.claude/settings.json`)

```json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Edit|Write|MultiEdit", "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.funnel/bin/writeset-guard.sh" }] },
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.funnel/bin/bash-guard.sh" }] }
    ],
    "PostToolUse": [
      { "matcher": "Edit|Write|MultiEdit", "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.funnel/bin/format-touched.sh" }] }
    ],
    "SubagentStop": [
      { "matcher": "funnel-executor", "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.funnel/bin/require-evidence.sh" }] }
    ],
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.funnel/bin/status.sh" }] }
    ]
  }
}
```

- `writeset-guard.sh`: reads hook JSON (`cwd`, `agent_type`, `tool_input.file_path`); if `agent_type` is
  `funnel-executor`/`funnel-spiker`, looks for `<cwd>/.funnel-task` (the card instructs the agent to write it first);
  missing marker or path outside the write-set -> `permissionDecision: deny` with reason. Other agents: exit 0.
- `bash-guard.sh`: denies `git push`, `git checkout|switch` away from the worktree branch, `rm -rf`, `DROP|TRUNCATE`,
  and `sed -i`/redirects into paths outside the write-set (best effort; the post-hoc diff check is authoritative).
- `require-evidence.sh` (SubagentStop, executor only): runs `gate.sh` (acceptance + zone tests + lint + diff ⊆
  write-set), writes `evidence.json`; on failure with attempts < 3 -> `exit 2` with the failing output on stderr
  (the executor keeps going); at attempt 3 -> allow stop with `status: fail`.
- `status.sh`: prints active epics/parked subtasks as `additionalContext` so a resumed session knows the state.

### 12.5 Memory
`CLAUDE.md` stays tiny: gate commands, "artifacts live in `.funnel/`", and `@.funnel/lessons.md`. Nothing else
grows, so the executor's context stays small and the outsider (`omitClaudeMd`) stays blind.

## 13. How a task flows (60-second narrative)

User types two paragraphs. Triage (1 cheap call) says T1, zones `api`+`web`, 6 files, one unknown ("does the ORM
support partial unique index?"). Planner makes 3 subtasks with disjoint write-sets and a contract each. Script
computes 2 waves. Wave 1: two spikes run in parallel; one proves the ORM supports it and leaves a failing test;
the other has no unknowns and skips. Two executors run in parallel worktrees; hooks stop one from editing a file
outside its set; SubagentStop refuses to let the other stop until lint passes. Two inspectors re-run gates and
pass. Two outsiders (different model) see only diffs: one blocks with a repro (empty-list case). Script writes
`regress_<sig>` test, re-dispatches one executor (round 2), inspector+outsider pass, auto-merge to `integration`.
Wave 2 runs the dependent subtask. Learner adds one lesson line. Human sees: "epic done, 3 merged, 1 round of
send-back, 14 calls, 0 questions". Human promotes `integration -> main`.

## 14. Top risks (honest)

1. **Contract quality is the load-bearing element.** Weak `contract.json` -> everything green but wrong.
   Mitigation: spike writes the test *before* execution; blind reviewer judges the artifact against the intent
   sentence, not the contract. Residual: if both intent sentence and contract are wrong, the funnel ships the wrong
   thing quickly. The H2 merge card shows assumptions for T2+, T1 assumptions are visible only at H4.
2. **Risk misclassification** (a T2 change riding the T0 lane). Mitigation: deterministic path floors dominate the
   agent's estimate; escapes raise floors. Residual: a new area with no floor yet; first escape there is the price.
3. **Write-set enforcement is leaky at the hook level** (`sed -i`, scripts, generated files). Mitigation: the
   authoritative gate is `git diff --name-only ⊆ writes[]` post hoc; hooks only fail fast. Residual: wasted executor
   calls when the leak is found late.
4. **Serialized resources in parallel waves** (lockfiles, migrations, generated clients). Mitigation: zones declare
   `serialized_resources[]`; the DAG validator forces them into one subtask per wave. Residual: integration
   conflicts still happen on shared files nobody declared; they cost a rebase round.
5. **Reviewer false blocks and noise.** Mitigation: "no repro, no block" makes noise free and blocks expensive to
   assert. Residual: reviewers may under-block (miss things) because repro is work; hence two separators, and
   cross-model outsiders for T2+.
6. **Token cost multiplier 2-4x** per task versus a straight line. Acceptable under the stated goal (net
   wall-clock and error rate), but a real bill; the fast lane exists to keep the multiplier near 2 on the bulk.
7. **Blindness leakage.** The outsider can infer the plan from branch names, commit messages, comments in the diff,
   or CLAUDE.md. Mitigation: `omitClaudeMd`, squash-for-blind, diff-only. Residual: code comments that narrate the
   plan; accepted.
8. **Over-decomposition on small projects and under-decomposition on large ones.** Mitigation: collapse rules
   (T0/T1 single card) and the 12-subtask cap with epic splitting. Residual: planner quality varies; the DAG
   validator catches structure, not judgment.
9. **Learn drift.** Bounded `lessons.md` and rule-based floors prevent CLAUDE.md bloat, but a wrong lesson can
   persist for a while; dedupe by sig and recurrence-based pruning are the only defense.
10. **Human bottleneck moves, not disappears.** H2 cards for T2+ and H4 promotion still need a person; if the
    person is away, T2+ work queues on `integration`. This is by design (that is where the money is), but it
    caps throughput on risky work at the human's review rate.
