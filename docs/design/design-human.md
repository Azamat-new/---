# Design "SEPARATOR-HITL": a human-ON-the-loop, economics-first funnel

Angle: **Human-in-the-loop-and-economics-first.** Optimize for the human owner of a large project.
Thesis: the straight line (task -> error -> fix -> error -> fix) is slow not because the model is slow, but because
the *human is the verification loop* and every error round-trip costs human attention plus a more polluted context.
A separator fixes this by (a) putting the human at exactly four decision points and nowhere else, (b) batching every
question, (c) catching each defect at the cheapest stage that can catch it, (d) routing work by risk class so routine
work stays cheap, and (e) measuring its own yield so rigor is a dial tuned from data, not a ritual.

Vocabulary: the user's milk separator. Raw milk = incoming requests. Plates = zones of responsibility. Cream = work that
needs judgment (R2/R3). Skim = routine work (R0/R1) that must flow through fast. The drum spins in a Workflow script;
the human only opens the taps.

---------------------------------------------------------------------------------------------------

## 1. The separator (ASCII)

```
                 ┌──────────────────────────────────────────────────────────────┐
  raw requests   │  S0 INTAKE (wide mouth)  triage -> risk class R0..R3         │
  (many at once) │  questions.md (<=5, with defaults)  ──►  [H1] batched answers │
                 └───────────────┬──────────────────────────────────────────────┘
                                 ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │  S1 ZONES (plates)   zones.yaml: owner rules, invariants,    │
                 │      verify command, protected paths, risk multiplier        │
                 └───────────────┬──────────────────────────────────────────────┘
                                 ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │  S2 DECOMPOSE  units/*.json  (1 zone, 1 context window,      │
                 │      disjoint write-set, independent test)  + plan-checker   │
                 └───────────────┬──────────────────────────────────────────────┘
                                 ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │  S3 DISTRIBUTE  (script, no LLM) topo-order, parallel groups,│
                 │      model tier + budget per unit, worktree per unit         │
                 └───────────────┬──────────────────────────────────────────────┘
          ┌──────────────────────┼──────────────────────┐   per unit, in parallel
          ▼                      ▼                      ▼
  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
  │ S4 HYPOTHESIS │      │ S4 HYPOTHESIS │      │ S4 HYPOTHESIS │  contract.md + red test
  │  + refuter    │      │  + refuter    │      │  + refuter    │  ──► [H2] R2/R3 only
  ├───────────────┤      ├───────────────┤      ├───────────────┤
  │ S5 EXECUTE    │      │ S5 EXECUTE    │      │ S5 EXECUTE    │  hooks: scope, stop=verify
  ├───────────────┤      ├───────────────┤      ├───────────────┤
  │ S6 REVIEW     │◄─┐   │ S6 REVIEW     │◄─┐   │ S6 REVIEW     │◄─┐  context-aware, fresh ctx
  │  (send back)  │──┘   │  (send back)  │──┘   │  (send back)  │──┘  <=3 rounds, then tier-up
  └───────┬───────┘      └───────┬───────┘      └───────┬───────┘     <=5, then [H3]
          └──────────────────────┼──────────────────────┘
                                 ▼   integration branch
                 ┌──────────────────────────────────────────────────────────────┐
                 │  S7 BLIND VERDICT   3-5 judges, omitClaudeMd, no run dir,     │
                 │     only: candidate tree + acceptance.md + run command.       │
                 │     Must RUN things. Decision table -> PASS/CONCERNS/FAIL     │
                 │     FAIL ──► finding-router ──► S2/S4/S5 (or [H3] if S0)      │
                 └───────────────┬──────────────────────────────────────────────┘
                                 ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │  S8 MERGE   verdict-packet.md (1 page) ──► [H4] approve/merge │
                 │     commit trailer Separator-Run: <id>  -> ledger.jsonl       │
                 └───────────────┬──────────────────────────────────────────────┘
                                 ▼
                 ┌──────────────────────────────────────────────────────────────┐
                 │  S9 LEARN   FPY/RTY, send-back matrix, escaped defects,       │
                 │     cycle time, $/unit  ──► tuner proposes rigor changes      │
                 │     (approved in the [H4] digest) ──► policy.yaml, rules      │
                 └──────────────────────────────────────────────────────────────┘

  [H1]..[H4] are the ONLY places a human decides.  Every arrow between boxes is a file.
```

---------------------------------------------------------------------------------------------------

## 2. Risk classes = the separator plates (rigor is proportional to blast radius)

Classification is done at S0 by a cheap model from objective signals, then may only be *raised* by later stages
(never lowered without a human). Defaults live in `policy.yaml`; S9 tunes them.

| Class | Objective signals (any raises to this class)                                             | Budget default ($ / wall-clock) | Rigor profile |
|-------|-------------------------------------------------------------------------------------------|---------------------------------|---------------|
| R0 trivial   | one-sentence diff, <=1 file, no interface/data change, existing tests cover it, zone not protected | <=$0.5 / <=5 min        | S0 -> S5 (1 unit) -> S6 (1 lens) -> S8 digest. No S4 contract beyond a red test if one applies. S7: 1 judge or 0 (policy). |
| R1 routine   | bounded bug fix or feature inside ONE zone, intent well-defined (done-state, must-not-change, out-of-scope all stated) | <=$5 / <=30 min | full chain, S4 contract auto-approved by refuter, S6 two lenses, S7 panel of 2, no H2. |
| R2 significant | touches >=2 zones OR new interface OR schema/data change OR intent has open questions      | <=$30 / <=3 h                   | full chain, H2 contract approval, S6 two lenses + refuters, S7 panel of 3 + naive-user judge. |
| R3 critical  | irreversible action (migration, deletes data, auth/permissions, payments, public API, release), OR blast radius > 30% of zones, OR any zone flagged `critical: true` | <=$100 / <=1 day (human gates dominate) | as R2, plus: S4 requires rollback plan; S7 panel of 5 incl. security lens; H4 is per-unit, never digest; irreversible step executed only after H4. |

Budgets are ceilings, not targets: a stage that would exceed 80% of the class ceiling stops fanning out and ends with
`status: budget_escalation` (an [H3] event with partial state). Nothing silently truncates.

---------------------------------------------------------------------------------------------------

## 3. Human decision points: exactly four, all batched, all at workflow boundaries

