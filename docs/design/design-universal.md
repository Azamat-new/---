# SEPARATOR — a universality-first funnel workflow for AI-assisted work on large codebases

Design angle: **works anywhere**. Any language, any repo size (greenfield to 10-year monolith), any driver
(Claude Code, Cursor, Codex/Gemini CLI, a human team). The workflow is defined as *artifact contracts on
disk* (Markdown + JSON) and *stage cards* (SKILL.md, the open Agent Skills format). Tool features
(subagents, hooks, worktrees, workflow scripts) only make the same protocol faster and harder to violate;
they never define it. Independence of reviewers is achieved by **what they are allowed to read**, not by
which product runs them.

Sources used: the research notes in `scratchpad/research/` (Anthropic engineering posts, Claude Code docs)
plus three lookups: AGENTS.md (agents.md, Linux Foundation AAIF, read natively by Codex/Cursor/Copilot/
Gemini CLI/Aider/Windsurf/Zed; Claude Code via `@AGENTS.md` import), Cursor `.cursor/agents/*.md`
subagents (frontmatter `name, description, model, readonly, is_background`), Agent Skills
(agentskills.io; SKILL.md supported by 27+ tools).

---------------------------------------------------------------------------------------------------

## 0. The four invariants (everything else is derived)

| # | Invariant | Why it exists |
|---|-----------|---------------|
| I1 | **Artifacts are the only memory.** Every stage reads named files and writes named files under `.separator/runs/<run>/`. No stage depends on a transcript. | Subagents get a fresh context each time; humans and other tools have no transcript at all. |
| I2 | **Every stage has an input allow-list and a deny-list ("pack").** Independence = fresh context + pack. | This is how "context-free" and "context-aware" reviewers are made real in any tool, including a human. |
| I3 | **Verification is a declared command with an exit code, owned by a zone, or a described observation with an evidence file.** The funnel never assumes a language. | Universality across languages/legacy; `null` is a legal value and forces a probe. |
| I4 | **Every send-back goes strictly backwards, is counted, and has a terminal outlet (escalate to human).** | No infinite cycles; the separator has a sludge outlet, not just a cream outlet. |

---------------------------------------------------------------------------------------------------

## 1. The separator (diagram)

```
                     ┌──────────────────────────────────────────────────────┐
   raw request  ───► │ S0 INTAKE (wide mouth) – interview, normalize, LANE  │ ◄── H0/H1 human
                     └───────────────┬──────────────────────────────────────┘
                                     │ request.json  lane.json
                     ┌───────────────▼──────────────────────────────────────┐
                     │ S1 ZONES – incremental cartography, impact set       │
                     └───────────────┬──────────────────────────────────────┘
                                     │ zones.json(+patch)  impact.json
                     ┌───────────────▼──────────────────────────────────────┐
                     │ S2 DECOMPOSE – units, DAG, disjoint write sets       │
                     └───────────────┬──────────────────────────────────────┘
                                     │ units.json
                     ┌───────────────▼──────────────────────────────────────┐
                     │ S3 DISTRIBUTE – profile, model, budget, isolation    │
                     └───────────────┬──────────────────────────────────────┘
                                     │ assignments.json
   ╔═════════════════════════════════▼═══════════════════════════════════════╗  per unit, in parallel
   ║ S4 HYPOTHESIS – claim/probe/observed → contract (RED check)  ◄─────┐   ║ ◄── H2 (deep lane)
   ║        contract-check by a different agent                         │   ║
   ╠══════════════════════════════════╤════════════════════════════════╪═══╣
   ║ S5 EXECUTE – one unit, own worktree, evidence, commit  ◄───────┐   │   ║
   ╠══════════════════════════════════╤═════════════════════════════╪═══╪═══╣
   ║ S6 REVIEW (context-aware, independent) – findings ─► verify ───┴───┘   ║   send-backs:
   ║        pack: contract + diff + zone rules + evidence.  NOT transcript   ║   S5, S4, S2, S0
   ╠══════════════════════════════════╤═════════════════════════════════════╣
   ║ S7 BLIND VERDICT (context-free) – parallel lenses on a sealed pack      ║
   ║        customer lens: acceptance + diff + commands ; cold lens: diff    ║
   ║        NO plan, NO contract rationale, NO reviews, NO CLAUDE.md         ║
   ╚══════════════════════════════════╤═════════════════════════════════════╝
                                      │ verdict cards
                     ┌────────────────▼─────────────────────────────────────┐
                     │ S8 DECIDE – deterministic decision table             │ ◄── H3 human (always)
                     │   cream ─► MERGE   skim ─► DEFER   sludge ─► ESCALATE│
                     └────────────────┬─────────────────────────────────────┘
                                      │ decision.json (diff hash)  escalation.md
                     ┌────────────────▼─────────────────────────────────────┐
                     │ S9 LEARN – ledger, recurring finding → rule/hook/skip│
                     └──────────────────────────────────────────────────────┘
```

The three outlets are the point of a separator: **cream** (merge), **skim** (correct but out of scope →
deferred ticket, never silently dropped), **sludge** (cannot converge → human, with the full evidence
trail). A straight line has only one outlet, so everything that does not fit becomes another fix cycle.

---------------------------------------------------------------------------------------------------

## 2. Lanes (the router at the mouth)

The mouth is wide; the pipe is not the same width for everything. `lane.json` is produced at S0 and
decides which stages run in full, reduced, or are skipped. Skipping is *declared*, so a skipped stage is
still visible in the run directory as `SKIPPED(reason)`.

| Lane | Trigger (all must hold) | What runs |
|------|-------------------------|-----------|
| **fast** | 1 zone, zone has a declared `test` command, est. ≤ 3 files, no `risk:high` zone, no path in `risk_paths` (auth, payments, migrations, schema, crypto, infra, public API), user can state acceptance in one sentence | S0(short) → S4(contract only, no probe) → S5 → S6(1 reviewer, correctness only) → S7(customer lens only) → S8 → S9. S1/S2/S3 collapse to one implicit unit. Cost: straight line + 2 read-only agent calls. |
| **standard** | default | all stages; S4 probe required only for units touching `inferred`/`unmapped` zones or `risk:high`; S7 both lenses |
| **deep** | any of: ≥3 zones, `risk:high`, cross-cutting refactor, unmapped zone in a legacy area, user says "critical", prior run for the same area ended in ESCALATE | all stages; S4 mandatory probe with RED check per unit; S4 gets human checkpoint H2; S7 3+ lenses incl. a second model or vendor when available; S6 two reviewers with distinct lenses |

