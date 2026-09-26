# Gap research: separator calibration — risk/size routing, per-tier budgets, and measuring acceleration

Dimension: "Separator calibration: risk/size routing, per-tier cost/latency/model budgets, and measuring whether the funnel actually accelerates work"
Date: 2026-09-26. Researcher: subagent (Fable 5.1).

Method note. The session's WebSearch budget was already exhausted (200/200) when this
researcher started, so NO web searches were run. All evidence below comes from direct
WebFetch of primary sources by URL, from PDFs saved locally by those fetches, from the
Claude Code bundled skills loaded in-session (claude-api pricing table cached 2026-06-24;
workflow-authoring reference), and from cross-checking the other researchers' notes in this
directory (anthropic-agents.md, review-judging.md, failure-modes.md, quality-systems.md,
verification-tech.md). Where a number comes only from another researcher's notes, or only
from a small-model WebFetch summary, it is marked as such.

Egress-blocked hosts encountered (marked BLOCKED below): metr.org, dora.dev, arxiv.org,
google.github.io, posl.ait.kyushu-u.ac.jp, ieeexplore.ieee.org, dl.acm.org, research.google,
codescene.io, codescene.com, smartbear.com, gitclear.com (but the GitClear S3 PDF worked),
api.semanticscholar.org, core.ac.uk, testing.googleblog.com, web.archive.org.

---

## Sources read

### Claude Code / Anthropic (vendor documentation and posts) — FETCHED
1. Sub-agents — https://code.claude.com/docs/en/sub-agents
2. Dynamic workflows — https://code.claude.com/docs/en/workflows
3. Agent teams — https://code.claude.com/docs/en/agent-teams
4. Manage costs — https://code.claude.com/docs/en/costs
5. How Claude Code uses prompt caching — https://code.claude.com/docs/en/prompt-caching
6. Prompt caching (platform API) — https://platform.claude.com/docs/en/build-with-claude/prompt-caching
7. Monitoring (OpenTelemetry) — https://code.claude.com/docs/en/monitoring-usage
8. Hooks reference — https://code.claude.com/docs/en/hooks
9. Claude directory (transcripts) — https://code.claude.com/docs/en/claude-directory
10. Agent SDK: cost tracking — https://code.claude.com/docs/en/agent-sdk/cost-tracking
11. Agent SDK: subagents (depth/concurrency/spend caps) — https://code.claude.com/docs/en/agent-sdk/subagents
12. Code Review — https://code.claude.com/docs/en/code-review
13. Ultrareview — https://code.claude.com/docs/en/ultrareview
14. Best practices — https://code.claude.com/docs/en/best-practices (redirect from anthropic.com/engineering/claude-code-best-practices)
15. Model configuration — https://code.claude.com/docs/en/model-config
16. Settings reference — https://code.claude.com/docs/en/settings-reference (fetch truncated; subagentPromptCacheTtl/workflowSizeGuideline confirmed via pages 2, 3, 5 instead)
17. Claude Code CHANGELOG — https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md (fetched; the summarizer found none of the searched terms — treat as inconclusive, not negative)
18. Anthropic, How we built our multi-agent research system — https://www.anthropic.com/engineering/built-multi-agent-research-system
19. Anthropic, Demystifying evals for AI agents — https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
20. Anthropic, Effective harnesses for long-running agents — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
21. Anthropic, Harness design for long-running application development — https://www.anthropic.com/engineering/harness-design-long-running-apps
22. Anthropic, Agent harness design: 3 patterns — https://claude.com/blog/harnessing-claudes-intelligence
23. Anthropic, Code Review for Claude Code (launch post) — https://claude.com/blog/code-review
24. Anthropic, How Anthropic secures its AI-native SDLC — https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle
25. Bundled skill `claude-api` (pricing table cached 2026-06-24) and bundled skill `workflow-authoring` (agent()/pipeline()/parallel()/budget API) — loaded in-session.

### Defect prediction / code review research — FETCHED
26. Nagappan & Ball 2005, Use of Relative Code Churn Measures to Predict System Defect Density (ICSE) — https://www.microsoft.com/en-us/research/publication/use-of-relative-code-churn-measures-to-predict-system-defect-density/
27. Bird, Nagappan, Murphy, Gall, Devanbu 2011, Don't Touch My Code! (FSE) — https://www.microsoft.com/en-us/research/publication/dont-touch-my-code-examining-the-effects-of-ownership-on-software-quality/ and PDF https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bird2011dtm.pdf (PDF text extracted locally; Table 1 read directly)
28. Zimmermann & Nagappan 2008, Predicting Defects using Network Analysis on Dependency Graphs (ICSE) — https://www.microsoft.com/en-us/research/publication/predicting-defects-using-network-analysis-on-dependency-graphs/
29. Nagappan, Ball, Zeller 2006, Mining Metrics to Predict Component Failures (ICSE) — https://www.microsoft.com/en-us/research/publication/mining-metrics-to-predict-component-failures/
30. Bosu, Greiler, Bird 2015, Characteristics of Useful Code Reviews (MSR) — https://www.microsoft.com/en-us/research/publication/characteristics-of-useful-code-reviews-an-empirical-study-at-microsoft/
31. Czerwonka, Greiler, Tilford 2015, Code Reviews Do Not Find Bugs (ICSE SEIP) — https://www.microsoft.com/en-us/research/publication/code-reviews-do-not-find-bugs-how-the-current-code-review-best-practice-slows-us-down/ (abstract only)
32. Google eng-practices, Small CLs — https://raw.githubusercontent.com/google/eng-practices/master/review/developer/small-cls.md (google.github.io blocked; raw GitHub mirror worked)

### Measurement / productivity — FETCHED
33. Google Cloud blog, Announcing the 2025 DORA report — https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report
34. Google Cloud blog, Announcing the 2024 DORA report — https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report
35. GitClear, AI Copilot Code Quality 2025 (PDF) — https://gitclear-public.s3.us-west-2.amazonaws.com/GitClear-AI-Copilot-Code-Quality-2025.pdf
36. tau-bench README (leaderboard with pass^k) — https://raw.githubusercontent.com/sierra-research/tau-bench/main/README.md