Claude Code workflows accept no mid-run input, and that is a feature: it forces every question into a file and every
human decision to a boundary between workflows. Agents are given no `AskUserQuestion` tool; a question is written to
`questions.md` with a recommended default and the stage ends with `status: needs_human`.

| Gate | When                                   | What the human sees (one packet)                                              | Decision options                                   | Skipped when |
|------|----------------------------------------|--------------------------------------------------------------------------------|----------------------------------------------------|--------------|
| H1 Intent | after S0, only if `needs_clarification` | `questions.md`: <=5 questions per request, each with a recommended default and why; ALL requests in the intake batch in one packet | answer / accept defaults / kill request | triage has no questions; or policy `auto_defaults: true` for R0/R1 |
| H2 Contract | after S4 for R2/R3                     | `contracts-packet.md`: per unit, 10 lines: hypothesis, what changes, verification command, irreversible actions, rollback, footprint | approve all / edit a contract / send unit back to S2 / kill | class R0/R1 (refuter is the approver) |
| H3 Escalation | any loop limit, judge deadlock, budget breach, spec-vs-reality contradiction, back-edge to S0, irreversible action pending | `escalation.md`: the two competing positions with evidence, the counter that tripped, cost so far, the three cheapest options | pick option / give a ruling (recorded in `rulings.md`) / kill | never skipped; but it fires rarely by construction |
| H4 Merge | after S7 for every run                 | `verdict-packet.md` (1 page): what changed (by zone), evidence (commands + exit codes), judge votes + concerns, $ and time spent, residual risks; R0/R1 arrive as a daily digest | merge / merge with follow-up ticket / reject with reason (reason routes) | never skipped. Accountability stays human. R0/R1 may be batch-approved. |

Rules that keep the human *on* the loop rather than *in* it:
1. No agent may ask a human anything outside H1-H4. Enforced structurally (no AskUserQuestion tool in `.claude/agents`) and
   by schema (every stage output has `status ∈ {ok, needs_human, sent_back, failed}` + `questions[]`).
2. Questions are batched per intake batch, capped at 5 per request, each with a default; the human can answer with one
   word ("defaults"). Spec Kit's clarify cap and default-first format are the model here.
3. A decision, once made, is written to `rulings.md` and is visible to every later stage of that run and to S9. The same
   question is never asked twice; the tuner turns repeated rulings into `policy.yaml` or `.claude/rules` entries.
4. The human never reads transcripts. They read packets, which are generated by the script from structured outputs.
5. Human wait time is measured separately from agent time (S9) because it is usually the largest slice of cycle time;
   batching exists to shrink it.

---------------------------------------------------------------------------------------------------

## 4. Stage table

Context rules: "must NOT have" is enforced by what the script pastes into the prompt and by the agent definition
(fresh context, restricted tools, `omitClaudeMd` for judges). Run artifacts live in `.separator/runs/<run>/` which is
git-ignored, so a worktree never carries them; the judges' worktree therefore cannot even find them.