The router is a small agent (or a human, or a `jq` script over `impact.json`); its output is a JSON
object with a `reason[]`, and the ledger (S9) tracks the **fast-lane failure rate**. If fast-lane units
get sent back more than 10% of the time, the router's thresholds tighten automatically (a rule in
`SEPARATOR.md`, applied by the S9 scribe).

---------------------------------------------------------------------------------------------------

## 3. Zones: the universality mechanism

A zone is the unit of responsibility **and** the unit of verification. The funnel never asks "what
language is this"; it asks the zone what commands prove it works.

`.separator/zones.json` (incrementally built; committed):

```json
{ "version": 1,
  "risk_paths": ["**/auth/**", "**/migrations/**", "**/*.sql", "**/payments/**", "infra/**", "**/openapi*.y*ml"],
  "zones": [
    { "id": "api",  "paths": ["services/api/**"], "lang": "go", "owner": "@backend",
      "commands": { "setup": "make deps", "build": "go build ./...", "test": "go test ./services/api/...",
                    "lint": "golangci-lint run ./services/api/...", "smoke": null },
      "rules": ["services/api/CONVENTIONS.md"], "risk": "high",
      "confidence": "declared", "mapped_at": "a1b2c3d" },
    { "id": "legacy-billing", "paths": ["src/billing/**"], "lang": "php", "owner": null,
      "commands": { "setup": null, "build": null, "test": null, "lint": null, "smoke": "scripts/smoke-billing.sh" },
      "rules": [], "risk": "high", "confidence": "inferred", "mapped_at": "a1b2c3d",
      "notes": "no unit tests; characterization tests must be written by the prober before change" }
  ],
  "default": { "commands": { "build": null, "test": null, "lint": null, "smoke": null }, "risk": "unknown", "confidence": "unmapped" } }
```

Rules that make this work on any repo:

* **Incremental cartography.** Nobody maps a 10-year monolith up front. S1 maps only the zones in the
  impact set of the current request; a zone starts `unmapped`, becomes `inferred` (commands guessed from
  `Makefile`, `package.json`, `go.mod`, `pyproject.toml`, `pom.xml`, `Cargo.toml`, `*.csproj`, CI
  config), and becomes `declared` once a human confirms it (a one-line edit). Confidence changes what
  S4 must do: `inferred`/`unmapped` ⇒ probe mandatory.
* **`null` is legal, not silent.** A `null` `test` command means S4 must produce a check some other
  way: a characterization test, a golden-master snapshot, a smoke script, or a described manual
  observation with an evidence file. The funnel degrades gracefully but never pretends.
* **Verification vocabulary is two words:** `check` (a command; pass = exit 0) and `observation`
  (a described step whose result is captured into `evidence/`). Every contract and every review speaks
  only these two words. That is what makes a Go service, a PHP monolith, a data pipeline, a CLI, and a
  Figma-driven frontend all reviewable by the same stage cards.
* **Write sets are path globs.** Disjointness of units is checked by glob intersection, which every
  tool can compute. Overlap ⇒ units are serialized (not parallel), never merged into one giant unit.

---------------------------------------------------------------------------------------------------

## 4. Stage table

Notation: `who` = role card; **NOT** = what its pack must exclude. Files are under
`.separator/runs/<run>/`. Exit gates are objective (a script can check them, and `sep validate` does).