### BLOCKED (cited from memory or from other researchers' notes; confidence lowered accordingly)
37. Kamei et al. 2013, A Large-Scale Empirical Study of Just-in-Time Quality Assurance (TSE) — all mirrors blocked (kyushu-u, IEEE, Semantic Scholar API, CORE, archive.org). Numbers from memory only.
38. METR 2025, Early-2025 AI on experienced OSS developer productivity — https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ — BLOCKED; numbers via failure-modes.md (search-level).
39. Meta RADAR 2026 — https://arxiv.org/abs/2605.30208 — BLOCKED; numbers via review-judging.md (search-snippet level).
40. Tornhill & Borg 2022, Code Red — https://arxiv.org/abs/2203.04374 — BLOCKED (arxiv, ACM, codescene). From memory.
41. Hassan 2009, Predicting faults using the complexity of code changes — BLOCKED (ACM). From memory.
42. Shin, Meneely, Williams, Osborne 2011, vulnerability indicators (TSE) — BLOCKED (IEEE). From memory.
43. Sadowski et al. 2018, Modern Code Review: A Case Study at Google — BLOCKED (research.google). Numbers via review-judging.md (snippet).
44. SmartBear/Cisco peer review study — BLOCKED. Numbers via review-judging.md (snippet).
45. Mockus & Weiss 2000, Predicting risk of software changes (Bell Labs) — not attempted (Wiley likely blocked). From memory.
46. Kochhar et al. 2017 / Mockus, Nagappan, Dinh-Trong 2009 on coverage vs post-release defects — not fetched. From memory.

---

## Findings

### Part A — the router

#### A0. The framing evidence: cost of ceremony vs. size of change

