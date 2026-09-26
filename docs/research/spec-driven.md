# Spec-driven / plan-first development methods for AI coding — research notes

Dimension: "Spec-driven / plan-first development methods for AI coding"
Date: 2026-09-26. Researcher: subagent in the funnel-workflow research sweep.

Access note: the session's egress proxy blocked many first-party hosts (kiro.dev, ghuntley.com,
arxiv.org and every arXiv mirror tried, martinfowler.com, thoughtworks.com, cursor.com, docs.cursor.com,
docs.windsurf.com, docs.devin.ai, cognition.ai, docs.openhands.dev, docs.bmad-method.org, developer.microsoft.com,
github.blog, agents.md, harper.blog, simonwillison.net, dev.to, medium.com, substack.com, aws.amazon.com,
builder.aws.com, marmelab.com, brooker.co.za, en.wikipedia.org). Wherever possible I substituted the
GitHub-hosted originals (the Spec Kit repo, Huntley's own how-to-ralph-wiggum repo, the agents.md site source,
BMAD's docs/ tree, Claude Code docs on code.claude.com, anthropic.com research pages). Where only search-result
snippets were available, confidence is marked LOW or MEDIUM and the finding says so.

---------------------------------------------------------------------------------------------------

## Sources read

### Primary sources fetched and read (full page or the requested sections)

Spec Kit (GitHub)
- https://github.com/github/spec-kit/blob/main/spec-driven.md — the SDD methodology document (constitution articles, phases, gates, templates-as-constraints, feedback loop, limitations).
- https://github.com/github/spec-kit/blob/main/README.md — command list incl. converge, bug-assess/fix/test, assess-intake/research/define/shape/decide.
- https://github.com/github/spec-kit/blob/main/templates/spec-template.md — P1/P2/P3 user stories with "Independent Test", FR-xxx, SC-xxx, [NEEDS CLARIFICATION].
- https://github.com/github/spec-kit/blob/main/templates/plan-template.md — Constitution Check GATE, Phase 0 research / Phase 1 design / Phase 2 tasks, Complexity Tracking.
- https://github.com/github/spec-kit/blob/main/templates/tasks-template.md — Setup → Foundational (blocking) → user stories by priority → Polish; [P]; [USn]; "STOP and VALIDATE".
- https://github.com/github/spec-kit/blob/main/templates/commands/clarify.md — 9-category ambiguity taxonomy, max 5 questions, recommended option first, write-back.
- https://github.com/github/spec-kit/blob/main/templates/commands/analyze.md — read-only cross-artifact consistency report, 6 passes, severities.
- https://github.com/github/spec-kit/blob/main/templates/commands/checklist.md — "unit tests for requirements writing".
- https://github.com/github/spec-kit/blob/main/templates/commands/implement.md — halts on unchecked checklist items, phase-by-phase, halt on non-parallel failure.
- https://github.com/github/spec-kit/blob/main/templates/commands/converge.md — append-only gap analysis: missing / partial / contradicts / unrequested.
- https://github.com/github/spec-kit/blob/main/docs/guides/existing-projects.md — brownfield guidance.
- https://github.com/github/spec-kit/blob/main/docs/guides/evolving-specs.md — living / flow-back / flow-forward.
- https://github.com/github/spec-kit/blob/main/docs/guides/monorepo.md — directory-scoped .specify, no constitution inheritance.
- https://github.com/github/spec-kit/blob/main/docs/concepts/complex-features.md — "degrade during implementation", task scoping, sub-agent delegation, spec-of-specs.
- https://github.com/github/spec-kit/blob/main/docs/concepts/spec-persistence.md — spec-first / spec-anchored / spec-as-source; "silent divergence".

BMAD Method v6 (GitHub, docs/ tree; docs.bmad-method.org itself was blocked)
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/README.md
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/reference/skills-and-agents.md — 5 agents, 8 core skills, 16 workflow skills.
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/plan/choose-a-planning-path.md — single sizing criterion ("is the intent well-defined").
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/plan/define-requirements-and-a-specification.md — spec = Why, Capabilities (intent + success condition), Constraints, Non-goals, Success signal.
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/plan/break-work-into-stories-and-track-it.md
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/build-a-change.md — intent → plan (intent gaps, irreversible actions, footprint) → gate → implement → review/repair → human verification.
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/review-a-change.md — independent parallel review layers, verified-consequence severity, patch/defer/decision-needed.
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/autonomous-development-loops.md — bmad-build-auto: one ticket per run, READY FOR DEVELOPMENT gate, repair loop ≤5.
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/walk-through-a-change.md — guided human review, no verdict.
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/test-completed-work.md — generated coverage "is not code review".
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/finish-an-epic.md — retrospective: aggregate defects, action items.
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/existing-codebases/theory-of-project-context.md — what belongs in agent context and why.
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/existing-codebases/start-in-an-existing-codebase.md — brownfield pitfalls.
- https://github.com/wolverin0/bmad-claude-agents — (secondary) v4-era role port for Claude Code: analyst/pm/architect/po/sm/dev/qa.

Ralph Wiggum loop
- https://github.com/ghuntley/how-to-ralph-wiggum/blob/main/README.md — Huntley's own playbook ("a funnel with 3 Phases, 2 Prompts, and 1 Loop").
- https://github.com/ghuntley/how-to-ralph-wiggum/blob/main/files/PROMPT_build.md
- https://github.com/ghuntley/how-to-ralph-wiggum/blob/main/files/PROMPT_plan.md
- https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md — Stop-hook implementation, --max-iterations, --completion-promise, when (not) to use.
- https://github.com/snarktank/ralph — prd.json + progress.txt implementation, story sizing.

AGENTS.md
- https://github.com/agentsmd/agents.md (README) and the site source:
  https://github.com/agentsmd/agents.md/blob/main/components/FAQSection.tsx (FAQ verbatim),
  https://github.com/agentsmd/agents.md/blob/main/components/AboutSection.tsx (governance).

Kiro (kiro.dev blocked; used ports/reproductions)
- https://github.com/gotalab/cc-sdd — Kiro-style SDD for Claude Code and others (discovery routing, gates, File Structure Plan, per-task subagents + independent review).
- https://github.com/cremich/promptz.lib/blob/main/steering/kiro-specs.md — reproduction of Kiro spec structure, EARS pattern, `_Requirements: 1.1, 3.2_` traceability.
- https://github.com/kirodotdev/Kiro — official issues repo; links to docs on "Requirements Analysis" (contradictions/gaps) and "correctness with property-based testing".

Claude Code / Anthropic (reference implementation target)
- https://code.claude.com/docs/en/best-practices — verification, plan mode, CLAUDE.md, adversarial review, Writer/Reviewer, failure patterns.
- https://code.claude.com/docs/en/sub-agents — context isolation, frontmatter, depth limit 3, 20 concurrent, built-in Explore/Plan.
- https://code.claude.com/docs/en/workflows — scripted orchestration, schema-validated agent outputs, phases, resume, limits.
- https://code.claude.com/docs/en/hooks and https://code.claude.com/docs/en/hooks-guide — exit-2 blocking, Stop hook, 8-consecutive-block cap, prompt/agent hooks.
- https://code.claude.com/docs/en/goal — fresh evaluator model checks a completion condition after every turn.
- https://code.claude.com/docs/en/agent-teams — parallel review lenses, competing hypotheses, TaskCompleted hook gate.
- https://www.anthropic.com/research/building-effective-agents — chaining with gates, routing, parallelization, orchestrator-workers, evaluator-optimizer.
- https://www.anthropic.com/engineering/multi-agent-research-system — delegation rules, ~15x tokens, end-state evaluation.
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — context rot, JIT retrieval, compaction, notes, sub-agents.

Other spec/plan-first frameworks (GitHub)
- https://github.com/Fission-AI/OpenSpec (README), docs/concepts.md, docs/existing-projects.md, docs/reviewing-changes.md — delta specs, brownfield-first.
- https://github.com/obra/superpowers (README), skills/subagent-driven-development/SKILL.md, skills/verification-before-completion/SKILL.md.
- https://github.com/open-gsd/gsd-core (README) and docs/explanation/the-phase-loop.md — plan-checker, verifier, fresh-context executors.
- https://github.com/EveryInc/compound-engineering-plugin/blob/main/README.md — plan/work/review/compound loop.
- https://github.com/cline/cline — Plan/Act modes.
- https://claude.com/code-with-claude/session/tyo-mercari-human-on-the-loop — Mercari ASDD session abstract (~1.6x PR throughput claim).

Secondary synthesis with citations (read in full)
- https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md — July 2026 field study collating Böckeler, Marmelab, Thoughtworks, ranthebuilder, Mercari, GSD; used for critiques whose originals were blocked.

### Search-only (snippets; originals blocked — LOW/MEDIUM confidence where cited)
- Böckeler, "Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl", martinfowler.com (Oct 2025) — via field study + search snippets.
- Marmelab, "Spec-Driven Development: The Waterfall Strikes Back" (Nov 2025) — https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html
- Marc Brooker, "Spec Driven Development isn't Waterfall" (Apr 2026) — https://brooker.co.za/blog/2026/04/09/waterfall-vs-spec.html
- Harper Reed, "My LLM codegen workflow atm" (Feb 2025) — https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/
- Devin docs "When to use Devin" — https://docs.devin.ai/essential-guidelines/when-to-use-devin
- arXiv 2606.04967 (process taxonomy of agent frameworks), 2603.25697 (Kitchen Loop), 2601.03878 (spec-driven codegen empirical), 2602.00180 (SDD: code to contract) — abstracts only via search.
- Thoughtworks Technology Radar Vol. 33 SDD entry (Assess) — via field study/search.
- Cursor Plan Mode / Windsurf Planning Mode — search snippets only.

---------------------------------------------------------------------------------------------------

## Findings

### 1. GitHub Spec Kit — stage structure, artifacts, gates

Canonical pipeline (README): "Constitution once per project; specify → plan → tasks → implement → converge per feature."
Extra gates: "Add clarification, checklists, and consistency analysis when you need extra quality gates."
Newer command families: `/speckit-bug-assess` → `bug-fix` → `bug-test`; `/speckit-assess-intake` → `assess-research` →
`assess-define` → `assess-shape` → `assess-decide` ("Produces a go/needs-clarification/kill verdict"). The assess family is
literally an intake funnel with a kill decision — very close to the user's "wide mouth".

Artifacts (spec-driven.md): spec.md (user stories + acceptance criteria, NFRs, success metrics, `[NEEDS CLARIFICATION]`),
plan.md (tech choices with rationale, decisions traced to requirements, data model, contracts, test scenarios, research),
tasks.md (sequenced, parallel groups, deliverables/prereqs). Supporting: research.md, data-model.md, contracts/, quickstart.md,
checklists/.

Constitution (spec-driven.md): "Nine immutable architectural principles". Article III: "This is NON-NEGOTIABLE: All
implementation MUST follow strict Test-Driven Development. No implementation code shall be written before: 1. Unit tests are
written 2. Tests are validated and approved by the user 3. Tests are confirmed to FAIL (Red phase)." Article VII Simplicity
(≤3 projects), VIII Anti-Abstraction ("framework features directly rather than wrapping them"), IX Integration-First
("real databases over mocks"). Plan template: "_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._"
Violations must be justified in a "Complexity Tracking" table.

Ambiguity handling: "If the prompt doesn't specify something, mark it" rather than assuming. Completeness checklist requires
"No `[NEEDS CLARIFICATION]` markers remain". Template enforces altitude: "Focus on WHAT users need and WHY" and avoid
"HOW to implement (no tech stack, APIs, code structure)".

`/speckit.clarify` (clarify.md): scans 9 dimensions — Functional Scope & Behavior; Domain & Data Model; Interaction & UX Flow;
Non-Functional Quality Attributes; Integration & External Dependencies; Edge Cases & Failure Handling; Constraints & Tradeoffs;
Terminology & Consistency; Completion Signals. "Maximum of 5 total questions". Questions are multiple-choice tables with the
"recommended option prominently displayed first, plus reasoning", or short-answer with a suggested answer ≤5 words. Each
accepted answer is written back: `## Clarifications` section, `- Q: <question> → A: <answer>`, and the relevant spec sections
are updated; "Spec file saved atomically after each integration". Stops when critical ambiguities are resolved, user says
done, or 5 questions asked.

`/speckit.checklist` (checklist.md): "UNIT TESTS FOR REQUIREMENTS WRITING" — "If your spec is code written in English, the
checklist is its unit test suite." Items must ask "Are [requirement type] defined/specified/documented for [scenario]?" or
"Is [vague term] quantified/clarified with specific criteria?", with `[Spec §X.Y]` or `[Gap]` traceability. Forbidden: items
starting with "Verify/Test/Confirm/Check" + implementation behaviour. Example good item: "Is 'prominent display' quantified with
specific sizing/positioning?" [Clarity]. "[x] means the reviewer determined the requirements-quality criterion is satisfied.
[x] does NOT mean implementation work is complete." Checkbox state "belongs solely to the reviewer"; generated items are never
pre-checked.

`/speckit.analyze` (analyze.md): "Do **not** modify any files. Output a structured analysis report." Six passes: duplication;
ambiguity ("Flag vague adjectives (fast, scalable, secure, intuitive, robust) lacking measurable criteria"); underspecification;
constitution alignment; coverage gaps ("Requirements with zero associated tasks, tasks with no mapped requirement");
inconsistency. CRITICAL = "Violates constitution MUST, missing core spec artifact, or requirement with zero coverage that blocks
baseline functionality". Report = table (ID, Category, Severity, Location, Summary, Recommendation) + coverage table + metrics.

`/speckit.tasks` (tasks-template.md): Phase 1 Setup; Phase 2 Foundational — "Core infrastructure that MUST be complete before
ANY user story can be implemented" and "No user story work can begin until this phase is complete"; Phases 3–5 user stories
by priority, each with an "Independent Test" ("How to verify this story works on its own"); Phase N Polish. `[P]` = "Can run in
parallel (different files, no dependencies)"; `[US1]` labels for traceability. MVP-first: "Complete Phase 3: User Story 1 →
STOP and VALIDATE: Test User Story 1 independently". "Once Foundational phase completes, all user stories can start in parallel
by different team members." Avoid "cross-story dependencies that break independence."

`/speckit.implement` (implement.md): scans checklists first — "STOP and ask: 'Some checklists have unchecked items. Do you want
to proceed...?'"; "Phase-by-phase execution: Complete each phase before moving to the next"; "Respect dependencies: Run
sequential tasks in order, parallel tasks [P] can run together"; TDD ordering when tests exist; "mark the task off as [X]";
"Halt execution if any non-parallel task fails" (parallel tasks continue with per-task failure reports).

`/speckit.converge` (converge.md): "assess the current codebase against the feature's spec, plan, and tasks, then append any
remaining unbuilt work as new tasks". Gap classes: `missing`, `partial`, `contradicts`, `unrequested`. Converged = "the
implementation satisfies the spec, plan, and tasks". It is append-only: "MUST NOT modify spec.md or plan.md" and cannot
"rewrite, renumber, reorder, or delete any existing task". Loop implement → converge until Converged.

Feedback loop (spec-driven.md): "Production metrics and incidents don't just trigger hotfixes—they update specifications for the
next regeneration." "Pivots become systematic regenerations rather than manual rewrites." (aspirational; no tooling enforces it).

What breaks with large codebases (Spec Kit's own docs):
- complex-features.md: "Large or complex features often run smoothly through /speckit.specify, /speckit.plan, and
  /speckit.tasks, then degrade during implementation." Cause: context exhaustion — the model will "lose track of the plan,
  ignore tasks, or hallucinate." Remedies, escalating: (1) task scoping per run; (2) sub-agent delegation of parallel tasks with
  focused context; (3) both; (4) feature decomposition into independent sub-features ("spec of specs").
- existing-projects.md: constitution from evidence ("Use the repository's README, architecture decisions, contribution guide,
  and CI configuration as evidence"; "Do not invent standards merely to fill the constitution template"); "The new spec.md
  defines the change you intend to make, not a retroactive specification of every existing behavior"; "Describe both the
  requested outcome and the compatibility boundaries that must remain intact"; "Start with a feature or modernization slice that
  can be reviewed independently." Limitation: "It does not rewrite your application or infer specifications for existing
  behavior."
- monorepo.md: "A Spec Kit project is directory-scoped: the project is whichever directory contains .specify/". Per-project
  constitutions with no inheritance; git branch creation happens at repo root (pitfall).
- spec-persistence.md / evolving-specs.md: three models — Living spec ("update spec.md first and then regenerate or revise
  plan.md and tasks.md"), Flow-back ("Capture the discovery in the artifact closest to the work" then reconcile), Flow-forward
  ("Completed artifacts are treated as immutable... creates a new feature directory"). Risk under flow-back: "silent divergence.
  If the team changes lower-level artifacts without reflecting the decision back into spec.md, future contributors may not know
  which artifact to trust." "Do not leave a lower-level change in tasks.md or code if spec.md still says something different and
  the spec is meant to remain trustworthy."
- spec-driven.md admits: "Today, practicing SDD requires assembling existing tools and maintaining discipline throughout the
  process." No brownfield discussion in the methodology doc itself.

External critique of Spec Kit (field study, MEDIUM): Marmelab measured "1,300 lines of markdown generated for a simple
date-display feature"; "known upgrade issues that overwrite user customization files"; ranthebuilder's hands-on scored it below
OpenSpec and BMAD.

### 2. BMAD Method (v6.x, Sept 2026) — roles, sizing, gates, review

Roles (skills-and-agents.md): Analyst (Mary) — research/brainstorm/tech selection; PM (John) — PRD, correct course, tickets;
Architect (Winston) — "Architecture spine; plan work and dependencies"; Developer (Amelia) — "Build; QA test generation; code
review; epic retrospective; ticket planning and tracking"; UX Designer (Sally). The v4-era set additionally had PO (Sarah),
Scrum Master (Bob, "detailed story creation") and QA (Quinn, "QA Architect for code review") — wolverin0 port. v6 collapsed the
SM/QA personas into skills (bmad-preview-ticketing, bmad-code-review, bmad-review, bmad-qa-generate-e2e-tests).
Core skills include bmad-review ("Reviews a diff, document, or other artifact through one or more lenses"), bmad-deep-recon
("Researches a topic to support a decision, three ways"), bmad-forge-idea ("Pressure-tests a half-formed idea in a questioning
conversation"), bmad-advanced-elicitation.

Sizing (choose-a-planning-path.md): one pivot question — "Is the intent already well-defined?" "A well-defined intent says what
should be true when the work is done, what must not change, and what is out of scope." If yes → bmad-spec directly. "Size
follows the intent...Scope is only one signal: use more planning when the work has high risk, unclear requirements, broad
architectural reach, cross-system effects, or coordination between people or teams." Epic-sized path: bmad-spec → preview-
ticketing (ordered tickets.toml) → build each story → retrospective. Project-sized (~20+ implementation sessions): PRD,
architecture, spec per epic. README: "Right-sized process — Go directly to implementation for clear changes or add deeper
planning for larger initiatives."

Spec shape (define-requirements-and-a-specification.md): SPEC.md with "Why, Capabilities (each with an intent and a success
condition), Constraints, Non-goals, and Success signal". Ticketing "reports assumptions it made and open questions it could not
answer, for you to resolve." "One small story or bug can go straight to Build without ticketing."

Build (build-a-change.md): intent resolution (investigate codebase and planning artifacts) → planning gate reports three
facts — "intent gaps (things you did not say that you would notice in the result), irreversible actions, and footprint" →
implement → "Independent review occurs; findings are triaged and fixed if they belong to the current scope" → user verifies
"the change matches your intent" → status `built`; only the user marks `done`. Review triage: "Issues that belong to the current
change get fixed. Unrelated pre-existing issues get deferred." "not a dump of every possible note".

Review (review-a-change.md): "Active layers review the same diff independently and in parallel." Rule: "Verify the claimed
consequence at the named location, reading past the diff hunk far enough to tell whether that consequence actually occurs."
"Assign severity from the verified consequence (low, medium, high)." "Route survivors to patch, defer, or decision needed."
"If you have a spec, requirements, or even a stream of consciousness for what this change is supposed to implement, feed that
in too. Review quality depends on it." Findings append to the plan's `## Code Review` section.

Autonomous loop (autonomous-development-loops.md): `bmad-build-auto` "performs one unattended implementation run": clarify
intent → create/resume plan → implement → review → write terminal status. Gate: plan must pass "READY FOR DEVELOPMENT gate".
Hard limits: "review repair loop exceeded 5 iterations (non-convergence)" blocks; "halts blocked with no subagents"; "Exactly
one ticket per invocation"; it "never picks the next ticket itself"; "never moves a ticket to done. The user or an orchestrator
marks a ticket done." Retrospective is separate.

Human verification (walk-through-a-change.md): "a guided human review. It writes a review narrative, then walks you through it
one block at a time" (intent, broad strokes, concerns, periphery); "does not assign severity scores or produce a pass/fail
verdict"; "not a replacement for bmad-code-review".

Tests (test-completed-work.md): "This is generated coverage of finished work. It is not code review."

Retrospective (finish-an-epic.md): reads tickets, epic "Done when checks", requirements, plans, git diffs, previous retro.
Captures "Aggregate defects: the architecture that drifted, the helper written twice, the file that grew a little in every
session", spec divergences. "Action items feed the normal dev loop as fix-now work or fresh tickets. The retrospective writes
them up; it doesn't execute them." "A rejected epic, or one accepted with open items, tells the next planning step what to
carry forward."

Context theory (theory-of-project-context.md): "A line belongs when the fact is expensive to get from the repository — not
whether an agent could derive it, but what it costs every time one doesn't." Cites research that "repository instruction files
show no improvement in success rate and +20% inference cost" (original study not verified by me). "Implementation behavior is
recoverable from source; intent, rationale, and what was deliberately rejected are not." Include: unobvious project facts,
policy code cannot express, cross-component constraints, observed pitfalls only, negative constraints naming alternatives.
Exclude: repo structure, derivable architecture, ecosystem defaults, "aspirational state", style rules (belong in linters).
"agents often skip retrieval they have to choose" (agents "skipped the index and guessed page paths"). Human-curated compressed
docs "achieving 100% pass rates on framework APIs versus 53% unaided — but only when containing genuinely novel knowledge".
Refresh cycles "re-check every caveat" and ask "whether each line still changes agent behavior."

Brownfield (start-in-an-existing-codebase.md): scan the codebase first (agents "are well-trained for this"); write context to
AGENTS.md via bmad-project-context; plan proportionally. Pitfalls: over-documentation ("nobody reads"); feeding original PRD when
agents can read current code → "contradiction, ambiguity, and context-window bloat"; pattern inconsistency ("leaves two
standards with no record of which one wins"); design decisions that "do not name what the code already does" → reinvented
components.

External assessment (field study, MEDIUM): "Reviewers praised 'adversarial code review' and depth for complex features; same
reviews called it 'far too heavy for routine work.'"

### 3. Kiro specs (AWS) — requirements/design/tasks with approval gates

Structure (promptz reproduction; search snippets of kiro.dev): requirements.md (user stories + EARS acceptance criteria),
design.md (architecture, sequence diagrams), tasks.md (discrete trackable tasks). EARS: "WHEN [condition/event] THE SYSTEM SHALL
[expected behavior]", e.g. "WHEN a user submits a form with invalid data THE SYSTEM SHALL display validation errors next to the
relevant fields." Tasks carry `_Requirements: 1.1, 1.5, 3.1, 3.2_` for traceability. Search snippet (kiro.dev/docs/specs):
"Kiro generates three markdown documents in sequence, with a human approval gate between each"; "for well-understood features,
you can also use Quick Spec to auto-generate all three artifacts without approval gates"; two variants "Requirements-First and
Design-First". The kirodotdev/Kiro README links "Requirements Analysis" docs to "identify contradictions and gaps before coding"
and "correctness with property-based testing" to "turn requirements into executable properties and exercise them across
generated inputs" (kiro.dev/docs/specs/correctness/ — not fetched).

cc-sdd (Kiro-style port, primary read): "Discovery routes new work into one of: extend an existing spec, implement directly
with no spec, create one new spec, decompose into multiple specs, or mixed decomposition." "Code remains the source of truth.
Specs make the boundaries between parts of the code explicit so humans and agents can work in parallel without constant
synchronization." design.md includes "a File Structure Plan" that "drives task boundaries and boundary-first discipline".
Implementation: "Native subagents provide per-task implementation, independent review, and auto-debug when available;
otherwise the workflow runs in the main context with inline review." Tasks run "behind feature flags with RED → GREEN TDD
cycles." `kiro-validate-gap` supports extending existing systems without full re-specification.

Critiques (field study, MEDIUM): "EARS genuinely reduces ambiguity in acceptance criteria"; but a practitioner: "it just keeps
drifting and drifting until you have duplication and contradictions"; Böckeler: Kiro "turned trivial bug fixes into
multi-user-story ceremonies".

### 4. Ralph Wiggum loop (Huntley) — one item per fresh context, plan/build prompts, backpressure

Huntley's playbook (how-to-ralph-wiggum README): "Ralph isn't just 'a loop that codes.' It's a funnel with 3 Phases, 2 Prompts,
and 1 Loop." Minimal loop: `while :; do cat PROMPT.md | claude ; done`. "Bash loop runs → feeds PROMPT.md to claude → Agent
completes one task → updates IMPLEMENTATION_PLAN.md on disk, commits, exits → Bash loop restarts immediately → fresh context
window." IMPLEMENTATION_PLAN.md "acts as shared state between otherwise isolated loop executions."
Phase 1: human + LLM discuss, identify Jobs To Be Done, break into topics of concern, write `specs/FILENAME.md` per topic.
Planning mode (PROMPT_plan.md): "Study @IMPLEMENTATION_PLAN.md (if present) and use up to 500 Sonnet subagents to study
existing source code in src/* and compare it against specs/*." "Plan only. Do NOT implement anything. Do NOT assume
functionality is missing; confirm with code search first." Output: prioritized bullet list of items yet to implement. Treat
`src/lib` as the standard library, prefer "consolidated, idiomatic implementations there over ad-hoc copies".
Building mode (PROMPT_build.md): "choose the most important item to address"; search codebase with subagents before changing;
implement; "run the tests for that unit of code that was improved"; "update @IMPLEMENTATION_PLAN.md with your findings";
commit and push. "Use up to 500 parallel Sonnet subagents for searches/reads and only 1 Sonnet subagent for build/tests";
"Implement functionality completely. Placeholders and stubs waste efforts"; "If tests unrelated to your work fail, resolve them
as part of the increment"; keep @AGENTS.md "operational only". Tag a release when build/tests are green.
Context rationale: "When 200K+ tokens advertised = ~176K truly usable. And 40-60% context utilization for 'smart zone'. Tight
tasks + 1 task per loop = 100% smart zone context utilization." AGENTS.md "~60 lines max", "Operational learnings only—no status
updates or progress notes".
Backpressure: "Create backpressure via tests, typechecks, lints, builds, etc. that will reject invalid/unacceptable work."
Signs: "When Ralph fails a specific way, add a sign to help him next time." "The prompts you start with won't be the prompts you
end with—they evolve through observed failure patterns." Key phrases: "study", "don't assume not implemented" ("the Achilles'
heel"), "using parallel subagents", "only 1 subagent for build/tests", "capture the why".
Plan is disposable: "If it's wrong, throw it out, and start over. Regeneration cost is one Planning loop; cheap compared to Ralph
going in circles." Human role: "Your job is now to sit on the loop, not in it." Failure modes acknowledged: "Ralph can go in
circles, ignore instructions, or take wrong directions—this is expected and part of the tuning process." Sandbox required
when bypassing permissions.

Claude Code plugin (anthropics/claude-code plugins/ralph-wiggum): implemented as a Stop hook that "blocks exit" and "feeds the
SAME prompt back"; "The prompt never changes between iterations"; "Claude's previous work persists in files". Options
`--max-iterations`, `--completion-promise`. Warning: "The --completion-promise uses exact string matching, so you cannot use it
for multiple completion conditions (like 'SUCCESS' vs 'BLOCKED'). Always rely on --max-iterations as your primary safety
mechanism." Good for: "Tasks with automatic verification (tests, linters)"; not good for "Tasks requiring human judgment or
design decisions", "Tasks with unclear success criteria", "Production debugging". Philosophy: "Deterministically bad means
failures are predictable and informative. Use them to tune prompts." Self-reported results: 6 repos overnight; "$50k contract
completed for $297 in API costs" (unverified marketing-style claims).

snarktank/ralph: "Each iteration spawns a new AI instance ... with clean context. The only memory between iterations is: Git
history, progress.txt, prd.json." Loop: pick highest-priority story with `passes: false` → implement → "Run quality checks
(typecheck, tests)" → commit → mark `passes: true` → append learnings → `<promise>COMPLETE</promise>`. Sizing: "Each PRD item
should be small enough to complete in one context window." Right-sized: "Add a database column and migration"; too large:
"Build the entire dashboard", "Add authentication".

Concern (search snippet, tessl.io): Huntley worries about Claude Code's automatic context compaction because "each iteration
depends on the agent retaining a clear, unchanged understanding of the original goal" — fresh context per iteration is the
answer, not compaction.

### 5. AGENTS.md convention

FAQ verbatim (FAQSection.tsx): "Are there required fields?" — "No. AGENTS.md is just standard Markdown. Use any headings you
like; the agent simply parses the text you provide." "What if instructions conflict?" — "The closest AGENTS.md to the edited
file wins; explicit user chat prompts override everything." "Will the agent run testing commands found in AGENTS.md
automatically?" — "Yes—if you list them. The agent will attempt to execute relevant programmatic checks and fix failures before
finishing the task." "Can I update it later?" — "Absolutely. Treat AGENTS.md as living documentation." Migration via
`mv AGENT.md AGENTS.md && ln -s AGENTS.md AGENT.md`. Governance (AboutSection.tsx): "emerged from collaborative efforts across
the AI software development ecosystem, including OpenAI Codex, Amp, Jules from Google, Cursor, and Factory" and "is now
stewarded by the Agentic AI Foundation under the Linux Foundation." Adoption numbers (search only, LOW): 60k+ projects, 20+
tools by Dec 2025.
Convergence: BMAD's bmad-project-context writes into AGENTS.md; Ralph uses AGENTS.md as the ≤60-line operational guide; OpenHands
repo ships AGENTS.md. Claude Code equivalent CLAUDE.md guidance (best-practices): "keep it short and human-readable"; "For
each line, ask: 'Would removing this cause Claude to make mistakes?' If not, cut it. Bloated CLAUDE.md files cause Claude to
ignore your actual instructions!"; "If Claude keeps skipping one instruction, add emphasis such as IMPORTANT to that line
alone"; hooks are "deterministic" while "CLAUDE.md instructions ... are advisory".

### 6. PRD-first workflows (Harper Reed, Claude Code interview, OpenSpec, compound engineering)

Harper Reed (search snippets, MEDIUM): Step 1 idea honing — a prompt that asks "one question at a time" until "a detailed
specification a developer can use", compiled to spec.md; Step 2 planning with a reasoning model → prompt_plan.md (prompts for
each step) + todo.md, "small iterative steps" with TDD; Step 3 execute prompts with aider/Claude, run tests, loop. Spec doubles
as input for "asking a reasoning model to poke holes in the idea".

Claude Code best-practices (primary): "For larger features, have Claude interview you first ... 'Interview me in detail using
the AskUserQuestion tool. Ask about technical implementation, UI/UX, edge cases, concerns, and tradeoffs. Don't ask obvious
questions, dig into the hard parts I might not have considered. Keep interviewing until we've covered everything, then write a
complete spec to SPEC.md.'" "Once the spec is complete, start a fresh session to execute it." "The most useful specs are
self-contained: they name the files and interfaces involved, state what is out of scope, and end with an end-to-end verification
step that proves the feature works. Time spent making the spec precise pays off more than time spent watching the
implementation."

OpenSpec (primary): philosophy "fluid not rigid", "iterative not waterfall", "built for brownfield not just greenfield".
"Specs are the source of truth — they describe how your system currently behaves." Changes are delta specs with "ADDED /
MODIFIED / REMOVED Requirements"; "A delta shows exactly what's changing. Reading a full spec, you'd have to diff it mentally
against the current version." Artifacts: proposal → specs (deltas) → design → tasks; "Dependencies are enablers, not gates".
Flow: `/opsx:explore` ("a no-stakes thinking partner") → propose → review "while it's still just words" → apply → verify
(validates completeness/correctness/coherence; "does not block archiving") → archive merges deltas into specs. Brownfield: "You
do not document your whole codebase to start. You write specs only for what you're about to change." "A delta lets you specify
that one change precisely without first writing a 40-page spec of everything around it." "Resist back-filling: Writing specs
for code you aren't changing feels productive and usually isn't." Review checklist: proposal — "does this match what I actually
asked for, and is anything sneaking in?"; delta specs are "the heart of the review": SHALL/MUST + GIVEN/WHEN/THEN scenarios that
"actually test it"; tasks "ordered steps, each traceable to a requirement, nothing mysterious". Positioning vs Spec Kit:
"Thorough but heavyweight. Rigid phase gates, lots of Markdown, Python setup."

Compound engineering (Every, primary README): "Each unit of engineering work should make subsequent units easier -- not harder."
Loop: `/ce-plan` (can "dispatch parallel research subagents"), `/ce-work` (clarifying questions, tests), `/ce-code-review`
("multi-agent review against the plan before merging", issues "triaged by priority", fixes explicit not automatic),
`/ce-compound` ("Capture the learning into docs/solutions/ so the next loop starts smarter"). "Run one teaches it. Run two
remembers." Search snippet (MEDIUM): Plan/Work/Assess/Compound; review agents check "security, architecture, and code quality".

### 7. Planning modes (Claude Code, Cline, Cursor, Windsurf)

Claude Code (primary): "Explore first, then plan, then code" — plan mode is read-only ("Claude reads files and answers
questions without making changes"); "Press Ctrl+G to open the plan in your text editor for direct editing before Claude
proceeds." Caveat: "Plan mode is useful, but also adds overhead ... Planning is most useful when you're uncertain about the
approach, when the change modifies multiple files, or when you're unfamiliar with the code being modified. If you could
describe the diff in one sentence, skip the plan." Built-in `Plan` subagent: "A research agent used during plan mode to gather
context before presenting a plan" (read-only). Agent teams: a teammate spawned while the lead is in plan mode "works in
read-only plan mode until its plan is ready" (but the lead auto-approves the plan "without the lead reviewing it" — a gap).

Cline (primary README): "In Plan mode, Cline explores your codebase, asks clarifying questions, and lays out a strategy."
In Act mode "Every file edit and terminal command requires your approval"; "All changes are tracked with checkpoints".

Cursor Plan Mode (search only, LOW): "Planning Mode separates research from execution, where the AI creates a detailed
implementation plan before modifying any code"; plans are markdown the user edits/approves.
Windsurf Planning Mode (search only, LOW): Wave 10 (June 2025) — "persistent markdown files to manage goals and tasks"; "A more
capable model handles strategic reasoning, while short-term actions are executed by the user's chosen model"; motivation:
"preventing AI from drifting away from the goal and losing context over time on longer tasks like refactoring".
Common principle (search, MEDIUM): "AI coding usually fails when language models are asked to plan and code at the same time;
the rule is to give them one clearly defined task at a time."

### 8. Devin / OpenHands planning (mostly unverified — blocked)

Devin (search snippet of docs.devin.ai "When to use Devin", MEDIUM): "Good tasks have a clear start and end, plus explicit
success criteria (e.g., passing tests, matching an existing pattern, CI green)"; tasks with "test suites, lint checks, or
compilation steps yield better results"; "Devin can test its own work by launching your app and verifying behavior in the
browser"; "use Ask Devin to collaboratively scope the work before starting a session."
OpenHands (search snippets, LOW): decomposes tasks and delegates to sub-agents; has a Planner agent; repo "microagents" for
repo-specific instructions. The repo README/architecture pages I could reach describe only the UI layer; the SDK README
mentions a `TaskTrackerTool`. No primary detail on gates.
Cognition "Don't build multi-agents" (NOT fetched; from prior knowledge, LOW): argues sub-agents that act in parallel without
sharing full traces make conflicting implicit decisions; recommends single-threaded agents plus context compression, and
sub-agents mainly for read-only investigation. Relevant caution for the "distribution" stage.

### 9. Orchestration and verification primitives (Anthropic / Claude Code) — how to build the gates

Building effective agents: prompt chaining "where each LLM call processes the output of the previous one" with programmatic
"gates"; routing; parallelization as sectioning or voting; orchestrator-workers when "subtasks aren't pre-defined";
evaluator-optimizer "particularly effective when we have clear evaluation criteria, and when iterative refinement provides
measurable value". "consider adding complexity only when it demonstrably improves outcomes". Coding: "Code solutions are
verifiable through automated tests" but "human review remains crucial for ensuring solutions align with broader system
requirements." Invest in tool/ACI design ("Poka-yoke").

Multi-agent research system: "Each subagent needs an objective, an output format, guidance on the tools and sources to use,
and clear task boundaries." Scale effort: "Simple fact-finding requires just 1 agent with 3-10 tool calls, direct comparisons
might need 2-4 subagents with 10-15 calls each." "Multi-agent systems use about 15× more tokens than chats." Evaluate with
"a single LLM call with a single prompt outputting scores from 0.0-1.0" against a rubric, plus "end-state evaluation rather
than turn-by-turn analysis". "Minor system failures can be catastrophic for agents."

Context engineering: "as the number of tokens in the context window increases, the model's ability to accurately recall
information from that context decreases" (attention budget / context rot); just-in-time retrieval via "lightweight identifiers
(file paths, stored queries, web links)"; compaction; structured note-taking "persisted to memory outside of the context window";
sub-agents "return only a condensed, distilled summary".

Claude Code best-practices — verification ladder: "Give Claude a check it can run: tests, a build, a screenshot to compare."
"Claude stops when the work looks done. Without a check it can run, 'looks done' is the only signal available, and you become
the verification loop." Gate options: in one prompt; `/goal` ("A separate evaluator re-checks it after every turn"); Stop hook
("runs your check as a script and blocks the turn from ending until it passes"); "By a second opinion: a verification subagent
or a dynamic workflow that checks its own findings has a fresh model try to refute the result, so the agent doing the work
isn't the one grading it." "Have Claude show evidence rather than asserting success." Adversarial review: "A reviewer running
in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced the change, so it
evaluates the result on its own terms." Caveat: "A reviewer prompted to find gaps will usually report some, even when the work
is sound ... Chasing every finding leads to over-engineering ... Tell the reviewer to flag only gaps that affect correctness or
the stated requirements, and treat the rest as optional." Writer/Reviewer sessions: "A fresh context improves code review since
Claude won't be biased toward code it just wrote." Failure patterns: kitchen-sink session; "After two failed corrections,
/clear and write a better initial prompt"; over-specified CLAUDE.md; "trust-then-verify gap"; "infinite exploration".

`/goal` (primary): "After each turn, a small fast model checks whether the condition holds" — verdicts Not yet met / Met /
Impossible; "completion is decided by a fresh model rather than the one doing the work"; the evaluator "doesn't run commands
or read files independently, so write the condition as something Claude's own output can demonstrate"; good conditions have
"One measurable end state", "A stated check", "Constraints that matter"; stall detection stops the loop when no tool use for
several turns.

Hooks (primary): PreToolUse/PostToolUse/Stop/SubagentStop/UserPromptSubmit/TaskCompleted etc.; "Exit 2 means a blocking error"
and "even a JSON permissionDecision of 'allow' can't override it"; Stop hook exit 2 "Prevents Claude from stopping"; cap:
"Claude Code overrides a Stop hook after it blocks eight times in a row without progress" — hooks must check
`stop_hook_active`. Prompt-based (`type: "prompt"`) and agent-based (`type: "agent"`, multi-turn with tools, experimental) hooks
exist for judgment calls. Agent-team hooks: `TaskCompleted` "Exit with code 2 to prevent completion and send feedback".

Subagents (primary): "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation history";
defined in `.claude/agents/*.md` with `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`,
`skills`, `hooks`, `memory`, `isolation: worktree`; "a subagent can spawn subagents of its own, up to three layers below the
main conversation"; default 20 concurrent; descriptions capped at 15k tokens; use main conversation when "Multiple phases share
significant context".

Workflows (primary): "A workflow moves the plan into code ... so Claude's context holds only the final answer." Scripts use
`agent()`, `pipeline()`, `parallel()`, `phase()`; `schema` gives JSON-validated outputs (fails after 5 attempts); "it can have
independent agents adversarially review each other's findings before they're reported, or draft a plan from several angles and
weigh them against each other"; example prompts: "keep fixing the reported errors until the type check passes or two rounds in
a row make no progress"; limits: 16 concurrent agents default, 1,000 agents/run, "No mid-run user input ... For sign-off
between stages, run each stage as its own workflow"; runs are resumable and replay deterministic (Date.now/Math.random throw).

Agent teams (primary): "Spawn three teammates to review PR #142: one focused on security implications, one checking performance
impact, one validating test coverage"; competing hypotheses: "Have them talk to each other to try to disprove each other's
theories, like a scientific debate ... Sequential investigation suffers from anchoring"; "Two teammates editing the same file
leads to overwrites. Break the work so each teammate owns a different set of files."; 3–5 teammates, 5–6 tasks each.

Superpowers (primary): brainstorming → writing-plans ("bite-sized tasks (2-5 minutes each). Every task has exact file paths,
complete code, verification steps") → executing-plans or subagent-driven-development: "Fresh subagent per task + task review
(spec + quality) + broad final review = high quality, fast iteration." Per task: implementer → self-review → "review package" →
task reviewer; fix loop max 5 rounds ("Rounds 1–3 resume the original implementer; rounds 4–5 escalate to a more capable
model"; at round 5 "the controller adjudicates and records rulings in the ledger"). Independence rule: "A dispatch prompt
describes one task, not the session's history." TDD: "Deletes code written before tests." verification-before-completion:
"NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"; gate = IDENTIFY the command → RUN full → READ output/exit code →
VERIFY → then claim; forbidden phrases "should", "probably", "seems to", "Done!" before verification.

GSD Core (primary): loop "Discuss → (UI design) → Plan → Execute → Verify → Ship"; plan-checker verifies plans are "complete,
consistent, and within scope" and catches "ambiguities that could cause parallel executors to make divergent assumptions about
shared concerns"; executors get "a fresh 200k-token context window loaded with exactly what it needs: the project summary, the
phase context, the research, and the specific PLAN.md for its task"; "write code and commit atomically"; verifier does
goal-backward verification (REQ-ID coverage, CONTEXT.md decisions actually coded): "A phase is not done because execution
finished without errors. It is done because what was built is what was planned." `STATE.md` "is the navigation layer". Root
diagnosis: "context bloat silently degrades output quality, there is no shared memory between sessions, and nothing verifies
that code actually works." Field study: GSD's popularity "signals practitioners see context rot, not missing specs, as the root
problem."

### 10. Evidence, critiques, and where practitioners disagree

Böckeler's three levels (field study, MEDIUM): spec-first ("The spec is scaffolding"), spec-anchored ("living document for the
feature's evolution"), spec-as-source ("Humans maintain only the spec"); "none consistently achieves spec-as-source". Her
problems: problem-size mismatch ("Kiro turned a small bug fix into multiple user stories"); "Reviewing stacks of generated
markdown is tedious and repetitive — potentially worse than reviewing code"; illusory control ("Agents frequently ignore the
elaborate instructions anyway, misinterpret context, and duplicate existing code"); functional/technical separation is leaky;
MDD analogy; semantic diffusion. Search snippet: "nothing checks that the code matches it, and the agents don't always follow
it"; "excessive review overhead, a false sense of control, and doesn't scale well across different problem sizes".
Thoughtworks Radar (Nov 2025, Assess; via field study/search, MEDIUM): workflows "remain elaborate and opinionated, with some
tools generating spec files that are hard to review"; "executable code remains the source of truth"; worry that "handcrafting
detailed rules for AI ultimately doesn't scale" (bitter lesson).
Marmelab (via field study/search, MEDIUM): failures — "context blindness, excessive documentation, redundant processes, double
review burden, agent non-compliance with specs, poor scaling"; built a 3D sculpting tool in ~10 hours with no spec, small
features one by one ("Natural Language Development"). Scott Logic: "10x slower, more ceremony, same bugs". Solo dev: "specs
consuming 50% of total project time".
Defence (Brooker, search, MEDIUM): SDD "isn't about pulling designs up-front, but about pulling designs up"; specs "explicit,
versioned, living artifacts"; Wong/scrum.org: Waterfall's flaw was "months-long feedback loops; SDD's loops are minutes".
Kindred (search, LOW): SDD is "largely waterfall/contract-design rebranded" and "the value is the thinking you do while writing
the spec, not the tooling around it."
Consensus failure modes (field study): spec drift #1 ("Nothing enforces spec↔code consistency"); over-ceremony ("More markdown
means more tokens competing for the agent's attention; specs full of repetitions, imaginary corner cases"); agent
non-compliance; problem-size mismatch; false confidence ("A reviewed-and-approved wrong spec is still wrong, now with more
authority"). When worth it: "Multi-session or multi-agent features, team settings needing stakeholder-reviewable intent,
brownfield changes where contract matters, compliance-adjacent work." Not: "Bug fixes, exploratory prototypes, solo fast
iteration—where plan mode + tests wins." "Spec-first won by becoming a feature" (Claude Code plan mode + short markdown spec is
"the most common lightweight spec-first workflow, no framework required").
Quantitative claims (all self-reported or unverified originals): Mercari — claude.com session page (primary): ASDD + Agent
Harness "lifting PR throughput ~1.6x for high-AI-usage engineers"; secondary: "+150% speed gain over the traditional baseline
and 80% over freeform-prompt AI" across 30+ backend projects. arXiv 2601.03878 (search, LOW): "human-refined specifications
reduce LLM code-generation errors by up to ~50%" but "passing spec tests don't guarantee correct software — only that software
matches the spec." Kitchen Loop arXiv 2603.25697 (search, LOW): trust model = "(1) a specification surface enumerating what the
product claims to support; (2) 'As a User x 1000' ... synthetic power user at 1,000x human cadence; (3) Unbeatable Tests,
ground-truth verification the code author cannot fake; and (4) Drift Control, continuous quality measurement with automated
pause gates"; six phases "Backlog, Ideate, Triage, Execute, Polish, and Regress"; "285+ iterations ... 1,094+ merged pull
requests with zero regressions detected by the regression oracle" (self-reported). arXiv 2606.04967 process taxonomy — could not
read; only title known ("From Prompt to Process: a Process Taxonomy and Comparative Assessment of Frameworks Supporting AI
Software Development Agents").
Ralph economics (plugin README, LOW/marketing): "$50k contract completed for $297 in API costs".

---------------------------------------------------------------------------------------------------

## Anti-patterns (things known NOT to work, with the why and the source)

1. One giant spec/plan for a large feature, executed in one context — "run smoothly through specify/plan/tasks, then degrade
   during implementation"; models "lose track of the plan, ignore tasks, or hallucinate" (Spec Kit complex-features.md).
2. Retro-documenting the whole codebase before the first change — "Writing specs for code you aren't changing feels productive
   and usually isn't" (OpenSpec); "does not infer specifications for existing behavior" (Spec Kit); "over-documentation ...
   nobody reads" (BMAD).
3. Applying the full ceremony to bug fixes / one-line diffs — Kiro "turned trivial bug fixes into multi-user-story ceremonies"
   (Böckeler via field study); "If you could describe the diff in one sentence, skip the plan" (Claude Code).
4. Over-specifying until the spec is pseudo-code — "When a spec becomes pseudo-code, you've written the program twice"
   (search/field study); Spec Kit templates forbid HOW in spec.md for this reason.
5. Bloated instruction files — "Bloated CLAUDE.md files cause Claude to ignore your actual instructions!" (Claude Code); BMAD
   cites instruction files "no improvement in success rate and +20% inference cost"; Ralph keeps AGENTS.md ≤60 lines.
6. Letting the implementer grade its own work — "Claude stops when the work looks done" (Claude Code); "NO COMPLETION CLAIMS
   WITHOUT FRESH VERIFICATION EVIDENCE" (Superpowers); GSD: "not done because execution finished without errors".
7. Reviewers with an open-ended "find gaps" brief — "will usually report some, even when the work is sound ... leads to
   over-engineering" (Claude Code best-practices). Scope reviewers to correctness + stated requirements; route the rest to
   defer.
8. Assuming functionality is missing without searching — "Do NOT assume functionality is missing; confirm with code search
   first" ("the Achilles' heel", Huntley); BMAD: design decisions that "do not name what the code already does" → reinvented
   components; Böckeler: agents "duplicate existing code".
9. Feeding stale upstream artifacts (original PRD) to agents in brownfield instead of current code — "contradiction, ambiguity,
   and context-window bloat" (BMAD).
10. Pasting session history into subagent/reviewer dispatches — "A dispatch prompt describes one task, not the session's
    history" (Superpowers); reviewer must see "only the diff and the criteria ... not the reasoning" (Claude Code).
11. Parallel executors on ambiguous plans or shared files — plan-checker exists to catch "divergent assumptions about shared
    concerns" (GSD); "Two teammates editing the same file leads to overwrites" (Claude Code agent teams).
12. Unbounded loops / single exact-string completion promise — "Always rely on --max-iterations as your primary safety
    mechanism" (Ralph plugin); BMAD caps repair loops at 5; Claude Code caps Stop-hook blocks at 8 consecutive.
13. Correcting the same polluted session repeatedly — "After two failed corrections, /clear and write a better initial prompt"
    (Claude Code).
14. No declared spec-persistence model — "silent divergence ... future contributors may not know which artifact to trust"
    (Spec Kit spec-persistence.md); spec drift is "the field's central unsolved technical problem" (field study).
15. Treating an approved spec as proof — "A reviewed-and-approved wrong spec is still wrong, now with more authority"
    (field study); "passing spec tests don't guarantee correct software" (arXiv 2601.03878 via search).
16. Auto-approving plans without a review — Claude Code agent teams: the lead "approves the plan ... without the lead reviewing
    it" (documented behaviour to design around).

---------------------------------------------------------------------------------------------------

## Open questions

1. Is a truly "context-free" final reviewer better than one that gets the acceptance criteria? Every source that isolates the
   reviewer still gives it the criteria (diff + spec). No evidence found for a reviewer with zero criteria; likely it should get
   the EARS/SC acceptance list and the running artifact/test evidence, but not the transcript or plan rationale.
2. Spec↔code drift detection: Kiro's "correctness / property-based testing" and Kitchen Loop's "Drift Control" claim automation;
   neither primary page was readable. What is actually enforced vs. aspirational?
3. How many clarification questions is optimal? Spec Kit caps at 5 with recommended defaults; Harper Reed asks one at a time
   with no cap; Claude Code's interview prompt is open-ended. No comparative evidence.
4. All quantitative gains (Mercari 1.6x/150%, Ralph $297, Kitchen Loop zero regressions, ~50% error reduction) are self-reported
   or unreproduced; no independent benchmark of SDD frameworks was found (arXiv 2606.04967 may contain one — unread).
5. Kiro, Cursor, Windsurf, Devin, OpenHands, Cognition primary docs were unreachable; details there are LOW confidence.
6. Cost/benefit break-even for a solo vibe-coder: multi-agent "about 15× more tokens"; agent teams and workflows warn about
   cost; where does the funnel pay for itself? (Probably: multi-session features and brownfield changes, per field study.)
7. Whether Kiro's approval gates can be auto-approved in agentic/CI mode (cc-sdd suggests yes via flags; not verified).
8. BMAD's cited study on instruction files (+20% cost, no gain) — original source not verified.

---------------------------------------------------------------------------------------------------

## Design implications for the funnel (mapping to the user's stages)

Wide mouth / intake (assess before you specify)
- Copy Spec Kit's assess family: intake → research → define → shape → decide with an explicit "go / needs-clarification / kill"
  verdict; or OpenSpec's `/opsx:explore` "no-stakes thinking partner"; or BMAD's forge-idea ("pressure-tests a half-formed idea").
- Route by size at the mouth (cc-sdd discovery): "extend an existing spec / implement directly with no spec / create one new spec /
  decompose into multiple specs". BMAD's single criterion: is intent well-defined — "what should be true when the work is done,
  what must not change, and what is out of scope"? If the diff fits in one sentence, bypass the funnel (Claude Code).

Zones of responsibility
- Roles as `.claude/agents/*.md` with restricted tools: analyst/PM/architect/planner = read-only (`permissionMode: plan` or
  tools Read/Grep/Glob); implementer = edit + bash in a worktree (`isolation: worktree`); reviewers = read-only, fresh context,
  `omitClaudeMd` optional. Constitution (non-negotiables) as a short CLAUDE.md/AGENTS.md section plus deterministic hooks, not
  prose ("hooks are deterministic ... CLAUDE.md instructions are advisory").
- Keep project context to what is "expensive to get from the repository" (BMAD); prune with "Would removing this cause
  mistakes?" (Claude Code).

Decomposition
- Spec with prioritized, independently testable stories (Spec Kit "Independent Test" per story; foundational phase blocking);
  EARS acceptance criteria (Kiro) + measurable SC-xxx; File Structure Plan that drives task boundaries (cc-sdd); every task
  sized to "complete in one context window" (snarktank) / "2-5 minutes each" with exact file paths (Superpowers).
- Mark `[P]` parallel tasks only when "different files, no dependencies".

Distribution
- Orchestrate via a Workflow script (plan in code, results in variables, schema-validated outputs) rather than one long chat;
  fresh subagent per task with "exactly what it needs" (GSD); "one item per loop" (Ralph); each executor commits atomically; no
  two agents share files (agent-teams). Run each gated stage "as its own workflow" when a human sign-off is needed.
- Every dispatch carries objective, output format, tool guidance, boundaries (Anthropic multi-agent).

Hypothesis check BEFORE implementation
- Gate 1 clarify: `[NEEDS CLARIFICATION]` markers; ≤5 targeted questions with recommended defaults; write-back to spec.
- Gate 2 checklist: "unit tests for English" — requirement quality, never implementation.
- Gate 3 constitution check + complexity tracking (justify every violation).
- Gate 4 analyze: read-only cross-artifact consistency (coverage gaps, contradictions, vague adjectives) — CRITICAL blocks.
- Gate 5 plan-checker (GSD): complete, consistent, in scope; no ambiguity that could make parallel executors diverge.
- Gate 6 research spikes: Spec Kit research.md / BMAD deep-recon ("three ways"); Ralph's "confirm with code search first".
- BMAD's planning gate must report "intent gaps, irreversible actions, and footprint" before READY FOR DEVELOPMENT.

Execution
- TDD as constitution rule (tests fail first); backpressure hooks: PostToolUse lint/typecheck, Stop hook running the test
  command (respect `stop_hook_active`, cap 8), or `/goal` with a measurable end state and stated check.
- "Implement functionality completely. Placeholders and stubs waste efforts"; fix unrelated failing tests in the increment
  (Ralph). Evidence before claims (Superpowers Iron Law).

Independent reviewers who can send work back
- Two-stage per-task review in fresh context: spec-compliance vs. plan/acceptance criteria, then code quality (Superpowers);
  reviewers get "only the diff and the criteria"; verify "the claimed consequence at the named location, reading past the diff
  hunk" (BMAD); severity from verified consequence; triage to patch / defer / decision-needed.
- Send-back routing: converge's gap classes map to stages — `missing`/`partial` → back to tasks; `contradicts`/`unrequested` →
  back to spec/clarify; constitution violation → back to plan. Cap repair loops (5) then escalate model, then human adjudicates.

Outside, context-free reviewers with a verdict
- Final verdict stage = separate workflow/agent(s) that receive ONLY: the acceptance criteria (EARS/SC), the diff or built
  artifact, and the test/evidence log — never the transcript, plan rationale, or prior review findings. Use parallel lenses
  (security, performance, tests, UX) and let them "try to disprove each other's theories"; end-state evaluation with a rubric
  score 0–1 (Anthropic); gate statuses PASS / CONCERNS / FAIL / WAIVED (BMAD v4-era vocabulary); final human walkthrough
  (bmad-walkthrough) before merge for anything irreversible.
- Have the verdict agent run the checks itself ("fresh, complete") rather than trust reported results.

Loop back to the mouth (learning)
- Retrospective per epic: aggregate defects ("helper written twice", drift), spec reconciliations, action items → new tickets
  (BMAD); compound learnings into docs the planner reads next time (compound engineering); add "signs" to prompts after each
  observed failure (Ralph); keep AGENTS.md/CLAUDE.md operational and short.

Acceleration guardrails (so the funnel speeds up rather than adds ceremony)
- Ceremony proportional to risk/size (BMAD, Claude Code, field-study consensus); lightweight delta specs for brownfield (OpenSpec);
  reuse prompt cache across fan-outs and use small models for evaluators (Claude Code workflows/goal); pilot on a slice before
  full fan-out; watch the 15× token multiplier.
