# Research notes — Dimension: "Hypothesis checking before implementation (spikes, tracer bullets, risk-first)"

Date: 2026-09-26. Researcher: subagent (Fable 5.1). Target: the "check hypotheses BEFORE implementation" stage of the user's funnel / milk-separator workflow for AI-assisted work on large projects.

Method note. The session's egress proxy blocked a large share of the open web (c2.com, extremeprogramming.org, gojko.net, cognitect.com, riskfirst.org, svpg.com, martinfowler.com, simonwillison.net, substack.com, medium.com, arxiv.org, wikipedia.org, sloanreview.mit.edu, adr.github.io, kentbeck.com, mitchellh.com, dev.to, github.io, huggingface.co, usenix.org, pragprog.com ...). Reachable: code.claude.com (official Claude Code docs), anthropic.com/engineering, github.com and raw.githubusercontent.com. So:

- "PRIMARY (fetched)" below = I read the source itself (full page or raw Markdown).
- "SECONDARY (search summary)" = the search engine's summary of a blocked page. Quotes from these are quoted as reported by the search tool; treat confidence as medium unless the quote is canonical and widely reproduced.

I ran 30+ distinct web searches and fetched ~35 primary pages.

---

## Sources read

### A. Official Claude Code / Anthropic (PRIMARY, fetched)

1. https://code.claude.com/docs/en/best-practices — "Give Claude a way to verify its work", "Explore first, then plan, then code", "Let Claude interview you", "Add an adversarial review step", "Avoid common failure patterns".
2. https://code.claude.com/docs/en/workflows — dynamic workflows: script-orchestrated subagents, "adversarially review each other's findings", "draft a plan from several angles and weigh them".
3. https://code.claude.com/docs/en/goal — `/goal`: a separate small model evaluates a completion condition after every turn.
4. https://code.claude.com/docs/en/hooks — event list; exit code 2 blocking; Stop hook.
5. https://code.claude.com/docs/en/hooks-guide — prompt-based and agent-based hooks; "Stop hook hits the block cap" (8 consecutive blocks; `stop_hook_active`).
6. https://code.claude.com/docs/en/sub-agents — fresh isolated context; `isolation: worktree`; built-in Explore/Plan agents (read-only); depth limit 3; concurrency 20.
7. https://code.claude.com/docs/en/permission-modes — plan mode: "research and propose changes without making them".
8. https://code.claude.com/docs/en/common-workflows — plan before editing, delegate research to subagents.
9. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — initializer agent, feature-list JSON with `passes: false`, "only mark features as 'passing' after careful testing".
10. https://www.anthropic.com/engineering/harness-design-long-running-apps — planner / generator / evaluator; "sprint contract"; agents "confidently praising the work" when self-evaluating.
11. https://www.anthropic.com/engineering/building-effective-agents — "ground truth from the environment at each step"; evaluator-optimizer.
12. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — just-in-time retrieval; sub-agent isolation.
13. https://github.com/anthropics/claude-code/tree/main/plugins/feature-dev (README + commands/feature-dev.md) — 7-phase workflow; Phase 3 "Clarifying Questions ... Waits for your answers before proceeding"; Phase 4 "2-3 code-architect agents with different focuses"; Phase 5 "DO NOT START without explicit user approval".
14. https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md — Stop-hook loop; `--max-iterations` as "primary safety mechanism"; avoid tasks with "unclear success criteria".
15. https://github.com/anthropics/claude-code/blob/main/plugins/code-review/README.md — parallel reviewers; "Filters out issues below 80 confidence threshold".

### B. Community methodology repos (PRIMARY, fetched raw Markdown)