| # | Stage | Purpose | Who runs it / context it MUST NOT have | Inputs | Outputs | Objective exit gate | Send-back targets | Skipped when |
|---|-------|---------|-----------------------------------------|--------|---------|---------------------|-------------------|--------------|
| S0 | INTAKE (wide mouth) | accept N raw requests at once; normalize; classify risk; extract user-visible acceptance criteria; collect questions | `intake-triage` (cheap model, read-only tools). Must NOT have: prior runs' transcripts, any implementation ideas | `request.md` (raw text, screenshots, links), `zones.yaml`, `policy.yaml`, `rulings.md` (global) | `triage.json` {class, zones_touched, one_sentence_diff, signals[]}, `acceptance.md` (EARS-style, WHAT only), `questions.md` | schema-valid; class assigned with >=1 signal; acceptance.md has >=1 testable criterion; questions <= 5 with defaults; no `[NEEDS CLARIFICATION]` left after H1 | — (it is the beginning); a request may be *killed* | never; R0 gets the 1-call version |
| S1 | ZONES (plates) | maintain the map of responsibility: for each zone, owner rules, invariants, verify command, protected/frozen paths, risk multiplier | `zone-mapper` (strong model, read-only). Must NOT have: the current request (zones are request-independent) | repo (README, CI config, package manifests, test layout), previous `zones.yaml`, `escapes.jsonl` | `zones.yaml`, `.claude/rules/zone-<name>.md` (path-scoped) | every zone has a runnable `verify` command that passes on main; every path in the repo maps to exactly one zone; diff of zones.yaml reviewed by human at next H4 digest | — | skipped on every run unless: first run, `zones.yaml` older than policy `zone_refresh_days`, S9 flags drift (send-back rate for a zone > 2x median), or S0 found unmapped paths |
| S2 | DECOMPOSE | turn a request into units that each fit one context window, one zone, one independent test, disjoint write-set | `planner` (strong model, read-only) then `plan-checker` (fresh context, read-only). plan-checker must NOT have: planner's reasoning, only its output | `acceptance.md`, `triage.json`, `zones.yaml`, `answers.md` | `plan.json` {units[], deps[], est_cost}, `units/<u>/unit.json` {zone, owned_files[], frozen_tests[], criteria_ids[], class, est_tokens} | plan-checker report: every acceptance criterion covered by >=1 unit; write-sets pairwise disjoint; each unit has an `independent_test`; est_cost <= class budget; no unit > 1 context window; no ambiguity that could make parallel executors diverge (GSD plan-checker rule) | S0 (intent gap found -> new questions, requires H1) | R0: one auto-generated unit, plan-checker skipped |
| S3 | DISTRIBUTE | schedule units: topological order, parallel groups, model tier and token budget per unit, worktree per unit | the Workflow script (no LLM) | `plan.json`, `policy.yaml` | `schedule.json` | deps respected; sum(unit budgets) <= class budget; parallel groups have disjoint write-sets (asserted in code) | S2 if constraints unsatisfiable | never (trivial for 1 unit) |
| S4 | HYPOTHESIS CHECK (before implementation) | write and *refute* the contract: what will change, why it will work, evidence from code search (never assume missing), the runnable verification, irreversible actions, footprint, rollback | `contractor` (worktree, may run probes/spikes, may write ONLY test files) then `contract-refuter` (fresh context, read-only + bash for probes). Refuter must NOT have: contractor's reasoning; it gets contract.md + unit.json + zone rules only | `unit.json`, `zone-<name>.md`, `acceptance.md` (criteria ids of this unit), `rulings.md` | `contract.md`, `red-test.txt` (command + output proving the new test FAILS on main), `refutation.json` {verdict: ready/refuted, probes[]} | contract has `verification.command`; red test exists and fails; every "X exists/does not exist" claim in the contract was probed by the refuter (grep/run) and held; irreversible actions listed with rollback; refuter verdict `ready` | S2 (unit too big / wrong split / write-set conflict), S0 (contradiction between acceptance.md and code reality -> H1) | R0: contract is 3 lines + red test when a test applies; refuter pass is 1 probe call |
| S5 | EXECUTE | implement exactly the contract in an isolated worktree; produce evidence, not claims | `implementer` (isolation: worktree; tools Read/Grep/Glob/Edit/Write/Bash; no Agent). Must NOT have: transcript of S0-S4, other units' contracts, review findings of other units | `contract.md`, `unit.json`, `zone-<name>.md`, `rulings.md` | commit(s) on unit branch, `result.json` {commands[], exit_codes[], changed_files[], evidence_hash} | Stop hook: `verification.command` exit 0; red test now green; changed files ⊆ owned_files (PreToolUse guard); no file in `frozen_tests` modified; lint/typecheck hook clean; commit has trailer `Separator-Unit: <u>` | — (S5 never sends back; it reports `blocked` with reason, which the script routes to S4) | never |
| S6 | INDEPENDENT REVIEW (context-aware, can send back) | verify the diff against the contract and zone rules; findings must be verified consequences at file:line; route each finding | `reviewer-spec` and `reviewer-correctness` (fresh contexts, read-only) in parallel, then `finding-refuter` x2 per finding. Reviewers must NOT have: implementer transcript, S4 reasoning, other reviewers' output. Refuters must NOT have: the reviewer's reasoning, only the finding | diff, `contract.md`, `unit.json`, `zone-<name>.md`, `acceptance.md` criteria of the unit | `review.json` {findings[]: {id, severity, file, line, claim, verified_by, route ∈ patch/defer/decision/contract/split}} | zero findings of severity high/critical that survived refutation; round 2+ reports only high/critical (convergence rule); nits capped at 5 and never block | S5 (patch), S4 (contract wrong or verification too weak), S2 (unit boundary wrong), S0 via H3 (intent contradiction) | R0: one reviewer, no refuters |
| S7 | BLIND VERDICT (context-free) | judge the integrated candidate as an outsider: does the product do what `acceptance.md` says, and did anything break | `blind-judge` x N (omitClaudeMd: true; isolation: worktree at candidate commit; tools Read/Grep/Glob/Bash; no Agent, no web). Must NOT have: `.separator/runs/*`, contracts, reviews, plan, transcripts, CLAUDE.md, commit messages of the run (script passes a squashed tree, not history) | pasted `acceptance.md`, pasted run/verify commands from zones.yaml, the worktree | `blind/judge-<k>.json` {vote ∈ PASS/CONCERNS/FAIL, evidence[]: {command, exit_code, excerpt}, findings[]} then `verdict.json` via the decision table (section 5) | decision table yields PASS or CONCERNS-accepted; every counted vote has >=1 executed command in evidence (a judge that ran nothing has weight 0) | FAIL -> `finding-router` (context-aware) maps each verified finding to S5/S4/S2; a route to S0 or a split panel -> H3 | R0 with policy `blind_r0: 0` after S9 shows 0 escapes over 50 R0 units; otherwise 1 judge |
| S8 | MERGE (final verdict) | one-page packet for the human; merge; ledger | script builds packet; human decides H4; script merges | `verdict.json`, `review.json`s, `costs.json`, `result.json`s | `verdict-packet.md`, `MERGE_APPROVED` marker (human), merge commit with trailer `Separator-Run: <run>`, `ledger.jsonl` row | marker exists (git-push/merge guard hook checks it); merge commit trailer present; ledger row written | reject-with-reason routes to the stage the reason names (S5 default) | never |
| S9 | LEARN (metrics and tuning) | compute yield metrics from the ledger; propose rigor changes; fold repeated rulings into policy/rules; prune stale rules | script computes metrics (deterministic); `tuner` (strong model, read-only) proposes; human approves in the H4 digest | `ledger.jsonl`, `escapes.jsonl`, `rulings.md`, `policy.yaml`, `zones.yaml` | `metrics.md`, `tuning-proposals.md`, diff to `policy.yaml` / `.claude/rules/*` (applied only after approval) | metrics.md regenerated; every proposal cites the metric + window that motivates it; no proposal lowers rigor for a class with an escape in the last window | — | metrics: never; tuner: only every `tune_every_n_runs` (default 10) or on an escaped defect |

---------------------------------------------------------------------------------------------------

## 5. Blind verdict decision table

Inputs: N judge files; each judge votes PASS / CONCERNS / FAIL and lists findings with evidence. A finding is
*verified* if the judge's evidence contains an executed command that reproduces it (exit code + excerpt), or if a
`finding-refuter` pair (2 fresh contexts told to refute) fails to refute it. Judges never see each other.

| Condition (evaluated top-down, first match wins)                                               | Verdict            | Next |
|------------------------------------------------------------------------------------------------|--------------------|------|
| Any judge FAIL with a *verified* finding of severity high/critical                             | FAIL               | finding-router -> S5 / S4 / S2. If the route is S0 (acceptance.md itself is wrong) -> H3 |
| Any judge FAIL whose findings were all refuted, and remaining votes are PASS/CONCERNS          | recompute without that judge (log it; counts against judge precision) | — |
| Counted votes split with no majority (e.g. 1 PASS / 1 FAIL verified-low, or 2/2)              | DEADLOCK           | H3 with both evidence sets. Never an automated re-vote (re-votes converge to noise) |
| Majority PASS, zero verified findings                                                          | PASS               | S8 |
| Majority PASS or CONCERNS, only verified findings of severity low/medium, count <= `concerns_max` (default 3) | CONCERNS-accepted | S8; concerns printed in the packet; for R3 the human must tick each one |
| Verified medium findings > `concerns_max`, no high/critical                                     | FAIL-soft          | S5 once (patch round), then re-judge with the SAME judge lenses but fresh contexts; second FAIL-soft -> H3 |
| Judges' evidence arrays are empty (nobody ran anything)                                        | INVALID            | re-run S7 once with an explicit "you must execute the run command" prefix; second INVALID -> H3 (harness problem, not code) |
| Run budget < 20% remaining before S7 starts                                                    | BUDGET             | H3 before spending: human chooses "judge anyway", "merge on review only (recorded as unjudged)", or "stop" |

