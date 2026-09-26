# Intake research notes — "The wide mouth": turning a vague, compound vibe-coder prompt into routed, sized, gradeable work items

Researcher dimension: intake stage of the funnel workflow (request typing, compound-ask splitting, dedupe,
acceptance-criteria formats that two graders score identically, ask-vs-assume-vs-prototype, what NOT to
extract, non-functional envelope, story-splitting adapted to agents, intake artifact schema).
Date: 2026-09-26.

Method note. The session's WebSearch budget was already exhausted (200/200) when this researcher started, so
every source below was reached by direct URL (WebFetch) or by GitHub code search. The egress proxy blocks
most third-party sites; the list of blocked hosts is in "Sources NOT reachable" below. Where a blocked primary
source could only be read through a GitHub mirror (a translation, a digest, a reproduction inside a skill
repo), the evidence class is marked "secondary mirror" and confidence is lowered. Nothing below is
paraphrased from memory without being flagged.

Evidence classes used: `vendor doc` (official product docs), `vendor eng` (vendor engineering blog),
`practitioner` (individual/OSS practice, no measured outcome), `peer-reviewed / preprint` (paper),
`secondary mirror` (paper or blocked page read via a third-party reproduction), `inference` (my synthesis).

---------------------------------------------------------------------------------------------------

## Sources read (with what was extracted)

### Anthropic / Claude Code (vendor doc, vendor eng) — all fetched directly
- https://code.claude.com/docs/en/best-practices — verification criteria, plan-mode threshold ("If you could
  describe the diff in one sentence, skip the plan"), bug prompt pattern, "Let Claude interview you"
  (AskUserQuestion prompt, SPEC.md, fresh session), self-contained spec definition, adversarial review in fresh
  subagent, "Report gaps, not style preferences", failure patterns.
- https://code.claude.com/docs/en/common-workflows — bug tips ("Tell Claude the command to reproduce the issue
  and get a stack trace"), worktrees for parallel sessions, scheduled-task prompt advice ("can't ask clarifying
  questions").
- https://code.claude.com/docs/en/hooks and https://code.claude.com/docs/en/hooks-guide — events,
  exit-2 semantics per event, `UserPromptSubmit` block/`additionalContext`, Stop hook 8-block cap and
  `stop_hook_active`, prompt-based hooks (`ok:false` + `reason`, `impossible:true`).
- https://code.claude.com/docs/en/sub-agents — fresh isolated context, `tools`, `model`, `maxTurns`,
  `isolation: worktree`, what a subagent does and does not receive.
- https://code.claude.com/docs/en/workflows — `agent()` with JSON `schema` (validated, 5 retries), `pipeline()`,
  "No mid-run user input … For sign-off between stages, run each stage as its own workflow".
- https://code.claude.com/docs/en/agent-teams — "Two teammates editing the same file leads to overwrites",
  task sizing ("self-contained units that produce a clear deliverable"), `TaskCreated`/`TaskCompleted` hooks.
- https://code.claude.com/docs/en/goal — evaluator is a separate small model; a good condition has "One
  measurable end state", "A stated check", "Constraints that matter: anything that must not change".
- https://code.claude.com/docs/en/tools-reference — AskUserQuestion: multiple-choice + `Other` free text,
  `askUserQuestionTimeout`.
- https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents — "two domain experts … same
  pass/fail verdict", grader types table, "Everything the grader checks should be clear from the task description".
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — initializer agent,
  features.json with `passes:false`, "one feature at a time".
- https://www.anthropic.com/engineering/multi-agent-research-system — subagent brief must contain objective,
  output format, tools/sources, task boundaries; effort scaling numbers; duplicate-work failure.
- https://www.anthropic.com/research/building-effective-agents — routing, evaluator-optimizer,
  orchestrator-workers definitions.
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — "smallest possible set
  of high-signal tokens", "right altitude", context rot, 1,000–2,000-token subagent summaries.
- https://www.anthropic.com/engineering/how-we-contain-claude — auto-mode classifier "catches roughly 83% of
  overeager behaviors", "~17% of overeager actions get through", "Design for containment at the environment
  layer first, then steer behavior at the model layer."
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices —
  "Golden rule: Show your prompt to a colleague with minimal context …", "Overeagerness" section with the scope
  guidance text.
- https://platform.claude.com/docs/en/test-and-evaluate/define-success — Specific / Measurable / Achievable /
  Relevant; "Even 'hazy' topics such as ethics and safety can be quantified."
- https://platform.claude.com/docs/en/test-and-evaluate/develop-tests — "Automate when possible", "Prioritize
  volume over quality", binary LLM-classification example, "use a different model to evaluate".

### GitHub Spec Kit (vendor doc; GitHub) — raw files fetched directly
- https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md — 5-question cap, 10
  coverage categories, one-at-a-time, Recommended option, Impact × Uncertainty, question format rules, stop rules.
- https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/specify.md — max 3
  `[NEEDS CLARIFICATION]`, informed guesses, list of things NOT to ask about, quality checklist.
- https://raw.githubusercontent.com/github/spec-kit/main/templates/spec-template.md — INDEPENDENTLY TESTABLE
  stories, FR-001 format, Assumptions section.
- https://raw.githubusercontent.com/github/spec-kit/main/templates/tasks-template.md — `[P]` = "different
  files, no dependencies"; foundational phase blocks stories.
- https://raw.githubusercontent.com/github/spec-kit/main/templates/plan-template.md — Constitution Check gate,
  Technical Context (performance goals / constraints / scale "or NEEDS CLARIFICATION"), Complexity Tracking.
- https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/checklist.md — "checklists are
  unit tests for requirements writing", item format, `[Gap]/[Ambiguity]/[Conflict]`.
- https://raw.githubusercontent.com/github/spec-kit/main/spec-driven.md — "Avoid HOW to implement (no tech
  stack, APIs, code structure)", "Don't guess".
- https://raw.githubusercontent.com/github/spec-kit/main/README.md and
  https://raw.githubusercontent.com/github/spec-kit/main/extensions/assess/README.md — the opt-in `assess`
  extension (intake → research → define → shape → decide; "go / needs-clarification / kill").
- https://raw.githubusercontent.com/github/spec-kit/main/extensions/assess/commands/speckit.assess.intake.md —
  the intake note fields (Type enum, "Idea (as captured)", "Restated", "First-Glance Unknowns"), "Do not
  evaluate, size, or solutionize", "Never invent origin or context".
- https://raw.githubusercontent.com/github/spec-kit/main/extensions/assess/commands/speckit.assess.decide.md —
  six criteria rated strong/adequate/weak/unknown; verdict conditions.
- https://raw.githubusercontent.com/github/spec-kit/main/extensions/bug/README.md and
  https://raw.githubusercontent.com/github/spec-kit/main/extensions/bug/commands/speckit.bug.assess.md —
  assess → fix → test; "a reproduction that was not actually performed is reported as `partial` or `not-run`,
  not `verified`"; fix "stays within the files listed in the assessment"; "Never invent reproduction steps".

### BMAD Method (OSS practitioner framework; GitHub raw)
- https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/docs/plan/choose-a-planning-path.md —
  "Is the intent already well defined?"; well-defined intent = "What should be true when the work is done",
  "What must not change", "What is out of scope"; "complete enough that someone else could build it without
  guessing, and no longer than that."