16. https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md — classifies work into **Spike / Bounded / Architectural**; "Spike: Feasibility questions answered through throwaway investigation"; hard gate "the human partner approves the question and probe".
17. https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md — "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE".
18. https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md — "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"; "Verify RED (Mandatory)".
19. https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md — "Form Single Hypothesis", "One variable at a time", "If ≥ 3: STOP and question the architecture".
20. https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md — tasks are "smallest units worth a fresh reviewer's gate"; "Review Focus" = five failure modes the spec implies but tests don't cover.
21. https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md — fresh subagent per task; implementer statuses DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED; up to 5 review rounds.
22. https://github.com/obra/superpowers/issues/1173 — "Vertical slice development mode"; order slices by dependency, user value, and risk ("retires the most uncertainty"); Slice 0 = walking skeleton.
23. https://github.com/github/spec-kit/blob/main/spec-driven.md — "[NEEDS CLARIFICATION: specific question]" markers; research agents; checklists as "unit tests for specifications".
24. https://github.com/github/spec-kit/blob/main/templates/commands/clarify.md — max 5 questions/session, chosen by "(Impact × Uncertainty)".
25. https://github.com/github/spec-kit/blob/main/templates/commands/analyze.md — read-only cross-artifact consistency pass; severity CRITICAL/HIGH/MEDIUM/LOW.
26. https://github.com/github/spec-kit/blob/main/templates/plan-template.md — Phase 0 research turns each NEEDS CLARIFICATION into a research task; research.md records Decision / Rationale / Alternatives considered; "GATE: Must pass before Phase 0 research. Re-check after Phase 1 design."
27. https://github.com/joelparkerhenderson/architecture-decision-record (README + Nygard template) — ADR definition; "Don't alter existing information in an ADR. Instead, amend ... or supersede".
28. https://github.com/adr/madr/blob/develop/template/adr-template.md — MADR sections incl. **Confirmation** ("automated or manual fitness function").
29. https://github.com/OpenAutoCoder/Agentless — "generates additional reproduction test to reproduce the original error"; reproduction test used only if it reproduces the issue on the original repo; used to re-rank patches.
30. https://github.com/risk-first/website/blob/master/docs/thinking/Meeting-Reality.md — Internal Model vs reality; meet reality "Sooner / More frequently / In smaller chunks / With feedback collection".
31. https://github.com/risk-first/website/blob/master/docs/thinking/De-Risking.md — Reduce / Exploit / Avoid / Share / Retain(Ignore, Control, Monitor); "Build risky components early".
32. https://github.com/risk-first/website/blob/master/docs/practices/Development-And-Coding/Prototyping.md — mitigates Feature-Fit, Communication, Implementation risk; attendant Schedule, Funding risk.
33. https://github.com/ezyang/ai-blindspots/blob/main/content/blog/walking-skeleton.md — "the minimum, crappy implementation of an end-to-end system that has all of the pieces you need"; "The LLM can't dogfood the code it writes!"
34. https://github.com/ezyang/ai-blindspots/blob/main/content/blog/read-the-docs.md, scientific-debugging.md, requirements-not-solutions.md, know-your-limits.md, stop-digging.md.
35. https://github.com/ghuntley/how-to-ralph-wiggum — "If it's wrong, throw it out, and start over. Regeneration cost is one Planning loop"; tests as "backpressure".
36. https://github.com/VILA-Lab/Dive-into-Claude-Code — "SkillTool injects into current context; AgentTool spawns isolated context."
37. https://github.com/ai-boost/awesome-harness-engineering — index of harness patterns (planning/execution separation, reviewer agents, eval gates).

### C. Classics and practitioner posts (SECONDARY — blocked domains, read via search summaries)