Lenses (each judge gets exactly one, pasted as its task): (1) naive user: read acceptance.md, run the product, try each
criterion; (2) regression: run the whole verify suite and any smoke commands, look for behavior changes outside the
criteria; (3) boundaries/security: inputs, auth, data, secrets, injection, permission changes; (4) failure paths: what
happens on bad input, empty state, concurrency, timeouts; (5) maintainability (R3 only, advisory, weight 0 in the vote).
Vote weights: 1 for lenses 1-4, 0 for lens 5. A judge is "counted" only if `evidence.length >= 1`.

---------------------------------------------------------------------------------------------------

## 6. Send-back matrix and loop control

Back edges are only allowed upstream and each has a budget. A send-back must carry a new `finding_key`
(sha of normalized claim + file); the same key arriving twice in a row at the same stage is a *stall*.

| From \ To | S0 | S2 | S4 | S5 | Notes |
|-----------|----|----|----|----|-------|
| S2 plan-checker | yes (H1) | — | — | — | only for intent gaps; carries new questions |
| S4 refuter      | yes (H3) | yes | — | — | contradiction with reality -> S0; wrong split -> S2 |
| S5 implementer  | — | — | reports `blocked`; script routes to S4 | — | S5 never decides routing |
| S6 review       | via H3 | yes | yes | yes | route field per finding |
| S7 blind        | via H3 | via router | via router | via router | judges never route; `finding-router` (context-aware, read-only) does |
| S8 human reject | any (human names it) | | | | free-text reason is parsed into a route by the script; default S5 |

Counters (per unit unless stated), all stored in `units/<u>/loop.json` and enforced by the script, not by prompts:

