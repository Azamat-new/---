# SEPARATOR — Unified Specification (v1)

A risk-tiered funnel for AI-assisted work on large projects. Backbone: the THROUGHPUT design (lanes T0..T3,
deterministic path floors, ratchet, auto-merge to `integration`). Grafted: physical blind sandbox + neutral commits
(STATE), incremental cartography / `null` commands / three outlets / diff-hash gate / degradation ladder (UNIVERSAL),
four batched human gates / rulings / judges-must-execute / tuning ratchet / shadow mode (HUMAN), error taxonomy /
frozen tests / mutant probes / flake control / back-translation / cascade invalidation / class computed twice
(CORRECTNESS), interface-contract-first / risk-first ordering / WIP limit (ORCHESTRATOR). Every fatal flaw and
cross-cutting gap named by the judges is resolved in the section that owns it and listed in §15.
Reference implementation: Claude Code. The protocol itself is files + shell commands and runs anywhere (§13).


## 1. Problem and principles

Problem. On a large project a single chat degenerates into task -> error -> fix -> error: the human is the verification
loop, one context carries planning, coding and judging (so the judge shares every blind spot of the coder), the context
rots with each fix, nothing is written down, and the same defect is rediscovered next session. Research confirms each
part: self-review approves buggy work (agents "confidently praise" their own output); a reviewer that inherits the
author's context finds FEWER bugs than a cold one (CCR: context-aware subagent 23.8% < fresh 28.6%); more review rounds
on the same artifact add noise (+62% false positives); "after two failed corrections, /clear".

Principles (each one sentence, then why):

1. **Artifacts are the only memory.** Subagents are fresh every time and humans have no transcript; a stage that
   depends on a conversation cannot be resumed, audited, or run by another tool.
2. **Separate who writes from who tests from who reviews from who judges.** Self-grading is structurally biased;
   independence is what a second look buys.
3. **Independence is defined by what a stage is allowed to READ, and enforced physically.** Prompts are requests;
   packs, sandboxes, hooks and archives are guarantees.
4. **Rigor is priced by risk class, and the class is set by deterministic path rules an agent may only raise.**
   Ceremony on a typo is how a funnel gets abandoned; a leaky zone must not be able to talk itself into the fast lane.
5. **Every gate is objective: an exit code, a schema, a set equation or a hash.** "Looks good" is not a gate; where
   judgment is unavoidable it is a binary checklist filled by an agent that did not do the work.
6. **Evidence, never claims.** A command, its full output and exit code, freshly run; reviewers re-run, scripts
   re-verify, nothing is trusted from a report.
7. **Nothing moves back without a reproduction or a named hazard, and every reproduction becomes a permanent test
   before re-dispatch.** This is what makes loops shrink instead of cycle.
8. **Send-backs go strictly upstream, are counted, and always end at a human outlet.** The separator has three
   outlets (cream / skim / sludge); a straight line has one, so everything becomes another fix cycle.
9. **The cheapest disproof comes first.** Triage (0.2 call) kills contradictions, DAG validation (0 calls) kills
   overlapping plans, a spike (1 bounded call) kills infeasible plans before N executions and 2N reviews.
10. **Parallelize reads freely; partition writes by disjoint write-set and worktree.** Parallel writers with unshared
    implicit decisions produce inconsistent code; disjoint footprints commute.
11. **The human is ON the loop at five batched gates, never IN it.** Human attention is the scarce serial resource;
    questions carry defaults, decisions are files, the same question is never asked twice.
12. **The funnel measures itself and prunes itself.** Every stage encodes an assumption about what the model cannot
    do alone; escapes raise rigor immediately, yield lowers it slowly with approval, dead rules are deleted.
13. **Universality lives in one file.** `zones.json` is the only place language, commands and risk paths appear;
    every other artifact speaks a two-word verification vocabulary (`check`, `observation`).
14. **The harness is tested before it is trusted.** A silently disabled hook turns every "enforced" rule into a
    suggestion, so the gate refuses to run until the self-test has passed.


## 2. The separator

```
  raw text / issues / screenshots / 20 pasted one-liners / voice ("wide mouth", широкое горлышко)
        │
  ┌─────▼──────────────────────────────────────────────────────────────────────────────────────┐
  │ S0 INTAKE   triage (1 cheap call, batches N requests) + intent-checker (sees ONLY the raw    │
  │             request) → request.md, ACCEPTANCE.md, triage.json {class T0..T3, questions[]}  │──► H0 questions
  └─────┬──────────────────────────────────────────────────────────────────────────────────────┘    (batched, defaults)
        │ T0 ─────────────────────────────────────────────────────────────────────┐
  ┌─────▼──────────────────────────────────────────┐                              │
  │ S1 ZONES   zones.json lookup (0 calls if mapped)│  S1b BOOTSTRAP: zone with   │
  │            incremental cartography of the      │  test:null → characterization│──► Hz declare zone
  │            impact set only; confidence levels  │  tests for the impact set    │    (one line, batched)
  └─────┬──────────────────────────────────────────┘                              │
  ┌─────▼──────────────────────────────────────────────────────────────────────┐  │
  │ S2 DECOMPOSE  planner (read-only) → dag.json, cards, contracts; plan-auditor│  │
  │               back-translates the DAG and a code check diffs it vs ACs     │  │──► T3: design panel + H1
  └─────┬──────────────────────────────────────────────────────────────────────┘  │
  ┌─────▼──────────────────────────────────────────────────────────────────────┐  │
  │ S3 DISTRIBUTE  pure code: waves, disjoint write-sets, serialized resources,│  │
  │                cross-epic locks, model/effort/budget, one worktree per unit│  │
  └─────┬─────────────┬─────────────┬──────────────────────────────────────────┘  │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   per unit, in parallel (WIP ≤ 5 writers)  │
   │S4 SPIKE │   │S4 SPIKE │   │S4 SPIKE │   hypothesis check → FAILING acceptance test │  (T2: +contract check
   ├─────────┤   ├─────────┤   ├─────────┤                                              │   by a 2nd agent → H1)
   │S5 EXEC  │   │S5 EXEC  │   │S5 EXEC  │◄──┐ worktree, card only, frozen tests,       ◄┘
   ├─────────┤   ├─────────┤   ├─────────┤   │ Stop-hook needs evidence
   │ GATE    │   │ GATE    │   │ GATE    │   │ code: tests, lint, scope ⊆ writes, mutants, flake, secrets
   ├─────────┤   ├─────────┤   ├─────────┤   │
   │S6 INSPECT│  │S6 INSPECT│  │S6 INSPECT│──┘ fresh, context-AWARE, re-runs gates; send-back S5/S4/S2/S0
   ├─────────┤   ├─────────┤   ├─────────┤     (первые независимые ревьюеры)
   │S7 BLIND │   │S7 BLIND │   │S7 BLIND │──┐ sealed sandbox: 2 neutral commits, no plan/CLAUDE.md/history
   └────┬────┘   └────┬────┘   └────┬────┘  │ customer lens (ACCEPTANCE only) + cold lens (diff only)
        └─────────────┼─────────────┘       │ (ревьюеры без контекста); repro → block; hazard → hold
  ┌───────────────────▼────────────────────────────────────────────────────────┐  │
  │ S8 INTEGRATE + VERDICT  rebase onto integration, wave-level full gate,     │◄─┘
  │     decision table (code), T0/T1 auto-merge → integration, T2/T3 merge card│──► H2 merge card / H3 stuck
  │     integration → main promoted by the human at cadence                    │──► H4 promotion digest
  └───────────────────┬────────────────────────────────────────────────────────┘
  ┌───────────────────▼────────────────────────────────────────────────────────┐
  │ S9 LEARN  metrics.jsonl → zone floors, lessons.md (≤60 lines), rulings →   │
  │           rules, escapes (auto-detected + manual) → regression tests       │
  └────────────────────────────────────────────────────────────────────────────┘
  Outlets: cream = merge; skim = DEFER ticket (correct but out of scope, never dropped); sludge = ESCALATE (H3).
```

### 2.1 Risk classes and which stages each passes through

Class = `max(path_floor(zones.json), modifiers, triage_estimate)`, computed at S0 from the predicted footprint and
AGAIN at the mechanical gate from the actual diff; exceeding the lane limits auto-promotes and runs every skipped stage.
Modifiers: +1 per extra zone; +1 if est. LOC > 400; T2 on any public contract/schema/migration/auth/billing/infra/
serialized-resource touch; T3 on irreversible side effects, data deletion, new zone, cross-cutting refactor, or a human
flag. An agent can raise the class, never lower it below the path floor. Escapes raise a zone's floor for the next 10
tasks; 20 consecutive clean tasks lower it back to the static floor.

| Class | Definition (deterministic) | Typical share | S0 | S1 | S2 | S3 | S4 | S5 | Gate | S6 | S7 | S8 | Human |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **T0** trivial | 1 zone, ≤3 files, ≤80 lines, zone floor T0, no contract/schema/infra, 0 unknowns | ~30% | batched | lookup | skip (1 card, 0 calls) | code | skip | 1 | fast+full | skip | 1 cold lens (low) | auto → integration | none (H4 digest) |
| **T1** normal | ≤2 zones, ≤8 files, no public contract change, no irreversible effect | ~50% | 1 | lookup | if >3 files or >1 zone | code | if unknowns≠[] | 1 | full | 1 lens | customer lens (+cold if floor≥T1) | auto → integration | none (H4 digest; intent assumptions acked at H4) |
| **T2** high-risk | any risk path, >8 files, >2 zones, public API/schema, serialized resource | ~15% | 1 + premortem | + bootstrap if needed | always + auditor | code | 2 spikes (feasibility, blast radius) + contract check | 1 | full + mutants + contract tests | 2 lenses | customer + cold + cross-family if available | merge card | H1 contracts, H2 merge |
| **T3** irreversible | data deletion, external side effects, new zone, architecture, human flag | ~5% | as T2 | as T2 | design panel (3 designs, 2 judges) | code | as T2 + rollback plan | 1 | as T2 | 2 lenses | as T2 + security lens | merge card; irreversible step only after H2 | H1 design+contracts, H2 merge |

Bypass lane: the human edits directly and runs `/sep check` → class computed from the actual diff; T0 gets one cold
lens, anything else is promoted into the funnel as a unit with the human's diff as the executor's starting commit.


## 3. Stage-by-stage specification