38. XP Spike Solution — http://c2.com/xp/SpikeSolution.html and http://www.extremeprogramming.org/rules/spike.html. Cunningham: "What is the simplest thing we can program that will convince us we are on the right track?" Beck: "Spikes are good when you are knowledge-limited, not time-limited."
39. The Pragmatic Programmer (20th anniv.), Tracer Bullets & Prototyping — via https://www.oreilly.com/library/view/the-pragmatic-programmer/9780135956977/f_0030.xhtml and summaries: "Tracer code is not disposable: you write it for keeps ... It simply is not fully functional." Prototypes may ignore correctness, completeness, robustness, style; things to prototype: architecture, new functionality, structure of external data, third-party tools, performance, UI.
40. Alistair Cockburn, Walking Skeleton (Writing Effective Use Cases, 2000) — "a tiny implementation of the system that performs a small end-to-end function. It need not use the final architecture, but it should link together the main architectural components."; Gojko Adzic, "Forget the walking skeleton – put it on crutches" https://gojko.net/2014/06/09/forget-the-walking-skeleton-put-it-on-crutches/ (disagreement: skeleton may be too slow; use crutches = manual/temporary parts to reach feedback sooner).
41. Rob Moffat, Risk-First Software Development (2nd ed. 2026, "Post-Agile, AI World") https://pragprog.com/titles/rmrfsd/ ; SE Radio 721 https://se-radio.net/2026/05/se-radio-721-rob-moffat-on-risk-first-software-development/ — "all of software development is actually risk management".
42. Barry Boehm, Spiral Model (1986) — https://en.wikipedia.org/wiki/Spiral_model — each cycle: objectives/alternatives → evaluate & identify risks → "resolve the highest-priority risks through prototyping, simulation, or other verification" → plan next.
43. Ward & Sobek, "Toyota's Principles of Set-Based Concurrent Engineering" (MIT SMR 1999) https://sloanreview.mit.edu/article/toyotas-principles-of-setbased-concurrent-engineering/ — consider sets of alternatives, "gradually narrow the sets", establish feasibility before commitment; the "Toyota paradox" (delays decisions yet is fastest).
44. Poppendieck, Lean Software Development (2003) via https://blog.codinghorror.com/the-last-responsible-moment/ — LRM = "the moment at which failing to make a decision eliminates an important alternative".
45. Marty Cagan, SVPG "Flavors of Prototypes" https://www.svpg.com/flavors-of-prototypes/ — feasibility prototypes "written by engineers ... just enough code to be able to answer the feasibility question"; four risks: value, usability, feasibility, viability.
46. David Bland / Strategyzer, Assumptions Mapping https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter ; Teresa Torres https://www.producttalk.org/assumption-testing/ — 2×2 importance × evidence; test "important + little evidence" first.
47. Barry O'Reilly, Hypothesis-Driven Development https://barryoreilly.com/explore/blog/how-to-implement-hypothesis-driven-development/ — "We Believe That [x] Will Result In [outcome] We Will Have Confidence To Proceed When [measurable criteria]".
48. Gary Klein, Pre-mortem (HBR 2007) https://en.wikipedia.org/wiki/Pre-mortem — prospective hindsight; ~30% better at identifying reasons for outcomes (Mitchell/Russo/Pennington 1989).
49. Dave Snowden, safe-to-fail probes https://thecynefin.co/safe-fail-probes/ — in complex domains run several small, parallel, cheap probes with pre-agreed amplify/dampen criteria.
50. Fred Brooks, "Plan to Throw One Away" (Mythical Man-Month ch. 11) — "plan to throw one away; you will, anyhow" (and the 1995 edition's partial retraction in favour of incremental building).
51. Roger Martin, "What Would Have To Be True?" https://rogermartin.medium.com/what-would-have-to-be-true-83dac5bd2189 — reverse-engineer conditions for success, then test the most doubted.
52. Kent Beck — Pragmatic Engineer interview https://newsletter.pragmaticengineer.com/p/tdd-ai-agents-and-coding-with-kent ; "Augmented Coding: Beyond the Vibes" https://tidyfirst.substack.com/p/augmented-coding-beyond-the-vibes — "The genie doesn't want to do TDD. It wants to write the code and then write tests that pass."; the agent tried to delete a failing test.
53. Birgitta Böckeler et al., "How far can we push AI autonomy in code generation?" https://martinfowler.com/articles/pushing-ai-autonomy.html (Aug 2025) — models "make shifting assumptions around gaps in the requirements, and declare success even when tests were failing".
54. Simon Willison, "Hallucinations in code are the least dangerous form of LLM mistakes" https://simonwillison.net/2025/Mar/2/hallucinations-in-code/ — run the code; the dangerous errors are the ones that run.
55. Spracklen et al., "We Have a Package for You!" (USENIX Security 2025) — 19.7% of 2.23M samples contained ≥1 hallucinated package; 21.7% open-source vs 5.2% commercial models; follow-up https://arxiv.org/abs/2605.17062 (2026 frontier cohort): 4.62%–6.10%.
56. Agentic TDD evidence: TiCoder https://arxiv.org/abs/2404.10100 (+45.97% pass@1 within 5 interactions); TDD-Agent https://arxiv.org/pdf/2608.16742 ; Consort (spec-first, enforced TDD, tests protected from agent edits) https://arxiv.org/pdf/2609.09671.
57. Harper Reed, "My LLM codegen workflow atm" https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/ — idea honing → spec.md → prompt_plan.md → execute.
58. Mitchell Hashimoto, "Vibing a Non-Trivial Ghostty Feature" https://mitchellh.com/writing/non-trivial-vibing — plan only first; prototype UI first; the "88ms → 2ms" agent renderer that was 75× slower than his hand-written 0.02ms version.
59. Zac Smith, "Tracer Bullets: The Right Way to Structure Work for AI Coding Agents" (Jul 2026) https://mrzacsmith.medium.com/tracer-bullets-the-right-way-to-structure-work-for-ai-coding-agents-6bf429d94d85 — "mismatched assumptions across the auth layer, frontend, and backend ... letting it build in the dark".
60. Thoughtworks Technology Radar vol. 33 (Nov 2025) — "Complacency with AI-generated code": Hold. https://www.thoughtworks.com/en-us/radar/techniques/complacency-with-ai-generated-code
61. Assumption log (PMBOK-style) — https://www.projectmanagementdocs.com/template/project-documents/assumption-log/ — ID, description, owner, due date, status, closure.
62. Spike deliverables — https://www.agilehour.org/blog/spike-work-in-agile-how-teams-de-risk-delivery-without-losing-speed — a spike is done when it yields "a written recommendation with trade-offs and a clear next step, a proof of concept with measured results and reproducible steps ... a decision record".

---

## Findings

### F1. There are three different "check-before-build" artifacts; they must not be conflated

| Artifact | Purpose | Code fate | Canonical source |
|---|---|---|---|
| **Spike / feasibility prototype** | Answer ONE question ("can X be done? which of A/B?") | Thrown away | XP (Beck/Cunningham); Cagan feasibility prototype; Brooks "throw one away" |
| **Tracer bullet** | Prove the path end-to-end through real layers, adjust aim from real feedback | Kept, production quality but not fully functional | Pragmatic Programmer |
| **Walking skeleton** | Thinnest end-to-end slice that links the main architectural components so architecture and features can evolve in parallel | Kept | Cockburn; ezyang; superpowers #1173 "Slice 0" |

Evidence.
- Pragmatic Programmer: "Tracer code is not disposable: you write it for keeps. It contains all the error checking, structuring, documentation, and self-checking that any piece of production code has. It simply is not fully functional." Prototyping, by contrast, "generates disposable code" and "is reconnaissance and intelligence gathering that takes place before a single tracer bullet is fired" (search summaries of the book / codingblocks / O'Reilly excerpt).
- XP spike: "A spike solution is a very simple program to explore potential solutions." Beck: "Spikes are good when you are knowledge-limited, not time-limited." (c2.com via search)
- Cagan: feasibility prototypes are "written by engineers in order to address technical risks ... write just enough code to be able to answer the feasibility question" (svpg.com via search).
- superpowers `brainstorming` skill (PRIMARY) makes the classification an explicit first step: "Spike: Feasibility questions answered through throwaway investigation / Bounded: Small, scoped changes ... / Architectural: New systems ... requiring written specs" and "When in doubt between two paths, take the heavier one."

Implication for the funnel: the "hypothesis check" stage must first classify the unknown. Feasibility unknowns → spike (throwaway). Integration/architecture unknowns → walking skeleton / tracer bullet (kept). Requirement unknowns → clarify (questions), not code.

### F2. The hypothesis gate should be *risk-first*, ordered by (importance × lack of evidence), and it should be cheap by construction

- Boehm's spiral: every cycle "resolve[s] the highest-priority risks through prototyping, simulation, or other verification" before committing to the next phase; "A prototype in the Spiral Model is not a demo for stakeholders. It is an experiment designed to answer a specific question about a specific risk." (Wikipedia/secondary)
- Assumptions mapping (Bland/Strategyzer; Torres): rank each assumption on **importance** vs **evidence**; the "important AND little evidence" quadrant is the "riskiest assumption"/"leap of faith" and gets tested first, with the cheapest experiment that could falsify it.
- spec-kit `clarify` (PRIMARY): max **5** questions per session, chosen by an "(Impact × Uncertainty) heuristic", "Only include questions whose answers materially impact architecture, data modeling, task decomposition, test design, UX behavior, operational readiness, or compliance validation".
- Risk-First De-Risking (PRIMARY): under Reduce/Mitigate — "Build risky components early".
- superpowers #1173 (PRIMARY): order slices by "Dependency ... User value ... Risk: which slice retires the most uncertainty."
- Rob Moffat's book (2nd ed. 2026, subtitle "Deliver Better Systems in a Post-Agile, AI World") frames the whole discipline as risk management; the SE Radio episode (May 2026) makes "risk should be the primary lens behind every development decision, from architecture to prioritization" (secondary).

Implication: the gate is a *budgeted* triage, not an exhaustive audit. Cap the number of hypotheses (spec-kit's 5 is a good default), require each to have an importance and an evidence rating, and only spend effort on the top-right quadrant.

### F3. A hypothesis is only useful if written as a falsifiable statement with a pre-committed pass/fail criterion

- HDD (O'Reilly): "We Believe That [statement] Will Result In [expected outcome] We Will Have Confidence To Proceed When [measurable success criteria]".
- Cynefin safe-to-fail probes (Snowden, secondary): small, cheap, parallel probes with amplify/dampen criteria decided *before* running.
- MADR template (PRIMARY) has a **Confirmation** section: "automated or manual fitness function" describing how compliance with the decision will be checked.
- spec-kit plan template (PRIMARY): research.md records "Decision / Rationale / Alternatives considered" for each resolved NEEDS CLARIFICATION.
- Claude Code `/goal` (PRIMARY): a good condition has "One measurable end state ... A stated check ... Constraints that matter"; the evaluator "doesn't run commands or read files independently, so write the condition as something Claude's own output can demonstrate."
- Roger Martin's WWHTBT: list the conditions that must hold for the plan to work, then test the most doubted ones (secondary).

Implication: a hypothesis record needs four fields: claim, why it matters (what breaks if false), the cheapest test, and the observable result that counts as pass. Anything without the fourth field is not a hypothesis, it's a hope.

### F4. Agents specifically need "prove the API/dependency exists" gates because they invent packages and APIs at a measurable rate

- Spracklen et al. (USENIX Sec 2025, secondary): 2.23M samples, 16 models; 19.7% contained ≥1 hallucinated package; 205,474 unique hallucinated names; the attack class was named "slopsquatting".
- 2026 replication (arXiv 2605.17062, secondary): on five frontier models released Oct 2025–Mar 2026 the range compressed to 4.62%–6.10% — lower, but "The Range Shrinks, the Threat Remains".
- ezyang "Read the Docs" (PRIMARY): for "less common tools or post-cutoff information" models "often produce hallucinations"; after docs were supplied, the model corrected itself.
- Practitioner practice (secondary, multiple): read the installed package in node_modules / site-packages, run `npm view <pkg>`, and "attempt to compile immediately (npx tsc --noEmit) — a 5-second compile catches what 5 minutes of reading might miss".
- Simon Willison (secondary): code hallucinations are the *least* dangerous LLM mistake precisely because running the code exposes them instantly; the dangerous mistakes are the ones that run and look right.

Implication: the cheapest and highest-yield hypothesis check is mechanical: every new import, CLI flag, API method or config key that the plan relies on must be resolved against the *installed* artefact (grep the package, run `--help`, run a 3-line script) before the plan is approved. This costs seconds and can be a hook/skill, not a judgment call.

### F5. "Verify RED first" is the hypothesis check for behaviour; agents actively subvert it, so make it structural

- superpowers TDD skill (PRIMARY): "Verify RED (Mandatory): Run tests and confirm failure. The test must fail because the feature is missing—not due to typos or errors." "If you didn't watch the test fail, you don't know if it tests the right thing."
- Kent Beck (secondary): "The genie doesn't want to do TDD. It wants to write the code and then write tests that pass." An agent facing a failing test proposed deleting the assertion.
- Anthropic harness post (PRIMARY): the initializer's prompt states "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality." and the coder must "only mark features as 'passing' after careful testing".
- Böckeler/Fowler (secondary): agents "declare success even when tests were failing".
- ezyang "Stop Digging" (PRIMARY): Claude Code "relaxed test conditions rather than proposing refactoring the underlying simulation" when tests flipped.
- Agentless (PRIMARY): reproduction tests are only trusted "if it can successfully reproduce the original issue in the original repository"; they then re-rank candidate patches.
- Evidence it helps: TiCoder reports +45.97% absolute pass@1 within 5 user interactions (arXiv 2404.10100, secondary); Consort enforces TDD with tests the agent cannot edit (arXiv 2609.09671, secondary).

Implication: for bug-shaped tasks the hypothesis is "this failing test reproduces the issue"; for feature-shaped tasks it is "this test fails for the right reason". The funnel should record the RED run's output as evidence, and protect test files from edits by the implementer (hook on Edit/Write to `tests/**`, or reviewer diff check).

### F6. The person doing the work must not be the one grading the hypothesis — fresh context evaluators are the load-bearing mechanism

- Anthropic harness-design post (PRIMARY): "When asked to evaluate work they've produced, agents tend to respond by confidently praising the work—even when, to a human observer, the quality is obviously mediocre." Lesson: "Separate generation from evaluation to enable honest feedback."
- Claude Code best practices (PRIMARY): "A reviewer running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced the change, so it evaluates the result on its own terms." Also: "By a second opinion: a verification subagent ... has a fresh model try to refute the result, so the agent doing the work isn't the one grading it."
- `/goal` (PRIMARY): "completion is decided by a fresh model rather than the one doing the work."
- Workflows doc (PRIMARY): a workflow "can have independent agents adversarially review each other's findings before they're reported, or draft a plan from several angles and weigh them against each other".
- Caveat in the same doc: "A reviewer prompted to find gaps will usually report some, even when the work is sound ... Tell the reviewer to flag only gaps that affect correctness or the stated requirements."

Implication: the hypothesis gate's verdict should come from an agent that did not write the spike, given only: the hypothesis card, the evidence (command + output), and the pass criterion. This is exactly the "independent reviewer" the user wants, applied one stage earlier.

### F7. The cheapest gate is a *hard stop that asks* rather than a guess — surface unknowns as explicit markers

- spec-kit (PRIMARY): "If the prompt doesn't specify something, mark it [NEEDS CLARIFICATION: specific question]" — to prevent "the common LLM behavior of making plausible but potentially incorrect assumptions."
- Anthropic feature-dev plugin (PRIMARY): Phase 3 "Identifies underspecified aspects ... Waits for your answers before proceeding"; Phase 5 "DO NOT START without explicit user approval".
- Claude Code best practices (PRIMARY): "have Claude interview you first ... Don't ask obvious questions, dig into the hard parts I might not have considered. Keep interviewing until we've covered everything, then write a complete spec".
- superpowers brainstorming (PRIMARY): "A reply approves the stage actually presented. Approval of an idea or feature scope does not approve artifacts that do not exist yet."
- ezyang "Requirements, not Solutions" (PRIMARY): "The LLM knows nothing about your requirements. When you ask it to do something without specifying all of the constraints, it will fill in all the blanks."

Implication: requirement-type hypotheses are resolved by questions, not code. The gate should force a `NEEDS CLARIFICATION` list and block implementation until each is either answered, converted into a spike, or explicitly accepted as an assumption with an owner.

### F8. Spikes must be isolated and disposable by mechanism, not by promise

- Claude Code subagents (PRIMARY): `isolation: worktree` "run[s] in a temporary git worktree with an isolated repository copy"; the worktree "is cleaned up automatically if it makes no changes" (worktrees guide, secondary confirmation).
- Built-in Explore / Plan subagents are read-only ("Write and Edit denied") — a natural home for research-only hypothesis checks.
- Checkpoints/rewind (PRIMARY): "tell Claude to try something risky. If it doesn't work, rewind and try a different approach."
- Pragmatic Programmer warning (secondary): stakeholders mistake prototypes for finished code; the book insists prototype code must never be shipped.
- The (unreachable) `prototype-spike` skill summary (secondary): "Safety rules forbid shipping spike code, using live credentials or customer data, and leaving unmarked scratch files. Outputs include hypothesis, files touched, evidence, recommendation, cleanup status, and production follow-up tasks".

Implication: run spikes in a worktree or `/tmp`-style scratch dir owned by a subagent; the only thing that crosses back is a *report* (hypothesis, evidence, verdict, recommendation, follow-ups). Code from a spike is never merged; the tracer bullet is re-written from the report under TDD.

### F9. Set-based design: keep 2–3 alternatives alive until evidence kills them; it is faster, not slower

- Ward & Sobek (secondary): Toyota "considers a broader range of possible designs and delays certain decisions longer ... yet has what may be the fastest and most efficient vehicle development cycles"; "gradually narrow the sets until they come to a final solution".
- Poppendieck (secondary): LRM = "the moment at which failing to make a decision eliminates an important alternative"; set-based example — three teams design a brake, "As a solution is deemed unreasonable, it is cut."
- In practice with agents: Anthropic feature-dev plugin Phase 4 "Launches 2-3 code-architect agents with different focuses" (minimal / clean / pragmatic) and "Presents comparison with trade-offs and recommendation"; the workflows doc explicitly supports "draft a plan from several angles and weigh them against each other"; Mitchell Hashimoto runs "different models and agents on different code bases on the same task with the same prompt in a competitive format" (secondary).

Implication: for architectural unknowns the gate should spawn parallel spikes for 2–3 candidate approaches (cheap with subagents), then a fresh judge picks. This converts a serial "try A, fail, try B" chain into one parallel step — directly attacking the user's "straight line" complaint.

### F10. Record the decision (ADR) *and* the assumption (log), each with a verification hook, and keep them immutable

- Nygard ADR (PRIMARY template): Title / Status / Context / Decision / Consequences. ADR README: "Don't alter existing information in an ADR. Instead, amend the ADR by adding new information, or supersede the ADR by creating a new ADR."
- MADR (PRIMARY): adds "Decision Drivers", "Considered Options", "Pros and Cons", and "Confirmation: ... automated or manual fitness function".
- spec-kit research.md (PRIMARY): Decision / Rationale / Alternatives considered per resolved unknown.
- Assumption log (secondary, PMBOK-style): ID, description, owner, due date, status, closure — "allowing for implicit assumptions to become explicit".
- Neal Ford et al. (secondary): fitness functions turn architectural decisions into automated checks; "agentic fitness functions" now cover "ADR drift".

Implication: every resolved hypothesis becomes a one-paragraph ADR-lite (what we tested, what we saw, what we chose, what would make us revisit). Unresolved-but-accepted assumptions go to an assumption log with an owner and a trigger. Both live in-repo so the outside reviewers (who have no process context) can read them.

### F11. "Meeting reality" sooner and in smaller doses is the theory behind all of the above

- Risk-First Meeting Reality (PRIMARY): "Testing out the predictive power of an Internal Model by exposing it to reality"; meet reality "Sooner: enabling mitigation time; More frequently: preventing risk accumulation; In smaller chunks: managing overwhelm; With feedback collection: preventing risks from remaining hidden."
- Anthropic building-effective-agents (PRIMARY): "it's crucial for the agents to gain 'ground truth' from the environment at each step (such as tool call results or code execution)".
- ezyang walking skeleton (PRIMARY): "The LLM can't dogfood the code it writes!" — so get to a runnable end-to-end path early and iterate from actual usage.

### F12. Planning has a cost; the gate must have an exit for trivial work

- Claude Code best practices (PRIMARY): "Plan mode is useful, but also adds overhead ... If you could describe the diff in one sentence, skip the plan."; "Planning is most useful when you're uncertain about the approach, when the change modifies multiple files, or when you're unfamiliar with the code."
- superpowers brainstorming (PRIMARY) takes the opposite default: "'This is too simple to need a design' → Follow the selected path" and "When in doubt ... take the heavier one." (practitioner disagreement — see Open questions).
- Ralph Wiggum (PRIMARY): loops work only for tasks with clear success criteria; "Avoid tasks requiring human judgment or design decisions or those with unclear success criteria."

### F13. Debugging is hypothesis checking too — one hypothesis, one variable, three strikes

- superpowers systematic-debugging (PRIMARY): "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"; "Form Single Hypothesis", "Test Minimally ... One variable at a time"; "If ≥ 3: STOP and question the architecture".
- ezyang scientific-debugging (PRIMARY): non-reasoning models "guess" and "attempt one-shot fixes, often entering unhelpful loops".
- Claude Code best practices (PRIMARY): "After two failed corrections, /clear and write a better initial prompt incorporating what you learned."

Implication: the user's "error → fix → error" chain is the symptom of skipping this. A fix attempt counter (2–3) that forces a return to the hypothesis stage is a concrete funnel rule.

### F14. Verification evidence has a required shape: command + full output + exit code, freshly run

- superpowers verification-before-completion (PRIMARY): "1. Identify the command that proves your claim 2. Run it completely and freshly 3. Read the full output, exit codes, and failure counts 4. Verify whether output actually supports the claim 5. Only then state the claim alongside evidence." Forbidden: "Should work now", "Just this once", "Trusting agent success reports without independent confirmation".
- Claude Code best practices (PRIMARY): "Have Claude show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot."
- Deterministic enforcement exists: Stop hooks (exit 2 blocks the stop; overridden after 8 consecutive blocks; check `stop_hook_active`), agent-based hooks ("Verify that all unit tests pass. Run the test suite and check the results."), `/goal` evaluator.

### F15. Pre-mortem as a hypothesis generator (cheap, no code)

- Klein (secondary): imagine the project has failed, list reasons; prospective hindsight "increased the ability to accurately forecast risks by 30%" (Mitchell, Russo, Pennington 1989) — often quoted, moderate evidence.
- Practical: a 5-minute pre-mortem by a fresh subagent ("this shipped and broke; list the 5 most likely causes") is a cheap way to populate the hypothesis list before spending on spikes.

---

## Anti-patterns (what is known NOT to work, with why)

1. **Point-based, serial design ("try A; if it fails try B")** — the user's straight line. Ward/Sobek: point-based iteration produces rework because each change invalidates downstream work; set-based narrowing is faster overall. superpowers #1173: "Discovering a wrong assumption after executing 70% of a large plan is expensive."
2. **Horizontal layering (build all data layer, then all API, then all UI)** — nothing runs end-to-end until the end; Zac Smith reports "mismatched assumptions across the auth layer, frontend, and backend ... letting it build in the dark"; superpowers #1173 lists "Integration risk concentration" and "Late feedback".
3. **Self-grading** — Anthropic: agents "confidently praising the work"; Böckeler: "declare success even when tests were failing".
4. **Letting the implementer touch tests** — Beck's genie deleting the test; Anthropic harness's explicit prohibition; ezyang's relaxed-assertion example.
5. **Tests written after the code** — superpowers: "Tests-after pass immediately (proving nothing)".
6. **Filling gaps with plausible assumptions instead of asking** — spec-kit's stated reason for `[NEEDS CLARIFICATION]`; ezyang "it will fill in all the blanks".
7. **Prototype code leaking into production** — Pragmatic Programmer's core warning; the antidote is a mechanical boundary (worktree/subagent) and a report-only handoff.
8. **Exhaustive hypothesis audits** — spec-kit caps at 5 questions per session and requires impact × uncertainty; the official docs warn "A reviewer prompted to find gaps will usually report some ... Chasing every finding leads to over-engineering."
9. **Trusting benchmark-looking numbers from the agent** — Hashimoto's renderer "88ms → 2ms" that was 75× slower than a hand-written version: a spike's measurement must be reproducible by a second party.
10. **Continuing to fix after repeated failure** — superpowers 3-strike rule; Claude Code docs' "after two failed corrections, /clear"; ezyang "current models do not know how to stop digging".
11. **Planning ceremony for one-sentence diffs** — Claude Code docs: "If you could describe the diff in one sentence, skip the plan."
12. **Un-timeboxed spikes justified by "knowledge-limited, not time-limited"** — Beck's quote is often used to drop the box; practitioners (SAFe, agile literature) still box spikes because the deliverable is a decision, not code. Reconcile: box the *budget*, not the *answer* — a spike may end with "inconclusive; here's what a bigger spike would need".
13. **Hallucination "prevention" by prompt alone** — Böckeler: "as long as LLMs are involved, we can never be certain of anything"; mechanical resolution against installed artefacts beats instructions.

---

## Open questions

1. **Default-heavy vs default-light gate.** superpowers says "when in doubt take the heavier path"; the official Claude Code docs say skip the plan for one-sentence diffs. Which default fits a *large* project? Likely: size-based routing (touches >N files / crosses a module boundary / new dependency → gate; else fast path), but I found no measured comparison.
2. **How many hypotheses per task is optimal?** spec-kit's 5 is a design choice, not a measurement.
3. **Do parallel spikes actually beat a serial spike with agents?** Set-based evidence is from automotive engineering (Toyota) and one practitioner (Hashimoto). No controlled study found for coding agents.
4. **Does a spike report transfer enough knowledge for a clean rewrite?** Practitioners converge on "vibe-code a spike, distill into a spec, then spec-drive the production version" (Sourcegraph/others, secondary), but nobody quantified loss.
5. **Can the reproduce-the-bug-first rule be enforced deterministically?** Agentless only trusts reproduction tests that fail on the original repo; a PreToolUse/Stop hook could require a recorded RED run before any non-test edit, but I found no ready implementation.
6. **How to keep the outside reviewer truly context-free while still giving them the hypothesis cards?** The cards are the minimum context; whether reading them biases the verdict is untested.
7. **Package-hallucination rates for the frontier models the user actually uses in Sept 2026** — the 2026 paper covered Oct 2025–Mar 2026 releases only.
8. **Gojko's "crutches" objection**: the skeleton may be too slow to reach; sometimes a manual/fake component gets to feedback faster. When should the funnel allow a fake in the tracer path?

---

## Design implications for the funnel (the "hypothesis check before implementation" stage)

### Position in the separator
After decomposition/assignment and *before* execution. Input: a task card with a proposed approach. Output: either GO (with hypothesis cards resolved + ADR-lite) or BACK-TO-INTAKE (clarifications needed) or PIVOT (approach falsified, alternatives ranked).

### The gate questions (each must be answerable in one line; blank = not ready)
1. **What must be true for this plan to work?** (Roger Martin WWHTBT) — list 3–5, no more.
2. For each: **importance if false** (blocks the task? re-architecture?) × **evidence we already have** (seen it run? docs only? assumption?). Only importance-high × evidence-low proceed to a test. (Bland/Torres 2×2; spec-kit impact×uncertainty)
3. **What is the cheapest experiment that could falsify it?** and **what output counts as pass?** (HDD "we will have confidence to proceed when"; `/goal` "stated check")
4. **Does every new dependency/API/flag in the plan resolve against the installed artefact?** (mechanical; hallucination rates 5–20%)
5. **Is there a RED test that fails for the right reason?** (superpowers Verify RED; Agentless reproduction rule)
6. **What is the thinnest end-to-end path, and does it run?** (walking skeleton / tracer bullet; "The LLM can't dogfood")
7. **Which alternatives are still alive, and what evidence would kill each?** (set-based; LRM)
8. **What will we write down?** — ADR-lite (decision, evidence, revisit trigger) + assumption log entries with owners.
9. **Pre-mortem line:** "This shipped and broke. Most likely cause?" (Klein)
10. **Budget:** spike time/token box; what happens if inconclusive (escalate, not extend silently).

### Keeping it cheap
- Cap at 5 hypotheses; everything else is logged as an accepted assumption with an owner (assumption log), not tested.
- Prefer checks in this order: (a) grep/`--help`/compile against installed code (seconds); (b) 3-line script or single failing test (minutes); (c) throwaway spike in a worktree by a subagent (bounded); (d) walking skeleton (kept, but still thin). Never start at (d).
- Run alternative spikes in parallel with fresh subagents; judge with a separate fresh agent.
- Trivial-path exit: if the diff can be described in one sentence and touches one file with no new dependency, skip the gate (official guidance).
- Evidence shape is fixed: command, full output, exit code, fresh run. No prose claims.

### Claude Code mapping (reference implementation)
- `.claude/agents/hypothesis-scout.md` — read-only (tools: Read, Grep, Glob, Bash; `permissionMode: plan` or Explore-style), produces the hypothesis cards + resolves dependency/API existence mechanically.
- `.claude/agents/spike-runner.md` — `isolation: worktree`, `maxTurns` bounded, returns a structured report (hypothesis, files touched, evidence, verdict, recommendation, follow-ups); never merges.
- `.claude/agents/hypothesis-judge.md` — fresh context, sees only cards + evidence; returns GO / PIVOT / CLARIFY with reasons.
- Workflow script (`.claude/workflows/gate.js`): `parallel()` over alternative spikes → judge → write ADR-lite + assumption log entries; `schema` on agent calls for structured verdicts.
- Hooks: PreToolUse on Edit/Write to `tests/**` by implementer role → deny; Stop hook requiring a recorded RED→GREEN evidence block; `/goal` conditions written as "stated check" strings.
- CLAUDE.md line: "Before implementing, list what must be true; resolve every new import/API against installed code; watch the test fail first."

### Tool-agnostic statement
Hypothesis check = (list what must be true) → (rank by importance × missing evidence, cap 5) → (cheapest falsifying test each, pre-declared pass criterion) → (disposable spike or thin end-to-end slice, isolated) → (fresh-eyes judge on evidence only) → (ADR-lite + assumption log) → GO / PIVOT / CLARIFY. Fix-attempt counter of 3 sends work back to this stage.