| Counter | Limit | On breach |
|---------|-------|-----------|
| S5<->S6 patch rounds, same implementer tier | 3 | rounds 4-5 escalate model tier and effort (`model: opus/fable, effort: xhigh`) with the refuted findings only |
| S5<->S6 total rounds | 5 | H3 escalation with: contract, all findings, diff, cost; options: rule / re-contract (S4) / split (S2) / kill |
| S4 refutations per unit | 2 | third refutation -> S2 (the unit is mis-scoped, not the contract) |
| S2 re-plans per run | 2 | H3 |
| S7 rounds per run | 2 | H3 (see decision table) |
| back-edges to S0 per run | 1 automatic | any second one -> H3 with "intent is unstable" |
| stall (same finding_key twice in a row) | 1 | immediate tier-up; if already at top tier -> H3 |
| Stop-hook blocks (implementer) | 5 (below Claude Code's cap of 8) | hook exits 0 with `IMPLEMENTER_GAVE_UP` marker; script routes to S6 with the failing output attached (review decides whether the verification command or the code is wrong) |
| run budget | class ceiling; 80% soft | soft: stop fan-out, finish in-flight, escalate; hard: script throws, H3 with partial state; resumable via runId |
| run wall-clock (agent time) | class ceiling | same as budget |

Why loops cannot cycle forever: every back edge decrements a finite counter; every counter breach ends in H3, which is a
human ruling recorded in `rulings.md`; a ruling is pasted into every subsequent stage of the run, so the same dispute
cannot re-arise without contradicting a ruling (the plan-checker and refuter are told "a ruling overrides your
judgment; report a conflict with a ruling as `needs_human`, do not re-litigate"). Progress is monotonic because a
send-back without a new finding_key is treated as a stall, not as a round.

---------------------------------------------------------------------------------------------------

## 7. Economics

### 7.1 Where the money goes and how it is capped
Anthropic's own numbers: multi-agent runs use ~15x the tokens of a chat; a verified code review costs $5-25 and 5-20
minutes per PR; a full generator/evaluator harness turned a $9 broken result into a $200 working one. The funnel pays
for itself only when it displaces human round-trips, so:

| Lever | Rule |
|-------|------|
| Model tiers | S0 triage, refuters, finding-refuters: small/fast model, `effort: low`. S2 planner, S4 contractor, S7 judges, S9 tuner: strong model. S5 implementer: inherit; tier-up only on rounds 4-5. Blind judges are the most expensive per call and the most valuable per call, so their count is the main rigor dial. |
| Parallelism | reads and reviews fan out freely (`parallel`, `pipeline`); writes are one implementer per unit with a disjoint write-set. Never two writers on one file. |
| Fast lane | R0/R1 must be cheaper than the straight line for the same task or the funnel loses the user. Target: R0 <= 3 agent calls, R1 <= 12. S9 reports this as `calls_per_unit` by class. |
| Prompt caching | every stage of a unit pastes the same prefix (zone rules, contract) first, so fan-outs hit cache. |
| Budget as code | `budget.total`/`remaining()` in the script; `policy.yaml` ceilings per class; `costs.json` per run written from agent return values (each agent reports tokens it observed via its schema; the script sums). |
| Stop early | plan-checker rejects plans whose `est_cost` exceeds the class ceiling; the human sees the estimate at H2. |

### 7.2 Cost model: straight line vs separator (illustrative, to be replaced by the ledger)
Let a task need k error rounds in the straight line. Each round costs one human attention slice (read the error, decide,
re-prompt: 5-15 min) plus context pollution that raises the probability of the next error (Anthropic: after two
corrections, /clear and re-prompt). For a large project k is 3-8 on multi-file tasks. The separator costs two batched
human slices (H1, H4; plus H2 for R2/R3) regardless of k, and moves the k rounds to agent-agent loops that cost tokens,
not attention. Break-even is roughly k >= 2, which is why R0 (k ~ 0-1) takes the fast lane and R2/R3 (k >= 3) take the
full drum. Defect cost by catch stage (cheapest to dearest): S4 refuter (1 small call) < S6 review (1 implementer
round) < S7 blind (1 round + re-judge) < post-merge escape (new run + human debugging + reputation). Every stage exists
to catch defects one stage earlier than the straight line would.

---------------------------------------------------------------------------------------------------

## 8. Metrics that prove the funnel helps, and the tuning rules that use them

All computed deterministically by the S9 script from `ledger.jsonl` (one row per unit and per run) and
`escapes.jsonl` (one row per post-merge defect, logged by the human with `/sep escape <run-or-commit> "<what>"`; the
`Separator-Run:` commit trailer makes `git log --grep` attribution mechanical).

| Metric | Definition | Target (initial) | What it diagnoses |
|--------|------------|-------------------|-------------------|
| FPY(stage) | units leaving a stage on the first attempt / units entering | S4 >= 80%, S5 >= 85%, S6 >= 70%, S7 >= 90% | per-stage quality of the upstream artifact |
| RTY | product of FPY over S2..S7 = P(mouth-to-merge with zero send-backs) | >= 40% at start, rising | overall smoothness; the number the user feels |
| send-back matrix | count of back edges by (from, to, class), rolling window of 30 runs | no cell > 25% of its stage's throughput | *where* the funnel leaks (see rules below) |
| escaped defects | escapes per 100 merged units, by class and zone | R0/R1: <= 2; R2/R3: 0 | the ground-truth "error-free" number; the only metric allowed to raise rigor automatically |
| reviewer precision | findings surviving refutation / findings reported, per reviewer and per judge lens | >= 70% | a lens below target is rewritten or dropped (Anthropic Code Review runs at <1% incorrect; be honest if you are far from it) |
| cycle time | intake -> merge, split into agent time and human wait time | human wait <= 50% of cycle time | batching effectiveness and gate placement |
| human interventions per unit | H1+H2+H3+H4 touches / units merged | trending down; H3 < 5% of units | whether the human is on the loop or still in it |
| calls per unit, $ per unit | by class | R0 <= 3 calls; R1 <= 12 | ceremony creep |
| stall count | stalls per 100 rounds | < 3 | prompt/tooling problems, not code problems |

Tuning rules (S9 proposes, human approves in the H4 digest; rules are explicit so tuning is auditable):

| Signal (window = last 30 runs of that class unless stated)                       | Action |
|----------------------------------------------------------------------------------|--------|
| escaped defect in class C                                                         | raise C's rigor one notch for 20 runs (more judges / add the lens that should have caught it); route the defect's zone at C+1 until clean; the tuner drafts a `.claude/rules/zone-<z>.md` line naming the failure ("sign" pattern) |
| FPY(S7) >= 98% AND escapes(C) = 0 over 50 runs                                     | reduce S7 panel by one judge for class C (floor: R0 0, R1 1, R2 2, R3 4) |
| FPY(S6) >= 95% AND reviewer precision >= 80% AND escapes = 0                       | drop the second S6 lens for R1 |
| send-back S6 -> S5 > 25%                                                          | contracts are too vague: add "verification must be a command with expected output" checklist item to contractor; raise refuter effort |
| send-back S4 -> S2 > 20%                                                          | units too large: lower `max_unit_tokens` in policy; planner told to split by file-set |
| send-back to S0 > 10% or repeated identical H1 questions                          | intake checklist missing a dimension; add the question to `intake-checklist.md` with a default; consider a `.claude/rules` fact |
| send-back S7 -> S5 > 10% while FPY(S6) is high                                    | S6 is blind to something S7 sees: add the judge lens as an S6 lens (cheaper to catch earlier) |
| human wait > 50% of cycle time                                                    | batch harder: enable `auto_defaults` for R0/R1 questions; move R1 to digest approval; notify on packet ready |
| calls_per_unit(R0) > 3 or R1 > 12                                                  | ceremony creep: remove the stage that added calls without changing FPY (harness pruning) |
| H3 > 5% of units                                                                   | loop limits too tight or contracts too weak; inspect rulings.md for a pattern; convert the pattern into policy |
| a `.claude/rules` line unchanged for 90 days with no related finding               | candidate for deletion (rules must earn their attention cost) |

Rigor is therefore a dial with a ratchet: escapes turn it up immediately and automatically (proposal pre-approved by
policy); yield turns it down only slowly and with human approval.

---------------------------------------------------------------------------------------------------

## 9. Why this is faster than the straight line (not just safer)

1. Human attention is the bottleneck resource and it is spent at four batched points instead of at every error.
2. Defects are caught by the cheapest stage able to catch them (refuter probes cost seconds; a post-merge bug costs a day).
3. Units run in parallel with disjoint write-sets; the straight line is serial by construction.
4. Fresh context per stage kills context rot: the implementer never sees the arguments that produced the plan, so it does
   not inherit their errors; the straight line's context gets worse with every fix.
5. The fast lane keeps R0/R1 at 3-12 calls; ceremony is only applied where blast radius justifies it, and S9 measures
   ceremony creep so it cannot grow unnoticed.
6. Resumable script: a crash or budget stop resumes from the last agent call, never from the top.
7. Rulings are remembered; the straight line re-asks the human the same question in every new session.
8. The ledger proves it: if cycle time or human interventions per unit are not falling after 30 runs, the tuner says so
   and proposes removing stages. A workflow that cannot show it is helping is ceremony.

---------------------------------------------------------------------------------------------------

## 10. Universality

Tool-agnostic contract: the separator is nine directories of files with JSON/Markdown schemas and a driver that can
(a) run a fresh-context agent with a prompt plus a fixed set of files, (b) run a deterministic pre/post command around
an agent's actions (hooks or CI), (c) create an isolated workspace per unit (git worktree, container, branch), and
(d) restrict what an agent can read. Any runtime with those four capabilities (Claude Code, a CI pipeline calling a
headless CLI, another agent framework) can implement it; the stage definitions never mention a model.

Language/size agnostic: `zones.yaml` is the only project-specific input. Each zone declares `verify`, `lint`,
`run` (how to start the product for a naive-user judge: CLI invocation, HTTP smoke, browser script), `protected`,
`frozen_tests`, `critical`. A 1-zone repo is valid (a script, a library); a monorepo has dozens. "Run as a user" is
whatever `run` says: for a library it is "write a 10-line program against the public API and execute it".

Solo vs team: for a solo vibe-coder the human gates are the same person; H4 digest mode makes R0/R1 a once-a-day
five-minute review. For a team, H1/H2 can be answered by the requester and H4 by the zone owner named in zones.yaml.

Headless: every stage's exit gate is a file check, so the whole drum can run under `claude -p ... --json-schema` in CI
with H-gates implemented as PR comments/labels instead of terminal prompts.

---------------------------------------------------------------------------------------------------

## 11. Concrete Claude Code mapping

### 11.1 Directory layout
```
.separator/
  policy.yaml            # class thresholds, budgets, panel sizes, loop limits, digest mode, tune_every_n_runs
  zones.yaml             # plates: zone -> paths, owner rules file, verify/lint/run cmds, protected, frozen_tests, critical
  intake-checklist.md    # dimensions triage must consider (scope, data, UX flow, NFRs, integrations, failure handling, terms, done-signal)
  rulings.md             # global human rulings (append-only; per-run rulings are copied here at merge)
  ledger.jsonl           # one row per unit and per run: stage timings, rounds, sendbacks[], cost, verdict, class, zone
  escapes.jsonl          # post-merge defects: {run, unit?, zone, class, lens_that_should_have_caught, note}
  metrics.md             # regenerated by S9
  runs/<run-id>/         # GIT-IGNORED (judges' worktrees never see it)
    request.md  triage.json  acceptance.md  questions.md  answers.md  rulings.md
    plan.json  schedule.json  costs.json  escalation.md  verdict-packet.md  MERGE_APPROVED
    units/<u>/  unit.json  contract.md  red-test.txt  refutation.json  result.json  review.json  loop.json
    blind/      judge-1.json ... judge-N.json  verdict.json  router.json
.claude/
  agents/   intake-triage.md zone-mapper.md planner.md plan-checker.md contractor.md contract-refuter.md
            implementer.md reviewer-spec.md reviewer-correctness.md finding-refuter.md blind-judge.md
            finding-router.md tuner.md
  workflows/ sep-intake.js sep-plan.js sep-build.js sep-verdict.js sep-learn.js
  skills/   sep/SKILL.md (driver) sep-answer/ sep-approve/ sep-escape/ sep-metrics/ sep-packet/
  rules/    zone-<name>.md (paths: [...])   separator-core.md (no paths; ~15 lines)
  hooks/    guard-scope.sh guard-git.sh stop-verify.sh post-lint.sh
  settings.json
CLAUDE.md   (<= 30 lines about the separator: where policy/zones live, commit trailers, "evidence not claims")
```
`.gitignore` contains `.separator/runs/`. Only `zones.yaml`, `policy.yaml`, `rulings.md`, `ledger.jsonl`,
`escapes.jsonl`, `metrics.md` are committed.

### 11.2 Agents (`.claude/agents/*.md`)

| Agent | model / effort | tools | isolation / flags | Body (system prompt) essentials |
|-------|----------------|-------|-------------------|----------------------------------|
| intake-triage | haiku-class, low | Read, Grep, Glob | — | classify by the signal table only; extract WHAT-criteria in EARS form; <=5 questions each with a default and a one-line reason; never propose implementation |
| zone-mapper | strong, high | Read, Grep, Glob, Bash(read-only cmds) | — | build zones from evidence (CI config, manifests, test layout); every path maps to one zone; each zone's verify must pass on main (run it); do not invent standards |
| planner | strong, high | Read, Grep, Glob | — | units: one zone, one context window, independent test, disjoint owned_files; confirm with code search before assuming something is missing; est_tokens per unit |
| plan-checker | strong, high | Read, Grep, Glob | — | fresh eyes: coverage matrix criteria x units; disjointness; ambiguity that could make parallel executors diverge; budget; report gaps only |
| contractor | inherit, high | Read, Grep, Glob, Bash, Edit/Write limited by hook to test files | isolation: worktree | contract.md with: hypothesis, evidence (file:line for every claim), verification.command, irreversible actions, rollback, footprint; write the red test and prove it fails |
| contract-refuter | small/fast, medium | Read, Grep, Glob, Bash(read-only) | — | try to refute every factual claim in the contract with a probe; verdict ready/refuted; a ruling overrides you |
| implementer | inherit (tier-up on rounds 4-5), high | Read, Grep, Glob, Edit, Write, Bash | isolation: worktree; hooks (frontmatter): PreToolUse guard-scope, PostToolUse post-lint, Stop stop-verify | implement exactly the contract; no placeholders; tests verify, they do not define the solution; do not touch frozen tests; return result.json with commands + exit codes; first action: write `.separator/ACTIVE_UNIT` |
| reviewer-spec | inherit, high | Read, Grep, Glob, Bash(git diff/log) | — | every criterion implemented? anything outside scope? gaps only, not style |
| reviewer-correctness | inherit, high | Read, Grep, Glob, Bash | — | verify the claimed consequence at the named location, reading past the hunk; severity from verified consequence; file:line required; <=5 nits |
| finding-refuter | small/fast, low | Read, Grep, Glob, Bash | — | refute one finding; default `refuted: true` if you cannot reproduce or cite |
| blind-judge | strong, xhigh | Read, Grep, Glob, Bash | isolation: worktree; **omitClaudeMd: true**; maxTurns 40 | you know nothing about how this was built; here are the acceptance criteria and the run command; execute, observe, vote; every finding needs an executed command; no reading of `.separator`, `.claude`, git history (also blocked by hook) |
| finding-router | inherit, medium | Read | — | map a verified outside finding to S5/S4/S2/S0 with one sentence why |
| tuner | strong, high | Read | — | propose only rule-table actions from section 8; cite metric and window; never lower rigor where an escape exists in window |

None of the agents lists `Agent` or `AskUserQuestion` in tools; `disallowedTools: Agent, AskUserQuestion, WebFetch,
WebSearch` on judges and refuters.

### 11.3 Workflow scripts (one per human boundary; each is resumable by runId)

```
sep-intake.js   S0 (+S1 if due)          -> ends with questions or with triage ok        [H1 between]
sep-plan.js     S2, S3, S4 (contracts)   -> ends with contracts-packet (R2/R3) or ready  [H2 between]
sep-build.js    S5<->S6 loop per unit    -> ends with integrated branch or escalation    [H3 if tripped]
sep-verdict.js  S7 + packet              -> ends with verdict-packet.md                  [H4 between]
sep-learn.js    S8 ledger + S9 metrics   -> runs after merge; tuner every N runs
```
The `/sep` skill is the driver: it reads `.separator/runs/<id>/` state and tells the main session which workflow to
launch next, renders the human packet, and records answers/approvals as files (so a fresh session can always continue).

Skeleton of `sep-build.js` (plain JS; counters live in the script, not in prompts):
```js
export const meta = { name: 'sep-build', description: 'Contract -> implement -> review loop per unit',
  phases: [{title:'Build'},{title:'Review'},{title:'Integrate'}] }
const { run, units, policy } = args                       // schedule.json content passed as args (no fs in scripts)
const RESULT = { type:'object', properties:{ status:{type:'string'}, commands:{type:'array'}, changed_files:{type:'array'},
  tokens:{type:'number'} }, required:['status','commands','changed_files'] }
const REVIEW = { type:'object', properties:{ findings:{type:'array'}, tokens:{type:'number'} }, required:['findings'] }
const VOTE   = { type:'object', properties:{ refuted:{type:'boolean'}, why:{type:'string'} }, required:['refuted'] }
const key = f => `${f.file}:${f.line}:${(f.claim||'').toLowerCase().slice(0,60)}`

const outcomes = await pipeline(units,
  async (u) => {                                           // Build + Review loop for ONE unit
    let round = 0, lastKeys = '', open = [], escalate = null
    while (true) {
      round++
      const tier = round >= 4 ? { model: policy.tierUp, effort: 'xhigh' } : {}
      const r = await agent(implementPrompt(run, u, open), { agentType:'implementer', isolation:'worktree',
        schema: RESULT, phase:'Build', label:`${u.id} r${round}`, ...tier })
      if (!r || r.status === 'blocked') { escalate = { to:'S4', why: r ? r.status : 'agent died' }; break }
      const reviews = await parallel(['reviewer-spec','reviewer-correctness'].map(a => () =>
        agent(reviewPrompt(run, u), { agentType:a, schema: REVIEW, phase:'Review', label:`${u.id} ${a}` })))
      const found = reviews.filter(Boolean).flatMap(x => x.findings)
      const verified = []
      for (const f of found) {                             // 2 refuters per finding; survives if <2 refute
        const votes = await parallel([0,1].map(i => () => agent(refutePrompt(u, f, i), { agentType:'finding-refuter',
          schema: VOTE, phase:'Review', label:`refute ${key(f)} #${i}` })))
        if (votes.filter(Boolean).filter(v => v.refuted).length < 2) verified.push(f)
      }
      open = verified.filter(f => ['high','critical'].includes(f.severity) || round === 1 && f.severity === 'medium')
      const nonPatch = open.find(f => f.route && f.route !== 'patch')
      if (nonPatch) { escalate = { to: nonPatch.route, finding: nonPatch }; break }   // S4 / S2 / decision
      if (!open.length) break                                                          // unit is clean
      const keys = open.map(key).sort().join('|')
      if (keys === lastKeys && round >= 4) { escalate = { to:'H3', why:'stall at top tier', open }; break }
      if (keys === lastKeys) round = Math.max(round, 3)                                // stall -> jump to tier-up
      lastKeys = keys
      if (round >= policy.maxRounds) { escalate = { to:'H3', why:'round limit', open }; break }
      if (budget.total && budget.remaining() < policy.reserve) { escalate = { to:'H3', why:'budget' }; break }
    }
    log(`${u.id}: ${escalate ? 'escalate -> ' + escalate.to : 'clean'} after ${round} round(s)`)
    return { unit: u.id, rounds: round, escalate }
  })