| id | Stage | Purpose | Who / context | Inputs | Outputs | Exit gate (objective) | Send-back targets | Skipped when |
|----|-------|---------|---------------|--------|---------|-----------------------|-------------------|--------------|
| S0 | INTAKE | Turn a vague request into observable acceptance + constraints + lane. The only conversational stage. | `sep-intake` (interactive, main session or a human). Has: repo, user. NOT: nothing to hide yet. | user text, `zones.json`, `ledger.jsonl` (last 20 entries for this area) | `00-intake/request.md` (raw + Q&A), `request.json`, `lane.json` | `request.json` validates against schema; ≥1 `acceptance[]` item marked `observable_by_user: true`; `non_goals[]` non-empty or explicitly `[]` with reason; lane has `reason[]` | — (it is the beginning) | never (fast lane: 3 fixed questions max) |
| S1 | ZONES | Compute impact set; map unmapped zones incrementally; assign zone owners. | `sep-cartographer` (read-only, cheap model). NOT: request rationale beyond the impact keywords. | `request.json`, `zones.json`, repo | `01-zones/impact.json`, `zones.patch.json` | every path in impact maps to a zone; every impacted zone has `confidence != unmapped`; patch validates | S0 (request names things that do not exist) | fast lane (single zone already declared) |
| S2 | DECOMPOSE | Split into units with disjoint write sets, a DAG, and per-unit done-criteria in check/observation vocabulary. | `sep-planner` (read-only + write to `.separator/`). NOT: implementation code from prior runs' transcripts. | `request.json`, `impact.json`, `zones.json` | `02-plan/units.json`, `dag.json` | write-set globs pairwise disjoint or `serialize_after` set; DAG acyclic; each unit ≤ 1 zone with `risk:high`; each unit has ≥1 `done[]` item that maps to a zone check or observation | S0 (acceptance not decomposable), S1 (impact wrong) | fast lane |
| S3 | DISTRIBUTE | Assign each unit a worker profile, model tier, budget, isolation, and order. | `sep-dispatcher` (or the workflow script itself — deterministic). NOT: none needed. | `units.json`, `dag.json`, `lane.json`, `zones.json` | `03-assign/assignments.json` | every unit has `profile`, `model`, `budget.max_turns`, `isolation`, `order`; total budget ≤ lane cap | S2 (unit too large for any profile: > N files or > 1 risk zone) | fast lane |
| S4 | HYPOTHESIS | Before code: state what must be true, probe it, and sign a contract with a check that is currently RED. | `sep-prober` (scratch worktree, may run anything, all edits discarded) then `sep-contract-checker` (**different** agent; gets `request.json`, unit, `contract.md`; NOT `hypothesis.md` reasoning, NOT the prober's transcript). | unit, `request.json`, zone commands | `04-hypothesis/<U>/hypothesis.md`, `probe.log`, `contract.md`, `contract-check.json` | contract has `done[]` each with `check` or `observation`; `red_evidence` (the check fails now) or `red_waiver` with reason; `contract-check.json: {ok:true}`; all hypotheses have `observed` filled | S2 (unit is wrong shape), S0 (acceptance ambiguous — via `ask-human` probe) | fast lane: probe skipped, contract still required; any lane: probe skipped when zone is `declared`, `risk != high`, and unit touches ≤ 2 files |
| S5 | EXECUTE | Implement exactly the contract, one unit, in isolation, with evidence. | `sep-worker` (worktree; full tools; edits restricted to write set by hook). Has: contract, zone rules, unit. NOT: reviews of other units, other workers' diffs, `ledger.jsonl`. | `contract.md`, unit, `zones.json` rules | `05-exec/<U>/report.json`, `evidence/*.log`, `diff.patch`, commit(s) on unit branch | contract `check`s exit 0 (GREEN) with captured output; zone `build`/`lint`/`test` exit 0 or declared `null`; diff touches only write set; `report.json` lists evidence files that exist; no test files deleted/skipped (`git diff --diff-filter=D` on test paths = empty) | — (workers do not send back; they write `blocked.md` and stop) | never |
| S6 | REVIEW (context-aware, independent) | Find correctness gaps against the contract; classify each finding's *origin* so the send-back is precise. Then a verifier tries to refute each finding. | `sep-reviewer` (fresh context; read-only + Bash for checks). Pack: contract, diff, zone rules, evidence, `request.json` acceptance. **NOT**: worker transcript, `hypothesis.md`, other reviews, prior rounds' rationale. Then `sep-verifier` (fresh; gets findings + diff only). | pack | `06-review/<U>/review-r<N>.json`, `verify-r<N>.json` | every finding has `severity ∈ {blocker, important, minor}`, `file:line`, `origin ∈ {code, contract, decomposition, request}`, `fingerprint`; verifier marks each `confirmed/refuted/unverifiable`; round exits when `confirmed & severity ≥ important` is empty | S5 (origin=code), S4 (origin=contract), S2 (origin=decomposition), S0 (origin=request) | never; round 2+ runs in *delta mode* (important+ only, nits suppressed) |
| S7 | BLIND VERDICT (context-free) | Judge the result as an outsider would: does it do what the user asked, and is the code safe and legible on its own? | Parallel lenses, each fresh, `omitClaudeMd`, deny-listed from `.separator/**` except its sealed pack. **customer lens**: `acceptance.md` + diff + zone commands + a runnable checkout. **cold lens**: diff **only** (+ surrounding source, read-only) — must *infer* intent. **NOT** for either: plan, contract rationale, hypothesis, reviews, transcripts, memory files, git log. | sealed pack `07-blind/<U>/pack/` | `07-blind/<U>/blind-customer.json`, `blind-cold.json`, `blind-summary.json` | each lens returns a verdict enum + evidence paths; cold lens returns `inferred_intent` (1–2 sentences); `blind-summary.json` computed by script: `intent_match` = LLM/human compare of `inferred_intent` vs acceptance | none directly — blind lenses only return verdict + evidence; S8 translates | fast lane: cold lens skipped |
| S8 | DECIDE | Apply the decision table; produce merge decision with the diff hash; route send-backs; write escalations. | deterministic script (`sep decide`, jq/node); agent fallback if no script runtime. Human H3 reads the verdict card. | all gate files | `08-decide/decision.json` (`verdict`, `diff_sha256`, `sendbacks[]`, `counters`), `escalation.md` if any | `decision.json` validates; `verdict ∈ {MERGE, SENDBACK, DEFER, ESCALATE, PARTIAL}`; if MERGE then all rows of the table are green and H3 approval recorded | as computed by the table (S5/S4/S2/S0) | never |
| S9 | LEARN | Append to the ledger; turn recurrences into rules, hooks, or skips; prune the harness. | `sep-scribe` (cheap model). Has: run dir, `ledger.jsonl`. NOT: nothing sensitive. | run dir | `ledger.jsonl` (append), `09-learn/proposals.md` (rule/hook/skip proposals, never auto-applied to `CLAUDE.md`) | ledger line validates; proposals reference ≥2 ledger entries with same fingerprint or explicitly say "none" | — | never (fast lane: ledger only) |

---------------------------------------------------------------------------------------------------

## 5. Artifact contracts (schemas; tool-agnostic)

All JSON files have `"$schema"` pointing to `.separator/schemas/<name>.schema.json`. Agents that support a
`schema` option (Claude Code workflows, `claude -p --json-schema`, Cursor structured output) enforce it
at generation time; everyone else gets `sep validate <run>` (a 40-line node/python script using
ajv/jsonschema) which is also the CI gate.

**`request.json`**
```json
{ "run": "2026-09-26-cart-discount-a1b2c3d", "title": "Apply percentage discounts in cart",
  "goal": "…one paragraph in the user's words…",
  "acceptance": [ { "id": "A1", "text": "Adding code SAVE10 to a cart of 100.00 shows 90.00 total", "observable_by_user": true },
                  { "id": "A2", "text": "Invalid code shows an error and total is unchanged", "observable_by_user": true } ],
  "non_goals": ["stacking multiple codes"], "constraints": ["no schema migration"],
  "risk_flags": ["payments"], "estimated_files": 6, "requester": "maksat" }
```
**`units.json`** — `[{ "id":"U-01", "zone":"api", "title":…, "write_set":["services/api/cart/**"], "read_hints":[…],
"depends_on":[], "done":[{"id":"D1","maps_to":"A1","kind":"check|observation","spec":"go test ./services/api/cart/ -run TestDiscount"}] }]`
**`contract.md`** (human-readable, with a fenced `json` block the validator parses):
```
# Contract U-01
Done when:
- D1 (A1): check `go test ./services/api/cart/ -run TestDiscountPercent` — RED now: see probe.log#L40 (test written by prober, fails: function missing)
- D2 (A2): check `go test ./services/api/cart/ -run TestDiscountInvalid` — RED now
- D3: observation — "smoke-billing.sh prints 'OK'" evidence: evidence/smoke.txt   (legacy-billing zone has test=null)
Out of scope: stacking, UI copy.
Hypotheses relied on: H1 (cart totals computed in one place: cart/total.go:88) — observed TRUE via probe.
```
**`review-rN.json`** — `{ "round":1, "findings":[{ "id":"F1", "severity":"important", "file":"services/api/cart/total.go", "line":102,
"claim":"discount applied before tax, acceptance A1 implies after", "origin":"contract", "fingerprint":"total.go:discount-order",
"evidence":"…", "fix_hint":"…" }], "tally":{"blocker":0,"important":1,"minor":2} }`
**`blind-customer.json`** — `{ "verdict":"PASS|FAIL|UNVERIFIABLE", "per_acceptance":[{"id":"A1","result":"PASS","how":"ran go test …; also curl …","evidence":"…"}], "notes":[] }`
**`blind-cold.json`** — `{ "verdict":"SAFE|UNSAFE|ILLEGIBLE", "inferred_intent":"Adds percentage coupon support to cart totals", "concerns":[{"file":…,"line":…,"claim":…,"severity":…}] }`
**`decision.json`** — `{ "verdict":"MERGE", "diff_sha256":"…", "rows":{"C":"PASS","K":"GREEN","R":"minor","Bc":"PASS","Bk":"SAFE","M":"MATCH","S":"yes"},
"counters":{"exec_attempts":1,"review_rounds":1,"contract_revisions":0,"sendbacks":0}, "human":{"H3":"approved","by":"maksat","note":""} }`

---------------------------------------------------------------------------------------------------

## 6. Verdict decision table (S8; deterministic, evaluated top-down, first match wins)

Inputs per unit: **C** zone checks (build/lint/test) `PASS|FAIL|NONE`; **K** contract checks `GREEN|RED|WAIVED`;
**S** scope (diff ⊆ write set) `yes|no`; **R** max *confirmed* S6 severity `none|minor|important|blocker`;
**Bc** customer lens; **Bk** cold lens; **M** intent match `MATCH|MISMATCH`; counters from §7.

| # | Condition | Verdict | Send-back → | Note |
|---|-----------|---------|-------------|------|
| 1 | any counter exhausted, or diff hash unchanged after an exec attempt | **ESCALATE** | human (`escalation.md`) | sludge outlet; other units continue |
| 2 | S = no | SENDBACK | S3 if write set merely too narrow; S2 if unit shape wrong | never "just widen it" silently |
| 3 | C = FAIL or K = RED | SENDBACK | S5 | `exec_attempts++` |
| 4 | R = blocker (confirmed) | SENDBACK | by finding `origin`: code→S5, contract→S4, decomposition→S2, request→S0 | `review_rounds++` |
| 5 | R = important and same `fingerprint` seen in a previous round | **ESCALATE** | human | "same finding twice" rule |
| 6 | R = important | SENDBACK | by `origin` (as row 4) | round 2 runs delta mode |
| 7 | Bc = FAIL and the failing acceptance id is covered by a contract `done` item | SENDBACK | S5 | code wrong, contract fine |
| 8 | Bc = FAIL and the acceptance id is **not** covered by the contract | SENDBACK | S4 | contract missed acceptance; `contract_revisions++` |
| 9 | Bc = UNVERIFIABLE | SENDBACK | S0 | acceptance not observable ⇒ spec defect; human answers |
| 10 | Bk = UNSAFE and verifier confirms | SENDBACK | S5 | |
| 11 | Bk = ILLEGIBLE or M = MISMATCH | **DEFER-GATE** | S5 (add rationale: doc comment/ADR/test name), unless lane=fast ⇒ H3 decides | code that outsiders cannot read is a latent error |
| 12 | K = WAIVED and lane ≠ fast and no `observation` evidence file | SENDBACK | S4 | a waiver without an observation is not a contract |
| 13 | C ∈ {PASS,NONE}, K = GREEN, S = yes, R ≤ minor, Bc = PASS, Bk = SAFE, M = MATCH | **MERGE** (pending H3) | — | cream outlet; `C = NONE` allowed only when zone commands are all `null` and K has ≥1 observation |
| 14 | MERGE conditions hold but there are `minor` findings or skim items | MERGE + **DEFER** list | — | skim outlet: `08-decide/deferred.md` becomes tickets, never dropped |

The table is small on purpose. It is evaluated by `sep decide` (jq) when a shell exists, by an agent
reading this exact table when it does not, and by a human with the same table on a PR template when
nothing runs at all.

---------------------------------------------------------------------------------------------------

## 7. Loop control (how send-backs cannot cycle forever)

| Mechanism | Rule | Terminal action |
|-----------|------|-----------------|
| **Monotone send-back** | A send-back target is always a strictly earlier stage. Stages after the target re-run; stages before it do not. | — |
| **Per-unit counters** | `exec_attempts ≤ 3`, `review_rounds ≤ 2`, `contract_revisions ≤ 2`, `decomp_revisions ≤ 1`, `sendbacks_total ≤ 5` (fast lane: 2/1/1/0/2) | exceed ⇒ ESCALATE |
| **Same-finding rule** | A confirmed finding whose `fingerprint` (file + normalized claim) reappears after a fix | ESCALATE (do not try a third time) |
| **No-progress rule** | `sha256(diff.patch)` unchanged after an exec attempt, or a worker writes `blocked.md` | ESCALATE immediately |
| **Delta mode** | Review round 2+: reviewer gets round-1 findings + new diff, must report *only* important+ and regressions; nits suppressed. Blind lenses always run fully (they are blind), but at most 2 times per unit. | — |
| **Run budget** | Workflow `budget` / agent-call cap per lane: fast ≤ 6 agent calls, standard ≤ 30, deep ≤ 120; tokens as secondary cap | exceed ⇒ ESCALATE remaining units, verdict PARTIAL |
| **Isolation of failure** | Escalation is per unit. Other units proceed to their own verdicts. Run verdict = PARTIAL with a list. | never blocks the whole run |
| **Human re-entry** | Escalation resolution is a file (`escalation.md` gets a `## Resolution` section). Resuming resets *only* the counter named in the resolution. | prevents hidden infinite loops via humans |

---------------------------------------------------------------------------------------------------

## 8. Human checkpoints

| Checkpoint | When | Human sees | Time | Skipped when |
|------------|------|-----------|------|--------------|
| H0 interview | S0 | interactive questions (≤ 3 in fast lane; interview until acceptance is observable in deep lane) | 1–10 min | never |
| H1 approve request + lane | after S0 | `request.json` rendered as 10 lines + lane reason | 1 min | fast lane (implicit; the human just wrote it) |
| H2 approve contracts | after S4 | one contract per unit; the RED evidence lines | 2–5 min | standard/fast lanes unless a probe returned `ask-human` or a zone is `risk:high` |
| H3 merge | after S8 | the **verdict card**: decision table rows, evidence paths, deferred list, blind lens intent sentence | 1–3 min | never (accountability stays human; override must carry a note ⇒ ledger) |
| H-esc | any time | `escalation.md` with the full trail | async | — |

Human input is a file in every case (a `## Resolution` or `approved_by` field), which is what makes the
checkpoints identical in Claude Code (separate workflow runs), Cursor (a chat turn), or a PR (a comment).

---------------------------------------------------------------------------------------------------

## 9. Why this is faster than the straight line

1. **Rework locality.** Straight line: error → fix in a bloated context → new error. Here a finding
   carries `origin`, so rework re-enters at the exact stage that was wrong (contract, not code; unit
   shape, not contract). A contract fix costs one read-only call; the same defect found after
   implementation costs a full exec+review cycle. Front-loading S4 is the cheapest place to be wrong.
2. **Parallelism where it is safe.** Reads (cartography, probes, review lenses, blind lenses) run in
   parallel; writes are partitioned by write set and worktree. A 5-unit feature runs 5 workers at
   once; the straight line runs one.
3. **Fresh contexts instead of corrections.** Each stage starts clean with a small pack, so no stage
   suffers context rot from the previous stage's failed attempts (the "corrected more than twice ⇒
   /clear" rule is structural here, not a habit).
4. **Lanes keep small things small.** ~70% of tasks are fast-lane: straight line + one contract line
   + one context-aware reviewer + one blind customer check ≈ 2–4 extra minutes, in exchange for
   catching the class of bug that otherwise costs an afternoon.
5. **Human time is the real bottleneck.** The human reads three short cards instead of debugging.
   Evidence files replace "trust me, tests pass".
6. **The ledger removes repeat classes.** A recurring finding becomes a path-scoped rule, a hook, or a
   lane-router tweak; the funnel gets *shorter* over time (S9 proposes skips when a stage has not
   produced a send-back in 30 runs on a lane ⇒ sample it 1-in-5 instead).
7. **Three outlets.** Out-of-scope-but-correct work is deferred, not argued about for three cycles.

Honest cost: deep lane is 10–20× the tokens of a chat, and wall-clock for one unit is longer than a
lucky straight line. The claim is faster *end to end on large projects* (fewer regressions, fewer
re-reads, parallel units), not faster per small edit — which is why the fast lane exists.

---------------------------------------------------------------------------------------------------

## 10. Universality: the degradation ladder

The protocol (`.separator/SEPARATOR.md` + stage cards + schemas) is identical at every level; only the
mechanisms that *run* and *enforce* it differ.

| Capability | L3: Claude Code | L2: Cursor / tool with subagents, no hooks | L1: single-context CLI (Codex/Gemini CLI, `claude -p`, plain chat) | L0: human team |
|------------|-----------------|--------------------------------------------|---------------------------------------------------------------------|----------------|
| Stage isolation | subagent fresh context, `isolation: worktree`, `omitClaudeMd` | `.cursor/agents/<role>.md` subagent (`readonly: true` for reviewers), separate chats per stage | one headless invocation per stage: `claude -p --json-schema` / `codex exec` reading only the pack dir; `/clear` between stages in chat | a different person per stage; blind reviewer gets the pack, not the PR thread |
| Orchestration | `.claude/workflows/sep-*.js` | orchestrator subagent following `SEPARATOR.md`; or `sep.sh` calling the CLI | `sep.sh` (bash) driving the CLI stage by stage | checklist in PR template |
| Enforcement | hooks (PreToolUse/PostToolUse/Stop/SubagentStop) | **git hooks** (pre-commit runs `sep validate`; pre-push requires `decision.json` hash) + CI job `separator-gate` | same git hooks + CI | CI + branch protection |
| Memory | `CLAUDE.md` → `@AGENTS.md`; `.claude/rules/*.md` with `paths:` | `AGENTS.md`; `.cursor/rules/*.mdc` with globs | `AGENTS.md` | `AGENTS.md` read by people |
| Skills / stage cards | `.claude/skills/sep-*/SKILL.md` (`context: fork`, `agent:`) | same SKILL.md files (Agent Skills standard; Cursor 2.4+ loads them) | same files, pasted or referenced | same files, read |
| Blind independence | `omitClaudeMd` + deny-hook on `.separator/**` | `readonly` subagent + pack dir; independence rests on the pack | pack dir is the *only* mounted/passed input | pack dir zipped to a reviewer outside the team |

Design consequences of universality-first:

* **Pack directories are physical.** `sep pack S7 U-01` copies the allowed files into
  `07-blind/U-01/pack/`. Any tool can be pointed at a directory; a deny-list is then a bonus, not a
  requirement. (`sep` is a ~200-line bash script with `jq`; a node/python port is trivial.)
* **The unforgeable gate is the diff hash.** `decision.json.diff_sha256` must equal
  `sha256(git diff <base>..HEAD)` at push time. A git `pre-push` hook or a CI job checks it. Change
  code after the verdict ⇒ verdict invalid ⇒ back to S6. Works with zero AI tooling.
* **Schemas over prose.** JSON artifacts are less likely to be casually overwritten by a model than
  Markdown (Anthropic's long-running-harness finding), and validate the same everywhere.
* **Two-word verification vocabulary** (`check`, `observation`) — see §3 — means the review and blind
  stage cards contain no language-specific instructions at all; language specifics live in
  `zones.json` and the zone's `rules[]` files.
* **Second-opinion diversity.** In deep lane the cold lens may be run by a different model or vendor
  through the L1 mechanism (`codex exec` / `gemini -p` on the same pack). Same prompt, same pack,
  different weights — the closest thing to an independent auditor.

---------------------------------------------------------------------------------------------------

## 11. Claude Code reference mapping (L3)

### 11.1 Directory layout

```
repo/
├─ AGENTS.md                         # tool-agnostic memory (≤ 60 lines); CLAUDE.md first line: @AGENTS.md
├─ CLAUDE.md                         # @AGENTS.md + damping prompts + "read .separator/SEPARATOR.md when asked to /sep"
├─ .separator/
│  ├─ SEPARATOR.md                   # the protocol: stages, packs, decision table, counters (this doc, condensed)
│  ├─ zones.json                     # incremental zone map (committed)
│  ├─ schemas/*.schema.json          # request, lane, impact, units, assignments, contract, report, review, verify, blind-*, decision, ledger
│  ├─ stages/S0-intake.md … S9-learn.md   # stage cards = bodies reused by SKILL.md and agent prompts
│  ├─ bin/sep                        # bash+jq: new-run | pack | validate | decide | hash | ledger
│  ├─ ledger.jsonl                   # committed; one line per run
│  └─ runs/<run>/00-intake … 09-learn/   # gitignored except decision.json + escalation.md (committed with the PR)
├─ .claude/
│  ├─ agents/  sep-cartographer.md sep-planner.md sep-prober.md sep-contract-checker.md sep-worker.md
│  │           sep-reviewer.md sep-verifier.md sep-blind-customer.md sep-blind-cold.md sep-scribe.md
│  ├─ skills/  sep/ sep-intake/ sep-plan/ sep-run/ sep-review/ sep-blind/ sep-zones/ sep-status/  (SKILL.md each)
│  ├─ workflows/ sep-intake.js sep-plan.js sep-run.js sep-fast.js
│  ├─ hooks/   guard-write-set.sh guard-blind-reads.sh zone-lint.sh unit-check.sh validate-artifact.sh guard-push.sh
│  ├─ rules/   sep-worker.md (paths: ["**/*"] damping: no over-engineering, never delete/skip tests, evidence not assertions)
│  └─ settings.json
```

### 11.2 Agents (frontmatter; body = stage card + pack list)

```markdown
---  # .claude/agents/sep-reviewer.md
name: sep-reviewer
description: Context-aware independent reviewer. Use on a unit after execution; reads only the review pack.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit, Agent
model: inherit
effort: high
maxTurns: 40
memory: project          # accumulates recurring review patterns across runs
---
You review ONE unit against its contract. Your pack is `.separator/runs/$RUN/06-review/$UNIT/pack/`
(contract.md, diff.patch, evidence/, zone rules, acceptance.md). Do not read anything under
.separator/ outside that directory. Report correctness gaps only; at most 5 minor items.
Every finding: severity, file:line, claim with evidence you can cite, origin (code|contract|
decomposition|request), fingerprint. If the work is sound, return an empty findings list — that is a
valid and common result. Output must validate against schemas/review.schema.json.
```

```markdown
---  # .claude/agents/sep-blind-cold.md
name: sep-blind-cold
description: Context-free cold reader. Receives only a diff; infers intent; judges safety and legibility.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit, Agent, WebFetch, WebSearch
model: sonnet            # deliberately a different model than the worker/reviewer; deep lane may use another vendor via L1
omitClaudeMd: true
effort: high
maxTurns: 30
---
You have never seen this project before. You are given a patch. First write, in two sentences, what
you believe this patch is trying to do (inferred_intent). Then judge: is it SAFE (no data loss,
security, concurrency, or obvious logic hazard you can point to at file:line), UNSAFE, or ILLEGIBLE
(you cannot tell what it does or why). You may read surrounding source and run the zone commands
listed in pack/commands.json. You must not read .separator/, .claude/, CLAUDE.md, AGENTS.md, git log.
```

Other agents: `sep-cartographer` (haiku/sonnet, read-only, `maxTurns: 20`), `sep-planner` (inherit,
read + Write limited by hook to `.separator/`), `sep-prober` (`isolation: worktree`, full tools,
`maxTurns: 40`; its worktree is discarded — the *only* outputs are `hypothesis.md`, `probe.log`, and
the RED test it may commit into the unit branch as `contract-tests`), `sep-contract-checker`
(read-only; pack excludes `hypothesis.md`), `sep-worker` (`isolation: worktree`, `permissionMode:
acceptEdits`, agent-scoped `Stop` hook = `unit-check.sh`), `sep-verifier` (read-only + Bash),
`sep-blind-customer` (`omitClaudeMd`, pack = acceptance + diff + commands), `sep-scribe` (haiku).
Coordinator agents, if any, restrict spawning with `tools: Agent(sep-reviewer, sep-verifier)`.

### 11.3 Workflow scripts (three runs = three human checkpoints; the API forbids mid-run input)

`/sep-intake` is a **skill**, not a workflow (it must talk to the user). It writes `request.json` +
`lane.json` and prints the run id. `/sep-plan <run>` and `/sep-run <run>` are workflows; `/sep-fast
<run>` is the collapsed fast lane. Scripts cannot touch the filesystem, so agents write artifacts and
return small JSON summaries; the script holds counters and branching. No `Date.now()`; the run id
comes from `args`.

```js
// .claude/workflows/sep-run.js  (sketch; S5→S6 loop per unit, S7 parallel, S8 decide, S9 learn)
export const meta = { name: 'sep-run', description: 'SEPARATOR: execute, review, blind verdict, decide',
  phases: ['execute-review', 'blind', 'decide', 'learn'] };

const run = args.run;                              // e.g. 2026-09-26-cart-discount-a1b2c3d
const plan = await agent(`Read .separator/runs/${run}/03-assign/assignments.json and lane.json; return them.`,
  { label: 'load', schema: { type:'object', required:['units','lane'], properties:{ units:{type:'array'}, lane:{type:'object'} } } });
const CAP = plan.lane.id === 'fast' ? { exec:2, review:1, contract:1 } : { exec:3, review:2, contract:2 };

phase('execute-review');
const results = await pipeline(plan.units, async (u) => {
  let counters = { exec:0, review:0, contract:0 }, lastHash = null, seenFingerprints = new Set(), state = 'EXEC';
  while (true) {
    if (state === 'EXEC') {
      if (++counters.exec > CAP.exec) return { unit:u.id, verdict:'ESCALATE', why:'exec_attempts' };
      const r = await agent(`Execute unit ${u.id} of run ${run} per its contract. Write report.json + evidence. Return {ok, diff_sha256, blocked}.`,
        { label:`exec ${u.id}`, agentType:'sep-worker', isolation:'worktree', schema: REPORT });
      if (!r || r.blocked || r.diff_sha256 === lastHash) return { unit:u.id, verdict:'ESCALATE', why:'no-progress' };
      lastHash = r.diff_sha256; state = 'REVIEW';
    }
    if (state === 'REVIEW') {
      if (++counters.review > CAP.review) return { unit:u.id, verdict:'ESCALATE', why:'review_rounds' };
      await agent(`sep pack S6 ${u.id} for run ${run}`, { label:`pack S6 ${u.id}`, agentType:'sep-cartographer' });
      const rev = await agent(`Review unit ${u.id} (run ${run}, round ${counters.review}${counters.review>1?', DELTA MODE':''}).`,
        { label:`review ${u.id}`, agentType:'sep-reviewer', schema: REVIEW });
      const ver = await agent(`Verify each finding in review-r${counters.review}.json for ${u.id}; refute or confirm with file:line evidence.`,
        { label:`verify ${u.id}`, agentType:'sep-verifier', schema: VERIFY });
      const open = ver.findings.filter(f => f.status === 'confirmed' && f.severity !== 'minor');
      if (open.length === 0) return { unit:u.id, verdict:'REVIEWED', hash:lastHash };
      if (open.some(f => seenFingerprints.has(f.fingerprint))) return { unit:u.id, verdict:'ESCALATE', why:'same-finding-twice' };
      open.forEach(f => seenFingerprints.add(f.fingerprint));
      const target = open.some(f => f.origin === 'request') ? 'S0' : open.some(f => f.origin === 'decomposition') ? 'S2'
                   : open.some(f => f.origin === 'contract') ? 'S4' : 'S5';
      if (target === 'S0' || target === 'S2') return { unit:u.id, verdict:'SENDBACK', target };   // leaves this workflow → human re-runs /sep-plan
      if (target === 'S4') {
        if (++counters.contract > CAP.contract) return { unit:u.id, verdict:'ESCALATE', why:'contract_revisions' };
        await agent(`Revise contract for ${u.id} per confirmed findings; must keep RED evidence rule.`, { label:`contract ${u.id}`, agentType:'sep-prober', isolation:'worktree', schema: CONTRACT });
        await agent(`Check revised contract ${u.id}.`, { label:`contract-check ${u.id}`, agentType:'sep-contract-checker', schema: OK });
      }
      state = 'EXEC';
    }
  }
});

phase('blind');
const blind = await parallel(results.filter(r => r.verdict === 'REVIEWED').flatMap(r => [
  () => agent(`Blind customer verdict for ${r.unit} of run ${run}; read ONLY 07-blind/${r.unit}/pack.`, { label:`blind-customer ${r.unit}`, agentType:'sep-blind-customer', schema: BLIND_C }),
  ...(plan.lane.id === 'fast' ? [] : [ () => agent(`Cold read of 07-blind/${r.unit}/pack/diff.patch.`, { label:`blind-cold ${r.unit}`, agentType:'sep-blind-cold', schema: BLIND_K }) ])
]));

phase('decide');
const decision = await agent(`Run \`.separator/bin/sep decide ${run}\` and return decision.json.`, { label:'decide', agentType:'sep-scribe', schema: DECISION });
phase('learn');
await agent(`Append ledger entry for run ${run}; propose rules for fingerprints seen ≥2 times.`, { label:'learn', agentType:'sep-scribe', schema: OK });
log(`run ${run}: ${decision.verdict}; sendbacks=${JSON.stringify(decision.sendbacks)}`);
```

`sep-plan.js` is simpler: `phase('zones')` cartographer → `phase('decompose')` planner → dispatcher →
`phase('hypothesis')` `parallel(units.map(u => () => agent(prober…)))` then `parallel(contract-checker…)`;
a `contract-check.ok=false` loops the prober at most `CAP.contract` times, then escalates.

### 11.4 Hooks (`.claude/settings.json`)

```json
{ "hooks": {
  "PreToolUse": [
    { "matcher": "Edit|Write", "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-write-set.sh", "timeout": 10 } ] },
    { "matcher": "Read|Grep|Glob|Bash", "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-blind-reads.sh", "timeout": 10 } ] },
    { "matcher": "Bash", "if": "Bash(git push *)", "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard-push.sh", "timeout": 20 } ] }
  ],
  "PostToolUse": [
    { "matcher": "Edit|Write", "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/zone-lint.sh", "timeout": 120 } ] }
  ],
  "SubagentStop": [
    { "matcher": "sep-.*", "hooks": [ { "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/validate-artifact.sh", "timeout": 30 } ] }
  ] } }