- https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/docs/build/build-a-change.md — plan must
  report "intent gaps (things you did not say that you would notice in the result)", "irreversible actions",
  "footprint"; light path vs full plan; "fixing the plan is cheaper than fixing the code."
- https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/skills/bmad-build-auto/step-01-clarify-and-route.md
  — "Do not fantasize or leave open questions. If the intent cannot be resolved, HALT with status `blocked`";
  `multiple-goals` warning.
- https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/skills/bmad-build-auto/workflow.md —
  full-plan standard: Actionable, Logical, Testable (Given/When/Then), Surface-anchored ("ACs observe outermost
  surface, never internal proxies"), Complete, Sufficient, Coherent.
- https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/skills/bmad-build-auto/step-02-plan.md —
  READY-FOR-DEVELOPMENT GATE, Code Map with read-only constraints.
- GitHub code search hits in the same repo: `skills/bmad-architecture/references/headless.md` ("infer
  everything, ask nothing, but never invent — record inferences as `assumptions[]` and gaps that need a human as
  `open_questions[]`"); `skills/bmad-architecture/references/reviewer-gate.md` ("a throwaway prototype may run it
  quietly or skip the gate entirely").

### Superpowers (obra/superpowers; practitioner; GitHub raw)
- skills/brainstorming/SKILL.md — "Only one question per message"; "Explore the current structure before
  proposing changes"; "YAGNI ruthlessly"; "If the project is too large for a single spec, help the user decompose
  into sub-projects".
- skills/writing-plans/SKILL.md — task = "the smallest unit that carries its own test cycle"; "Each step is one
  action with a checkable result"; "A plan is the set of decisions the implementer cannot make alone."
- skills/systematic-debugging/SKILL.md — "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"; "If not
  reproducible → gather more data, don't guess"; failing test "MUST have before fixing"; 3+ failed fixes → stop.
- skills/test-driven-development/SKILL.md — "If you didn't watch the test fail, you don't know if it tests the
  right thing."; "Write code before the test? Delete it."
- skills/verification-before-completion/SKILL.md — "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION
  EVIDENCE"; evidence table (bug resolved = "Original symptom no longer reproduces"; regression test valid =
  "Red-green cycle confirmed").
- skills/subagent-driven-development/SKILL.md — reviewer receives "task brief, report file, diff as a file,
  binding global constraints"; "A dispatch prompt describes one task, not the session's history."; fix loop ≤5.

### Other practitioner sources (GitHub raw / code search)
- https://raw.githubusercontent.com/harperreed/harper.blog/main/content/post/2025-02-16-llm-codegen-and-you/index.md
  (mirror of the blocked harper.blog post) — "Ask me one question at a time so we can develop a thorough,
  step-by-step spec for this idea."; "compile our findings into a comprehensive, developer-ready specification";
  steps "small enough to be implemented safely with strong testing, but big enough to move the project forward";
  non-greenfield: "planning done per task, not for the entire project".
- https://raw.githubusercontent.com/snarktank/ralph/main/README.md and .../prompt.md — "Each PRD item should be
  small enough to complete in one context window."; "Work on ONE story per iteration"; "Keep changes focused and
  minimal"; `passes: true` only after checks.
- https://raw.githubusercontent.com/mikeyobrien/ralph-orchestrator/main/AGENTS.md — anti-patterns "Scoping work
  at task selection time (scope at plan creation instead)" and "Assuming functionality is missing without code
  verification"; "Backpressure Over Prescription".
- GitHub code search for the exact phrase "before assuming functionality is missing" — 3 hits:
  crabbuild/crab AGENTS.md ("Search before assuming. Search the codebase before assuming functionality is
  missing." next to "Surgical changes … Every changed line traces to the request."), tradestreamhq/tradestream
  dev/ralph-loop/PROMPT_plan.md ("VERIFY FIRST - Search codebase before assuming functionality is missing"),
  NoamHadad12/secure-research-image-upload AGENTS.md ("Search the repository before assuming functionality is
  missing. Implement only that story and its tests. Record unrelated discoveries in the plan instead of
  expanding scope."). Provenance: Ralph-loop family of prompts (Geoffrey Huntley's ghuntley.com is blocked, so
  the original wording could not be verified).
- https://raw.githubusercontent.com/gotalab/claude-code-marimo/main/.claude/commands/kiro/spec-requirements.md
  (cc-sdd reproduction of Kiro's requirements command; kiro.dev blocked) — EARS templates, "Generate an initial
  set of requirements … then iterate with the user to refine them" (no sequential questioning), approval gate.
- https://raw.githubusercontent.com/Kanevry/session-orchestrator/main/docs/adr/0005-ears-notation-plan.md —
  practitioner ADR: Spec Kit does not standardise on EARS (issue #1356 open); EARS→test mapping is 1:1;
  decision = emit EARS alongside Gherkin.
- https://raw.githubusercontent.com/cucumber/docs/main/content/docs/bdd/better-gherkin.md (source of the
  blocked cucumber.io page) — "describe what, not how"; test: "Will this wording need to change if the
  implementation does?"; declarative vs imperative examples.
- https://raw.githubusercontent.com/conventional-commits/conventionalcommits.org/master/content/v1.0.0/index.md
  — `fix`, `feat`, `BREAKING CHANGE`, plus `build chore ci docs style refactor perf test`.
- https://raw.githubusercontent.com/lm-sys/FastChat/main/fastchat/llm_judge/README.md — "humans and GPT-4 judge
  achieve over 80% agreement, the same level of agreement between humans."
- https://raw.githubusercontent.com/borghei/Claude-Skills/main/project-management/execution/backlog-refinement/references/invest-and-splitting-guide.md
  and https://raw.githubusercontent.com/citypaul/.dotfiles/main/claude/.claude/skills/story-splitting/resources/source-notes.md
  — secondary reproductions of INVEST (Wake), Lawrence's 9 patterns, SPIDR mapping, hamburger method, walking
  skeleton; "Spike last, not first".
- GitHub code search hits quoting Cockburn's walking-skeleton definition verbatim (simota/agent-skills,
  philou/built-in-quality-game).

### Peer-reviewed / preprints (read only via mirrors — arXiv is blocked)
- Qu, Zhang, Zhang, Deng, Li, Zhang, Liu (2026), "Overeager Coding Agents: Measuring Out-of-Scope Actions on
  Benign Tasks", arXiv:2605.18583. Read via:
  https://raw.githubusercontent.com/CMander02/DailyAgentPapers/main/data/2026/05/18/overeager-coding-agents-measuring-out-of-scope-actions-on-benign-tasks.md
  (English digest), https://raw.githubusercontent.com/deusyu/harness-engineering/main/works/arxiv-overeager-coding-agents-translation.md
  (full Chinese translation), https://raw.githubusercontent.com/agentpatterns-ai/website/main/verification/overeager-behavior-elicitation-scope-trap-fragments.md.
- Cook et al. (2024), "TICKing All the Boxes: Generated Checklists Improve LLM Evaluation and Generation",
  arXiv:2410.03608, read via https://raw.githubusercontent.com/memgrafter/research-digests/main/ml_research_analysis_2024/2410.03608_ticking-all-the-boxes-generated-checklists-improve-llm-evaluation-and-generation_20260214_234746.md.
- Zheng et al. (2023) MT-Bench / "Judging LLM-as-a-judge" — via the FastChat README above.
- Mavin et al. (2009) EARS, RE'09 — NOT reachable (alistairmavin.com, IEEE, Wikipedia all blocked). Pattern
  templates confirmed by multiple independent GitHub reproductions (lextoumbourou/notes, n17foo/retailpos
  EARS-GUIDE.md, hexsecs/canarchy spec-template.md). No outcome data (ambiguity/defect reduction) could be verified.

### Sources NOT reachable through the proxy (do not treat any statement about them as verified)
arxiv.org (+ export/ar5iv), alistairmavin.com, harper.blog (mirrored via GitHub), mountaingoatsoftware.com
(SPIDR primary), humanizingwork.com (Lawrence patterns primary), xp123.com (INVEST primary), gojko.net
(hamburger method primary), cucumber.io (mirrored via GitHub), kiro.dev (mirrored via cc-sdd replica),
hamel.dev (LLM-judge binary pass/fail post — NOT mirrored; excluded), en.wikipedia.org, conventionalcommits.org
(mirrored via GitHub), web.archive.org, semanticscholar, openalex, huggingface.co, openreview.net,
aclanthology.org, agilealliance.org, wiki.c2.com, alistair.cockburn.us, martinfowler.com, docs.github.com,
simonwillison.net, medium.com, dev.to, substack.com, openai.com, cursor.com, docs.anthropic.com (use
platform.claude.com instead). GitHub MCP `get_file_contents` is restricted to the session repo; raw.githubusercontent.com
works for public files.

---------------------------------------------------------------------------------------------------

## Findings

### F1. Request typing exists in shipped tools and changes the downstream path (vendor doc, practitioner)

Spec Kit's `assess` extension intake note has a closed `Type` enum: `new-capability | improvement | fix |
exploration | cost-saving | compliance | other` (speckit.assess.intake.md). Its bug extension is a separate
family (`assess → fix → test`) with its own artifact directory `.specify/bugs/<slug>/`. Conventional Commits
provides the industry vocabulary `fix / feat / BREAKING CHANGE` plus `build chore ci docs style refactor perf test`.
Anthropic's "Building effective agents" names the pattern: routing "classifies an input and directs it to a
specialized followup task" and is for "complex tasks where there are distinct categories that are better handled
separately."

How each type changes the path, with the source for each rule:
- bug → reproduce first, record the RED run. Claude Code best practices bug prompt: "users report that login
  fails after session timeout. check the auth flow in src/auth/, especially token refresh. write a failing test
  that reproduces the issue, then fix it". Superpowers: "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST", "If
  not reproducible → gather more data, don't guess", failing test "MUST have before fixing". Spec Kit bug
  extension: "a reproduction that was not actually performed is reported as `partial` or `not-run`, not
  `verified`"; the fix "stays within the files listed in the assessment". Verification-before-completion: bug
  resolved = "Original symptom no longer reproduces"; regression test valid = "Red-green cycle confirmed".
- question → no funnel. Claude Code: "Ask Claude questions you'd ask a senior engineer … No special prompting
  required: ask questions directly." `/btw` answers "never enter conversation history". A question produces an
  answer, not a work item; the only artifact is the answer.
- chore / one-sentence diff → direct, skip planning. Claude Code: "For tasks where the scope is clear and the
  fix is small (like fixing a typo, adding a log line, or renaming a variable) ask Claude to do it directly …
  If you could describe the diff in one sentence, skip the plan." BMAD: "One small story or bug can go straight
  to Build without ticketing"; light path when "clean on all three" (intent gaps, irreversible actions, footprint).
- idea / "make it better" → assessment or spike before spec. Spec Kit assess: "Capture & normalize a raw idea"
  → research ("evidence *against* the idea") → define → shape ("2–3 concept-level options with appetite") →
  decide ("go / needs-clarification / kill"; a `go` needs evidence "adequate or higher, never weak/unknown").
  Claude Code: "Vague prompts can be useful when you're exploring and can afford to course-correct."; "tell
  Claude to try something risky. If it doesn't work, rewind". BMAD reviewer gate: "a throwaway prototype may run
  it quietly or skip the gate entirely". Harper Reed's greenfield loop (one-question spec) vs "non-greenfield …
  planning done per task, not for the entire project".
- feature / refactor → the full funnel (spec → plan → tasks). Refactor gets an extra invariant: Claude Code
  refactor recipe "while maintaining the same behavior", "Do refactoring in small, testable increments".

Inference: seven types are enough (`bug, feature, refactor, chore, question, idea, improve`), with `improve`
("make it better") forced to become either a measurable target (→ feature/refactor) or an `idea` spike. The
type is the router's first key; every other field's requiredness depends on it (bug requires a repro command;
question requires nothing).

### F2. "Search before assuming missing" and backlog dedupe are established rules, but only as prompts, not measured (practitioner, vendor doc)

Exact-phrase search finds the rule "Search the codebase before assuming functionality is missing" in the Ralph
prompt family (crabbuild/crab AGENTS.md; tradestreamhq PROMPT_plan.md "VERIFY FIRST"; NoamHadad12 AGENTS.md) and
its negative form "Assuming functionality is missing without code verification" as a listed anti-pattern in
ralph-orchestrator AGENTS.md. Superpowers brainstorming: "Explore the current structure before proposing
changes." Spec Kit bug assess: step 3 "Search the codebase for suspect files/functions; cite evidence";
"Never guess at file paths". Backlog dedupe: the GitHub MCP server's own instructions (present in this session)
say "Use 'search_issues' before creating new issues to avoid duplicates"; Spec Kit intake: "Do not duplicate—if
`intake.md` exists, ask (interactive) or refuse (automated)". Anthropic multi-agent: "Without detailed task
descriptions, agents duplicate work, leave gaps, or fail to find necessary information."

Implication: the intake artifact must carry evidence of the search (queries run, hits, verdict
`exists|partial|missing`), not just a checkbox, so the hypothesis checker and the blind verdict can see that
"missing" was established rather than assumed. Confidence that this reduces errors: medium (consistent
practitioner convergence, no controlled measurement).

### F3. Shared files ⇒ serialize; the rule is explicit in three vendor docs (vendor doc)

Spec Kit tasks template: task format `[ID] [P?] [Story] Description`; `[P]` = "different files, no
dependencies"; tasks touching identical files run sequentially; a Foundational phase blocks all stories. Claude
Code agent teams: "Two teammates editing the same file leads to overwrites. Break the work so each teammate owns
a different set of files."; worktrees exist "so concurrent edits don't collide". Claude Code workflows migration
example: "working on each file in its own isolated copy". Implication: the intake artifact needs per-item
`allow_paths` so the router can compute overlap and emit `shares_files_with` → `serialize`.

### F4. Acceptance criteria: the agreement standard is "two experts, same pass/fail"; formats that decompose into binary checks measurably raise agreement (vendor eng, preprint via mirror, vendor doc)

- Anthropic, demystifying evals: "A good task is one where two domain experts would independently reach the
  same pass/fail verdict." and "Everything the grader checks should be clear from the task description; agents
  shouldn't fail due to ambiguous specs." Grader table: code-based = "Binary tests (fail-to-pass,
  pass-to-pass)", "Objective", "Reproducible"; model-based = "Rubric-based scoring", "Non-deterministic",
  needs "Calibration with human graders".
- TICK (arXiv 2410.03608, via digest): instruction-specific YES/NO checklists raise exact agreement with
  human preferences "+5.8% compared to direct scoring"; giving the same checklists to humans raised
  inter-annotator agreement "from 0.194 to 0.256". (Numbers from a digest; paper not directly read.)
- MT-Bench (FastChat README): "humans and GPT-4 judge achieve over 80% agreement, the same level of agreement
  between humans" — i.e. holistic 1–10 judging tops out at human-level noise; decomposition is what buys more.
- Anthropic develop-tests: "Automate when possible: Structure questions to allow for automated grading (for
  example, multiple-choice, string match, code-graded, LLM-graded)"; "Generally best practice to use a different
  model to evaluate than the model used to generate the evaluated output".
- Spec Kit: "Requirements are testable and unambiguous", "Success criteria are measurable",
  "technology-agnostic"; the checklist command turns requirement quality itself into binary questions
  ("checklists are unit tests for requirements writing"; items like "Can visual hierarchy be objectively measured?").
- BMAD full-plan standard: "Testable: All acceptance criteria use Given/When/Then format", "Surface-anchored:
  ACs observe outermost surface, never internal proxies".
- EARS (templates confirmed via mirrors): `Ubiquitous: The <system> shall <response>`; `WHEN <trigger>, the
  <system> shall <response>`; `WHILE <state>, …`; `WHERE <feature>, …`; `IF <unwanted condition>, THEN the
  <system> shall <response>`. A practitioner ADR (Kanevry) notes EARS maps 1:1 to tests (Event-driven →
  arrange/trigger/expect, Unwanted → error path, State-driven → describe block) and that Spec Kit "does not
  standardize on EARS" (open issue #1356). No peer-reviewed ambiguity-reduction figure for EARS could be
  verified through the proxy.
- Gherkin (cucumber docs source): "it should describe what, not how"; test "Will this wording need to change
  if the implementation does?"; declarative ("When Free Frieda logs in with her valid credentials / Then she sees
  a Free article") over imperative click-by-click steps.

Inference for the funnel: an acceptance criterion is intake-complete only when it has (a) a trigger/condition
sentence (EARS or Given/When/Then), (b) an observable at the outermost surface, and (c) a `check` = command +
expected exit code / output fixture, so that the code-based grader can run it and the model-based grader only
has to answer YES/NO per item. "Definition of done as an ordered list of commands with expected exit codes" is
directly supported by Claude Code (`/goal`: "A stated check: how Claude should prove it, such as `npm test`
exits 0"; Stop hooks block on exit 2) and by Ralph (`passes:true` only after typecheck/lint/test).

### F5. Ask vs assume vs prototype: practitioners disagree on question count, agree on shape (vendor doc, practitioner)

Question policies found:
- Spec Kit /clarify: "Maximum of 5 total questions across the whole session"; "Present EXACTLY ONE question
  at a time"; "Never reveal future queued questions in advance"; each question multiple-choice (2–5 mutually
  exclusive options) or short answer (≤5 words) with a "**Recommended:**" option and 1–2-sentence reasoning;
  prioritised by "Impact × Uncertainty"; gate "Would the answer materially change implementation or validation
  strategy?"; excluded: implementation-only choices, tech-stack comparisons, task-breakdown details; stops when
  critical ambiguities resolved early, user says "done", or 5 asked; if none: "No critical ambiguities detected
  worth formal clarification".
- Spec Kit /specify: "Maximum 3 [NEEDS CLARIFICATION] markers total … keep only the 3 most critical"; "Make
  informed guesses based on context and industry standards"; "Use reasonable defaults for unspecified details
  (document assumptions in Assumptions section)"; do NOT ask about standard practices (data retention,
  performance targets, error handling, authentication methods, integration patterns); ask only when choices
  "significantly impact feature scope or user experience" with "multiple reasonable interpretations with
  different implications".
- Claude Code interview: open-ended — "Interview me in detail using the AskUserQuestion tool … Don't ask
  obvious questions, dig into the hard parts I might not have considered. Keep interviewing until we've covered
  everything, then write a complete spec to SPEC.md." Then "start a fresh session to execute it."
- Harper Reed: "Ask me one question at a time so we can develop a thorough, step-by-step spec" (unbounded).
- Superpowers brainstorming: "Only one question per message".
- Kiro (via cc-sdd replica): the opposite — "Generate an initial set of requirements … then iterate with the
  user to refine them" rather than sequential questioning; explicit approval gate before design.
- BMAD headless: "infer everything, ask nothing, but never invent — record inferences as `assumptions[]` and
  gaps that need a human as `open_questions[]`"; build-auto: "Do not fantasize or leave open questions. If the
  intent cannot be resolved, HALT with status `blocked`"; interactive build: "each intent gap recorded as an open
  question you answer before approval".
- Claude Code scheduled tasks: "The task runs autonomously, so it can't ask clarifying questions."
- Claude Code workflows: "No mid-run user input … For sign-off between stages, run each stage as its own
  workflow." ⇒ all questions must be asked before a workflow launches.

When a spike beats a question (sources): Lawrence patterns "Spike (last resort) – Time-box investigation when
team cannot estimate"; consensus digest "Spike last, not first"; Claude Code "tell Claude to try something risky.
If it doesn't work, rewind"; agent teams debugging "Spawn 5 agent teammates to investigate different hypotheses …
try to disprove each other's theories". Inference: a question whose answer lives in the codebase or can be
produced by running code (does X exist? does the API return Y? is the test flaky?) is a spike, not a human
question; a question about intent/value/priority is a human question; everything "standard practice" is an
assumption with a default.

### F6. What NOT to extract, and the measured value of a one-sentence scope statement (vendor doc, preprint via mirror)

- No HOW: Spec Kit "Focus on WHAT users need and WHY", "Avoid HOW to implement (no tech stack, APIs, code
  structure)"; checklist item "No implementation details (languages, frameworks, APIs)". Gherkin: "Will this
  wording need to change if the implementation does?" INVEST-N (secondary): "describes WHAT to build and WHY,
  but not HOW".
- Tension: Claude Code says the best spec "name[s] the files and interfaces involved, state[s] what is out of
  scope, and end[s] with an end-to-end verification step". BMAD Code Map lists "file paths, symbols/lines, reuse
  points, and read-only constraints" — but in the plan, after investigation, not in the intake. Resolution
  (inference): file paths appear in the intake artifact only as *authorization* (`allow_paths` / `deny_paths`),
  never as design; symbols/interfaces belong to the plan stage.
- Keep it short: Anthropic context engineering "find the smallest possible set of high-signal tokens that
  maximize the likelihood of some desired outcome"; CLAUDE.md test "Would removing this cause Claude to make
  mistakes?"; BMAD "complete enough that someone else could build it without guessing, and no longer than that";
  Anthropic prompting golden rule "Show your prompt to a colleague with minimal context on the task and ask them
  to follow it. If they'd be confused, Claude will be too."
- Scope statement evidence (Overeager Coding Agents, arXiv:2605.18583, via two mirrors): overeager action
  defined as reads/writes "the user never authorized" on a benign task; on paired scenarios byte-identical except
  for the "Scope of consent" block, "stripping the consent declaration alone raises the overeager rate from 0.0%
  to 17.1% on paired scenarios (McNemar exact p = 2.4 × 10⁻⁴)" (Claude Code, Sonnet-4.6); "Stripping consent
  multiplies the overeager rate on every shared base model (Δ in [11.9, 17.2] pp)"; permissive frameworks
  (Claude Code, Codex CLI, Gemini CLI) 5.4–27.7% vs ask-to-continue (OpenHands) 0.2–4.5%; 500 scenarios,
  ~7,500 runs. The authors' caution (translation): agents were "matching declared text rather than inferring
  boundaries" — the statement works because it is literal, so it must name paths/actions, not intentions.
  Anthropic containment post independently: auto-mode classifier "catches roughly 83% of overeager behaviors",
  "~17% of overeager actions get through", so "Design for containment at the environment layer first" — i.e.
  the scope statement must also be enforced by a deterministic PreToolUse hook, not only stated.
- Anthropic prompting doc's recommended scope text (for Opus 4.5/4.6 overeagerness): "Scope: Don't add
  features, refactor code, or make 'improvements' beyond what was asked. A bug fix doesn't need surrounding code
  cleaned up. A simple feature doesn't need extra configurability."

### F7. Non-functional envelope: what the shipped templates make mandatory (vendor doc, practitioner)

- Spec Kit /clarify coverage categories that are the NFR envelope: "Non-Functional Quality Attributes",
  "Integration & External Dependencies", "Edge Cases & Failure Handling", "Constraints & Tradeoffs", "Completion
  Signals"; each ends as Clear / Resolved / Deferred / Outstanding. Spec Kit plan Technical Context forces
  "Performance Goals … or NEEDS CLARIFICATION", "Constraints (e.g., <200ms p95, <100MB memory,
  offline-capable)", "Scale/Scope … or NEEDS CLARIFICATION"; deviations from the constitution need a "Complexity
  Tracking" justification.
- BMAD's three build-gate statements: the plan reports "intent gaps (things you did not say that you would
  notice in the result), irreversible actions, and footprint"; and a well-defined intent says "What should be
  true when the work is done", "What must not change", "What is out of scope".
- Claude Code `/goal`: "Constraints that matter: anything that must not change on the way there, such as 'no
  other test file is modified'". Long-running harness: "It is unacceptable to remove or edit tests".
- Spec Kit /specify explicitly lists NFR defaults you should assume rather than ask (performance targets,
  error handling, auth method, data retention, integration patterns) and record under Assumptions.
Inference: envelope = {performance target or "n/a", security boundary, compatibility (versions/platforms that
must keep working), out-of-scope list, irreversible actions allowed? (default no: no migrations, deletes,
force-pushes, external calls), footprint cap (max files/lines), tests-must-not-be-edited}.

### F8. Story splitting adapted to agents: vertical slices sized to one context window (vendor eng, practitioner, secondary)

- Sizing rules that name the unit: Ralph "Each PRD item should be small enough to complete in one context
  window. If a task is too big, the LLM runs out of context before finishing and produces poor code" (examples:
  add a column, a UI component, a server-logic update; not "build entire dashboard"). Anthropic harness: "over
  200 features, such as 'a user can open a new chat, type in a query, press enter, and see an AI response'",
  "work on only one feature at a time" was "critical to addressing the agent's tendency to do too much at once".
  Superpowers: task = "the smallest unit that carries its own test cycle". Agent teams: "self-contained units
  that produce a clear deliverable, such as a function, a test file, or a review"; "5-6 tasks per teammate".
  Anthropic multi-agent effort scale: "Simple fact-finding requires just 1 agent with 3-10 tool calls", "direct
  comparisons might need 2-4 subagents with 10-15 calls each", ">10 subagents" for complex research.
- Splitting patterns (primary sites blocked; reproduced consistently in several GitHub skills): Lawrence's nine
  — workflow steps, business-rule variations, happy/unhappy paths, input options/platforms, data variations,
  CRUD operations, test scenarios, defer performance, spike (last resort); SPIDR (Cohn) = Spikes, Paths,
  Interfaces, Data, Rules; hamburger method (Adzic) = pick the minimum acceptable option in every technical layer
  and take a vertical "bite"; walking skeleton (Cockburn, quoted verbatim in two repos): "a tiny implementation
  of the system that performs a small end-to-end function … it should link together the main architectural
  components." Consensus digest: "Slice vertically, not horizontally", "Spike last, not first".
- Independence: Spec Kit "Each user story/journey must be INDEPENDENTLY TESTABLE … if you implement just ONE
  of them, you should still have a viable MVP"; INVEST (secondary) I/S/T.
- Verification of the slice: Ralph "For any story that changes UI, you MUST verify it works in the browser";
  Anthropic harness "verifying features end-to-end once explicitly prompted to use browser automation tools".
Inference: the intake splits by (1) walking skeleton first if nothing end-to-end exists, then (2) Lawrence/SPIDR
patterns, and (3) a size check: one feature + its tests + its check must fit one subagent run (Claude Code
`maxTurns` and the 1,000–2,000-token summary return make this enforceable). Items that fail the size check are
split again; spikes are the last pattern, time-boxed, throwaway.

### F9. Hooks and schema validation give each intake rule a deterministic home (vendor doc)

- `UserPromptSubmit`: exit 2 "Blocks prompt processing and erases the prompt"; stdout / `hookSpecificOutput.additionalContext`
  adds context; `updatedInput` rewrites the prompt. ⇒ the place to stamp `intake.json` presence / language /
  type onto every prompt or to refuse a prompt that has no intake artifact yet.
- `PreToolUse` (Write/Edit/Bash): exit 2 blocks the call ⇒ enforce `deny_paths` and "no irreversible actions"
  deterministically (the 17% argument).
- `Stop`: exit 2 "Prevents Claude from stopping"; "Claude Code overrides a Stop hook after it blocks eight
  times in a row without progress"; check `stop_hook_active`. ⇒ definition-of-done as commands with exit codes.
- Prompt-based hooks: model returns `{"ok": false, "reason": …}` or `"impossible": true`. ⇒ cheap two-grader
  agreement dry run on acceptance criteria before release from intake.
- Agent teams: `TaskCreated` "Exit with code 2 to prevent creation" ⇒ duplicate/unsplit-task guard; `TaskCompleted`.
- Workflows: `agent(prompt, { schema })` validates JSON output (fails after 5 attempts) ⇒ the intake agent's
  output schema is enforced by the runtime; "No mid-run user input" ⇒ questions happen in a pre-workflow stage.
- Subagents: "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation
  history" ⇒ the context-free verdict agent is a subagent whose task message contains only the `verdict_view`
  subset; `omitClaudeMd: true` removes even project context if desired.

---------------------------------------------------------------------------------------------------

## Comparison table of intake methods (evidence quality)

| Method | Source class | Question policy | Ask-vs-assume rule | Output artifact | Typing / dedupe | Evidence quality |
|---|---|---|---|---|---|---|
| Spec Kit `/specify` + `/clarify` | vendor doc (GitHub) | ≤3 NEEDS CLARIFICATION markers in spec; ≤5 questions, one at a time, MC 2–5 options + Recommended, Impact×Uncertainty | Assume standard practices with defaults, record in Assumptions; ask only if "materially change implementation or validation strategy" | spec.md (stories P1.., FR-nnn, success criteria, assumptions, `## Clarifications`) | No type; dedupe only via assess-intake "if intake.md exists, ask/refuse" | Detailed procedure; no outcome data |
| Spec Kit `assess` extension | vendor doc (GitHub), opt-in | none at intake ("capture only") | "Never invent origin or context"; unknowns as `[NEEDS CLARIFICATION]` | intake.md (Type enum, idea verbatim, restated, origin, first-glance unknowns) → … → decision.md (go / needs-clarification / kill) | Type enum of 7; explicit kill path | Procedure only |
| Spec Kit `bug` extension | vendor doc (GitHub), opt-in | none | "Never invent reproduction steps"; repro status verified/partial/not-run | assessment.md → fix.md (only edits listed files) → test.md | bug-specific path | Procedure only |
| Claude Code interview | vendor doc | open-ended AskUserQuestion until "covered everything" | interviewer decides | SPEC.md; executed in fresh session | none | Vendor recommendation; no data |
| Harper Reed one-question | practitioner | one question at a time, unbounded | n/a | spec.md → prompt_plan.md → todo.md | greenfield only; legacy = plan per task | Anecdotal |
| Superpowers brainstorming | practitioner | one question per message | check codebase first; YAGNI; decompose if too large | design doc → writing-plans | none | Anecdotal |
| Kiro / cc-sdd | vendor (via replica) | generate first, then iterate; approval gate | infer, then let user correct | requirements.md (user story + EARS ACs) | none | Procedure only |
| BMAD choose-a-path / build | practitioner framework | headless: ask nothing, record assumptions[] / open_questions[]; interactive: gaps become open questions before approval; HALT if unresolvable | "never invent"; three statements: done / must not change / out of scope; plan reports intent gaps, irreversible actions, footprint | SPEC.md / plan with intent-contract, READY-FOR-DEVELOPMENT gate | `multiple-goals` warning; light vs full route | Procedure only |
| Ralph PRD loop | practitioner | none (PRD prepared up front) | n/a | prd.json stories sized to one context window, `passes` flag | one story per iteration; search-before-assume rule | Anecdotal |
| Anthropic long-running harness | vendor eng | none (initializer agent) | n/a | features.json (200+ features, `passes:false`) | one feature per session | Internal anecdotal |
| EARS acceptance syntax | peer-reviewed origin (inaccessible) + mirrors | n/a | n/a | five sentence templates | n/a | Templates verified; outcome claims unverified |
| Gherkin declarative | vendor doc (cucumber source) | n/a | n/a | Given/When/Then, what-not-how | n/a | Guidance only |
| Checklist grading (TICK) | preprint via digest | n/a | n/a | YES/NO items per instruction | n/a | +5.8% agreement; IAA 0.194→0.256 (digest) |
| "Two experts same verdict" | vendor eng (Anthropic) | n/a | n/a | task/grader design rule | n/a | Design principle, no number |
| Scope-of-consent statement | preprint via mirrors | n/a | n/a | one block naming authorized actions | n/a | 0.0%→17.1% paired ablation, p=2.4e-4 |

---------------------------------------------------------------------------------------------------

## Recommended intake procedure (question budget and stop rules)

Stage 0 — Capture (no judgment; Spec Kit assess-intake rules)
0.1 Store the ask verbatim (secrets redacted), the source language, the channel, attachments.
0.2 Restate in one or two neutral sentences in the working language (English), WHAT + WHY only.
0.3 Never invent origin/context; unknowns → `[NEEDS CLARIFICATION]`.

Stage 1 — Type and route (F1)
1.1 Assign one of `bug | feature | refactor | chore | question | idea | improve` per independent ask.
1.2 Route: `question` → answer, no artifact. `chore` where the diff fits one sentence → direct execution with
    a check, no plan. `bug` → reproduction-first path (repro command required before anything else). `idea` /
    `improve` → assessment or time-boxed spike; may end in `kill`. `feature` / `refactor` → full funnel.
1.3 BMAD's three statements must be answerable for anything routed to the funnel: what should be true when
    done; what must not change; what is out of scope. If any is blank after stages 2–4 → `needs-clarification`.

Stage 2 — Look before asking (F2)
2.1 Code search: run and log queries for each capability named in the ask; record `exists | partial | missing`
    with file hits. "Search the codebase before assuming functionality is missing."
2.2 Backlog search: `gh issue list --search`, existing intake artifacts; record duplicates → merge or link.
2.3 Read CLAUDE.md / constitution for constraints that answer questions before they are asked.

Stage 3 — Split (F3, F8)
3.1 One item per independently testable outcome (Spec Kit INDEPENDENTLY TESTABLE; INVEST). Compound signals:
    "and", multiple verbs, multiple surfaces, BMAD `multiple-goals`.
3.2 If nothing end-to-end exists yet, item 1 is a walking skeleton.
3.3 Apply Lawrence/SPIDR patterns; spike is the last pattern, time-boxed, throwaway.
3.4 Size check: feature + tests + check must fit one subagent run (target ≤ ~10 files touched, one commit); else split.
3.5 Compute `allow_paths` overlap between items; overlapping → `serialize`, else `[P]`.

Stage 4 — Fill each item (F4, F6, F7)
4.1 Acceptance criteria as EARS or Given/When/Then sentences, each with a `check` (command + expected exit code
    or fixture) and, for bugs, `red_evidence_required: true`.
4.2 Authorized-scope statement, literal: "May change: <paths>. Must not change: <paths/behaviours>. No
    irreversible actions (migrations, deletes, network writes) unless listed."
4.3 NFR envelope: performance target or n/a; security boundary; compatibility; out-of-scope list;
    irreversible actions allowed (default false); footprint cap; tests must not be edited/removed.
4.4 Risk signals for the router: touches auth/data/migrations/external APIs; user-facing; novelty; irreversible.

Stage 5 — Assume, then ask (F5)
5.1 Assume with defaults for standard practices (Spec Kit list: retention, performance targets, error handling,
    auth method, integration patterns). Each assumption gets `owner` (agent|human), `default_applied`,
    `revisit_when` (a concrete trigger, e.g. "if ACs mention >1k users").
5.2 Question budget: ≤5 per intake (≤3 when ≤2 items); one at a time; multiple choice 2–5 options + Recommended;
    ordered by Impact × Uncertainty; ask only if the answer "would materially change implementation or
    validation strategy". Never ask what a code search or a spike can answer, never ask tech-stack questions.
5.3 Spike instead of question when the answer is empirical (does X exist / what does the API return / is it
    flaky): time-box (e.g. 30 min or N tool calls), throwaway, output = facts into `assumptions`/`existing_code_check`.
5.4 Stop rules: all high-impact unknowns resolved; human says done; budget exhausted → remaining unknowns go to
    `open_questions` with a default and the item proceeds only if the default is low-impact, else
    `needs-clarification` (BMAD HALT `blocked`). Questions are asked before any workflow launches (workflows
    have "No mid-run user input").

Stage 6 — Release gates (F4, F9)
6.1 Schema-valid `intake.json` (Workflow `schema` enforces).
6.2 No HOW leakage: lint for framework/library/API names and file-level design in goal/AC text (not in paths).
6.3 Every AC has a runnable `check`; bug items have a repro command; two independent graders (fresh subagents,
    small model) receive each AC + a synthetic pass and a synthetic fail transcript and must agree on both →
    disagreement returns the AC for rewording ("two domain experts … same pass/fail verdict").
6.4 Scope statement non-empty; `deny_paths` compiled into a PreToolUse hook for the implementer.
6.5 Dedupe evidence present (queries logged).
6.6 `verdict_view` computed: the subset the context-free verdict agent may see.

---------------------------------------------------------------------------------------------------

## Intake artifact schema

### JSON (`.funnel/intake/<slug>/intake.json`)

```json
{
  "schema": "funnel.intake/1",
  "id": "IN-2026-09-26-offline-mode",
  "created_at": "2026-09-26T12:00:00Z",
  "source": {
    "verbatim": "<original ask, secrets redacted>",
    "language": "ru",
    "channel": "cli|issue|chat|voice",
    "attachments": ["screenshot.png"],
    "raised_by": "human|NEEDS CLARIFICATION",
    "trigger": "what prompted it|NEEDS CLARIFICATION"
  },
  "restated_goal": "One or two neutral sentences: WHAT + WHY, no HOW.",
  "route": "none|direct|bug|spike|assess|funnel",
  "items": [
    {
      "item_id": "IN-…-1",
      "type": "bug|feature|refactor|chore|question|idea|improve",
      "title": "≤ 10 words",
      "goal": "one sentence, outermost-surface observable",
      "acceptance": [
        {
          "id": "AC1",
          "form": "ears|gwt|command",
          "text": "WHEN a user submits a registered email, the system SHALL send a reset link within 60 seconds.",
          "check": { "cmd": "npm test -- reset-link.test.ts", "expect_exit": 0, "expect_output_regex": null },
          "red_evidence_required": false
        }
      ],
      "reproduction": { "cmd": "npm test -- login.test.ts -t 'empty password'", "status": "verified|partial|not-run", "observed": "stack trace…" },
      "authorized_scope": {
        "statement": "May change: src/auth/**, tests/auth/**. Must not change: public API of src/auth/index.ts, any migration, any file under infra/. No irreversible actions.",
        "allow_paths": ["src/auth/**", "tests/auth/**"],
        "deny_paths": ["infra/**", "migrations/**", "tests/**/!(auth)/**"],
        "irreversible_actions_allowed": false,
        "tests_may_be_edited": ["tests/auth/**"]
      },
      "existing_code_check": {
        "queries": ["rg 'resetLink'", "rg -i 'password reset' src/"],
        "hits": ["src/auth/reset.ts:42"],
        "verdict": "exists|partial|missing"
      },
      "backlog_check": { "queries": ["gh issue list --search 'password reset'"], "duplicates": [] },
      "depends_on": [],
      "shares_files_with": [],
      "parallelizable": true,
      "size": { "files_est": 3, "fits_one_context": true, "walking_skeleton": false },
      "nfr_envelope": {
        "performance": "n/a|<200ms p95",
        "security": "no new secrets; no auth bypass",
        "compatibility": "Node 20+, existing API unchanged",
        "out_of_scope": ["email templates redesign"],
        "footprint_cap": { "max_files": 10 }
      },
      "risk_signals": {
        "touches_auth": true, "touches_data_or_migrations": false, "external_api": true,
        "user_facing": true, "irreversible": false, "novelty": "low|medium|high"
      }
    }
  ],
  "assumptions": [
    { "id": "A1", "text": "Reset links expire after 24h (industry default).", "owner": "agent", "default_applied": true, "impact": "low", "revisit_when": "if AC or reviewer mentions expiry" }
  ],
  "open_questions": [
    { "id": "Q1", "question": "Should unregistered emails receive the same confirmation?", "options": ["Same message (Recommended: avoids enumeration)", "Explicit error"], "recommended": 0, "impact": "high", "blocking": false, "asked": false }
  ],
  "spike": { "needed": false, "question": "", "timebox_minutes": 30, "throwaway": true, "result": null },
  "gates": { "schema_valid": true, "no_how_leak": true, "all_ac_checkable": true, "two_grader_agreement": true, "scope_statement_present": true, "dedupe_done": true },
  "verdict_view": ["restated_goal", "items[].goal", "items[].acceptance[].text", "items[].acceptance[].check", "items[].authorized_scope.statement", "items[].nfr_envelope.out_of_scope"]
}
```

`verdict_view` is the only part the context-free verdict agent receives (plus the diff and the check outputs).
It deliberately excludes `source.verbatim` (which may contain the human's HOW hints), `assumptions`,
`open_questions`, `existing_code_check` and all risk signals, so the verdict is rendered against the contract,
not against the process. The independent (in-process) reviewers receive the full artifact.

### Markdown view (`intake.md`, ≤ 1 page, generated from the JSON)

```
# IN-2026-09-26-offline-mode — feature — route: funnel
**Ask (verbatim, ru):** «…»
**Goal:** …one sentence…
**Items**
1. [feature] Reset link by email — parallel — files: src/auth/**
   - AC1 (ears): WHEN … SHALL … — check: `npm test -- reset-link.test.ts` → exit 0
   - Scope: May change src/auth/**, tests/auth/**. Must not change public API, migrations, infra/**. No irreversible actions.
   - Envelope: perf n/a · security: no auth bypass · compat: API unchanged · out of scope: template redesign
   - Existing code: partial (src/auth/reset.ts:42) · Backlog: none
**Assumptions** A1 … (agent, low, revisit if …)
**Open questions** Q1 … [Recommended: …] (high, non-blocking)
**Gates** schema ✓ no-HOW ✓ checks ✓ 2-grader ✓ scope ✓ dedupe ✓
```

---------------------------------------------------------------------------------------------------

## Intake failure modes — detection signal and a hook/check for each

| # | Failure mode | Detection signal | Deterministic check / hook |
|---|---|---|---|
| 1 | Guessing instead of asking (silent assumption on a high-impact fork) | `assumptions[]` has `impact: high` with `owner: agent`; hedges in goal/AC ("probably", "assume", "likely"); BMAD "intent gaps: things you did not say that you would notice in the result" | Schema rule: high-impact assumption must have `owner: human` or a matching `open_questions[]` entry; intake agent output validated by Workflow `schema`; prompt-based hook on the intake stage returns `ok:false` with the gap |
| 2 | Over-asking (interview never ends; questions the codebase could answer) | `open_questions[].asked` count > 5; question mentions a library/framework/file; question answerable by `rg`; user fatigue | Counter in the intake script; reject any question failing "would the answer materially change implementation or validation strategy?"; force `existing_code_check` before the first question |
| 3 | Pseudo-code specs (HOW leakage) | framework/library names, function signatures, SQL, class names in `goal`/`acceptance[].text`; Gherkin imperative steps ("click", "field"); AC that "would need to change if the implementation does" | Lint script on intake.json (regex over a project-specific deny-list of tech terms + code-fence detection) run as a PostToolUse hook on writes to `.funnel/intake/**`; Spec Kit checklist item "No implementation details" |
| 4 | Duplicate items (vs backlog, vs code, vs other items in the same intake) | `existing_code_check.verdict = exists` yet item type is `feature`; two items with near-identical titles/ACs; `backlog_check.duplicates` non-empty | Require non-empty `existing_code_check.queries`; `TaskCreated` hook (agent teams) or PreToolUse on TaskCreate rejects a task whose title fuzzy-matches an existing one; GitHub `search_issues` before `issue_write` |
| 5 | Unsplit compound asks | "and"/"also"/"plus" joining verbs; >1 outermost surface in ACs; `size.fits_one_context = false`; BMAD `multiple-goals` | Schema: each item ≤ N ACs and one goal sentence; splitter subagent re-run until every item passes the size check; `TaskCreated` hook blocks tasks with >1 verb phrase |
| 6 | Bug without a RED run | `type: bug` and `reproduction.status != verified` | Gate before implementation: PreToolUse on Write/Edit blocks unless `reproduction.status == verified` recorded; verification-before-completion rule "Red-green cycle confirmed" |
| 7 | Missing / non-literal scope statement | `authorized_scope.statement` empty or lacks "Must not change"; `deny_paths` empty | Block release from intake; compile `deny_paths` into a PreToolUse hook for the implementer (the 0.0%→17.1% and "~17% get through" evidence say state it AND enforce it) |
| 8 | Non-gradeable acceptance criteria | AC has no `check`; adjectives (fast, clean, better, robust) without a number; two fresh small-model graders disagree on a synthetic pass/fail | Two-grader dry run (fresh subagents, different model than the author); Anthropic define-success S/M/A/R; reword until agreement |
| 9 | Shared-file collision marked parallel | overlapping `allow_paths` between items both `parallelizable: true` | Router computes overlap → `serialize`; worktree isolation for the rest |
| 10 | "Make it better" accepted as a feature | `type: improve` with no measurable target | Route to `assess`/spike; require a metric or convert to `kill` |
| 11 | Intake grows into a design doc | `intake.md` > 1 page; item count > ~7; file/symbol lists outside `allow_paths` | Length gate; BMAD "no longer than that"; move design content to the plan stage |
| 12 | Language drift (ask in Russian, spec in English loses nuance) | back-translation of `restated_goal` disagrees with `source.verbatim` | Keep verbatim; have a fresh subagent back-translate the restated goal and compare; ask one confirmation question if they diverge |

---------------------------------------------------------------------------------------------------

## Anti-patterns (things known NOT to work, with why)

- Relying on the scope statement alone for safety: Anthropic reports the auto-mode classifier still lets
  "~17% of overeager actions" through; the Overeager paper shows the statement works by text-matching. Enforce
  paths with PreToolUse hooks/sandbox as well ("Design for containment at the environment layer first").
- Holistic 1–10 rubric grading for acceptance: MT-Bench's judge tops out at "over 80% agreement, the same
  level of agreement between humans"; decomposed YES/NO checklists add measurable agreement (TICK). Also a
  reviewer "prompted to find gaps will usually report some, even when the work is sound" (Claude Code) — make
  the verdict item-wise and binary.
- Unbounded interviews (Harper Reed / open-ended AskUserQuestion) for brownfield work: Reed himself switches
  to "planning done per task" for legacy code; Spec Kit caps at 5; Kiro generates-then-iterates. Intake
  questions must also be asked before a Workflow starts ("No mid-run user input").
- Asking the human what the codebase can answer: contradicted by every Ralph/Superpowers/Spec Kit source
  ("Never guess at file paths", "Search the codebase before assuming functionality is missing").
- Putting HOW in the intake (tech stack, APIs, code structure): Spec Kit "Avoid HOW", Gherkin "will this
  wording need to change if the implementation does?"; it removes design freedom and makes ACs brittle.
- Big items "to save orchestration overhead": Ralph and Anthropic's harness both report degradation when a
  task exceeds one context window / one feature; agent teams docs: "Too large: teammates work too long without
  check-ins, increasing risk of wasted effort."
- Scoping at task-selection time rather than at plan/intake time (ralph-orchestrator anti-pattern): the
  implementer then decides scope in its own context, which is where overeager edits come from.
- Fixing before reproducing (bugs): Superpowers "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"; Spec Kit
  bug repro must be `verified`, otherwise reported as `partial`/`not-run`.
- Treating "kill" as failure: Spec Kit assess records `kill` "as successful, not a failure"; an intake that
  cannot produce a gradeable item should end there, cheaply.
- Over-long CLAUDE.md-style intake rules: Claude Code "If your CLAUDE.md is too long, Claude ignores half of
  it"; keep intake rules short and move the mechanical ones into hooks.

---------------------------------------------------------------------------------------------------

## Open questions

1. No accessible controlled study compares EARS vs Gherkin vs free text for *LLM* grader agreement; the TICK
   numbers are for checklists over general instructions, not code acceptance criteria. Worth a small in-house
   experiment: same 20 ACs in three formats, two fresh Haiku graders, measure exact agreement.
2. The Overeager result (0.0% → 17.1%) is a paired ablation on one model/framework; the translation says the
   authors treat the statement as text-matching rather than boundary inference. Unknown: does a literal
   path-level statement generalize across models, and does it hold when the implementer is a subagent that never
   saw the human's original prompt?
3. Optimal question budget for solo vibe-coders is unmeasured (5 in Spec Kit, 3 markers, unbounded in
   interviews). Proposal: 3 for ≤2 items, 5 otherwise, with a hard "no tech questions" rule.
4. Whether the context-free verdict agent should see `out_of_scope` and the scope statement at all (they help
   it judge scope creep) vs the risk of anchoring it on the intake's framing. Proposed: yes to the contract
   (goal, ACs, scope), no to assumptions/questions/risk signals.
5. Hamel Husain's binary-vs-Likert argument and Mavin's EARS outcome data are frequently cited but were not
   reachable; they remain unverified here.
6. Spec Kit's extension command file names differ from the README slugs (`speckit.assess.intake.md` vs
   `/speckit-assess-intake`); check the installed version before scripting against them.

---------------------------------------------------------------------------------------------------

## Design implications for the funnel

1. The intake stage is a *capture → type → route* stage, not a spec stage. It ends in one of five exits:
   answer (question), direct (chore), bug path (repro-first), assess/spike (idea/improve, may `kill`), funnel
   (feature/refactor). Every exit except "answer" produces `intake.json`.
2. The artifact carries per item exactly the three BMAD statements (done / must not change / out of scope)
   encoded as `acceptance[]`, `authorized_scope`, `nfr_envelope.out_of_scope`, each machine-checkable.
3. Acceptance criteria are written in EARS or Given/When/Then and each has a command with an expected exit
   code; the blind verdict agent grades item-wise YES/NO against `verdict_view` only.
4. Ask/assume/spike order is fixed: search code and backlog → assume standard practices with recorded defaults
   → spike empirical unknowns → ask ≤5 human questions (one at a time, multiple choice, recommended default) →
   halt as `needs-clarification` if a high-impact fork remains.
5. Scope is stated literally (paths and forbidden actions) and compiled into a PreToolUse deny hook for the
   implementer; irreversible actions default to forbidden.
6. Items are vertical slices sized to one subagent run; overlapping paths serialize; walking skeleton first;
   spikes last and throwaway.
7. Deterministic gates live in hooks and schema validation (UserPromptSubmit stamp, Workflow `schema`,
   PostToolUse lint on intake files, Stop-hook checks with the 8-block cap in mind); judgment gates use
   prompt-based hooks with a different, small model.
8. Keep the human-facing view to one page; anything longer is design and belongs to the plan stage.