const clean = outcomes.filter(Boolean).filter(o => !o.escalate).map(o => o.unit)
if (clean.length) await agent(integratePrompt(run, clean), { phase:'Integrate', label:'integrate', schema: RESULT })
return { run, outcomes }                                   // the /sep skill writes loop.json rows from this
```
`sep-verdict.js` fans out `policy.panel[class]` judges with `agentType:'blind-judge', isolation:'worktree'`, each given
one lens and the pasted acceptance criteria and run command, then applies the section-5 table in plain JS (no LLM
decides the verdict), runs `finding-refuter` pairs on FAIL findings lacking executed evidence, calls `finding-router`
only for verified FAILs, and returns `verdict.json`; the skill renders `verdict-packet.md`.

Because scripts have no filesystem access, the driver skill passes file contents in via `args` and writes the
returned JSON to the run directory; agents that must write files (contractor, implementer) do so themselves.

### 11.4 Hooks (`.claude/settings.json`, deterministic; prompts are advisory, hooks are enforcement)

| Event | Matcher / condition | Script | Effect |
|-------|---------------------|--------|--------|
| PreToolUse | `Edit\|Write\|MultiEdit`, `agent_type == implementer` | guard-scope.sh | read `.separator/ACTIVE_UNIT` in cwd; deny (exit 2) if missing; deny if path ∉ `owned_files` globs of that unit or ∈ `frozen_tests` or ∈ zone `protected` |
| PreToolUse | `Edit\|Write`, `agent_type == contractor` | guard-scope.sh --tests-only | allow only paths matching zone test globs |
| PreToolUse | `Bash`, `agent_type == blind-judge` | guard-blind.sh | deny commands touching `.separator`, `.claude`, `git log/show/diff/reflog`, network tools; the judge stays blind |
| PreToolUse | `Bash` matching `git push`, `git merge`, `gh pr merge`, `rm -rf`, migrations | guard-git.sh | deny unless `.separator/runs/<run>/MERGE_APPROVED` exists (human wrote it via `/sep approve`) |
| PostToolUse | `Edit\|Write`, implementer | post-lint.sh | run the zone's `lint` command on the changed file; surface errors to the agent (exit 0 with stderr) |
| Stop | implementer (frontmatter hook) | stop-verify.sh | run `verification.command` from contract.md; on failure exit 2 with the tail of output; count in `.separator/stop-count`; at 5, exit 0 and write `IMPLEMENTER_GAVE_UP`; always honor `stop_hook_active` |
| SubagentStop | blind-judge | check-evidence.sh | if the judge's output JSON has an empty `evidence[]`, exit 2 once with "you must execute the run command before voting" |
| SessionStart | — | sep-status.sh | print the active run's stage and pending human gate so a fresh session knows what to do |
| PreCompact | — | sep-preserve.sh | inject "preserve run id, active unit, verification command" |

Guard sketch (`guard-scope.sh`):
```bash
#!/bin/bash
IN=$(cat); T=$(echo "$IN" | jq -r .agent_type); P=$(echo "$IN" | jq -r '.tool_input.file_path // ""'); CWD=$(echo "$IN" | jq -r .cwd)
[ "$T" = implementer ] || exit 0
U=$(cat "$CWD/.separator/ACTIVE_UNIT" 2>/dev/null) || { echo "write .separator/ACTIVE_UNIT first" >&2; exit 2; }
SPEC="$CLAUDE_PROJECT_DIR/.separator/runs/$(cat "$CWD/.separator/ACTIVE_RUN")/units/$U/unit.json"
echo "$P" | "$CLAUDE_PROJECT_DIR/.claude/hooks/match-globs" "$(jq -r '.owned_files[]' "$SPEC")" \
  && ! echo "$P" | "$CLAUDE_PROJECT_DIR/.claude/hooks/match-globs" "$(jq -r '.frozen_tests[]' "$SPEC")" \
  || { echo "outside unit $U write-set: $P" >&2; exit 2; }