```

* `guard-write-set.sh`: if `agent_type == sep-worker`, read the unit's `write_set` from
  `assignments.json` (unit id from the worktree branch name), deny (`exit 2`) any path outside it and
  any path under `.separator/runs/*/0[6-9]-*`. Also deny deleting files matching zone test globs.
* `guard-blind-reads.sh`: if `agent_type` matches `sep-blind-*`, deny reads of `.separator/**` except
  the agent's own pack, and deny `CLAUDE.md`, `AGENTS.md`, `.claude/**`, `.cursor/**`, `git log`.
* `zone-lint.sh`: map the edited path to a zone via `zones.json`; run `commands.lint` if non-null;
  `exit 2` with the first 30 lines of output so the worker fixes it immediately.
* `unit-check.sh` (agent-scoped `Stop` hook in `sep-worker.md` frontmatter): run every contract
  `check`; if any fails and `stop_hook_active` is false, `exit 2` with the failing command; the 8-block
  cap plus the workflow's `exec_attempts` counter guarantee termination.
* `validate-artifact.sh`: validate the artifact the stopping subagent was supposed to produce
  against its schema; `exit 2` with the ajv error so it fixes the file.
* `guard-push.sh`: allow `git push` only if `decision.json.verdict == MERGE`, `human.H3 == approved`,
  and `diff_sha256` matches `sep hash`. The identical logic ships as `.githooks/pre-push` for L0–L2.

### 11.5 Skills (stage cards; Agent Skills format so Cursor/Codex load the same files)

* `sep` — entry point: shows status of runs, tells the user which of `/sep-intake`, `/sep-plan`,
  `/sep-run` to invoke next; `sep status` under the hood.
* `sep-intake` (interactive, `user-invocable`, `disable-model-invocation`): interview with
  `AskUserQuestion`; 3 questions in fast lane; writes `request.json`, `lane.json`; ends with "run
  `/sep-plan <run>` or `/sep-fast <run>`".
* `sep-review` (`context: fork`, `agent: sep-reviewer`, argument = unit or a PR/branch): the
  standalone version usable on *any* diff, funnel or not; `!`git diff --merge-base origin/main`` is
  injected as the pack when no run exists.
* `sep-blind` (`context: fork`, `agent: sep-blind-customer`): same idea for outside verdicts.
* `sep-zones`: run cartography on a path; write `zones.patch.json`; ask the human to flip
  `inferred → declared`.
* `sep-plan`, `sep-run`, `sep-fast`: thin wrappers that call the workflow.

### 11.6 Memory

`AGENTS.md` (≤ 60 lines, shared by every tool): what the project is, the zone map location, the three
commands `/sep-intake → /sep-plan → /sep-run`, and the one sentence "verification is a check or an
observation; assertions are not evidence". `CLAUDE.md`: `@AGENTS.md` + the damping prompts
(no over-engineering; tests verify, they do not define the solution; work directly for single-file
edits; no subagents for a grep). Path-scoped `.claude/rules/*.md` hold zone conventions — never in
`CLAUDE.md`. S9 *proposes* memory edits; a human applies them, and every proposal must name the ledger
entries that justify it (governance rot is a listed risk, so it gets a gate).

---------------------------------------------------------------------------------------------------

## 12. Legacy monolith walk-through (the hard case)

Request: "Percentage discount in cart" in a 10-year PHP monolith with no tests.
S0: interview yields A1/A2 observable via the checkout page; lane = **deep** (risk path `payments`,
zone unmapped). S1: cartographer maps `src/billing/**` as `inferred`, `test: null`, finds
`scripts/smoke-billing.sh`; patch proposed. S2: 2 units — U-01 `src/billing/discount/**` (new),
U-02 `src/billing/Cart.php` (integration); write sets disjoint; U-02 depends on U-01. S4: prober for
U-02 runs the smoke script, writes a **characterization test** capturing today's totals for 5 carts
(golden master), commits it as `contract-tests`; contract says D1 = check `phpunit tests/Char/CartTest`
(RED for the new code path, GREEN for the golden cases), D3 = observation "smoke prints OK". H2: human
approves contracts (2 min). S5: two workers in worktrees; U-02 waits for U-01. S6: reviewer finds
"discount before tax" — `origin: contract` → S4 revises contract (counter 1/2) → S5 re-exec → delta
review clean. S7: customer lens runs the smoke and the phpunit; cold lens infers "adds coupon discount
to cart totals" — MATCH. S8: MERGE pending H3; deferred: "hard-coded 10% string in UI copy" (skim).
S9: ledger shows `discount-order` fingerprint; if it recurs in another run, scribe proposes a
path-scoped rule for `src/billing/**`: "discounts apply after tax; see ADR-12". Human flips the zone to
`declared` with `test: phpunit tests/Char` — the monolith is now 1% mapped, which is exactly enough.

---------------------------------------------------------------------------------------------------

## 13. Top risks (honest)

1. **Router misclassification.** Fast-laning a risky change silently skips probes and the cold lens;
   over-laning trivia adds ceremony. Mitigation: `risk_paths`, ledger-tracked fast-lane failure rate,
   automatic tightening. Residual: the first weeks before the ledger has data.
2. **Zone maps in "everything touches everything" monoliths.** Disjoint write sets may be impossible;
   units serialize and parallel speed-up disappears; `inferred` commands may be wrong. Mitigation:
   serialization is explicit, probes verify commands, humans confirm zones one at a time. Residual:
   deep lane on such code is slower than a careful human, at least until zones are declared.
3. **Reviewer quality: false positives, missing recall, model homogeneity.** Same-family models
   "independently" agreeing is weaker independence than it looks; the cold lens cannot distinguish
   intended from unintended behavior by design. Mitigation: verifier pass, empty-findings-is-valid
   prompt, distinct models per lens, second vendor via L1 in deep lane, intent-match as a separate
   signal. Residual: no published recall numbers exist; "as error-free as possible" is bounded by
   the checks the zones declare.
4. **Enforcement gaps below L3.** Cursor and plain CLIs cannot block a read of `.separator/` inside
   the session; independence there rests on the pack directory and discipline; git hooks are
   bypassable locally. Mitigation: CI `separator-gate` (hash + schema validation) is the real gate.
5. **Cost and latency in deep lane.** 10–20× tokens; worktrees re-running `setup` per unit on heavy
   monorepos. Mitigation: `setup` command cached, lanes, sampling skips proposed by S9, budget caps.
6. **Artifact corruption / schema drift.** Agents write malformed JSON or stale `$schema` versions;
   a broken run dir needs manual repair. Mitigation: schema retries, `SubagentStop` validation,
   `sep validate` in CI, versioned schemas with a `version` field.
7. **Checks that cannot lie but can be absent.** `test: null` zones degrade to observations, which
   are only as good as the described step. Mitigation: row 12 of the table (waiver needs evidence),
   characterization tests by the prober. Residual: observation-only units are trust-based.
8. **Governance rot.** Nobody reads `proposals.md`; `CLAUDE.md` bloats; stale rules get ignored.
   Mitigation: proposals must cite ≥2 ledger entries; quarterly harness-pruning task in the ledger;
   memory edits are human-applied. Residual: this is a habit, not a mechanism.
9. **Workflow ergonomics.** Three separate runs for three checkpoints is friction; users may skip
   `/sep-plan` and jump to `/sep-run` (the script refuses without `assignments.json`, but the temptation
   to run `/sep-fast` on everything is real). Mitigation: the `sep` entry skill nags; ledger exposes
   lane distribution.
10. **Agent teams / cross-vendor dependence avoided on purpose** — but that means no live debate
    between hypotheses; competing hypotheses are handled as parallel probes with a comparison, which is
    weaker than a real argument for genuinely ambiguous bugs.

---------------------------------------------------------------------------------------------------

## 14. Minimal adoption path (day one, any tool)

1. `mkdir .separator && cp SEPARATOR.md schemas/ stages/ bin/sep` — no code changes.
2. Run `sep zones init` — it writes one `inferred` zone for the repo root from the build files.
3. Add `AGENTS.md` (and `CLAUDE.md: @AGENTS.md`), the `.githooks/pre-push` hash check, and a CI job
   `separator-gate` that runs `sep validate` + `sep hash`.
4. Use the fast lane for a week; let the ledger fill; declare zones as they get touched.
5. Turn on the Claude Code layer (`agents/`, `workflows/`, `hooks`) when you want speed and
   enforcement — the protocol does not change, so nothing done in steps 1–4 is thrown away.