- Claude Code best practices (14), exact: "Plan mode is useful, but also adds overhead. For tasks where the scope is clear and the fix is small (like fixing a typo, adding a log line, or renaming a variable) ask Claude to do it directly. Planning is most useful when you're uncertain about the approach, when the change modifies multiple files, or when you're unfamiliar with the code being modified. If you could describe the diff in one sentence, skip the plan."
- Same page, failure pattern: "Correcting over and over ... Fix: After two failed corrections, `/clear` and write a better initial prompt incorporating what you learned." (This is the seed of the mis-route promotion rule.)
- Same page, on reviewers: "A reviewer prompted to find gaps will usually report some, even when the work is sound ... Chasing every finding leads to over-engineering ... Tell the reviewer to flag only gaps that affect correctness or the stated requirements."
- Anthropic harness-design post (21): "The harness was over 20x more expensive, but the difference in output quality was immediately apparent." (table: $9 solo vs $200 full harness); "It is worth the cost when the task sits beyond what the current model does reliably solo."; "The evaluator is still an LLM that is inclined to be generous towards LLM-generated outputs."; "I moved to a more methodical approach, removing one component at a time and reviewing what impact it had on the final result."
- Anthropic harness patterns post (22): "Agent harnesses encode assumptions about what Claude can't do on its own. As Claude gets more capable, those assumptions should be tested." Also the recurring question "what can I stop doing?". (anthropic-agents.md F18 quotes the same source as "When a new model lands, it is generally good practice to re-examine a harness, stripping away pieces that are no longer load-bearing." — my fetch's summarizer returned the paraphrase above; the two are consistent.)
- Claude Code Review launch post (23), vendor-reported internal numbers: "Before, 16% of PRs got substantive review comments. Now 54% do." Large PRs (>1,000 lines): 84% get findings, averaging 7.5 issues. Small PRs (<50 lines): 31% get findings, averaging 0.5 issues. "less than 1% of findings are marked incorrect". Cost "$15–25, scaling with PR size and complexity"; ~20 minutes average.

Reading: the marginal value of a heavy review layer on a <50-line change is ~0.5 expected findings at $15–25 and 20 minutes; on a >1,000-line change it is ~7.5 findings. That alone justifies routing by size. But size is not the only signal (see A1).

#### A1. Signal table — what is observable BEFORE implementation and what predicts defects/rework

Legend for evidence level: IND = independent peer-reviewed; VEN = vendor-reported; MEM = from memory / blocked source (low); NOTES = from another researcher's notes (blocked for me).

| # | Signal (pre-implementation) | How to observe it before coding | Evidence that it predicts defects/rework | Level |
|---|---|---|---|---|
| 1 | Predicted change size (lines, files) | Planner/classifier estimate; recheck with `git diff --stat` at each gate | Google (32): "100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large"; small CLs are "Less likely to introduce bugs", "Simpler to roll back"; "Reviewers have discretion to reject your change outright for the sole reason of it being too large." Claude Code Review (23): <50 lines → 31%/0.5 findings vs >1,000 lines → 84%/7.5. Bosu et al. (30): "the more files that are in a change, the lower the proportion of comments in the code review that will be of value" (1.5M comments, 5 MS projects). Nagappan & Ball (26): relative churn measures (churn relative to size and time) predict defect density; 89.0% accuracy discriminating fault-prone binaries in Windows Server 2003; "absolute measures of code churn are poor predictors". | IND (26,30) + VEN (23,32) — HIGH |
| 2 | Diffusion: number of modules/directories/subsystems touched | Planner's file list grouped by top-level dir/package | Kamei et al. JIT (37): diffusion metrics NS (subsystems), ND (directories), NF (files), Entropy are among the 14 change metrics; Hassan 2009 (41): entropy of change scattering predicts faults better than prior faults. Both BLOCKED for me. Bird Table 1 shows Size and Churn correlate 0.69–0.75 with failures (Vista) — diffusion is the change-level analogue. | MEM (37,41) — MEDIUM (well-known literature, not re-verified) |
| 3 | Overlap zones: auth/authz, config, DB migrations, API contracts, shared helpers, core services | Deterministic path→zone map checked in the repo (e.g. `.claude/risk-zones.json`), matched against predicted files | Zimmermann & Nagappan (28): network measures on the dependency graph "could identify 60% of the binaries that the Windows developers considered as critical — twice as many as identified by complexity metrics"; recall "10% points higher than for models built from complexity metrics". I.e. central, high-fan-in code (shared helpers, core services) is where defects concentrate. Anthropic SDLC (24): "Tiering our codebase by risk and then automating reviews based on that level." | IND (28) + VEN practice (24) — HIGH |
| 4 | Co-change coupling of touched files | `git log --name-only` over last N months → pairs that change together; flag predicted files whose strong partners are NOT in the predicted set | Zimmermann et al. 2005 (mining version histories to guide changes) and D'Ambros et al. 2009 (change coupling vs defects) — NOT fetched. Mechanism is uncontroversial: a partial change to a coupled pair is an incomplete change. | MEM — LOW-MEDIUM |
| 5 | Churn hotspot of the target files | Commits touching the file in last 90 days × file size; Tornhill "hotspot" = change frequency × complexity | Nagappan & Ball (26) relative churn (IND, HIGH). Tornhill & Borg Code Red (40): low-quality (hotspot) code ~2x development time, up to 15x more defects — BLOCKED, from memory. | IND for churn — HIGH; Tornhill figures — LOW |
| 6 | Ownership / novelty: "no prior successful agent change in this module" | Telemetry: count of previously landed tasks per path (this workflow's own log) | Bird et al. (27), Table 1 read directly from the PDF: Spearman correlation with failures — Minor contributors: 0.86 (Vista pre-release), 0.70 (Vista post), 0.93 (Win7 pre), 0.25 (Win7 post); Size 0.75/0.69/0.70/0.26; Churn 0.72/0.69/0.71/0.26; Complexity 0.70/0.53/0.56/0.37; Ownership (top owner share) −0.49/−0.49/−0.29/−0.02. "All correlations are statistically significant except for that of Ownership and post-release failures in Windows 7." Abstract: "the removal of low-expertise contributions dramatically decreases the performance of contribution based defect prediction". NOTE: the WebFetch summarizer reported "0.52" and "25–30% reduction"; the 0.52 is wrong (Table 1 says 0.86/0.70), and the 25–30% figure was not found in the extracted text. | IND — HIGH for the human-ownership effect; LOW for the analogy "agent novelty ≈ minor contributor" (no direct evidence) |
| 7 | Test coverage / presence of tests in the area | `ls tests/**` matching predicted modules; coverage report if available | Literature on coverage vs post-release defects is weak/mixed (Mockus 2009; Kochhar 2017 — NOT fetched). DORA 2025 (33): "Without robust control systems, like strong automated testing, mature version control practices, and fast feedback loops, an increase in change volume leads to instability." Use as a VERIFIABILITY signal (can the light path's deterministic check even run?), not as a defect predictor. | IND/VEN mixed — MEDIUM as verifiability, LOW as predictor |
| 8 | Reversibility (data migration, published API, message schema, external side effects) | Intake question + file patterns (migrations/, openapi/, proto/, public SDK) | No defect-prediction paper; ops principle. Google (32) lists "Simpler to roll back" as a benefit of small CLs. Anthropic SDLC (24) tiers by risk. DORA stability. | MEDIUM (principle), no quantitative evidence |
| 9 | External schema / API contract change | Diff touches contract files; classifier flags semantic change | Zimmermann & Nagappan (28): high-centrality nodes (fan-in) are defect-prone; a contract change propagates through the graph. | IND (indirect) — MEDIUM |
| 10 | Security-sensitive paths | Path map (auth, crypto, input parsing, permissions) | Shin et al. 2011 (42): churn, complexity and developer-activity metrics predicted vulnerable files in Firefox/Linux with high recall (~80%) at modest FPR — BLOCKED, from memory. Anthropic SDLC (24): risk-tiered automated review, "A risk-weighted sample is reviewed by humans." | MEM + VEN — MEDIUM |
| 11 | User-declared risk | Intake field (low/normal/high) | Meta RADAR (39, NOTES): eligibility gates before heuristics/ML/LLM; Anthropic (24): human declares tier via codebase tiering. Should act as a FLOOR (cannot lower below hard triggers). | NOTES/VEN — MEDIUM |
| 12 | Dependency additions | Diff of package manifests/lockfiles | Zimmermann & Nagappan (28) for graph effects; supply-chain risk is a policy matter. | MEDIUM |
| 13 | Ambiguity / spec completeness | Intake artifact: acceptance criteria present? count of open questions | Best practices (14): planning is most useful "when you're uncertain about the approach"; spec advice: "self-contained: they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification step". | VEN — HIGH as vendor guidance |
| 14 | Dynamic: failed correction count (during the run) | Hook counters | Best practices (14): "After two failed corrections, `/clear`". | VEN — HIGH |

Cross-cutting, HIGH-confidence, primary-source caveat that ties Part A to Part B: Nagappan, Ball, Zeller 2006 (29): "Failure-prone software entities are statistically correlated with code complexity measures" BUT "There is no single set of complexity metrics that could act as a universally best defect predictor"; predictors must be built from the project's own history ("predictors obtained from one project can also be significant for new, similar projects"). Therefore the router's weights below are a PRIOR, and the telemetry in Part B is what calibrates them per repository.

#### A2. Router scoring rubric (prior; to be calibrated)

Hard floors (deterministic; cannot be lowered by the classifier or by the user):
- touches `migrations/` or changes a persisted schema → at least HEAVY (irreversible)
- touches auth/authz/permissions/crypto zone → at least MEDIUM; plus any other zone → HEAVY
- adds/updates a dependency → at least MEDIUM
- changes a published API contract / message schema → at least MEDIUM; if consumed outside the repo → HEAVY
- user-declared HIGH → HEAVY

Additive score (start values; Nagappan/Ball/Zeller say these must be re-fit per project):
- predicted lines: ≤50 → 0; 51–300 → +2; >300 → +4
- predicted files: ≤2 → 0; 3–8 → +2; >8 → +4
- distinct top-level modules: 1 → 0; 2 → +1; ≥3 → +3
- each overlap zone touched: +3
- co-change partner missing from plan: +2
- churn hotspot (top decile by 90-day commits × size): +2
- novelty (no landed task on this path in telemetry): +1
- no tests for the area / deterministic check impossible: +2
- external contract change: +2
- ambiguity (no acceptance criteria, or ≥1 open question): +2
- user-declared LOW: −1 (never below a floor)

Tier: 0–2 LIGHT; 3–7 MEDIUM; ≥8 HEAVY. Floors override.

Calibration target: after ~50 logged tasks, fit a logistic regression of "send-back or escape" on the raw signals (not on the score) and replace the weights; keep the floors as policy, not as fitted values.

#### A3. Three paths — stage lists and stop rules

Common stage vocabulary: INTAKE → ROUTE → (PLAN) → (SPIKE) → IMPLEMENT → GATE (deterministic) → REVIEW (LLM, fresh context) → REFUTE → SEND-BACK loop → (BLIND VERDICT) → (HUMAN) → LAND → LOG.

LIGHT — "one-sentence diff"
- Entry: score ≤2, no floors, deterministic check available.
- Stages: (1) ROUTE by deterministic script (no LLM); (2) IMPLEMENT in the main session or one Sonnet subagent at `effort: medium`, instruction "additive-only; state the diff in one sentence first"; (3) GATE: PostToolUse/Stop hook runs lint + typecheck + the targeted tests for touched files (Stop hook blocks the turn until the check passes; Claude Code caps consecutive Stop-hook blocks at 10); (4) one cheap REVIEWER: `/code-review low` (background subagent, fresh context, diff-only) or a Haiku/Sonnet read-only subagent returning JSON `{verdict, findings[]}` with a "flag only correctness/requirement gaps" mandate; (5) LAND + LOG.
- Stop rules: gate fails twice → PROMOTE to MEDIUM. Reviewer reports an Important finding → one fix cycle then re-review; a second Important → PROMOTE. Actual `git diff --stat` exceeds predicted by >2x, or touches any zone → PROMOTE (mis-route).
- Budget (estimate, see B3): $0.3–2, 3–10 min wall-clock, 0 human minutes beyond the intake sentence.

MEDIUM
- Entry: score 3–7, or one soft floor (dependency, single zone, contract change).
- Stages: (1) ROUTE; (2) PLAN in plan mode (or the built-in Plan subagent): files, interfaces, out-of-scope list, verification step; (3) PLAN CHECK by one independent Haiku/Sonnet subagent (fresh context; sees intake + plan only): "does the plan cover every acceptance criterion, and does it touch anything outside scope?"; (4) IMPLEMENT (Sonnet or Opus; tests for acceptance criteria written first); (5) GATE: full tests for touched modules + lint + typecheck + coverage of changed lines; (6) REVIEW PANEL: two lens reviewers in parallel, same agent type/model/effort/tools/schema (so their prefix is shared in the cache), lens in the prompt: correctness; scope/contract. Fresh context, diff + criteria only, JSON findings; (7) REFUTE: one skeptic per finding, mandate "refute; default refuted=true if uncertain"; unrefuted → send-back; unverifiable → reported as "unverified" (never dropped, never promoted); (8) SEND-BACK to the implementer (max 2 cycles), re-run GATE on the delta; (9) LAND + LOG.
- Stop rules: >2 send-backs → PROMOTE to HEAVY with a human gate. PLAN shows ≤2 files/≤50 lines/no zones and a runnable check → DEMOTE to LIGHT (only at the plan stage; only once per task).
- Budget: $4–15, 20–45 min, 2–5 human minutes (plan approval).

HEAVY — full funnel
- Entry: score ≥8 or any hard floor.
- Stages: (1) INTAKE with spec interview ("Let Claude interview you" → SPEC.md) and binary acceptance criteria; (2) ROUTE; (3) DECOMPOSE into units ≤~300 changed lines each, each with its own criteria and tier (units can be LIGHT/MEDIUM internally); (4) HYPOTHESIS SPIKES for uncertain units: 2–3 throwaway approaches in parallel worktrees (`isolation: 'worktree'`), judged by a judge panel with a schema; losers discarded; (5) IMPLEMENT units via a workflow `pipeline()` (worktree isolation when units touch overlapping files), tests-first; (6) GATE per unit + integration gate after merge of units; (7) PARALLEL LENS REVIEWERS (correctness, security, performance, contract/scope, tests) with fresh context, diff + spec only; (8) VERIFIER PASS: 3 skeptics per finding, majority rule; unverifiable reported as unverified; (9) SEND-BACK loop per unit (max 2) → re-gate; (10) BLIND VERDICT: one judge (Opus 5 or Fable 5.1; ideally a different model family than the implementer's) that receives ONLY the spec, the final diff, the test evidence and the confirmed-findings list — style-stripped: no PR prose, no author confidence statements, no transcript; outputs `{verdict: pass|fail, reasons[], unmet_criteria[]}`; no dialogue with the author; (11) HUMAN GATE (plan approval earlier; verdict review here); (12) optional `/code-review ultra` before merge ($5–25, 5–10 min, ≤500 files/8,000 lines); (13) LAND + LOG.
- Stop rules: BLIND VERDICT = fail → back to DECOMPOSE (not to a fix cycle); 3rd send-back on any unit → human; `maxBudgetUsd` / workflow `budget.total` reached → stop, report partial, human decides.
- Budget: $35–90 in tokens + $5–25 ultrareview, 60–150 min wall-clock incl. 15–40 human minutes.

#### A4. Mis-route recovery

Promotion triggers (LIGHT→MEDIUM, MEDIUM→HEAVY), all logged with reason:
1. Two failed corrections at any gate or review (best practices: "After two failed corrections, /clear"). Implementation: a Stop/PostToolUse hook counts gate failures per task_id in `.claude/telemetry/state/<task_id>.json`; on the second failure it writes `route_change: promote` and the orchestrator restarts at the higher path's PLAN stage with the failed attempt's EVIDENCE (test output, diff) but not its transcript (fresh context; the failed approaches would otherwise pollute).
2. Actual diff touches an overlap zone or exceeds the predicted size band by >2x (computed from `git diff --stat --name-only` against the zone map).
3. A reviewer/refuter confirms a security- or data-tagged finding.
4. A dependency manifest changed unexpectedly.
5. A required claim came back "unverified" from the refuter (cannot be checked at this tier).

Demotion (HEAVY→MEDIUM, MEDIUM→LIGHT): only at the PLAN stage, only once per task, only if the plan shows ≤2 files, ≤50 lines, no zones, no floors, and a runnable deterministic check. Keep the blind verdict optional but cheap (Haiku) when demoting from HEAVY, so the "outside view" is never fully lost on something a human declared heavy.

Anti-flip-flop: a task carries `route_changes[]`; after one promotion, no demotion; after two promotions, human decides.

#### A5. Router implementation in Claude Code

Two layers, deterministic first:
1. Deterministic script (bash/python, zero tokens) — mirrors Meta RADAR's "eligibility gates → static heuristics" ordering (39, NOTES) and Anthropic's "Every automated approval ... is logged with the signals it used" (24). Inputs: the intake artifact (declared risk, acceptance criteria count, open questions), a predicted file list (from the plan, or from a keyword grep of the intake against the repo), and git: 90-day churn per predicted file, co-change partners, zone map hits, presence of tests, manifest diff. Output JSON `{task_id, tier, score, floors[], signals{}, reasons[]}`. Trigger: a `UserPromptSubmit` hook (input has `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir`) or the first step of an `/intake` skill. Re-run at every gate on the actual diff (`git diff --stat`) for mis-route detection.
2. Haiku classifier subagent with a JSON schema — ONLY for signals git cannot see: predicted files/lines when no plan exists yet, ambiguity, reversibility, whether a contract change is semantic, novelty. In a workflow: `agent(prompt, {model: 'haiku', effort: 'low', schema: ROUTE_SCHEMA})` — schema validation is enforced at the tool layer with up to 5 attempts (`MAX_STRUCTURED_OUTPUT_RETRIES`). Give it an explicit "unknown" value per field (Anthropic evals: "give the LLM a way out"). Its output feeds the deterministic scorer; floors are never decided by the classifier.

Logging every decision for calibration: append one JSONL line to `.claude/telemetry/router.jsonl` per decision and per re-check: `{ts, task_id, session_id, prompt_id, stage, signals, classifier_output, score, floors, tier, route_change, reason, human_override}`. Nothing in Claude Code does this for you; hooks are the only deterministic place to do it ("Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens" — best practices).

### Part B — budgets and measurement

#### B1. Per-stage cost/latency mechanics in Claude Code today (all from vendor docs, HIGH confidence as documentation)

Subagents (1):
- "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation history, the skills you've already invoked, or the files Claude has already read." Exception: a fork inherits the parent's conversation (and reads the parent's cache).
- Model precedence: "1. The per-invocation `model` parameter 2. The subagent definition's `model` frontmatter, where `inherit` selects the main conversation's model 3. The `CLAUDE_CODE_SUBAGENT_MODEL` environment variable ... 4. The main conversation's model." `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` forces one model for every subagent/teammate/workflow agent (v2.1.257+). Aliases: `sonnet`, `opus`, `haiku`, `fable`, `inherit`, or a full ID.
- Concurrency: "when 20 subagents are running in a session, spawning another with the Agent tool fails with `Concurrent subagent limit reached`" — `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`; not enforced under ultracode. Depth: 3 layers by default (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`).
- Cache TTL: subagent requests fall outside the main-conversation bucket → 5 minutes by default even on a subscription; per-subagent `experimental: cacheTtl: 1h` frontmatter (v2.1.248+), or `subagentPromptCacheTtl` / `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL` (v2.1.242+). Resumed subagents keep the cache the original run warmed.
- Subagents inherit the main conversation's extended-thinking setting (v2.1.198+); effort can be set per agent in the SDK (`effort`) and per workflow `agent()` call.
- Token cost vs teams: "Subagents: Lower: results summarized back to main context. Agent teams: Higher: each teammate is a separate Claude instance."

Dynamic workflows (2, 25):
- "Intermediate results stay in script variables instead of landing in Claude's context."
- "Up to 16 concurrent agents by default, fewer when Claude Code has fewer CPUs available" — `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` 1–256 (v2.1.269+); the authoring skill states the cap as min(16, available CPUs − 2). 1,000 agents per run; 4,096 items per `parallel()`/`pipeline()`.
- Prompt caching in a fan-out: "Two agents that run with the same model, effort level, agent type, tools, output schema, and working directory build the same tools-and-system-prompt prefix, so an agent that starts after a matching sibling's response has begun reads that sibling's cache on its first request." Claude Code holds siblings until the first response begins, capped by `CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS` (default 5000). Workflow agents get the 5-minute TTL unless `subagentPromptCacheTtl: 1h`.
- Cost warning: "When a workflow schedules more than 25 agents, or its projected token total passes 1.5 million, its progress line ... shows a `Large workflow` warning." Advisory only; suppressed under ultracode.
- `workflowSizeGuideline`: `small` <5 agents, `medium` <10, `large` <50, `unrestricted`; default `medium` (`small` on Pro, v2.1.271+); a chosen guideline replaces the 25-agent warning threshold.
- Per-call knobs from the authoring skill: `agent(prompt, {label, phase, schema, model, effort, isolation: 'worktree', agentType})`; worktree isolation is "EXPENSIVE (~200-500ms setup + disk per agent)"; `budget.total` is "a HARD ceiling, not advisory: once `spent()` reaches `total`, further `agent()` calls throw"; `pipeline()` has no barrier between stages ("Wall-clock = slowest single-item chain"); `workflow()` nests one level. Every run writes its script and a `journal.jsonl` that "records each agent's actual return value" under `~/.claude/projects/`.
- `/workflows` progress view "shows each phase with its agent count, token total, and elapsed time"; drill-down shows each agent's prompt, tool calls and result.
- Model per stage: "Claude Code picks each workflow agent's model in the same order it uses for subagents. A model the script names for a stage counts as the per-invocation model."

Agent teams (3, 4):
- "Agent teams use significantly more tokens than a single session. Each teammate has its own context window, and token usage scales with the number of active teammates."; costs page: "Agent teams use approximately 7x more tokens than standard sessions when teammates run in plan mode". "Start with 3-5 teammates". Experimental, disabled by default. Plan-mode gap: "Claude Code approves the plan in the lead's session as soon as the request arrives, without the lead reviewing it."
- Quality gates: `TeammateIdle`, `TaskCreated`, `TaskCompleted` hooks (exit 2 sends feedback). NOTE: my hooks-page fetch reported that exit 2 on `TaskCompleted` "has no blocking effect" while the agent-teams page says "Exit with code 2 to prevent completion and send feedback" — the two pages disagree in my fetched summaries; verify before relying on it.

Prompt cache pricing (6): default TTL 5 minutes; 1-hour TTL available. "5-minute cache writes: 1.25x the base input token price; 1-hour cache writes: 2x". Reads: "0.1x the base input token price" for standard models; Fable 5.1 / Mythos 5.1: 0.025x; Opus 5.5: 0.05x. Minimum cacheable prefix: 512 tokens (Fable 5/5.1, Opus 5/5.5), 1,024 (Sonnet 5, Opus 4.8), 4,096 (Haiku 4.5, Opus 4.6). "For concurrent requests, note that a cache entry only becomes available after the first response begins." Lifetime "is measured from the start of the request that writes or reads the cache entry".

Model prices (claude-api skill table, cached 2026-06-24; VEN): Haiku 4.5 $1/$5 per MTok (in/out); Sonnet 5 $2/$10; Opus 5 $5/$25; Opus 5.5 $4/$20 (launching); Fable 5.1 $10/$50 (cache reads at 0.025x → $0.25/MTok). Effort: `low/medium/high/xhigh/max`; defaults: Opus 5.5 `medium`, Opus 4.7 `xhigh`, others `high` (15). Claude Code `haiku` alias resolves to the current Haiku (4.5); `opus` → Opus 5.5 on the Anthropic API; `sonnet` → Sonnet 5 (15).

Reference price points (VEN): enterprise Claude Code "average cost is around $13 per developer per active day and $150-250 per developer per month, with costs remaining below $30 per active day for 90% of users" (4). Managed Code Review "$15-25 in cost, scaling with PR size" and "completing in 20 minutes on average" (12). Ultrareview "typically $5 to $25 in usage credits", "typically takes 5 to 10 minutes", "up to 500 changed files and 8,000 changed lines by default", 3 free runs on Pro/Max, `claude ultrareview --json` prints `bugs.json`, `--timeout` default 45 minutes (13). Background token usage "typically under $0.04 per session" (4). Anthropic research system: "agents typically use about 4× more tokens than chat interactions, and multi-agent systems use about 15× more tokens than chats"; "token usage by itself explains 80% of the variance" in BrowseComp (18). Harness: 20x cost, $9 → $200 (21).

#### B2. Hard budget and concurrency caps available today (11, 25)
- Spend: `maxBudgetUsd` (TS) / `max_budget_usd` (Python) / CLI `--max-budget-usd`: "refuses to spawn more subagents, returning `Budget limit reached`, stops background subagents that are still running, and ends the query with the `error_max_budget_usd` result subtype". Counts subagent requests. Client-side estimate at list price.
- Concurrency: `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20); depth `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (default 3, `1` disables nesting).
- Workflow: `budget.total` hard ceiling on output tokens for the turn (shared pool across main loop and workflows); 16 concurrent; 1,000 agents/run.
- Per-agent: `maxTurns` in subagent definitions (output marked partial at the limit; resumable).

#### B3. Estimated cost and wall-clock table per path

Assumptions (stated so they can be replaced by measured numbers): list prices above; each agent's first request carries ~25–40k uncached tokens (system prompt + tool definitions + CLAUDE.md + intake), later requests read that prefix from cache; a "request" is one API round-trip per tool call; the implementer's context grows to 60k (light), 120k (medium), 150k (heavy per unit); output tokens per request 300–800 (thinking billed as output); cache hit rate 85–92% (the docs' example shows 91%). Cache write premium 1.25x (5-minute). Human time is wall-clock the developer is actually engaged.

| Path | Stage | Model / effort | Requests | Est. tokens (uncached in / cache read / out) | Est. cost | Est. wall-clock |
|---|---|---|---|---|---|---|
| LIGHT | Route (script) | none | 0 | 0 | $0 | <1 s |
| LIGHT | Implement | Sonnet 5 / medium | 15–30 | 40k / 0.8–1.5M / 10–20k | $0.4–0.8 | 3–8 min |
| LIGHT | Gate (hook) | none | 0 | 0 | $0 | 0.5–3 min (tests) |
| LIGHT | One reviewer | Haiku 4.5 or Sonnet 5 / low | 5–10 | 20k / 100–200k / 3–5k | $0.03 (Haiku) – $0.15 (Sonnet) | 1–3 min |
| LIGHT | Total | | | | **$0.5–1.2** ($1.2–3 if Opus 5 implements) | **5–15 min**, ~0 human min |
| MEDIUM | Plan | Opus 5 / high (plan mode) | 15–25 | 40k / 1–2M / 15–25k | $1–2 | 3–6 min |
| MEDIUM | Plan check | Haiku 4.5 / low | 2–4 | 15k / 30k / 2k | $0.03 | <1 min |
| MEDIUM | Implement | Sonnet 5 / high | 60–100 | 60k / 5–8M / 40–60k | $2–3.5 (Sonnet) / $6–9 (Opus 5) | 10–25 min |
| MEDIUM | Gate | none | 0 | 0 | $0 | 1–5 min |
| MEDIUM | 2 lens reviewers (parallel, shared prefix) | Sonnet 5 / medium | 2 × 8–12 | 30k + 5k / 300k each / 5k each | $0.3–0.6 total | 2–4 min |
| MEDIUM | Refuters (1 per finding, ~3 findings) | Sonnet 5 / medium | 3 × 5–8 | | $0.2–0.5 | 2–3 min (parallel) |
| MEDIUM | Send-back fix (×1) + re-gate | Sonnet 5 | 20–30 | | $0.7–1.5 | 5–10 min |
| MEDIUM | Total | | | | **$4.5–9** (Sonnet impl) / **$9–16** (Opus impl) | **25–55 min**, 2–5 human min |
| HEAVY | Spec interview | Opus 5 / high (main session) | 10–20 | | $1–2 | 10–20 min (mostly human) |
| HEAVY | Decompose | Opus 5 / high | 10–20 | | $1–3 | 3–6 min |
| HEAVY | Spikes (3 parallel, worktrees) + judge panel | Sonnet 5 / medium; judges Opus 5 | 3 × 30–50; 3 × 3 | | $4–8 + $0.5–1.5 | 8–15 min |
| HEAVY | Implement 4 units (pipeline, worktrees) | Sonnet 5 or Opus 5 / high | 4 × 60–100 | | $10–15 (Sonnet) / $25–40 (Opus) | 15–35 min wall (parallel) |
| HEAVY | Gates (unit + integration) | none | 0 | | $0 | 3–10 min |
| HEAVY | 5 lens reviewers (shared prefix) | Sonnet 5 / medium | 5 × 10–15 | | $1–2 | 3–5 min |
| HEAVY | Verifier pass (3 skeptics × ~8–12 findings) | Sonnet 5 / medium | 24–36 × 4–6 | | $2–4 | 3–6 min |
| HEAVY | Send-back fixes (2 units × 1) + re-gate | Sonnet 5 | 2 × 20–30 | | $1.5–3 | 8–15 min |
| HEAVY | Blind verdict | Opus 5 / xhigh (or Fable 5.1 / high) | 3–8 | 150–250k uncached / small / 10–20k | $1–2 (Opus 5) / $2.5–5 (Fable 5.1) | 3–8 min |
| HEAVY | Human gate | | | | $0 | 10–20 human min |
| HEAVY | Optional ultrareview | cloud fleet | | | $5–25 | 5–10 min (background) |
| HEAVY | Total | | | | **$25–45** (Sonnet impl) / **$45–90** (Opus impl), +$5–25 ultrareview | **60–150 min**, 20–40 human min |

Sanity checks against vendor numbers: the HEAVY/LIGHT cost ratio (~30–70x) brackets Anthropic's "over 20x" harness-vs-solo figure (21) and its 15x multi-agent-vs-chat token ratio (18); one MEDIUM run costs about half a managed Code Review ($15–25) and roughly one ultrareview ($5–25). These are ESTIMATES; replace them with the measured `cost_usd`/`duration_ms` from B4 after the first 10 runs per path.

Cache design rules that materially change these numbers: (a) make all lens reviewers the same `agentType`/model/effort/tools/schema and put the lens in the PROMPT, so they share one cached prefix (2); (b) set `subagentPromptCacheTtl: 1h` when the send-back loop can exceed 5 minutes between reviewer runs (costs 2x on writes, saves a full re-read of the prefix per reviewer); (c) never switch model or effort mid-session on the implementer (each model/effort has its own cache; the next request re-reads the whole history) (5); (d) `opusplan` toggles the model on every plan-mode switch and therefore starts a fresh cache each time (5).

#### B4. Telemetry design

Per-stage event (one JSONL line per stage attempt; write to `.claude/telemetry/events.jsonl`, keyed by task):
```
{ ts, task_id, path, path_at_start, route_changes: [{stage, from, to, reason}],
  stage, stage_attempt, run_id (workflow.run_id | session_id), prompt_id, agent_id, agent_type,
  model, effort, requests, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens,
  cost_usd_est, wall_ms, api_ms, tool_calls, gate: {name, pass, duration_ms},
  verdict: pass|fail|unverified, findings: {reported, confirmed, refuted, unverified},
  send_backs, human: {interventions, minutes}, diff: {files, insertions, deletions, zones_touched, predicted_files, predicted_lines},
  commit_hash, claude_code_version, model_regime_id }
```

How to capture each field (what the platform provides today):
1. Hooks → JSONL (deterministic). Every hook receives `session_id`, `prompt_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `permission_mode`, `hook_event_name`; inside a subagent also `agent_id`, `agent_type` (8). Use: `SessionStart` (open task record), `UserPromptSubmit` (route decision), `SubagentStart`/`SubagentStop` (`agent_id`, `agent_type`, `last_assistant_message` — parse the reviewer's JSON verdict from it; note SubagentStop does NOT carry the subagent's transcript path), `PostToolUse` on `Bash` (gate command, `success`, duration), `Stop` (`stop_hook_active`, `consecutive_blocks`; a Stop hook can block at most 10 consecutive times), `TaskCompleted` (teams). Hooks can also be declared in a subagent's frontmatter and run only while it runs (a `Stop` hook there becomes `SubagentStop`).
2. OpenTelemetry (token/cost truth per request): `CLAUDE_CODE_ENABLE_TELEMETRY=1`, `OTEL_METRICS_EXPORTER=otlp|prometheus|console`, `OTEL_LOGS_EXPORTER=otlp|console`. `claude_code.api_request` event carries `model`, `cost_usd`, `duration_ms`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, `effort`, `speed`, `agent.name`, `skill.name`, `prompt.id`, `request_id`; `claude_code.tool_result` carries `tool_name`, `tool_use_id`, `success`, `duration_ms`, `result_tokens`; metrics `claude_code.cost.usage` and `claude_code.token.usage` carry `query_source` = `main|subagent|auxiliary` and `type` = input/output/cacheRead/cacheCreation; `claude_code.active_time.total` (seconds) approximates human-engaged time; standard attribute `workflow.run_id` (prefix `wf_`) on events from workflow agents (7). GOTCHA: "user-defined agent names are replaced with `"custom"` unless `OTEL_LOG_TOOL_DETAILS=1`" — set it, or per-stage attribution is lost. For a solo developer, `OTEL_LOGS_EXPORTER=console` piped to a file, or a 30-line local OTLP/HTTP receiver, is enough.
3. Session-level: `/usage` Session block (total cost, API vs wall duration, per-model tokens, `Prompt cache (main)` hit ratio line, v2.1.251+), status-line `current_usage` and `prompt_cache` objects (4, 5). `/insights` writes `~/.claude/usage-data/report.html`.
4. Scripted runs: `claude -p ... --output-format json` returns `result`, `total_cost_usd`, `duration_ms`, `duration_api_ms`, `num_turns`, `usage`, `modelUsage`. Caveats from the SDK docs: `usage` EXCLUDES subagent tokens; `total_cost_usd` and `modelUsage` INCLUDE them; per-step assistant `output_tokens` is a placeholder — read output from the result; parallel tool calls share one message id (dedupe); a resumed session's result includes the session's earlier spend (v2.1.277+) (10). `claude ultrareview --json` prints `bugs.json`; exit codes 0/1/130 (13).
5. Transcripts: `~/.claude/projects/<project>/<session>.jsonl` (every message, tool call, result) and `<session>/subagents/`; workflow `journal.jsonl` and `agent-<id>.jsonl` per run; all deleted after `cleanupPeriodDays` (30 by default) — export nightly or telemetry disappears (9, 25).
6. Git: record `commit_hash` at LAND; attach `task_id` and `tier` with `git notes` or a commit trailer so later escapes can be attributed via `git blame`/`bisect`.

#### B5. Metric definitions (formulas) and why the vanity metrics fail

Let L = set of landed items in the window; for item i: t_intake(i), t_green(i) = first time the deterministic gate passed after implementation, t_land(i); sb(i) = send-backs; cost(i) = Σ cost_usd over all stage attempts incl. re-runs; hmin(i) = human minutes.

- Time-to-green: TTG(i) = t_green(i) − t_intake(i); report median and p90 per path. Time-to-land: TTL(i) = t_land(i) − t_intake(i).
- Rework rate: RR = Σ sb(i) / |L|; correction-cycle rate = Σ gate_failures(i) / |L|; post-land churn (GitClear's definition, 14-day window): C14 = lines of the change modified or reverted within 14 days / lines landed.
- Defect escape rate: DER = |{defects found after landing within N days attributed to i}| / |L|, per tier. Attribution: bug fix commit touches lines introduced by i (`git blame`) or bisect lands on i.
- Catch rate per reviewer layer ℓ: CR_ℓ = confirmed findings first raised by ℓ / (all confirmed findings across layers + escapes); precision P_ℓ = confirmed_ℓ / reported_ℓ; unverified fraction U_ℓ = unverified_ℓ / reported_ℓ; cost per confirmed finding = cost_ℓ / confirmed_ℓ.
- Cost per landed change: CPL = Σ cost(i) / |L| per tier; include ultrareview and failed/abandoned attempts.
- Human minutes per landed change: HPL = Σ hmin(i) / |L|, where hmin = interview + plan approval + gate review + fixes + verdict review (from `active_time.total` plus a manual timer for off-terminal time).
- pass^k consistency (tau-bench, 36; Anthropic evals, 19: "pass^k measures the probability that all k trials succeed"; pass@k "at least one correct solution in k attempts"): for an eval set E, pass^k = (1/|E|) Σ_e 1[all k runs of e pass]; estimate per task as (successes/k choose...) or simply run k=3 independently. tau-bench leaderboard shows how fast it falls: retail pass^1 0.692 → pass^4 0.462; airline 0.460 → 0.225 (Claude 3.5 Sonnet, tool-calling). Use pass^3 for gate reliability (flaky tests) and for the eval set.
- Route accuracy: RA = |{i finished in its initial tier}| / |L|; over-routing = demotions / heavy-entries; under-routing = promotions / light+medium entries.
- Acceleration claim test: compare TTL, RR, DER, CPL, HPL between paths on matched tasks (B6) — never compare raw output volume.

Why the vanity metrics fail (evidence):
- Lines/commits: GitClear 2025 PDF (35; 211M lines): "moved" (refactored) lines fell from 24.1% (2020) to 9.5% (2024) while copy/paste rose (8.3% → 12.3%) and churn rose (3.1% → 5.7%) (figures cross-checked with failure-modes.md S23); GitClear warns against measuring productivity by commit count or lines. DORA 2024 (34): "As AI adoption increased, it was accompanied by an estimated decrease in delivery throughput by 1.5%, and an estimated reduction in delivery stability by 7.2%" per 25% adoption increase; "improving the development process does not automatically improve software delivery — at least not without proper adherence to the basics ... like small batch sizes and robust testing". DORA 2025 (33): 90% use AI; positive relationship with throughput now, but "AI adoption does continue to have a negative relationship with software delivery stability"; "AI doesn't fix a team; it amplifies what's already there."
- Self-report: METR 2025 RCT (38, BLOCKED; via notes): 16 experienced OSS developers, 246 tasks, 19% slower with AI while forecasting +24% and believing +20% afterwards. Treat as "self-report is invalid", not as a claim about 2026 tools (METR announced a design update in 2026-02; blocked).
- Findings count: best practices (14) — reviewers report gaps even when the work is sound; Bosu (30) — comment usefulness falls with change size; Czerwonka (31) abstract — "code reviews often do not find functionality issues that should block a code submission". Count only refuter-confirmed findings.
- "Tests pass": the harness post (21) — the evaluator "is inclined to be generous"; use pass^k and seeded defects.

#### B6. Experiment protocol for a solo developer

1. Seeded-defect calibration per reviewer tier (2–3 hours, then 30 min per model change). Take 20–30 recent landed diffs of mixed tiers. For each, seed exactly one defect of a known class — logic (inverted condition/off-by-one), contract (missing null/edge/unhandled error), scope (an extra unrelated change), security (missing authz check). Run each reviewer layer (light single reviewer; medium panel+refuter; heavy panel+verifier; blind verdict; optionally ultrareview on a subset) k=3 times per seeded diff. Record per layer: catch rate by class, precision (false findings / reported), unverified fraction, cost, wall time. Baseline = deterministic gate alone. Anthropic evals (19): "20-50 simple tasks drawn from real failures is a great start"; grade each dimension with an isolated judge; "You won't know if your graders are working well unless you read the transcripts and grades from many trials."
2. Alternating light/heavy on comparable tasks. Restrict to boundary tasks (router score 2–4 or 7–9). Pre-register the assignment (ABAB by task arrival, or coin flip recorded in router.jsonl before starting). Compare TTL, RR, DER (30-day window), CPL, HPL. Minimum 10 pairs; paired sign test. Decision rule: if the heavier path does not reduce (RR + DER) by more than the cost ratio justifies (e.g. <20% fewer send-backs+escapes at >2x cost and >1.5x TTL), lower the threshold for that band; if the lighter path produced any escape in a hard-floor zone, the floor stays regardless of the average.
3. Eval set from 20–50 past failures with transcripts. Mine `~/.claude/projects/` transcripts (before the 30-day cleanup) and git history for: wrong problem solved, scope creep, broken contract, missing test, regression, "fixed the symptom". For each: intake text, the transcript, the final diff, what went wrong, the fixing commit. Convert into a task with a code grader (a test or a diff assertion) and, for judgment-heavy cases, a rubric graded per dimension by an isolated judge with an "Unknown" option. Run pass^3 per path; this is the regression suite for every change to the funnel.
4. Layer retirement rule. A layer whose unique confirmed catches stay at 0 AND precision <50% across N=30 runs (≥20 seeded + ≥10 real) is disabled (kept in config, logged). One layer at a time ("removing one component at a time and reviewing what impact it had", 21); re-run the seeded set after each removal ("As Claude gets more capable, those assumptions should be tested", 22).
5. Re-validation on model change. Each model has its own prompt cache and its own behavior; treat `(model id, effort, Claude Code version)` as a regime id in telemetry. On a change: re-run step 1 (seeded set, k=3) and step 3 (failure eval, pass^3) BEFORE trusting old thresholds; re-tune effort per stage (the claude-api skill: effort matters more on newer models; lower effort on a newer model often matches higher effort on the older one); compare CR_ℓ, P_ℓ, CPL against the previous regime; keep or strip layers per rule 4. Anthropic (19): teams with evals "can quickly determine the model's strengths, tune their prompts, and upgrade in days".

---

## Anti-patterns

1. Applying the full funnel uniformly. Vendor data: <50-line PRs yield findings only 31% of the time (0.5 avg) at $15–25 and ~20 min (23); harness = 20x cost (21); "If you could describe the diff in one sentence, skip the plan" (14).
2. Routing by an LLM alone, unlogged. RADAR (39, NOTES) and Anthropic's SDLC (24) put deterministic gates and heuristics before ML/LLM and log every decision "with the signals it used". A classifier without floors and logs cannot be calibrated.
3. Using a universal weight set. Nagappan/Ball/Zeller (29): "no single set of complexity metrics that could act as a universally best defect predictor."
4. Measuring acceleration by lines, commits or self-report (35, 34, 33, 38).
5. Counting reviewer findings as value; reviewers over-report (14), usefulness drops with size (30). Count refuter-confirmed findings and precision per layer.
6. Letting the implementing session judge its own work: "A fresh context improves code review since Claude won't be biased toward code it just wrote" (14); the evaluator "is inclined to be generous" (21).
7. Agent teams for sequential or same-file work: ~7x tokens in plan mode (4), coordination overhead, plan auto-approval without review (3).
8. Ignoring the cache when designing fan-outs: reviewers with different model/effort/agentType/schema do not share a prefix (2); switching model/effort mid-session re-reads the whole history (5); subagents get 5-minute TTL by default even on a subscription (5).
9. Reading `usage` from the SDK result as total spend — it excludes subagents; per-step `output_tokens` is a placeholder (10).
10. Custom subagent names redacted to "custom" in OTel unless `OTEL_LOG_TOOL_DETAILS=1` (7) — stage attribution silently lost.
11. Relying on transcripts as the telemetry store — deleted after 30 days (9).
12. Keeping a review layer because it once caught something; strip layers as models improve (21, 22).
13. Promote/demote flip-flopping; fix with a one-way counter per task.
14. Trusting the "16 concurrent agents" figure everywhere: 16 is the workflow runtime cap (min(16, CPUs−2)); subagents via the Agent tool cap at 20; both lifted under ultracode (1, 2).

## Open questions

1. Router weights: only a prior; needs ~50 logged tasks per repo to fit. Which of the 14 signals actually carry signal for AI-authored changes is unknown — all cited defect-prediction studies are about human-authored changes.
2. Does "agent novelty in a module" behave like Bird's minor-contributor effect? No evidence either way.
3. Does test coverage of the target area predict AI-change defects? The human-code literature is weak/mixed and was not re-verified (BLOCKED).
4. Kamei JIT numbers (68% accuracy / 64% recall / 35% of defect-inducing changes with 20% effort) are from memory — unverified.
5. Meta RADAR details (1/3 revert, 1/50 incident, p25→p50 threshold → 60.31% approve) come from another researcher's search snippets; the paper is BLOCKED.
6. The `TaskCompleted` exit-2 semantics conflict between my two fetched summaries (blocks vs does not block).
7. Whether Fable 5.1 as the blind judge adds catch rate worth 2x Opus 5's price; only the seeded-defect calibration can answer it.
8. How to automate escape attribution (blame/bisect) reliably in a solo repo without a bug tracker.
9. What ultrareview's fleet size and per-finding precision are — not published.
10. The cost table is unmeasured; the first 10 runs per path replace it.

## Design implications for the funnel

1. The separator is a deterministic script with hard floors, plus a Haiku classifier only for what git cannot see; the classifier never lowers a floor. Every decision and re-check is one JSONL line.
2. Three paths with explicit entry criteria and stop rules; promotion after two failed corrections, zone contact, or size overshoot; demotion only at the plan stage, once.
3. Reviewers are one agent type with the lens in the prompt (cache sharing); refuters confirm; unverifiable is a first-class verdict; the blind judge sees a style-stripped bundle and cannot talk to the author.
4. Budgets are enforced, not advised: `--max-budget-usd` / `maxBudgetUsd`, workflow `budget.total`, `maxTurns`, concurrency and depth caps; `workflowSizeGuideline: small` for LIGHT/MEDIUM runs.
5. Telemetry is hooks (JSONL) + OTel (`OTEL_LOG_TOOL_DETAILS=1`) + `claude -p --output-format json` for scripted stages + nightly export of transcripts/journals + git notes with task_id/tier.
6. Acceleration is proven only by TTL, rework, escapes, cost/landed and human-minutes/landed on matched tasks, with pass^3 for gate reliability; never by lines, commits, findings counts or how it felt.
7. Every layer has an expiry: seeded-defect catch rate ≈0 and precision <50% over 30 runs → strip it; re-run the seeded set on every model/effort/version change.