exit 0
```

### 11.5 Skills and memory
- `/sep <request...>`: driver. Creates run dir, pastes requests into `request.md`, launches `sep-intake`; on every later
  invocation reads state and launches the next workflow or renders the pending packet. `disable-model-invocation: true`.
- `/sep-answer`: appends to `answers.md`/`rulings.md` in the required format; re-launches the blocked workflow.
- `/sep-approve <run> [unit...]`: writes `MERGE_APPROVED` (H4) or `CONTRACTS_APPROVED` (H2); digest mode approves a list.
- `/sep-escape <commit|run> "<note>"`: appends to `escapes.jsonl` (attribution via commit trailer); triggers `sep-learn`.
- `/sep-metrics`: renders `metrics.md` and the pending tuning proposals with accept/reject checkboxes.
- `CLAUDE.md` (<= 30 lines): "policy in .separator/policy.yaml; zones in zones.yaml; evidence not claims; commit
  trailers `Separator-Run`/`Separator-Unit`; do not run git push/merge yourself; questions go to questions.md".
- `.claude/rules/separator-core.md` (no paths, ~15 lines): the constitution-level invariants (tests are never deleted;
  never assume functionality is missing without a search; one unit per worktree).
- `.claude/rules/zone-<name>.md` with `paths:` frontmatter: only loaded when an agent works in that zone; written by
  zone-mapper, appended by tuner ("signs" after escapes), pruned by the 90-day rule.
- Subagent `memory: project` for reviewers and judges so recurring finding classes accumulate without bloating CLAUDE.md.

---------------------------------------------------------------------------------------------------

## 12. Top risks (honest)

1. **Escape logging is the weak link.** Every automatic rigor increase depends on the human logging post-merge defects
   with `/sep escape`. If they do not, FPY looks great, rigor drifts down, and the ledger lies. Mitigation: the tuner
   refuses to lower rigor when `escapes.jsonl` has had no entries for 60 days *and* the project has active bug reports
   (it asks "no escapes logged: true or unlogged?" at the H4 digest); CI can auto-log reverts and hotfix commits.
2. **Blind judges can be blind in the bad sense.** With no process context they may FAIL intended behavior that
   `acceptance.md` under-specifies, producing send-backs to S0 and human escalations. Mitigation: acceptance.md is
   reviewed at H1 and is the single artifact both S6 and S7 read; a false FAIL is counted against judge precision and the
   lens is rewritten. Residual: extra cost on R2/R3 during the first weeks.
3. **Misclassification at the mouth.** An R2 task classed R0 skips most of the drum; an R0 task classed R2 wastes $30 and
   an hour. Mitigation: classes can only be raised later (plan-checker, refuter, reviewers may raise); ledger reports
   "class raised after S0" as a triage-quality metric; humans see the class at H1/H4.
4. **Hook fragility.** The scope guard depends on a marker file and glob matching; the Stop hook runs the verification
   command on every stop (a 10-minute suite makes the implementer loop slow). Mitigation: contract must name a
   *fast* verification for the Stop hook and the full suite for S6/S7; hooks are tested by a `sep-selftest` skill.
5. **Human wait dominates cycle time.** If the owner is away, runs stall at H gates; batching helps but does not remove
   this. Digest mode and notifications are needed, and the metric `human wait` must be watched or the funnel looks slow
   for reasons that have nothing to do with agents.
6. **Cost on R3.** A full R3 run (5 judges, refuters, tier-ups) can be 20-50x a chat. This is intentional for
   irreversible work but will feel expensive; policy ceilings and the 80% soft stop keep it bounded, not cheap.
7. **Metric gaming by lenient gates.** FPY rises if reviewers get lazy. Only escaped defects are ground truth, and they
   lag by days or weeks. Mitigation: reviewer precision is tracked per lens; periodic "seeded defect" runs (a known bug
   injected into a unit) measure recall; the tuner is forbidden to lower rigor on FPY alone within 50 runs of a change.
8. **Zone map staleness / wrong plates.** A stale `zones.yaml` misroutes ownership and verify commands. Mitigation:
   refresh triggers (age, unmapped paths, per-zone send-back spike), and zone diffs surface in the H4 digest.
9. **Workflow-tool constraints.** No mid-run input, no filesystem access in scripts, agents can return null, 16-agent
   concurrency, budget hard ceilings. The design works with these (files as memory, one workflow per gate, resume by
   runId) but the driver skill carries real complexity and is the most likely place for bugs.
10. **Adoption cliff.** Day one requires zones.yaml, policy.yaml, hooks, thirteen agent files. Mitigation: `/sep init`
    generates all of it from the repo with conservative defaults (everything R1, panel of 2, digest on), and the first
    10 runs are "shadow mode": the funnel runs but the human merges as before, so the ledger has a baseline to compare
    cycle time and interventions against.

---------------------------------------------------------------------------------------------------

## 13. Adoption path (so the first week is faster, not slower)

Week 1: `/sep init` (zones, policy, hooks, agents), shadow mode on 10 real tasks, baseline metrics recorded.
Week 2: fast lane live (R0/R1 with digest H4); H1 batching on; measure calls per unit and human wait.
Week 3: R2/R3 with H2 contracts and 3-judge blind panels; first `sep-learn` tuning proposal reviewed.
Week 4+: rigor tuned from the ledger; rules pruned; new model release -> re-run the ceremony-creep rule and drop what
is no longer load-bearing.