Notation. "Must NOT have" is enforced by the pack (allow-list of files copied into the stage's directory), fresh
context, restricted tools and hooks, in that order of strength. All paths are under `.separator/epics/<epic>/` unless
noted. Every stage output is a schema-validated JSON or a card that is the ENTIRE input of a later agent.

### S0 INTAKE (wide mouth)
- Purpose: accept anything, normalize it, classify risk, extract user-visible acceptance, ask only what is worth asking.
- Who: `sep-triage` (cheap model, effort low, Read/Grep/Glob, no write tools; has repo, `zones.json`, `rulings.md`,
  `lessons.md`). Then `sep-intent-checker` (fresh; sees ONLY the verbatim `request.md`, never the triage output) writes
  its own acceptance list; code diffs the two lists by AC id and a low-effort comparator flags semantic gaps.
  Must NOT have: prior epics' transcripts, implementation ideas.
- Inputs: raw request(s), attachments. N tiny requests in one message = one triage call, N T0 cards, one epic.
- Outputs: `request.md` (verbatim, immutable, hook-protected), `ACCEPTANCE.md` (WHAT-only, EARS-style, frozen; the
  only prose allowed into the blind sandbox), `triage.json`, `questions.md` (≤5 per request, each with a recommended
  default and a one-line why), `intent-check.json`.
- Exit gate: `triage.json` validates; class assigned with ≥1 signal; `ACCEPTANCE.md` has ≥1 criterion marked
  `observable_by_user`, contains no implementation verbs (grep deny-list `refactor|extract|use a|add table|migrate|
  rename|cache`); intent-check `mismatch=false` or a question was generated; for T2+: a 3-line premortem ("this
  shipped and did not achieve the goal; most likely cause") and a "cheapest alternative" line. H0 fires only if
  `class ≥ T2 && ambiguity ≥ 0.5`, or the intent-checker mismatches, or a question has no safe default. T0/T1 record
  `assumptions[]` tagged `cosmetic|intent` and proceed; `intent` assumptions are printed on the merge card and must be
  acknowledged at H4 before `integration → main`.
- Send-back targets: none (top). A request may be killed.
- Skip: never (T0 uses the batched 1-call version).
- Failure modes → guards: wrong intent agreed by everyone (E1) → intent-checker second opinion + blind customer lens
  judged against ACCEPTANCE + cold lens intent inference; vague ACs (E2) → verb deny-list + `observable_by_user` flag;
  request-level wrongness → premortem line at T2+; amendment mid-epic → §5.6.

### S1 ZONES (zones of responsibility) and S1b BOOTSTRAP
- Purpose: a persistent MAP, not a per-task meeting. `zones.json` maps path globs to commands, risk floor, persona,
  invariants, serialized resources, confidence. Zones are the unit of responsibility AND of verification.
- Who: code lookup; `sep-cartographer` (read-only, cheap) only for unmapped paths in the impact set, and it must NOT
  see the current request's rationale (zones are request-independent). `sep-prober` (worktree) for S1b.
- Incremental cartography: a zone starts `unmapped`, becomes `inferred` (commands guessed from Makefile/package.json/
  go.mod/pyproject/pom/Cargo/csproj/CI config; churn and co-change from `git log` seed the path globs; CODEOWNERS is
  imported when present), becomes `declared` after a one-line human confirmation (Hz, batched into the H4 digest).
  Only the impact set of the current epic is mapped; a 10-year monolith ends up "1% mapped, which is enough".
- `null` is a legal command that FORCES a probe. Zone with `commands.test == null` in the impact set → S1b: the prober
  writes characterization / golden-master tests for the impact set only (budget: 1 call, ≤15 turns, ≤10 golden cases),
  commits them as `contract-tests` on a `sep/<epic>/bootstrap` branch that merges first; gate: they pass on base 3×
  (flake control). If no runnable check can be produced, verification degrades to `observation` (described step +
  evidence file) and the class is raised by one; observation-only units never auto-merge.
- Exit gate: every path in `triage.json.est_paths` maps to exactly one zone with `confidence != unmapped`; every impacted
  zone has ≥1 non-null `check` command or an S1b result; `zones.patch.json` validates; `suite_seconds` recorded.
- Send-back: S0 (request names things that do not exist).
- Skip: all paths already mapped and declared (steady state, 0 calls).
- Failure modes → guards: stale map → refresh triggers (unmapped path, zone send-back rate > 2× median, `mapped_at`
  older than N commits); "everything touches everything" → overlapping globs force serialization, never a giant unit.

### S2 DECOMPOSE (разбор задач)
- Purpose: a DAG of units small enough to be right the first time, each with a disjoint write-set and an executable
  contract, sliced vertically (thin end-to-end), risk-first.
- Who: `sep-planner` (Read/Grep/Glob only; has `lessons.md`, `rulings.md`, `zones.json`, ACCEPTANCE.md; must NOT have
  other epics' plans or any executor tool). Then BT2: `sep-plan-auditor` (fresh; sees ONLY `dag.json` + cards) rewrites
  the acceptance list the plan implies; code diffs AC ids both ways (coverage matrix); a low-effort comparator judges
  the residue. T3: three `sep-designer` agents (independent, cannot see each other) + 2 judges → `design/chosen.md` → H1.
- Outputs: `dag.json`, `units/<u>/card.md` (the executor's entire world), `units/<u>/contract.json`. A unit touching ≥2
  zones must first produce an `interface.json` (what crosses the boundary), and each zone's work is a separate unit
  depending on it. Contract-shaped units (schema, migration numbering, generated clients, lockfiles) are scheduled
  first and frozen before fan-out.
- Exit gate (code, 0 calls): acyclic; write-sets pairwise disjoint within a wave (glob intersection); each serialized
  resource in ≤1 unit per wave; each unit has ≥1 `check` (or `observation` with class raise); `est_files ≤ 8`,
  `est_lines ≤ 300`; ≤12 units per epic (else split epic); coverage matrix total both ways; `unexplained` behaviours = 0;
  hardest unit first. A failed gate re-invokes the planner ONCE with the violation list; second failure → H3.
- Send-back: S0 (contradictory or undecomposable AC → question batch).
- Skip: T0; T1 with ≤3 files and 1 zone (code synthesizes one card from `triage.json`, 0 calls).
- Failure modes → guards: gap/overlap (E3) → BT2 audit; "split it tiny" → class recomputed from actual diff; over-
  decomposition → 12-unit cap and collapse rules; ambiguity that makes parallel executors diverge → the auditor flags
  any AC whose implied behaviour differs between units.

### S3 DISTRIBUTE (распределение)
- Purpose: schedule, isolate, price. Pure code, 0 calls.
- Inputs: `dag.json`, `zones.json`, `.separator/locks.json`. Output: `schedule.json`: topological waves; per unit
  `{branch: sep/<epic>/<unit>, worktree, base_sha, model, effort, maxTurns, call_budget}` from class
  (T0 `{low, 4}`, T1 `{medium, 12}`, T2 `{high, 24}`, T3 `{high, 40}`); WIP limit = min(wave size, 5 writers, harness cap).
- Cross-epic locks: a unit whose write-set or serialized resource is locked by another in-flight epic is queued, not
  scheduled; locks are released at merge. Contract staleness: every contract records `base_sha`; before dispatching a
  later wave, if `integration` moved, the contract's RED-on-base check is re-run against the new base (seconds); a
  contract that no longer fails on base or no longer applies → S4 revise (counter `contract_revisions`).
- Exit gate: schedule validates; no wave exceeds the cap; every unit has budget. Send-back: S2 (unsatisfiable).

### S4 SPIKE (проверка гипотез) — the cheapest kill
- Purpose: before paying for execution, disprove the plan cheaply, and produce the gate: a FAILING acceptance test.
- Who: `sep-prober` (worktree, `maxTurns: 15`, effort medium; has `card.md`, `contract.json`, zone commands; must NOT
  be told to implement; spike code is thrown away, only the report and the test cross back). T2+: a second agent
  `sep-contract-checker` (fresh, read-only; sees contract + card + ACCEPTANCE, NOT the prober's reasoning) probes every
  "X exists / does not exist" claim with grep or a run and vets the contract → `contract-check.json`.
- Method: list ≤5 "what must be true" claims ranked by importance × missing evidence; resolve every new import/API/
  flag/config key against the INSTALLED artefact (hallucinated packages run at 5–20%); cheapest falsifier first
  (grep/--help/compile → 3-line script → throwaway spike); for architectural unknowns run 2–3 alternative spikes in
  parallel and let a fresh judge pick; record each resolved claim as an ADR-lite line (`decisions.md`).
- Outputs: `spike.json` {verdict feasible|infeasible|replan, hypotheses[], evidence[], risks[], rollback (T3)},
  `units/<u>/tests/acc_<u>.*` in the zone's convention.
- Exit gate: the acceptance test exists, FAILS on `base_sha` for the right reason (SubagentStop `red-proof.sh`: exit
  nonzero, no skip/only/todo markers, passes on retry-in-isolation twice → not flaky), verdict schema-valid;
  T2+: `contract-check.ok == true`.
- Send-back: S2 (infeasible/replan, with `spike.json` as evidence); S0 via question if a claim needs a human.
- Skip: T0; T1 with `unknowns == []` and zone `declared` (then the planner's contract `check` is the gate).
- Failure modes → guards: prober "just implements" → worktree discarded, only test + report kept; test passes on base →
  rejected; over-specified test (exact error text) → contract-checker; wasted spike → the test is the deliverable.

### S5 EXECUTE (выполнение)
- Purpose: make the acceptance tests and zone gates pass inside the write-set, nothing else.
- Who: `sep-executor` (`isolation: worktree`, Read/Edit/Write/Bash/Grep/Glob, `permissionMode: acceptEdits`,
  `maxTurns` by class). Context: `card.md`, `contract.json`, acceptance tests, zone persona rule, `rulings.md`, and on
  retry ONLY `defects/*.json` + previous attempt's `notes.md`. Must NOT have: chat history, other units, reviewer
  prose, the previous attempt's context (a retry is a NEW agent).
- Hooks (enforcement): PreToolUse Edit|Write → `guard-scope.sh` (unit id from `git branch --show-current`; deny paths
  outside `writes[]`, deny any frozen test (`tests/acc_*`, `tests/regress_*`, zone `test_globs` unless the card
  declares `test_writes`), deny `.separator/**` except `units/<u>/notes.md`, deny gate files); PreToolUse Bash →
  `guard-bash.sh` (deny push/merge, branch switching, `rm -rf` outside worktree, DROP/TRUNCATE, redirects into
  protected paths — best effort); PostToolUse Edit|Write → zone `fast` lint; SubagentStop → `require-evidence.sh` runs
  the FAST gate (contract checks + zone fast command), exit 2 with failing output up to 3 times (honours
  `stop_hook_active`), then allows stop with `status: fail`.
- Outputs: commits on `sep/<epic>/<unit>` with NEUTRAL messages (`<unit> change set <n>`; intent lives in the ledger,
  never in git history), `evidence.json`, `notes.md` (what the next attempt should know).
- Exit gate = MECHANICAL GATE (code, `gate.sh`, writes `gate.json` which agents cannot write): contract checks green;
  zone `full` command green; lint/build green; `git diff --name-only base..HEAD ⊆ writes[]` (authoritative; hooks are
  fast-fail); frozen-test diff empty; no new skip markers; secrets scan of the diff clean; flake control (a failing
  test re-run 2× in isolation; pass-on-retry → quarantined in ledger, not a block); mutant probes (real mutation tool if
  `commands.mutate` exists, else 3 canned mutations on changed lines: flip comparison, drop branch, return constant —
  each must make a test fail; a surviving mutant is an E6 finding with a built-in repro); test-delta review flag when
  the diff touches any test the card allowed (expected-value/tolerance/snapshot changes are listed for S6). Class is
  recomputed from the actual diff here; promotion runs the skipped stages.
- Send-back: none (target). Fail → one fresh-context retry with the gate output, then S2 with evidence.
- Skip: never for code changes.
- Failure modes → guards: fake green (E6) → frozen tests + mutants + skip-marker check; scope creep (E7) → diff ⊆
  writes; widening needed → executor writes `SCOPE-REQUEST.md` (routes to S2, never silently allowed); stuck → Stop cap.

### S6 INSPECT (независимые ревьюеры, context-aware, can send back)
- Purpose: catch "green but wrong": contract met in letter not spirit, regressions, weakened tests, missed edge cases
  the plan named, hazards. Origin-tagged send-backs so rework re-enters at the exact wrong stage.
- Who: `sep-inspector` (fresh, worktree at the unit branch, Read/Grep/Glob/Bash; `memory: project` allowed). Has
  `dag.json` slice, `card.md`, `contract.json`, `spike.json`, diff, `evidence.json`, `gate.json`, ACCEPTANCE ids,
  `rulings.md`. Must NOT have: executor transcript/reasoning, other units' diffs, previous rounds' prose (delta mode
  gets round-1 findings + the new diff only). T2/T3: two lenses (correctness/contract; blast-radius/security/data).
  Re-runs the gate itself. One pass per artifact version; told that an empty findings list is a valid, common result.
- Output: `inspect.json` {verdict pass|fix|replan|kill, findings[{sig, severity, origin, kind, repro?, hazard?, note}]}.
- Exit gate: schema-valid; a `fix` finding carries a runnable repro the inspector actually ran (`cmd, expect, got`) OR
  a `hazard` class tag (§5.3); anything else is a `note` and cannot block; ≤5 nits; round 2+ important+ only.
- Send-back: S5 (`origin: code`, repro → `tests/regress_<sig>` first), S4 (`origin: contract`), S2 (`origin:
  decomposition`), S0 (`origin: request` → question), `kill` → H3.
- Skip: T0.
- Failure modes → guards: reviewer manufactures findings → repro-or-hazard rule, nit cap; anchoring on author narrative
  → no transcript, PR prose stripped; rubber-stamping → agreement-rate metric vs blind (§11).

### S7 BLIND (ревьюеры без контекста, context-free verdict)
- Purpose: the second separator: someone who never saw the plan says whether they would ship it. Catches "everyone
  agreed on the wrong thing".
- Who: two lenses in a sealed sandbox (§7): `sep-outsider-customer` (sandbox + ACCEPTANCE.md + how to run) and
  `sep-outsider-cold` (sandbox only; must infer intent). T2+: cross-family model for one lens when configured; T3: a
  security lens. Judges must EXECUTE something: an empty `evidence[]` has vote weight 0.
- Must NOT have: plan, cards, contracts, spike, inspect, evidence.json, CLAUDE.md, `.claude/`, `.separator/`, git
  history, branch names, commit messages, PR prose, provenance ("already reviewed"), author identity.
- Output: `blind-<lens>.json` {verdict, inferred_intent (cold), per_acceptance[] (customer), findings[{sig, repro?,
  hazard?, note}], evidence[]}, `leak-check.json`.
- Exit gate: schema-valid; `block` requires a repro the judge ran in the sandbox; `hazard` findings become HOLDs;
  `leak-check` clean (§7.4); evidence non-empty (SubagentStop refuses once with "execute before voting"; second empty
  → INVALID, harness problem).
- Send-back: never directly — blind judges do not know the stages exist; `sep-router` (context-aware, read-only) maps
  each counted finding to S5/S4/S2/S0 with one sentence.
- Skip: never; T0 gets one cold lens at low effort; customer lens skipped when `run == null` and no check applies.

### S8 INTEGRATE, VERDICT and MERGE (вердикт)
- Purpose: combine the separators mechanically, integrate, decide who presses the button.
- Who: code (`decide.sh`, table §6); `sep-judge` (fresh; both verdict files + diff) ONLY on a split; human for T2/T3
  via `merge-card.md`; `sep-integrator` only to resolve textual conflicts.
- Integration: `git merge-tree --write-tree` dry-run; rebase unit onto `integration`; run each unit's contract checks +
  the repo/zone `full` command ONCE per wave (not per unit); T2+: contract tests for changed public surfaces and zone
  `invariants[]` checks; for T2/T3 epics with ≥2 units, one integrated-diff cold lens. Conflict or regression → S5
  rebase task with the conflict list, charged to `integration_rounds` (cap 2 per pair; twice on the same pair →
  units serialized into one and H3).
- Verdict record: `decision.json` with `diff_sha256 = sha256(git diff base..HEAD)`; a pre-push hook / CI recomputes
  it — code changed after the verdict invalidates the verdict (works with zero AI tooling).
- Merge: T0/T1 auto-merge to `integration` with commit trailers `Separator-Epic:` / `Separator-Unit:`; T2/T3 wait for
  H2; `integration → main` is promoted by the human at cadence (H4) with the stack of merge cards; `/sep revert <unit>`
  reverts on integration and logs an escape. Skim: correct-but-out-of-scope findings → `deferred.md` → tickets.
- Exit gate: table row resolved; rebase + full gates green; `decision.json` hash recorded; merge commit exists.

### S9 LEARN
- Purpose: make the lanes self-tuning; make the same class of error impossible to pay for twice.
- Who: code appends `metrics.jsonl` at every stage (0 calls); `sep-learner` runs once per epic only if there were
  defects, send-backs, escapes or rulings.
- Deterministic rules: escape in zone Z → `risk_floor[Z] += 1` for 10 tasks; 20 clean → −1 (min static floor);
  defect repros are already permanent tests; `lessons.md` ≤ 60 lines, ≤3 new per epic, deduped by sig, lowest-
  recurrence pruned; repeated rulings → proposed `.claude/rules/zone-*.md` lines (proposals cite ≥2 ledger entries,
  human applies); rules untouched for 90 days with no related finding → deletion candidates; ADR-lite promoted to
  `decisions.md`. Escapes are auto-detected (reverts, commits labelled fix/hotfix touching files merged by a unit in
  the last 14 days, CI red on main attributed via trailers) and supplemented by `/sep escape`.
- Exit gate: `zones.json` validates; `lessons.md` ≤ 60 lines; every escape has a regression test + a "which layer
  should have caught it" line.


## 4. Artifact contracts

```
.separator/
  zones.json            # committed. the universality file
  policy.json           # committed. caps, budgets, lane thresholds, digest cadence, strip list, hazard classes
  rulings.md            # committed, append-only. human decisions; pasted into every later stage
  decisions.md          # committed. ADR-lite lines (Context/Decision/Consequence/Revisit-when)
  lessons.md            # committed. ≤60 lines; the ONLY memory CLAUDE.md imports
  metrics.jsonl         # committed. one event per stage per unit
  escapes.jsonl         # committed. post-merge defects (auto + manual)
  locks.json            # gitignored. serialized resources / write-sets held by in-flight epics
  selftest.json         # gitignored. last harness self-test result + settings hash
  bin/                  # gate.sh decide.sh sandbox.sh pack.sh ratchet.sh checkpoint.sh selftest.sh redact.sh
  schemas/*.schema.json
  epics/<epic>/         # GITIGNORED in full (blind worktrees/archives never contain it)
    request.md  ACCEPTANCE.md  triage.json  intent-check.json  questions.md  answers.md
    design/  dag.json  coverage.json  schedule.json  state.json  MANIFEST.json  merge-cards/  deferred.md
    units/<u>/  card.md contract.json interface.json spike.json contract-check.json tests/ evidence.json
                gate.json notes.md inspect-r<n>.json defects/<sig>.json blind/ decision.json merge-card.md
    blind/<u>/  sandbox/ (archive)  pack/  manifest.json  reads.log  leak-check.json  blind-<lens>.json
```

Schemas (compact; `$schema` field on every JSON; validated by the workflow `schema` option or `sep validate`):

- **Intake card** `triage.json`: `{epic, class:"T0".."T3", signals[], zones[], est_paths[], est_files, est_lines,
  unknowns[], ambiguity:0..1, questions[{id,text,default,why}], assumptions[{text,kind:"cosmetic"|"intent"}],
  premortem?, alternative?, batch:[request_ids]}`. `ACCEPTANCE.md`: `- A1 (observable_by_user): WHEN … THE SYSTEM
  SHALL …` lines only. `intent-check.json`: `{acs_from_request[], matched[], missing[], extra[], mismatch:bool}`.
- **Zones map** `zones.json`: `{version, risk_paths[], zones:[{id, paths[], lang, owner, alternate_owner,
  commands:{setup,build,test,fast,lint,run,mutate,smoke} (null legal), test_globs[], serialized_resources[],
  invariants:[{text, check?}], persona, risk_floor:"T0".."T3", floor_override:{value,until_task_count},
  confidence:"unmapped"|"inferred"|"declared", mapped_at:sha, suite_seconds}], default:{…}}`.
- **Plan / DAG** `dag.json`: `{epic, units:[{id, title, zone(s), writes[], reads[], depends_on[], class, unknowns[],
  est_files, est_lines, serialized[], contract_first:bool, interface?:"interface.json"}]}`; `coverage.json`:
  `{ac_to_units:{A1:[u]}, units_to_ac:{u:[A1]}, missing[], unexplained[]}`.
- **Task packet** `card.md` (≤1 page): Goal (1 sentence), ACs it satisfies, Write-set, Must-NOT-touch, Interface it
  must honour, How to run `fast` and `full` gates, Rulings that apply, Retry notes (on round ≥2).
  `contract.json`: `{unit, base_sha, checks:[{id, maps_to:"A1", kind:"check"|"observation", cmd?, expect?, timeout,
  evidence_file?}], red_evidence:{cmd, exit, sha}, irreversible[], rollback?}`.
- **Hypotheses record** `spike.json`: `{verdict, hypotheses:[{claim, importance, evidence_before, test, result:
  "supported"|"refuted"|"unverifiable", output_sha}], risks[], acc_tests[], adr[]}`.
- **Handoff** `evidence.json`: `{unit, head_sha, commands:[{cmd, exit, stdout_sha, redacted:bool}], files_touched[],
  acceptance:"pass"|"fail", zone_gates:"pass"|"fail", status, attempt}` (re-verified by `gate.sh`, never trusted);
  `gate.json` (script-only): `{pass, checks:{tests,lint,build,scope,frozen,skips,secrets,flaky[],mutants:{applied,
  killed}}, class_actual, promoted:bool}`.
- **Review record** `inspect-r<n>.json`: `{unit, round, lens, verdict, findings:[{sig, severity:"blocker"|"important"
  |"minor", origin:"code"|"contract"|"decomposition"|"request", kind:"defect"|"hazard"|"note", repro?:{cmd,expect,got,
  ran:true}, hazard?:class, file, line, claim}], rerun_gate:{pass}}`; `sig = sha1(normalized cmd + expect)` or
  `sha1(file:line:claim)` for hazards.
- **Blind review record** `blind-<lens>.json`: `{lens, verdict:"PASS"|"FAIL"|"UNVERIFIABLE"` (customer) or
  `"SAFE"|"UNSAFE"|"ILLEGIBLE"` (cold)`, inferred_intent?, per_acceptance?:[{id,result,how}], findings[…as above…],
  evidence:[{cmd, exit, excerpt}], knowledge_statement}`; `manifest.json`: `{base_sha, head_sha, stripped[],
  tree_hash, launcher, canary_id}`; `leak-check.json`: `{canary_hit, forbidden_reads[], narrative_terms[]}`.
- **Verdict** `decision.json`: `{unit, row, verdict:"MERGE"|"SENDBACK"|"HOLD"|"DEFER"|"ESCALATE"|"PARTIAL",
  target?, diff_sha256, inputs:{G,S,I,Bc,Bk,M,H,K,R}, counters, human?:{gate,by,note,at}}`.
- **Decision log**: `rulings.md` (`- R<n> [epic/unit] Q: … → A: … (by, date)`); `decisions.md` ADR-lite lines;
  `state.json`: `{stage, units:{u:{stage, attempt, sendbacks:{execute,contract,decompose,intake}, integration_rounds,
  sigs_seen[], calls, merged:bool, parked?:reason}}, human_escalations, waves_done[], budget_used}`; `MANIFEST.json`:
  `{artifact: {sha, inputs:{path:sha}, stale:bool}}` (cascade invalidation, scoped to the affected subtree).
- **Metrics** `metrics.jsonl`: `{ts, epic, unit, class, zone, stage, calls, wall_ms, agent_ms, human_wait_ms, tokens?,
  verdict, sendback_to?, sig?, fpy:bool, promoted?, blind_new?:bool, agreement?:bool}`.


## 5. Loop control and escalation

### 5.1 Counters (in `state.json`, incremented by scripts, never by agents)
| Counter | Cap (T0/T1/T2/T3) | On breach |
|---|---|---|
| in-agent Stop-hook retries (executor) | 3 (below the platform cap of 8) | stop with `status: fail`, gate output attached |
| `exec_retries` (fresh executor after gate fail) | 1 | → S2 with gate output |
| `sendbacks.execute` (S6/S7 → S5 rounds) | 1 / 2 / 2 / 3 | → S2 (round 3+ at T2/T3 first tiers up model/effort with only the open findings) |
| `sendbacks.contract` (→ S4) | 0 / 1 / 2 / 2 | → S2 |
| `sendbacks.decompose` (→ S2) | 0 / 1 / 1 / 1 | → H3 |
| `sendbacks.intake` (→ S0) | 1 per epic | → H3 ("intent unstable") |
| `integration_rounds` per unit pair | 2 | serialize the pair into one unit; H3 |
| `calls` per unit | 4 / 12 / 24 / 40 | park unit (stuck card); siblings continue |
| `human_escalations` per epic | 3 | epic parked; H3 offers split/kill |
| epic lifetime / budget | policy (default 14 days, class budget) | PARTIAL verdict; nothing silently truncates; 80% soft stop finishes in-flight work only |

### 5.2 Ratchet and monotone progress
Every send-back carries `sig`. `ratchet.sh` writes the repro as `tests/regress_<sig>` (frozen) BEFORE re-dispatch,
after a flake check (fails 2× on the branch, and the fixed branch must pass it 3× before it is kept). A sig already in
`sigs_seen[]` cannot target the same stage again and escalates one level (S5 → S2 → H3). Same artifact hash after a
send-back, or the same repro failing again, is non-convergence → H3 immediately. Oscillation (A fixed reintroduces B,
each with a fresh sig) is bounded by `sendbacks.execute` plus a rule: two consecutive rounds whose finding sets are
disjoint from each other but each re-appear from a round before → stall → tier-up, then H3.

### 5.3 Three verdict strengths (resolves "no repro, no block" vs real-but-unreproducible defects)
- **block**: runnable repro the reviewer ran; costs a round; becomes a test.
- **hold**: no repro but the finding names a hazard class from `policy.hazard_classes` (auth/authz, data loss,
  migration on prod-shaped data, concurrency/race, secrets/PII, performance on a declared hot path, irreversible
  external effect). A hold raises the class to ≥T2, spawns ONE `sep-verifier` (fresh, tries to reproduce or refute),
  and if still unverified reaches a human as a HOLD row on the merge card. Unverifiable is never refuted.
- **concern**: everything else; free; routed to S9 (lessons) and, for cold-lens ILLEGIBLE, to a `legibility` note.

### 5.4 Escalation ladder is strictly upward
S7 → (router) → S5/S4/S2/S0; S6 → S5/S4/S2/S0/H3; S5 → never (reports `blocked`/`SCOPE-REQUEST`); S4 → S2/S0;
S2 → S0; S0 → human. The send-back graph over (stage, round) is a DAG. Human re-entry after H3 resets ONLY the counter
named in the resolution; a resolution that contradicts a prior ruling must explicitly supersede it in `rulings.md`.

### 5.5 What the human sees
Stuck card (`merge-cards/<unit>-stuck.md`, one screen): intent line, class, counter tripped, what was tried (rounds,
sigs), the two best options with cost, "kill" always third. Escalations are per unit; the epic verdict becomes
PARTIAL with the parked list; nothing green is re-run on resume.

### 5.6 Amendments mid-epic
A new request touching an in-flight epic enters S0 as an amendment: triage returns `merge` (adds units, marks the
affected subtree stale in MANIFEST, unmerged descendants re-plan) or `restart` (kill epic, new epic; merged T0/T1 units
stay on integration unless the AC they satisfy changed, in which case a compensating unit is added). Merged units are
never rewritten in place.


## 6. Verdict decision table (S8, `decide.sh`, evaluated top-down, first match wins; per unit)

Inputs: **G** mechanical gate pass|fail; **S** scope diff ⊆ writes yes|no; **I** inspector verdict pass|fix|replan|kill
(max confirmed severity); **Bc** customer lens PASS|FAIL|UNVERIFIABLE|skipped; **Bk** cold lens SAFE|UNSAFE|ILLEGIBLE|
skipped; **M** intent match (cold `inferred_intent` vs ACCEPTANCE, judged by `sep-judge` low effort, MATCH|MISMATCH);
**H** open HOLDs count; **K** counters; **R** integration green|conflict|regression; **L** leak-check clean|dirty;
**E** blind evidence non-empty.

| # | Condition | Action | Target / counter |
|---|---|---|---|
| 1 | any counter in K exhausted, or artifact hash unchanged after a send-back, or same repro fails again | ESCALATE | H3 stuck card; unit parked, siblings continue |
| 2 | G = fail | SENDBACK | S5 fresh retry once (`exec_retries`), then S2 |
| 3 | S = no | SENDBACK | S2 if unit shape wrong; S3 re-schedule if write-set merely too narrow (SCOPE-REQUEST) |
| 4 | class_actual > class_predicted | PROMOTE | run every skipped stage at the new class, then re-enter at row 5 |
| 5 | L = dirty or E = empty (first time) | RE-RUN S7 | rebuild sandbox / "execute before voting"; second time → INVALID → H3 (harness) |
| 6 | I = kill | ESCALATE | H3 with kill reason; epic paused |
| 7 | I = replan | SENDBACK | S2 with inspect.json; blind result discarded; `sendbacks.decompose++` |
| 8 | I = fix, origin = contract | SENDBACK | S4 (`sendbacks.contract++`), then S5 |
| 9 | I = fix, origin = request | SENDBACK | S0 question batch (`sendbacks.intake++`) |
| 10 | I = fix (code) and/or any blind block with repro | SENDBACK | ratchet → S5 with the union of defect cards (dedupe by sig); `sendbacks.execute++` |
| 11 | Bc = FAIL on an AC covered by a contract check, no repro shipped | SENDBACK | S5 (router: code); the judge's script is the repro |
| 12 | Bc = FAIL on an AC NOT covered by any contract check | SENDBACK | S4 (contract missed acceptance) |
| 13 | Bc = UNVERIFIABLE | SENDBACK | S0 (acceptance not observable) unless `run == null` was declared → row 15 |
| 14 | Bk = UNSAFE with repro | SENDBACK | S5 (row 10) |
| 15 | H > 0 (hazard hold survives one verifier) | HOLD | merge card with HOLD rows; T0/T1 raised to T2 (human merge); never auto-merges |
| 16 | Bk = ILLEGIBLE or M = MISMATCH, no other finding | DEFER-GATE | S5 "add rationale" (doc comment / ADR / test name) once; second time → H3 (design problem) |
| 17 | lenses split (T2+: one PASS, one FAIL without repro) | JUDGE | `sep-judge` decides fix|pass from both files; cannot say replan; a block with a passing repro always wins |
| 18 | R = conflict or regression | SENDBACK | S5 rebase task (`integration_rounds++`); twice on the same pair → serialize + H3 |
| 19 | I ≠ fix, Bc ∈ {PASS,skipped}, Bk ∈ {SAFE,skipped}, M = MATCH, H = 0, R = green, only minor/concern findings | MERGE + DEFER list | T0/T1 → integration (trailers); T2/T3 → merge card (H2); skim → deferred.md |
| 20 | as 19 with zero findings | MERGE | as 19 |
| 21 | T0 skipped S6, cold lens block with repro | PROMOTE | class → T1; S5 then S6 + customer lens run |
| 22 | observation-only unit (all checks `observation`) | HOLD | merge card always (never auto-merge), evidence files linked |

Conflict rules: observed behaviour (customer lens) beats description (cold lens); two contradicting passing repros
mean an ambiguous AC → row 9. Verdict prose is written by `sep-judge`; the verdict itself is never an LLM's opinion.


## 7. Blind review protocol

### 7.1 Why worktrees are not blind
A worktree shares `.git`: `git log`, reflog, `logs/HEAD`, `COMMIT_EDITMSG` and branch names expose every message and
the epic name; committed docs, README, CHANGELOG, CLAUDE.md and `.claude/` are in the tree. Blindness must be built,
not requested.

### 7.2 Sandbox construction (`sandbox.sh <epic> <unit>`)
1. `git archive <base_sha> | tar -x -C blind/<u>/sandbox` (tree only, no `.git`).
2. Strip list from `policy.strip`: `CLAUDE.md CLAUDE.local.md AGENTS.md .claude .separator .cursor .github/copilot*
   docs/decisions CHANGELOG* PULL_REQUEST_TEMPLATE* .env* **/secrets/**` plus zone `secret_globs`.
3. `git init -b main && git commit -m "base"`; `git archive <head_sha> | tar -x` (same strip) `&& git commit -m
   "change"`. Exactly two neutral commits, so `git diff base change` locates the change and `git log` leaks nothing.
4. Redact: `redact.sh` scans the diff for secrets/PII patterns (tokens, keys, emails in fixtures) and replaces them.
5. Write `manifest.json` {base_sha, head_sha, stripped[], tree_hash, launcher, canary_id}. Blindness is auditable by
   rebuilding and comparing the tree hash.
6. Pack: `pack/` holds ONLY what the lens may read outside the tree: customer lens → `ACCEPTANCE.md` (verb-grep
   clean) + `commands.json` (how to build/run/test, no zone names); cold lens → nothing. `change.patch` is inside the
   sandbox as `git diff base change`.

### 7.3 Launch
L3 primary: subagent `sep-outsider-*` with `omitClaudeMd: true`, no `memory`, frontmatter hooks: SubagentStart
`assert-sandbox.sh` (refuses unless cwd is a manifest-verified sandbox), PreToolUse Read|Grep|Glob|Bash
`guard-blind.sh` (deny any path outside the sandbox + pack; deny network tools; append every read to `reads.log`),
SubagentStop `check-evidence.sh` + `leak-scan.sh`. Cross-family lens (T2+ when configured): `claude --bare -p`,
`codex exec` or `gemini -p` from the sandbox directory with the same system prompt file and JSON schema; `manifest.
launcher` records which. Prompt prefix for every lens: "You have never seen this project. First state in two sentences
everything you know about why this change exists (knowledge_statement)."

### 7.4 Leakage canary and content sanitization
- Canary: `sep-planner` embeds a random token `SEP-CANARY-<id>` in `dag.json` and each card (never in code). The
  blind verdict, `knowledge_statement`, and `reads.log` are scanned; a hit = blindness broken → verdict discarded,
  sandbox rebuilt, harness incident logged.
- Narrative scan: the diff is grepped for the epic id, unit ids, run-dir paths, ticket numbers, and plan vocabulary
  (a small per-epic list extracted from the cards: unusual nouns, ruling ids). Hits in comments, test names, docstrings
  or README → `leak-check.narrative_terms[]`; the executor is sent a "neutralize narrative" task (free, no round
  charged) before S7 runs; code comments that describe WHAT the code does are fine, comments that describe the plan
  or reviewer history are not.
- Provenance: the judge is never told who or what wrote the code, that it passed inspection, or how many rounds it
  took (CALM refinement-aware / authority / bandwagon biases).

### 7.5 What the blind reviewer may and may not see
May: the two-commit sandbox, the diff, surrounding source, build/test/run commands, (customer lens only) ACCEPTANCE.md.
May not: plan, cards, contracts, spike, inspect, evidence.json, CLAUDE.md/AGENTS.md/.claude, `.separator`, git history,
branch names, commit messages, PR text, rulings, lessons, other units, author or model identity, prior verdicts.

### 7.6 The back-translation test
The cold lens must first write `inferred_intent` (two sentences: what this change does and why it seems to exist),
then judge SAFE/UNSAFE/ILLEGIBLE. ILLEGIBLE is itself a finding (a stranger cannot read it → latent error).
`sep-judge` (low effort) compares `inferred_intent` with ACCEPTANCE.md → MATCH/MISMATCH. MISMATCH with no other finding
= the change is confusing, the intent leaked into nothing, or the wrong thing was built; it defers the merge once for
rationale (doc comment/ADR/test name), twice → H3. The customer lens exercises every AC from ACCEPTANCE.md against
the built product (`commands.run`), or, for libraries (`run == null`), writes a 10-line program against the public
API; it reports per-AC PASS/FAIL/UNVERIFIABLE with the command it ran.

### 7.7 Diversity (resolves same-model correlation)
Diversity axes in order of strength: model family (cross-vendor lens at T2+ when configured) > evidence source (customer
lens executes, cold lens reads; the two never share a prompt) > persona/mandate (customer, cold, security) > model tier.
Nine judges from seven families collapse to ~2 effective votes, so panels are small (≤3) and votes route, they are not
truth. Agreement rate between S6 and S7 is tracked (§11): ≥95% agreement over 30 units with escapes > 0 means the
second separator is rubber-stamping → lens rewritten. A quarterly seeded-defect run (5 known bugs injected into real
units) measures recall per lens.


## 8. Parallelism and isolation rules

1. **Waves** from the DAG; barrier only between waves (real dependencies) and at fan-outs (lenses, voters). Inside a
   wave units run as a `pipeline` (no barrier between units).
2. **Worktree per writer** (`isolation: worktree`, branch `sep/<epic>/<unit>` from `base_sha`); readers (planner,
   inspector, judges) read only. Spike worktrees are discarded; only the report and the test cross back.
3. **File-set disjointness** by glob intersection within a wave; overlap → serialize (`serialize_after`), never merge
   into a giant unit. Known overlap zones (auth, shared config, API contracts, core services, migrations, lockfiles,
   generated clients) are `serialized_resources` in ≤1 unit per wave; contract-shaped units go first and are frozen
   (hook-denied) during fan-out.
4. **WIP limit**: ≤5 concurrent writers per epic (3 by default on repos with `confidence != declared` zones); reads
   and reviews may fan out to the harness cap. Two epics may run concurrently only if `locks.json` shows disjoint
   write-sets and serialized resources; otherwise the second queues at S3.
5. **Integration order**: dependency order, one unit at a time onto `integration`, `git merge-tree --write-tree`
   dry-run first, full gate once per wave after all landings, contract checks per unit; remaining branches rebased.
   `integration` is append-only; a partially merged wave is recoverable from `state.json.merged` (resume skips merged
   units, rebases the rest onto the current tip).
6. **Semantic conflicts** (green alone, red together): zone `invariants[]` with checks run at integration; contract
   tests for changed public surfaces (T2+); one integrated cold lens for multi-unit T2/T3 epics.
7. **Cross-epic contract staleness**: contracts carry `base_sha`; RED-on-base re-verified before each later wave.
8. **Suite latency budget**: Stop hook runs `fast` only; mechanical gate runs zone `full`; integration runs repo `full`
   once per wave; blind lenses run contract checks + their own probes. If `suite_seconds > policy.max_gate_seconds`
   (default 600) the zone must declare `fast` or the gate runs `full` only at integration and the class is raised by
   one (less coverage per unit = more rigor).
9. **Prompt-cache lever**: every stage of a unit pastes the same prefix (zone rule, card, contract) first.
10. **Mixed tools** on the same repo at the same time double the conflict rate; one driver per repo per epic.


## 9. Human checkpoints (exact list; everything else is unattended)

| Gate | When | What the human sees (one packet) | Options | Timeout / away rule |
|---|---|---|---|---|
| **H0** questions | after S0 only if class ≥ T2 and ambiguity ≥ 0.5, intent-checker mismatch, or a question has no safe default | `questions.md`: ≤5 per request, each with default + why; all requests of the batch in one packet | answer / `defaults` / kill | T≤1 never waits (defaults recorded as assumptions); T2+ waits; after `policy.gate_timeout_h` (72) the epic is parked, not defaulted |
| **H1** contracts / design | after S4 for T2/T3 (contracts packet, 10 lines per unit: hypothesis, what changes, check, irreversible, rollback, footprint); after the T3 design panel (`chosen.md` + scores) | packet | approve all / edit / send unit to S2 / kill | T2 contracts: `auto_approve_after_h` may be set per zone by the owner; T3 never auto-approves |
| **H2** merge card | S8 for T2/T3 units and any HOLD / observation-only unit | `merge-card.md` (§9.1) | approve / send back (reason → route, default S5) / kill | queues on integration; T0/T1 keep flowing; alternate owner from `zones.json` may approve |
| **H3** stuck card | any counter exhausted, hazard hold unverified, judge deadlock, INVALID panel, kill, budget | stuck card (§5.5) | pick option / ruling (recorded) / kill | never auto-resolved; `human_escalations ≤ 3` per epic |
| **H4** promotion digest | at cadence (daily default) | stack of merge cards since last promotion, intent assumptions to ack, HOLD/skim lists, zone declarations (Hz), tuning proposals, "no escapes logged: true or unlogged?" | promote `integration → main` / revert unit(s) / ack / apply proposal | nothing reaches `main` without it; away for 3 days = 3 days of integration, never a leak to main |

Rules: no agent has `AskUserQuestion`; a question is a line in `questions.md`; a decision is a file
(`answers.md`, `rulings.md`, `MERGE_APPROVED`); rulings are pasted into every later stage of the epic and never
re-asked; the human never reads a transcript; human wait is measured separately from agent time; notifications go
through the `Notification` hook to the channel in `policy.notify` (terminal, file, or a webhook the user configures).

### 9.1 Merge card (rendered example, one screen)
```
MERGE CARD  epic 0926-cart-discount / unit U2   class T2 (floor: billing)   integration ✔ full gate ✔ 4m12s
Intent: cart applies a percentage code at checkout; invalid codes leave the total unchanged.
ACs: A1 ✔ (customer lens ran: pnpm test -- discount; curl checkout) A2 ✔ A3 ✔
Inspector (2 lenses): pass, 1 note (naming)      Blind: customer PASS, cold SAFE, intent MATCH ("adds coupon
percentage to cart totals")      Cross-family lens: PASS (codex)
HOLD: none      Assumptions (intent): "discount applies after tax" — ruling R14 applies
Diff: 6 files, +212/−31, writes ⊆ set ✔, frozen tests untouched ✔, mutants 3/3 killed, 0 flaky, secrets clean
Rounds: 1 send-back (sig 4f2a: empty cart → 500; now tests/regress_4f2a) · calls 9/24 · agent 31m · human wait 0
Skim → deferred.md: "hard-coded 10% string in UI copy"
[approve]  [send back: ______ ]  [kill]      diff sha256 3c9e…  (any code change after this invalidates the card)
```


## 10. Cost / latency model per risk class

Units: one **call** = one fresh subagent invocation (parallelizable, ~1–3 min); one **touch** = one human intervention
(serial, 3–5 min); `h` = touch cost in call-equivalents (sensitivity 2/6/10); `L` = cost of a latent escaped defect
(T0/T1 = 6 calls + 3 touches; T2 = 20 + 8). The escape-rate inputs below (straight line `e_s = 0.30` on multi-file
work, funnel `e_f = 0.05`, T0 `0.03` vs `0.10`, first-attempt `p = 0.45`) are PRIORS consistent with published
self-approval rates (5–47%) and cross-context review gains; they are replaced by the ledger after the 10-run shadow
baseline (§11), and the model is re-run per class from measured FPY, escapes and human wait.

| Class | Path | Calls | Touches | Latent (h=6) | Total (h=6) | h=2 | h=10 |
|---|---|---|---|---|---|---|---|
| T0 | straight line | 1 | 2 | 0.10×24 = 2.4 | **15.4** | 7.2 | 23.6 |
| T0 | funnel (executor + cold lens; triage amortized 0.2) | 2.2 | 0 | 0.03×24 = 0.7 | **2.9** | 2.6 | 3.3 |
| T1 | straight line | 2 | 3 | 0.30×24 = 7.2 | **27.2** | 12.6 | 41.8 |
| T1 | funnel (triage 0.2, plan 0.3, spike 0.6, exec 1.15, inspect 1, blind 1, rounds 0.9, learn 0.1) | 5.3 | 0.3 | 0.05×24 = 1.2 | **8.3** | 6.8 | 9.7 |
| T2 | straight line | 2.5 | 4 | 0.30×68 = 20.4 | **46.9** | 22.7 | 71.1 |
| T2 | funnel (2 spikes, contract check, exec, 2 inspectors, 2–3 lenses, verifier 0.3, rounds, integrate) | 11 | 1 | 0.03×68 = 2.0 | **19.0** | 15.0 | 23.0 |
| T3 | straight line | 10+ | 10+ | high | **>100** | — | — |
| T3 | funnel (panel 6 + 4 units × T2 lane) | ~50 | 2–3 | low | **~65** | — | — |

Why net faster than a straight-line chat (mechanisms, not hopes): (1) the human leaves the loop for ~80% of tasks
(touches 3 → 0.3); (2) escape reduction (latent 7.2 → 1.2 on T1, 20 → 2 on T2); (3) parallelism the per-task table
does not count (8 independent T1 units ≈ 1–2 chain lengths vs 8 serial chains); (4) small contexts raise p(first
attempt) and cut per-call latency; (5) cheap kills before expensive stages; (6) the ratchet never pays for the same
defect twice; (7) rulings are never re-asked; (8) resume is free. Where the funnel would lose: `h → 0` and single-file
tasks with `p ≥ 0.85` — exactly the T0 lane and bypass lane, where the worst case is "a straight line plus one cheap
insurance call". Token cost is 2–4× a chat on T0–T2 (multi-agent research systems run ~15×); the user accepted tokens,
not wall-clock, as the price.


## 11. Metrics and tuning

All computed deterministically by S9 from `metrics.jsonl` and `escapes.jsonl`; windows = last 30 units of a class.

| Metric | Definition | Initial target | Diagnoses |
|---|---|---|---|
| FPY(stage) | units leaving a stage first try / entering | S4 ≥ 80%, S5 ≥ 85%, S6 ≥ 70%, S7 ≥ 90% | upstream artifact quality |
| RTY | Π FPY(S2..S7) | ≥ 40%, rising | smoothness the user feels |
| send-back matrix | back edges by (from, to, class) | no cell > 25% of stage throughput | where the funnel leaks |
| escapes / 100 merged | auto-detected + manual, by class and zone | T0/T1 ≤ 2; T2/T3 0 | ground truth; the only metric that raises rigor automatically |
| blind_escape_rate | blind important+ findings not seen by S6 / all important+ | > 0 and falling | whether the second separator earns its cost |
| S6↔S7 agreement | units where verdicts agree | < 95% while escapes > 0 | rubber-stamping / correlated models |
| reviewer precision | findings surviving verification / reported, per lens | ≥ 70% | lens below target is rewritten or dropped |
| catch-depth histogram | which stage caught each defect | skews left over time | detection moving upstream |
| fast-lane promotion rate | units promoted at the gate / fast-lane units | < 10% | classifier thresholds |
| hypothesis kill rate | spikes returning infeasible/replan / spikes | per zone; if 0 over 30 → sample S4 1-in-5 | whether S4 is load-bearing there |
| cycle time | intake → merge, split agent time vs human wait | human wait ≤ 50% | batching and gate placement |
| calls per unit, tokens per unit | by class (tokens from the workflow `budget` API, never self-reported) | T0 ≤ 3, T1 ≤ 12 | ceremony creep |
| human interventions per unit | H0+H1+H2+H3 touches / merged units | falling; H3 < 5% | on vs in the loop |
| stall / INVALID / leak incidents | per 100 rounds | < 3 / 0 / 0 | harness problems, not code problems |
| wall-clock vs baseline | per class, against the shadow-mode straight-line baseline on the same task class | funnel ≤ baseline by unit 20 | the acceleration claim, measured |

Tuning rules (S9 proposes; escapes pre-approved by policy, everything else applied at H4):
escape in class C → C's rigor +1 notch for 20 runs (add the lens that should have caught it), zone floor +1;
FPY(S7) ≥ 98% and 0 escapes over 50 → drop one lens for C (floor: T0 cold only, T1 customer, T2 two, T3 three);
S6→S5 > 25% → contracts too vague, raise contract-checker effort; S4→S2 > 20% → units too large, lower size cap;
→S0 > 10% or repeated identical H0 questions → add the question with a default to the intake checklist;
S7→S5 > 10% while FPY(S6) high → add that lens to S6 (cheaper earlier); human wait > 50% → move T1 to digest, enable
notifications; calls/unit over target → remove the stage that added calls without changing FPY; H3 > 5% → inspect
rulings for a pattern → policy; rule untouched 90 days → delete; new model release → reset clean-count windows,
re-run the seeded-defect set, re-examine every stage ("every component encodes an assumption about what the model
cannot do alone"). Ratchet: escapes turn rigor up immediately and automatically; yield turns it down slowly with
approval; the tuner may not lower rigor within 50 runs of a change or where an escape exists in the window.
Shadow mode: `/sep init` generates zones/policy/hooks/agents with conservative defaults (everything T1, digest on);
the first 10 runs produce merge cards without merging while the human works as before, so the ledger has a baseline.


## 12. Claude Code reference implementation

### 12.1 Agents (`.claude/agents/*.md`; body = complete system prompt = stage card + pack list)
| Name | tools | model / effort | key frontmatter | Role (one line) |
|---|---|---|---|---|
| sep-triage | Read, Grep, Glob | haiku-class / low | maxTurns 12 | classify by signal table, extract WHAT-ACs, ≤5 questions with defaults, batch N requests |
| sep-intent-checker | Read (request.md only, hook) | sonnet / medium | omitClaudeMd, PreToolUse deny all but request.md | independent acceptance list from the verbatim request |
| sep-cartographer | Read, Grep, Glob, Bash(git log, ls-files) | sonnet / low | maxTurns 20 | infer zones for the impact set from build files, churn, CODEOWNERS; never sees the request |
| sep-prober | Read, Edit, Write, Bash, Grep, Glob | inherit / medium | isolation worktree, maxTurns 15, Stop `red-proof.sh`, Write limited to tests/probes | spike ≤5 claims; write the FAILING acceptance test; S1b characterization tests |
| sep-contract-checker | Read, Grep, Glob, Bash(read-only) | small / medium | — | probe every factual claim in a T2+ contract; vet or reject |
| sep-planner | Read, Grep, Glob, Write(.separator/epics/**) | inherit / high | skills: sep-contract; maxTurns 30 | DAG, cards, contracts, interface-first, canary token |
| sep-plan-auditor | Read (dag + cards only) | inherit / medium | omitClaudeMd, deny request/ACCEPTANCE | back-translate the plan into the ACs it implies |
| sep-designer (T3) | Read, Grep, Glob, Write(design/) | inherit / high | maxTurns 40 | one of three independent designs |
| sep-executor | Read, Edit, Write, Bash, Grep, Glob | inherit / by class | isolation worktree, acceptEdits, maxTurns 60, hooks: PreToolUse guard-scope/guard-bash, PostToolUse lint, SubagentStop require-evidence | implement the card; evidence not claims; neutral commits; SCOPE-REQUEST instead of widening |
| sep-inspector | Read, Grep, Glob, Bash | inherit / high | isolation worktree, memory project, skills: sep-defect-card, maxTurns 25 | context-aware review; re-runs gates; repro-or-hazard; origin per finding |
| sep-verifier | Read, Grep, Glob, Bash | small / low | — | reproduce or refute ONE finding; unverifiable ≠ refuted |
| sep-outsider-customer | Read, Grep, Glob, Bash | strong (other family if configured) / high | omitClaudeMd, no memory, hooks: SubagentStart assert-sandbox, PreToolUse guard-blind, SubagentStop check-evidence+leak-scan; maxTurns 30 | run the product against ACCEPTANCE.md; per-AC verdict with commands |
| sep-outsider-cold | Read, Grep, Glob, Bash | sonnet or other family / high | same hooks | infer intent from the diff; SAFE/UNSAFE/ILLEGIBLE |
| sep-router | Read | inherit / low | — | map a counted blind finding to S5/S4/S2/S0 in one sentence |
| sep-judge | Read, Grep, Glob, Bash | inherit / high | maxTurns 15 | split votes; intent MATCH/MISMATCH; merge-card prose |
| sep-integrator | Read, Edit, Bash(git *) | inherit / medium | worktree of integration | textual conflict resolution only |
| sep-learner | Read, Write(.separator/ only) | sonnet / low | maxTurns 15 | floors, lessons, proposals citing ≥2 ledger entries, escape postmortems |
None lists `Agent` or `AskUserQuestion`; blind agents and verifiers add `disallowedTools: WebFetch, WebSearch`.

### 12.2 Workflow scripts (`.claude/workflows/`; one per human boundary; resumable by runId; no `Date.now()`; every
prompt embeds `inputs_sha` of the files it reads so a changed answer or artifact can never replay a cached result)
| Script | Orchestrates | Control flow |
|---|---|---|
| `sep-intake.js` | S0 (+S1, S1b proposal) | `parallel([triage, intent-checker])` → code diff → if questions: return `{ask}` (H0) else return `{ready, class}` |
| `sep-plan.js` | S2, S3, S4 | planner → auditor → code coverage check (loop ≤1) → waves → `parallel(units.map(spike))` → T2+ `parallel(contract-checker)` → return `{contracts-packet}` (H1) or `{ready}` |
| `sep-build.js` | S5↔S6 per unit, S7, S8 per wave | see sketch below; returns `{merged, parked, cards}`; H2/H3 material |
| `sep-learn.js` | S9 | metrics (code) → learner if anything to learn → proposals |
| `sep-fast.js` | T0/T1 with no H0 question: intake+plan+build+learn in one run | same bodies; returns `{ask}` and hands over to the driver if a question arises |
`/sep` (driver skill) reads `state.json`, launches the next script with `args:{epic, ts, answers_sha}`, writes returned
JSON to the run dir, renders packets. Scripts have no filesystem access: agents write artifacts, scripts hold
counters and branching.

```js
// sep-build.js (sketch; counters live here, never in prompts)
export const meta = { name:'sep-build', description:'execute → inspect → blind → integrate per wave',
  phases:[{title:'Execute'},{title:'Inspect'},{title:'Blind'},{title:'Integrate'}] }
const { epic, waves, caps, ts, sha } = args                      // schedule.json passed in; sha = inputs hash
const merged = [], parked = []
for (const wave of waves) {                                     // barrier only at real dependencies
  const results = await pipeline(wave, async (u) => {
    const st = { exec:0, sb:{execute:0,contract:0}, calls:0, sigs:new Set(), lastHash:null }
    let cards = []
    for (let round = 0; round <= caps.execute[u.class]; round++) {
      const ev = await agent(execPrompt(epic,u,cards,sha), {agentType:'sep-executor', schema:EVIDENCE, phase:'Execute', label:`${u.id} r${round}`, effort:effortFor(u.class)}); st.calls++
      if (!ev || ev.status!=='pass') { if (st.exec++ < 1) { round--; continue } return {u, sendback:'decompose', why:ev} }
      if (ev.diff_sha256 === st.lastHash) return {u, stuck:'no-progress'}; st.lastHash = ev.diff_sha256
      const gate = await agent(`Run .separator/bin/gate.sh ${epic} ${u.id}; return gate.json`, {agentType:'sep-verifier', schema:GATE, effort:'low'})
      if (!gate.pass) { if (st.exec++ < 1) { round--; cards = gateCards(gate); continue } return {u, sendback:'decompose', why:gate} }
      if (gate.class_actual > u.class) u = promote(u, gate.class_actual)            // class computed twice
      const ins = u.class>=1 ? await parallel(lensesFor(u.class).map(l => () => agent(inspectPrompt(epic,u,l,round,sha), {agentType:'sep-inspector', schema:INSPECT, phase:'Inspect'}))) : [{verdict:'pass',findings:[]}]
      await agent(`Run sandbox.sh ${epic} ${u.id}`, {agentType:'sep-verifier', schema:OK, effort:'low'})     // physical blindness
      const bl = await parallel(blindLensesFor(u.class).map(l => () => agent(blindPrompt(u,l), {agentType:`sep-outsider-${l}`, schema:BLIND, phase:'Blind', effort:u.class?'high':'low'})))
      const d = decide(ins.filter(Boolean), bl.filter(Boolean), st, u)               // §6 table, pure code
      if (d.action==='rerun-blind' && !st.blindRerun) { st.blindRerun = true; round--; continue }
      if (d.action==='judge') { const j = await agent(judgePrompt(u,ins,bl), {agentType:'sep-judge', schema:JUDGE}); d.merge = j.verdict==='pass'; d.cards = j.defects }
      if (d.action==='hold')  { const v = await agent(verifyPrompt(d.hazard), {agentType:'sep-verifier', schema:VERIFY}); if (!v.refuted) return {u, hold:d.hazard, card:mergeCard(u,ins,bl)} }
      if (d.merge || d.action==='merge') return {u, merge:true, card:mergeCard(u,ins,bl), defer:d.defer}
      if (d.action!=='execute' || st.sb.execute++ >= caps.execute[u.class]) return {u, sendback:d.action, why:d}
      cards = ratchet(d.cards, st)                                                    // repro → regress test, sig dedupe
      if (cards.escalate) return {u, sendback:'decompose', why:cards}
    }
    return {u, stuck:'rounds'}
  })
  for (const r of results.filter(Boolean)) r.merge ? merged.push(r) : parked.push(r)
  const integ = await agent(`Integrate ${merged.filter(m=>!m.done).map(m=>m.u.id)} onto integration (dry-run merge-tree, one at a time, full gate once); return results`, {agentType:'sep-integrator', schema:INTEG, phase:'Integrate'})
  for (const f of integ.failed) { /* row 18: rebase task, integration_rounds++, serialize+park on second failure */ }
  log(`wave done: ${merged.length} merged, ${parked.length} parked`)
  const blocked = new Set(parked.flatMap(p => descendants(waves, p.u.id)))              // park only the affected subtree
  waves.forEach(w => w.splice(0, w.length, ...w.filter(x => !blocked.has(x.id))))
}
return { merged, parked, ts }
```

### 12.3 Skills (`.claude/skills/<name>/SKILL.md`)
`sep` (driver: status board, next workflow, packets; `disable-model-invocation`), `sep-answer` (H0 answers →
`answers.md`/`rulings.md`, relaunch), `sep-approve <epic> [unit…]` (writes `MERGE_APPROVED`/`CONTRACTS_APPROVED`;
digest mode), `sep-promote` (H4: integration → main with the card stack), `sep-revert <unit>`, `sep-escape
<commit|unit> "<note>"`, `sep-check` (bypass lane: post-hoc class + cold lens on the human's diff), `sep-batch`
(N tiny requests → one epic), `sep-zones` (cartography on a path; Hz flips), `sep-metrics`, `sep-selftest`,
`sep-contract` (how to write `contract.json` checks; preloaded into planner/prober), `sep-defect-card` (repro-or-
hazard format; preloaded into inspector/outsiders/judge), `sep-blind` (`context: fork`, `agent: sep-outsider-cold`:
ad-hoc blind check on any diff, funnel or not), `sep-review` (`context: fork`, `agent: sep-inspector`).

### 12.4 Hooks (`.claude/settings.json` global; agent-scoped ones live in frontmatter)
| Event | Matcher | Script | Effect |
|---|---|---|---|
| PreToolUse | `Edit\|Write\|MultiEdit` | guard-scope.sh | unit from branch name; deny outside `writes[]`, frozen tests, gate files (`gate.json`, `state.json`, `MANIFEST.json`, `request.md`, `ACCEPTANCE.md`), `.separator/**` except the stage's own outputs |
| PreToolUse | `Bash` | guard-bash.sh | deny `git push`/merge to integration or main without `MERGE_APPROVED` (T2+) or a `decision.json` with matching diff hash (T0/T1); deny branch switching, `rm -rf` outside worktree, DROP/TRUNCATE, redirects into protected paths |
| PostToolUse | `Edit\|Write` | lint-file.sh | zone `fast` lint on the touched file; stderr to the agent |
| SessionStart | `startup\|resume\|compact\|clear` | status.sh | prints the status board (epics × stage, parked, pending cards) as additionalContext |
| PreCompact | * | checkpoint.sh | writes RESUME lines into state; "preserve epic id, unit, gate commands" |
| ConfigChange / SessionStart | * | selftest.sh (if settings hash changed) | runs the harness self-test; `gate.sh` refuses to run while `selftest.json` is missing, stale or failed |
| Notification | * | notify.sh | forwards packet-ready events to `policy.notify` |
| agent: sep-executor | SubagentStop | require-evidence.sh | fast gate; exit 2 ≤3 times; then allow stop with `status: fail` |
| agent: sep-prober | SubagentStop | red-proof.sh | acceptance test must fail on base, no skip markers, not flaky |
| agent: sep-outsider-* | SubagentStart / PreToolUse / SubagentStop | assert-sandbox.sh / guard-blind.sh / check-evidence.sh + leak-scan.sh | refuse outside a verified sandbox; deny reads outside sandbox+pack, log reads; empty evidence → exit 2 once; canary/narrative scan |
| agent: sep-intent-checker, sep-plan-auditor | PreToolUse Read | pack-only.sh | deny anything but the pack |
Self-test (`selftest.sh`, also `/sep selftest`): plants a write outside a write-set and asserts denial; runs a cold
lens on a fixture with a canary and asserts no hit and an empty `forbidden_reads`; trips a counter in a fixture state
and asserts ESCALATE; feeds an invalid artifact and asserts schema rejection; runs a Stop-hook fixture and asserts
termination at 3; verifies `bypassPermissions` is not set for funnel agents. Result → `selftest.json`.
Also shipped: `.githooks/pre-push` and a CI job `separator-gate` (recompute diff hash, validate schemas, require
`decision.json`), which are the enforcement floor for L0–L2 (§13).

### 12.5 CLAUDE.md (≤ 30 lines) and memory
`CLAUDE.md`: what the project is (3 lines); "the separator lives in `.separator/`; run `/sep`"; gate commands are in
`zones.json`; "evidence not claims"; "never write intent into commit messages"; "questions go to questions.md, never
to the user"; damping lines (no over-engineering; tests verify, they do not define; work directly for single-file
edits; no subagents for a grep); compaction line ("preserve epic id, unit, gate commands"); `@.separator/lessons.md`.
Nothing else grows. `AGENTS.md` (≤60 lines, tool-agnostic) holds the same facts; `CLAUDE.md` first line may be
`@AGENTS.md`. Zone conventions live in path-scoped `.claude/rules/zone-<name>.md` (`paths:` frontmatter), written by
the cartographer, appended by approved learner proposals, pruned by the 90-day rule. `memory: project` only on
context-aware roles (inspector, learner, cartographer); never on blind roles.

### 12.6 `.gitignore`
```
.separator/epics/        .separator/locks.json      .separator/selftest.json
.separator/**/sandbox/   .separator/**/pack/        .claude/worktrees/
```
Committed: `zones.json policy.json rulings.md decisions.md lessons.md metrics.jsonl escapes.jsonl schemas/ bin/`.


## 13. Tool-agnostic playbook (Cursor / Codex / Gemini CLI / any chat model / a human team)

The protocol is `SEPARATOR.md` (this document condensed), `schemas/`, stage cards (SKILL.md, the open Agent Skills
format), `zones.json`, and `bin/sep` (bash + jq: `new-epic | pack | validate | gate | sandbox | decide | hash |
ledger`). Independence is defined by the PACK: `sep pack S7 U-01` copies exactly the allowed files into a directory,
and any tool — or a person — is pointed at that directory. The degradation ladder keeps the same files at every level:

| Capability | L3 Claude Code | L2 Cursor / subagents, no hooks | L1 single-context CLI (`codex exec`, `gemini -p`, `claude -p`, chat) | L0 human team |
|---|---|---|---|---|
| Stage isolation | subagent + worktree + omitClaudeMd | `.cursor/agents/<role>.md` (`readonly: true` for reviewers); separate chat per stage | one headless invocation per stage reading only the pack; `/clear` between stages in chat | a different person per stage; the blind reviewer gets the zip of the sandbox, never the PR thread |
| Orchestration | workflows | orchestrator agent following SEPARATOR.md, or `sep.sh` | `sep.sh` driving the CLI stage by stage | PR template checklist |
| Enforcement | hooks + pre-push + CI | git pre-commit (`sep validate`), pre-push (diff hash), CI `separator-gate` | same | CI + branch protection; approvals by bots do not count |
| Blindness | sandbox + hooks + canary | sandbox dir + `readonly` agent + canary scan of the verdict | sandbox dir is the only input | zipped sandbox to an outside reviewer; canary in the plan |
| Memory | CLAUDE.md → @AGENTS.md; rules with paths | AGENTS.md; `.cursor/rules/*.mdc` with globs | AGENTS.md | AGENTS.md read by people |

Role prompts in prose (paste as the whole system prompt; each ends with "output must validate against
`schemas/<name>.schema.json`"):
- **Triage**: "Classify this request by the signal table only; extract WHAT the user will observe, never HOW; write at
  most five questions, each with a recommended default and one line of why; never propose an implementation."
- **Intent checker**: "You see only the user's verbatim request. List what would have to be observably true for the
  user to say 'done'. Do not read anything else."
- **Cartographer**: "From build files, CI config and git churn, infer for these paths: commands (null if unknown),
  test globs, serialized resources, risk floor. Mark confidence `inferred`. Do not invent standards."
- **Planner**: "Cut the work into units that one fresh context can finish and prove: one zone, disjoint write-sets,
  a check that is red now, hardest first, interface contracts before consumers. Confirm with code search before
  assuming anything is missing. Every decision a reviewer might re-litigate is one ADR line."
- **Prober**: "List at most five things that must be true; test the cheapest falsifier for each; resolve every new
  import, flag or API against the installed artefact; write the acceptance test and watch it fail for the right
  reason. Your code is thrown away; only the report and the test survive."
- **Executor**: "Implement exactly the card in your write-set. Tests verify, they do not define the solution; if a
  test or the card is wrong, stop and say so instead of working around it. Commit with neutral messages. Show the
  commands you ran and their output; assertions are not evidence."
- **Inspector**: "Fresh eyes; you have the contract, the diff and the evidence, not the author's reasoning. Re-run
  the gates. Report only what affects correctness or the stated requirements; every blocking finding carries a
  reproduction you ran, or names a hazard class; cite file:line; at most five nits; an empty list is a valid and
  common result; a ruling overrides your judgment — report a conflict, do not re-litigate."
- **Customer lens**: "You are inspecting a delivered product against its acceptance list. You know nothing about
  how it was built. Run it, test each criterion, report PASS/FAIL/UNVERIFIABLE per criterion with the command you
  ran. First state everything you know about why this change exists."
- **Cold lens**: "You are handed a change with no explanation. First write two sentences: what it does and why it
  seems to exist. Then: is it SAFE, UNSAFE (point to file:line and demonstrate), or ILLEGIBLE (you cannot tell)?"
- **Judge** (split votes only): "Two independent verdicts disagree; read both files and the diff; a demonstrated
  failure beats an opinion; you may say fix or pass, never replan."
- **Human at H2/H4**: read the card, not the transcript; approve, send back with a reason, or kill; a veto after
  auto-merge is `revert` plus an escape line, never a silent fix on main.

Day-one adoption (nothing thrown away later): copy `SEPARATOR.md schemas/ stages/ bin/sep`; `sep zones init` (one
`inferred` zone from build files); add `AGENTS.md` (+ `CLAUDE.md: @AGENTS.md`), the pre-push hash check and the CI
gate; run the fast lane in shadow mode for ten tasks; declare zones as they are touched; switch on the Claude Code
layer (agents, workflows, hooks) when you want speed and enforcement.


## 14. Glossary EN / RU

| EN | RU (user's words where they exist) | Meaning here |
|---|---|---|
| Separator / funnel | сепаратор / воронка | the whole workflow: wide intake, narrowing filters, two independent separators, three outlets |
| Wide mouth (S0 Intake) | широкое горлышко / приём | anything goes in; triage classifies; questions batched with defaults |
| Zones of responsibility (S1) | зоны ответственности | path globs → commands, risk floor, persona, serialized resources; the universality file |
| Bootstrap (S1b) | подготовка зоны без тестов | characterization / golden-master tests for a `test: null` zone before the funnel runs there |
| Decompose / task breakdown (S2) | разбор задач / декомпозиция | DAG of units with disjoint write-sets and executable contracts |
| Distribute (S3) | распределение | waves, worktrees, budgets, locks; pure code |
| Hypothesis check / spike (S4) | проверка гипотез / спайк | cheapest falsification before code; deliverable = a failing acceptance test |
| Execute (S5) | выполнение | one executor, one unit, one worktree, evidence not claims |
| Mechanical gate | механический шлюз | script-only checks: tests, lint, scope, frozen tests, mutants, flake, secrets |
| Independent reviewers (S6 Inspect) | независимые ревьюеры (с контекстом) | fresh context, know the plan, re-run gates, can send back to S5/S4/S2/S0 |
| Context-free reviewers (S7 Blind) | ревьюеры без контекста / со стороны | sealed sandbox, never saw the plan; customer lens + cold lens; back-translation test |
| Verdict (S8) | вердикт | decision table in code; merge / send back / hold / defer / escalate |
| Learn (S9) | обучение / уроки | metrics, floors, lessons, escapes → tests |
| Risk class T0–T3 | класс риска | deterministic floor from paths; agent may only raise |
| Fast lane / full lane | быстрая / полная дорожка | which stages run |
| Send-back | возврат (на предыдущий этап) | strictly upstream, counted, with repro or hazard |
| Ratchet | храповик | every repro becomes a permanent test before re-dispatch; the failure space only shrinks |
| Hold | удержание | unreproducible hazard-class finding that must reach a human |
| Cream / skim / sludge | сливки / обрат / осадок | merge / deferred ticket / escalation |
| Merge card / stuck card | карточка слияния / карточка тупика | one-screen human packets |
| Ruling | решение человека (прецедент) | written once, pasted into every later stage, never re-asked |
| Escape | утечка дефекта | defect found after merge; the only ground truth; raises rigor automatically |
| Integration / main promotion | ветка интеграции / продвижение в main | T0/T1 auto-merge to integration; human promotes to main at cadence (H4) |
| Canary | канарейка | plan-only token whose absence in the blind verdict proves blindness |


## 15. Resolved flaws (traceability) and open decisions left to the user

Resolved (judges' fatal flaws and cross-cutting gaps → section): blindness prompt-only / worktree leaks / no canary /
narrative in diff → §7; no test-tamper guard, weakened assertions, fake green → §3 S5 gate (frozen tests, mutants,
skip markers, test-delta flag); no-test legacy repos → §3 S1b + `null` commands + observation with class raise;
rebase loop uncounted / integration ping-pong → §5.1 `integration_rounds`, §8.5; invented cost inputs → §10 priors +
§11 shadow baseline; T1 intent assumptions unseen before merge → §3 S0 (`intent` assumptions acked at H4, nothing
reaches main without H4) + intent-checker; "no repro, no block" discarding real hazards → §5.3 holds; flaky repro
ratcheted into a permanent flaky test → §5.2 flake checks; single-script resume replaying stale results → §12.2
(scripts per boundary, `inputs_sha` in prompts); no human ever confirms intent on T0/T1 → §3 S0 second opinion +
§7.6 back-translation; fragile `agent_type`/marker hooks → §12.4 (unit from branch name, agent-scoped frontmatter
hooks, self-test); decompose send-back stranding later waves → §12.2 (park only the affected subtree, scoped cascade);
same-model correlation → §7.7; full-suite latency → §8.8 fast/full split; requirement changes mid-epic → §5.6;
cross-epic contention / stale contracts → §3 S3 locks + RED re-check; AC correctness single point of failure → intent
checker + verb deny-list + premortem + customer lens + cold intent; human availability → §9 timeouts, alternates,
digest, nothing to main unattended; harness never self-tested → §12.4 selftest + gate refusal; secrets/PII → §7.2
redaction, strip list, gate secret scan; batching tiny requests → `/sep batch`; verification without a runnable
product → `run: null` library mode / check-only, first env failure auto-declares `run: null` once; semantic
integration conflicts → §8.6 invariants + contract tests + integrated cold lens; harness integrity → gate files
script-only, diff hash, manifest, canary; measured acceleration → §11 wall-clock vs baseline, tokens from the budget
API; escape detection without a diligent human → §3 S9 auto-detection; dry-run calibration and re-baseline on model
change → §11; loop prevention across human re-entries → §5.1 `human_escalations`, §5.4 counter reset + ruling
supersession; status view and rendered cards → §9.1, `status.sh`; veto/revert after auto-merge → `/sep revert`.

Open decisions deliberately left to the user (few):
1. **H4 cadence and channel** — daily digest is the default; the promotion `integration → main` could instead be
   per epic; and where notifications go (terminal file, webhook, chat) is `policy.notify`.
2. **Cross-family lens availability** — whether a second vendor CLI (`codex exec` / `gemini -p`) is installed for T2+;
   without it the funnel uses tier + evidence-source diversity and tracks the agreement rate.
3. **T0 blind lens after proof** — policy allows dropping the T0 cold lens after 50 clean T0 units with 0 escapes;
   the user decides whether "as error-free as possible" outranks 1 call per T0 task.
4. **Auto-approval of T2 contracts (H1) per zone** — zone owners may set `auto_approve_after_h`; default off.
5. **Hazard class list** — the default seven classes (§5.3) should be edited for the project (e.g. add "billing
   rounding" or "GDPR export"); this list is the only place where an unreproducible finding can force a human touch.
