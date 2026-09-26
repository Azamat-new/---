# Research notes — Dimension: Task decomposition, ownership zones and parallel distribution

Researcher run date: 2026-09-26. Scope: how to split large software tasks across parallel AI agents
without conflicts: hierarchical decomposition, dependency DAGs, vertical slices, bounded contexts /
ownership zones (Conway, Team Topologies, CODEOWNERS), interface contracts first, git worktrees per
agent, Claude Code agent teams / subagents / workflows, Anthropic's orchestrator-worker advice, sizing a
task to a single context window, detecting tasks that must NOT be parallelized, and merge/integration
strategies after parallel work.

Access note: the sandbox egress proxy blocked many domains (arxiv.org and mirrors, cognition.com,
martinfowler.com, docs.github.com, git-scm.com, metr.org, medium/substack, dev.to, teamtopologies.com,
etc.). Where a source could not be fetched directly, I relied on the search engine's extracted passages
and marked the claim "search-level" with reduced confidence. Directly fetched sources are marked "FETCHED".

---

## Sources read

### Anthropic / Claude Code (all FETCHED directly)

1. Building effective agents — https://www.anthropic.com/engineering/building-effective-agents
   - Orchestrator-workers: "a central LLM dynamically breaks down tasks, delegates them to worker LLMs,
     and synthesizes their results." Difference from parallelization: "subtasks aren't pre-defined, but
     determined by the orchestrator based on the specific input." Coding example: "Coding products that
     make complex changes to multiple files each time."
   - Parallelization has two flavours: sectioning (independent subtasks) and voting (same task run
     several times, e.g. several review prompts flag vulnerabilities).
   - Evaluator-optimizer works "when we have clear evaluation criteria, and when iterative refinement
     provides measurable value."
   - "Start with simple prompts, optimize them with comprehensive evaluation, and add multi-step agentic
     systems only when simpler solutions fall short."

2. How we built our multi-agent research system — https://www.anthropic.com/engineering/multi-agent-research-system
   - Each subagent brief needs "an objective, an output format, guidance on the tools and sources to use,
     and clear task boundaries." Vague briefs ("research the semiconductor shortage") caused duplication
     and gaps: one subagent explored the 2021 automotive chip crisis while 2 others duplicated work.
   - Scaling rules embedded in the prompt: simple fact-finding = 1 agent, 3-10 tool calls; direct
     comparisons = 2-4 subagents with 10-15 calls each; complex research = 10+ subagents with clearly
     divided responsibilities. Early failure: "Spawning 50 subagents for simple queries."
   - Cost: agents ~4x tokens of chat; multi-agent ~15x tokens of chat. Token usage alone explains 80% of
     variance on browsing evals (i.e., more tokens = better, but costly).
   - Key caveat for us: "most coding tasks involve fewer truly parallelizable tasks than research" and
     "Some domains that require all agents to share the same context or involve many dependencies between
     agents are not a good fit for multi-agent systems today."
   - Multi-agent (Opus 4 lead + Sonnet 4 subagents) beat single Opus 4 by 90.2% on their internal
     research eval — research, not coding.

3. When to use multi-agent systems (and when not to) — https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them
   - Three legitimate reasons: context protection ("context pollution"), parallelization of independent
     facets, specialization (different tools/prompts).
   - "Multi-agent implementations typically use 3-10x more tokens than single-agent approaches for
     equivalent tasks."
   - Warning: "teams invest months building elaborate multi-agent architectures only to discover that
     improved prompting on a single agent achieved equivalent results."
   - Decomposition rule: avoid problem-centric splits (planning -> implementation -> testing).
     "Dividing by context boundaries means an agent handling a feature should also handle its tests,
     because it already possesses the necessary context." Good boundaries: independent research paths,
     components with clean interfaces. Bad: sequential phases, tightly coupled components.
   - "Telephone game" failure: context lost at each handoff.

4. Effective context engineering for AI agents — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
   - Context rot: "As the number of tokens in the context window increases, the model's ability to
     accurately recall information from that context decreases." Finite "attention budget".
   - Compaction, structured note-taking (notes outside the window), just-in-time retrieval via
     lightweight identifiers (paths, queries).
   - Sub-agent architectures: each subagent "returns only a condensed, distilled summary of its work
     (often 1,000-2,000 tokens)".

5. Effective harnesses for long-running agents — https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
   - Initializer agent builds environment + feature list JSON (all features initially "failing";
     200+ features for a claude.ai clone) + init.sh; coding agent instructed to "work on only one
     feature at a time", leave claude-progress.txt, commit.
   - Failure modes: later agent "would often look around, see that progress had been made, and declare
     the job done"; agents "try to do too much at once—essentially to attempt to one-shot the app. Often,
     this led to the model running out of context in the middle of its implementation."
   - Testing improved when "explicitly prompted to use browser automation tools and do all testing as a
     human user would."

6. Harness design for long-running apps — https://www.anthropic.com/engineering/harness-design-long-running-apps
   - Planner (1-4 sentence prompt -> product spec), Generator ("work in sprints, picking up one feature
     at a time from the spec"), Evaluator (Playwright MCP, clicks through app like a user).
   - Generator/evaluator negotiate a contract: "the generator proposed what it would build and how
     success would be verified, and the evaluator reviewed that proposal." Agents communicate via files.
   - "Separating the agent doing the work from the agent judging it proves to be a strong lever."
     Self-evaluation: agents "confidently praising the work—even when...quality is obviously mediocre."
   - "context anxiety": models "begin wrapping up work prematurely as they approach what they believe is
     their context limit."
   - "every component in a harness encodes an assumption about what the model can't do on its own, and
     those assumptions are worth stress testing."

7. Claude Code best practices — https://code.claude.com/docs/en/best-practices
   - "Most best practices are based on one constraint: Claude's context window fills up fast, and
     performance degrades as it fills."
   - Verification: "Give Claude a check it can run." Gates: in-prompt, /goal, Stop hook, verification
     subagent ("a fresh model try to refute the result, so the agent doing the work isn't the one
     grading it"). "Have Claude show evidence rather than asserting success."
   - Explore -> Plan -> Implement -> Commit. "If you could describe the diff in one sentence, skip the
     plan." Planning is most useful when "the change modifies multiple files".
   - Spec via interview: "The most useful specs are self-contained: they name the files and interfaces
     involved, state what is out of scope, and end with an end-to-end verification step." Then "start a
     fresh session to execute it."
   - "/clear between unrelated tasks"; "After two failed corrections, /clear and write a better initial
     prompt". "A clean session with a better prompt almost always outperforms a long session with
     accumulated corrections."
   - Parallel: worktrees, cross-session messaging, desktop, cloud, agent view, agent teams. Writer /
     Reviewer pattern: "A fresh context improves code review since Claude won't be biased toward code it
     just wrote." Test-writer / implementer split.
   - Fan out: `/batch` splits into 5-30 worktree-isolated subagents; or loop `claude -p` with
     `--allowedTools`. "Test on a few files, then run on all of them."
   - Adversarial review: reviewer "sees only the diff and the criteria you give it, not the reasoning
     that produced the change". Caveat: "A reviewer prompted to find gaps will usually report some, even
     when the work is sound... Tell the reviewer to flag only gaps that affect correctness or the stated
     requirements."
   - Failure patterns: kitchen-sink session; correcting over and over; over-specified CLAUDE.md;
     trust-then-verify gap; infinite exploration.

8. Subagents — https://code.claude.com/docs/en/sub-agents
   - `.claude/agents/*.md` with frontmatter: name, description (required), tools, disallowedTools,
     model, permissionMode, maxTurns, skills, memory, mcpServers, hooks, background, omitClaudeMd,
     `isolation: worktree`.
   - Subagent receives: its own system prompt + task message + CLAUDE.md hierarchy + git status +
     preloaded skills + sibling roster. Does NOT receive: conversation history, files already read,
     parent's context.
   - `isolation: worktree` = temporary worktree "branched by default from your default branch rather
     than the parent session's HEAD"; auto-cleaned if no changes.
   - Limits: 3 nesting layers; 20 concurrent (configurable; ultracode exempt); 200 spawned per session
     (per third-party guides).
   - Use subagents when output is verbose / tool restrictions needed / self-contained work returning a
     summary; use main conversation when "Multiple phases share significant context, such as planning,
     implementation, and testing".
   - Subagent output is scanned for instruction-shaped text (prompt-injection defence).

9. Worktrees — https://code.claude.com/docs/en/worktrees
   - `claude --worktree <name>` creates `.claude/worktrees/<name>/` on branch `worktree-<name>`.
   - Isolation enforcement: blocks edits to main checkout, blocks commands whose cwd resolves to main
     checkout, blocks git redirects (`git -C`, GIT_DIR), blocks unparseable commands.
   - `worktree.baseRef`: "fresh" (default; from remote default branch) or "head".
   - `.worktreeinclude` copies gitignored files (.env) into new worktrees.
   - Worktrees share: .git dir, plugins, permission approvals, untracked skills/agents/commands.
   - Cleanup prompts on exit; periodic sweep; locks while agent runs.

10. Agent teams — https://code.claude.com/docs/en/agent-teams
    - Experimental (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Lead + teammates + shared task list +
      mailbox. "Tasks can also depend on other tasks: a pending task with unresolved dependencies cannot
      be claimed until those dependencies are completed." Claiming uses file locking. Dependencies
      unblock automatically on completion.
    - When to use: research/review, new modules "teammates can each own a separate piece", competing
      hypotheses, cross-layer coordination. "For sequential tasks, same-file edits, or work with many
      dependencies, a single session or subagents are more effective."
    - Team size: "Start with 3-5 teammates"; "If you have 15 independent tasks, 3 teammates is a good
      starting point"; "Three focused teammates often outperform five scattered ones"; "Having 5-6 tasks
      per teammate keeps everyone productive".
    - Task size: "Too small: coordination overhead exceeds the benefit. Too large: teammates work too
      long without check-ins... Just right: self-contained units that produce a clear deliverable, such
      as a function, a test file, or a review."
    - "Avoid file conflicts: Two teammates editing the same file leads to overwrites. Break the work so
      each teammate owns a different set of files." Agent teams do NOT put teammates in worktrees.
    - Hooks as gates: TeammateIdle, TaskCreated, TaskCompleted (exit 2 = block + feedback).
    - Plan mode for teammates: "Spawn an architect teammate" -> plan approval request to lead (auto-
      approved by lead session).
    - Messages between agents are marked as not from the user; cannot grant permissions.
    - Limitations: no session resumption of in-process teammates; task status can lag; one team per
      session; no nested teams; lead fixed.

11. Run agents in parallel (comparison) — https://code.claude.com/docs/en/agents
    - Five approaches: subagents, agent view, agent teams, projects, dynamic workflows. Decision axes:
      who coordinates; do workers need to talk; "Do the tasks touch the same files? Isolate the work
      with worktrees... Agent teams don't isolate teammates in worktrees, so partition the work so each
      teammate owns a different set of files."

12. Dynamic workflows — https://code.claude.com/docs/en/workflows
    - JS script with `agent()`, `pipeline()`, `parallel()`, `phase()`, structured `schema` outputs
      (5 validation retries). Up to 16 concurrent agents by default (1-256), 1,000 agents/run, 4,096
      items per parallel/pipeline. Resumable; deterministic (Date.now/Math.random throw).
    - "it can have independent agents adversarially review each other's findings before they're
      reported, or draft a plan from several angles". Examples: audit per file + adversarial verify;
      "migrate every component... working on each file in its own isolated copy"; keep fixing until
      tsc passes or two rounds make no progress.
    - `ultracode` effort = xhigh + automatic workflow planning ("one to understand the code, one to make
      the change, and one to verify it").

13. Hooks — https://code.claude.com/docs/en/hooks
    - Events: PreToolUse (can block; matcher e.g. `Edit|Write`, `if: Edit(src/**)`), Stop, SubagentStop,
      TaskCreated, TaskCompleted, TeammateIdle, WorktreeCreate/WorktreeRemove. Exit 2 = blocking error
      with stderr as feedback; JSON `permissionDecision` allow/deny, `updatedInput`, `additionalContext`.

14. /goal — https://code.claude.com/docs/en/goal
    - Wrapper around a prompt-based Stop hook; after each turn "a small fast model checks whether the
      condition holds" — "completion is decided by a fresh model rather than the one doing the work."
      Condition should have one measurable end state, a stated check, constraints. Evaluator doesn't
      run commands; judges what Claude surfaced. Stops after several no-tool turns.

15. Commands (/batch) — https://code.claude.com/docs/en/commands
    - `/batch`: "Researches the codebase, decomposes the work into 5 to 30 independent units, and
      presents a plan. Once approved, spawns one background subagent per unit in an isolated worktree.
      Each subagent implements its unit, runs tests, and publishes its change."

16. Large codebases — https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start
    - "Claude works best when it's scoped to the part of the codebase that's actually relevant." Layered
      CLAUDE.md (root = big picture; subdirectory = local conventions + build/test commands). Scope tests
      per subdirectory. Read-only subagent maps subsystems while main agent edits. LSP for symbol-level
      navigation. Designate a DRI for Claude Code config.

17. Cross-session messaging — https://code.claude.com/docs/en/cross-session-messaging
    - Sessions in separate worktrees can tell each other "what landed"; a message "can't approve
      anything"; plain text only; loops throttled. Use for "when a change in one session breaks what
      another is building on".

### Empirical studies / papers

18. AgenticFlict dataset (GitHub README, FETCHED) — https://github.com/unlv-evol/AgenticFlict
    (paper: https://arxiv.org/abs/2604.03551, ACM AIware 2026)
    - 142,652 agent PRs identified; 107,026 merge-simulated; 29,609 conflicting => 27.67% conflict rate;
      59,412 repos; 336K+ conflict regions; 5 AI agents. README: 27.67% is "notably elevated compared to
      human-authored PRs (typically 10–20%)".

19. AI Agent Pull Requests on GitHub: Frequency, Structure, and Merge Conflict Rates —
    https://arxiv.org/abs/2607.04697 (search-level; arxiv blocked)
    - AIDev-pop: 33,596 PRs in 2,807 repos. 40.2% of repos have co-active agent PR pairs with exact
      temporal overlap (79.4% of agent PRs); within a one-week window 53.4% / 95.0%.
    - Cross-agent co-active pairs conflict 41.7% vs intra-agent 19.8% (non-overlapping 95% CIs).
    - PR size: median churn 2 lines -> ~9.9% conflict; median churn 25 lines -> ~30%.

20. MAST — Why Do Multi-Agent LLM Systems Fail? — https://arxiv.org/abs/2503.13657 (NeurIPS 2025);
    definitions FETCHED from https://github.com/multi-agent-systems-failure-taxonomy/MAST
    (taxonomy_definitions_examples/definitions.txt); percentages search-level.
    - 14 failure modes in 3 categories. Names (repo): 1.1 Disobey Task Specification, 1.2 Disobey Role
      Specification, 1.3 Step Repetition, 1.4 Loss of Conversation History, 1.5 Unaware of Termination
      Conditions; 2.1 Conversation Reset, 2.2 Fail to Ask for Clarification, 2.3 Task Derailment,
      2.4 Information Withholding, 2.5 Ignored Other Agent's Input, 2.6 Action-Reasoning Mismatch;
      3.1 Premature Termination, 3.2 Weak Verification, 3.3 No or Incorrect Verification.
    - Percentages reported by secondary summaries (paper versions differ slightly): specification/system
      design ~44.2%, inter-agent misalignment ~32.3%, task verification ~23.5%; step repetition 15.7%,
      reasoning-action mismatch 13.2%, unaware of termination 12.4%, disobey task spec 11.8%, incorrect
      verification 9.1%, no/incomplete verification 8.2%, task derailment 7.4%, fail to ask 6.8%,
      premature termination 6.2%. 1600+ annotated traces across 7 frameworks; Cohen's kappa 0.88.
    - Weak verification definition: "Verification mechanisms exist within the system but fail to
      comprehensively cover all essential aspects" -> "partial validation that allows subtle errors to
      remain undetected."

21. LLMCompiler (README FETCHED; numbers not in README) — https://github.com/SqueezeAILab/LLMCompiler
    - Planner -> Task Fetching Unit -> Executor; builds a DAG of tasks with dependencies; tasks scheduled
      as soon as deps resolve; "automatically identifying which tasks can be performed in parallel and
      which ones are interdependent." Paper (search-level) claims up to ~3.6-3.7x latency speedup.

22. METR time horizons — https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/
    (search-level; metr.org blocked; GitHub METR/eval-analysis-public FETCHED confirms method + "doubling
    approximately every 7 months")
    - 50%-task-completion horizon ~50 min (early 2025); doubling ~7 months (post-2023 estimate ~4.3
      months); "Task success drops exponentially with task length"; 80%-reliability horizon is much
      shorter than the 50% horizon.

23. Context rot (Chroma) — https://www.trychroma.com/research/context-rot (search-level; blocked)
    - 18 frontier models; all degrade as input grows, well before the window limit; models did better on
      shuffled than coherent haystacks; distractors hurt.

### Practitioner / engineering sources

24. Google eng-practices, Small CLs (FETCHED) — https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md
    - "100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large"; one
      self-contained change; "Easier to merge. Working on a large CL takes a long time, so you will have
      lots of conflicts"; do refactorings in a separate CL; split by files (proto vs code using it);
      horizontal vs vertical splits.

25. git merge-tree (FETCHED from git/git Documentation) — https://github.com/git/git/blob/master/Documentation/git-merge-tree.adoc
    - `--write-tree`: "Performs a merge, but does not make any new commits and does not read from or
      write to either the working tree or index." Exit 0 clean, 1 conflicted, other = error. Output:
      OID, conflicted file info, informational messages. "parse the Conflicted file info section
      instead" of scanning the tree.

26. gh-stack (FETCHED) — https://github.com/github/gh-stack
    - "Each PR's base is set to the branch below it in the stack, so reviewers see only the diff for
      that layer"; rebases "in order from trunk upward"; merged PR -> rebase switches to `--onto`.

27. agent-org-inverse-conway kit (FETCHED) — https://github.com/IjzerenHein/agent-org-inverse-conway
    - Caveat: "Version 2 of the design, dated 2026-09-19. It has not been used on a real project yet."
    - "Cut work along ownership boundaries in the product, never by discipline." "One writer per work
      item. Fan out only reading, research, review and work on separate files." "Scripts orchestrate and
      files coordinate. Agents do not message each other. Each kind of fact has one writer and one home."
      "Whoever writes the code does not define done. Machine-produced evidence decides." "The scarcest
      approver sets how much work may be open." "Independent peer agents amplify errors far more than a
      validating centre does" and "multi-agent setups lose to a single agent on sequential, coupled work."

28. obra/superpowers issue #1173, Vertical slice development mode (FETCHED) —
    https://github.com/obra/superpowers/issues/1173
    - Horizontal/phase plans: "All layers (data, logic, API, UI) get built before anything runs
      end-to-end"; "The user (or stakeholders) can't interact with anything until the full plan is
      executed"; context strain (issue #1152 "5h token budget consumed in one run"); "Discovering a
      wrong assumption after executing 70% of a large plan is expensive."
    - Proposed: slicing phase after spec approval using nine splitting patterns; "Slice 0 (Walking
      Skeleton)" thinnest end-to-end path; order by dependency, user value, risk retirement.

29. Tracer bullets reference (FETCHED) — https://github.com/wondelai/skills/blob/main/pragmatic-programmer/references/tracer-bullets.md
    - "A tracer bullet is a thin, end-to-end implementation that connects all the major components of
      the system. It is production code -- not throwaway." Walking skeleton = tracer bullet applied to
      infrastructure. "A true tracer bullet should be deployable within days, not weeks."

30. code-maat README (FETCHED) — https://github.com/adamtornhill/code-maat
    - "Logical coupling refers to modules that tend to change together" with "a hidden, implicit
      dependency"; coupling as percentage; `--min-revs 5`, `--min-shared-revs 5`, `--min-coupling 30`,
      `--temporal-period` (same-day commits = one logical commit).

31. CODEOWNERS (FETCHED from github/docs source) — https://github.com/github/docs/blob/main/content/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners.md
    - File in `.github/`, root, or `docs/`; gitignore-like patterns; "Order is important; the last
      matching pattern takes the most precedence"; owners auto-requested for review; with branch
      protection "an approval from any of the owners is sufficient".

32. Cognition, Don't Build Multi-Agents — https://cognition.ai/blog/dont-build-multi-agents
    (search-level; blocked). Principles: "share context, and share full agent traces, not just
    individual messages"; parallel agents "make implicit choices about style, edge cases, and code
    patterns" that conflict; recommends single-threaded agent + context compression. Newer post
    "Multi-Agents: What's Actually Working" (https://cognition.com/blog/multi-agents-working) exists but
    could not be read.

33. Dave Paola, Stop parallelizing your AI agents — https://davepaola.com/writing/stop-parallelizing-your-ai-agents/
    (search-level). "The merge tax is superlinear"; USL coherency penalty ~N^2; 2 agents occasional
    conflicts, 5 frequent cascading, 9 "agents spend more time resolving conflicts than writing new
    code"; "conflict resolution was eating 30-50% of parallel agent time"; parallelize across projects
    that "don't share state", not five features in one project.

34. Base Power, Merge, Don't Queue — https://inside.basepowercompany.com/p/merge-dont-queue (search-level).
    "If two footprints are disjoint, neither change can invalidate the other's green, so the PRs can
    commute"; ledger of footprints of every landed merge; "Intersect a PR's footprint with the merges
    since its base, and you know exactly whose green went stale"; overlapping PRs ride merge trains.

35. Codacy / Autonoma / MindStudio on overlap zones (search-level) —
    https://blog.codacy.com/does-your-engineering-team-have-a-parallelization-strategy-for-ai-coding-agents-2026 ,
    https://getautonoma.com/blog/parallel-ai-agent-prs
    - "Only run tasks in parallel if their expected file sets are disjoint or nearly so." Overlap zones:
      auth/authz code, shared configuration, API contract definitions, core business logic services,
      database migration files. "Some database migrations still have to land before the code that
      depends on them." "If two tasks both require touching the same service (like AuthService), they
      should be sequential tasks for the same agent."

36. Team Topologies fracture planes (search-level; teamtopologies.com blocked) — business-domain bounded
    context, regulatory compliance, change cadence, team location, risk, performance isolation,
    technology, user personas. "If load rises, reduce scope, add platform capabilities, or split teams
    along fracture planes." Conway's law: system design copies communication structure; inverse Conway
    = choose architecture, then shape teams/ownership to match.

37. Contract-first API primer (Canada.ca; search-level) — "The establishment of a firm contract with
    strict change control rules is the only practical means of enabling parallel development"; mocks /
    virtualized services let consumers build before the provider exists.

38. Story splitting (Humanizing Work; search-level) — patterns: workflow steps, business rule
    variations, major effort, simple/complex, data variations, data entry methods, defer performance,
    operations, break out a spike; INVEST (Independent, Negotiable, Valuable, Estimable, Small, Testable);
    horizontal layer splits fail "independent" and "valuable".

---

## Findings

### A. What to split on (ownership zones, boundaries)

F1. Split by ownership/context boundary, never by discipline or phase. Anthropic: "Dividing by context
    boundaries means an agent handling a feature should also handle its tests, because it already
    possesses the necessary context"; problematic boundaries are "sequential phases or tightly coupled
    components". Inverse-Conway kit: "Cut work along ownership boundaries in the product, never by
    discipline." The frontend-agent / backend-agent / QA-agent split is an org-chart artefact that
    recreates the telephone game. (High)

F2. A "zone" for an agent should be a set of files/directories it exclusively writes. Claude Code's own
    guidance is blunt: "Two teammates editing the same file leads to overwrites. Break the work so each
    teammate owns a different set of files." Agent teams do not isolate teammates in worktrees, so the
    partition must be explicit. A CODEOWNERS-style map (last matching pattern wins; owners
    auto-requested for review) is a ready-made format for declaring zones and routing review. (High)

F3. Discover hidden coupling before drawing zones. Static imports miss "shared data contracts,
    configuration coupling, behavioral assumptions that are tested together". Logical/temporal coupling
    from git history (code-maat `coupling` analysis, default threshold 30% co-change over >=5 shared
    revisions; `--temporal-period` folds same-day commits) reveals files that must move together; put
    coupled files in the same zone or serialize them. (High for the technique; medium for the specific
    thresholds as applied to agents)

F4. Team Topologies' fracture planes are a usable checklist for where to cut: bounded business domain
    (first choice), change cadence, risk profile, performance isolation, technology, regulatory, user
    persona. Cut along the plane that minimizes cross-zone communication; if a zone's cognitive load is
    too high, "reduce scope ... or split ... along fracture planes" rather than adding process. (Medium;
    secondary sources only)

F5. Known overlap zones that break disjointness in almost every codebase: auth/authz, shared config,
    API contract definitions, core business services, DB migration files, shared helpers. These should
    be either (a) frozen before fan-out (contract first), (b) owned by exactly one worker, or (c) done
    serially before the parallel phase. (Medium; practitioner sources)

### B. How to slice (shape of units)

F6. Prefer vertical slices / tracer bullets over horizontal layers. Horizontal plans build "all layers
    (data, logic, API, UI) ... before anything runs end-to-end", concentrate integration risk at the
    end, and exhaust token budgets ("5h token budget consumed in one run"). Slice 0 = walking skeleton:
    thinnest end-to-end path that proves the architecture; then order slices by dependency, user value,
    risk retirement. A tracer bullet "is production code -- not throwaway" and should be "deployable
    within days, not weeks." (High)

F7. Each unit must be "self-contained" with "a clear deliverable, such as a function, a test file, or a
    review" (agent-teams doc). Google's review guidance gives the size intuition: "100 lines is usually a
    reasonable size ... 1000 lines is usually too large"; small changes are "Easier to merge" and
    "Less likely to introduce bugs"; refactors go in a separate change. Empirically, agent PR conflict
    probability climbs from ~10% at ~2-line churn to ~30% at ~25-line churn, so smaller units are also a
    conflict-reduction lever. (High for guidance; medium for the churn numbers)

F8. One feature per context window. Anthropic's long-running harness found agents that "attempt to
    one-shot the app" ran "out of context in the middle of its implementation"; the fix was "work on
    only one feature at a time" from a feature list where everything starts as failing. Context rot
    (recall degrades with tokens; models show "context anxiety" and wrap up early) and Claude Code's
    "context window fills up fast, and performance degrades as it fills" all point the same way. Sizing
    heuristic: if the plan needs more than one context to implement + test + verify, it is a slice
    sequence, not a task. (High)

F9. Task brief template (from Anthropic's research system): objective, output format, guidance on tools
    and sources, explicit task boundaries (what NOT to touch). Vague briefs caused duplicate coverage and
    gaps. For code, add: owned paths, forbidden paths, the contract/interface to honor, the check to run,
    and the evidence to return. MAST's most frequent failure ("Disobey Task Specification", ~12%) is a
    specification failure, not a model failure. (High)

F10. Specs before fan-out should be self-contained: "they name the files and interfaces involved, state
     what is out of scope, and end with an end-to-end verification step" — then "start a fresh session to
     execute it." (High)

### C. Dependencies and scheduling

F11. Represent the work as a DAG with explicit dependencies and schedule topologically; only nodes whose
     deps are all complete are eligible. Claude Code's shared task list implements this natively ("a
     pending task with unresolved dependencies cannot be claimed until those dependencies are completed";
     claiming uses file locking; completion unblocks dependents automatically). LLMCompiler's
     Planner/Task-Fetching-Unit is the same idea at the tool-call level. (High)

F12. Contract first unlocks parallelism: fix interfaces/schemas/API contracts (and migrations) BEFORE
     fan-out, freeze them under change control, and let consumers build against mocks/stubs. Canada.ca
     primer: "a firm contract with strict change control rules is the only practical means of enabling
     parallel development." In Claude Code, a PreToolUse hook (`Edit|Write` matcher on `contracts/**`,
     `migrations/**`) can make the freeze deterministic. (High for the principle; medium for the quote)

F13. Sizing the fan-out: Anthropic's rules (1 agent for simple; 2-4 for comparisons; 10+ only for
     genuinely complex, clearly divided work); Claude Code: "Start with 3-5 teammates", "5-6 tasks per
     teammate", "Three focused teammates often outperform five scattered ones." Coordination overhead
     grows superlinearly (Paola/USL: 2 -> occasional conflicts, 5 -> cascading, 9 -> more conflict time
     than coding). (High for Anthropic numbers; medium-low for Paola's numbers)

### D. Detecting what must NOT be parallelized

F14. Official do-not-parallelize list (Claude Code docs): "sequential tasks, same-file edits, or work
     with many dependencies" -> single session or subagents. Anthropic research post: "domains that
     require all agents to share the same context or involve many dependencies between agents are not a
     good fit for multi-agent systems today"; "most coding tasks involve fewer truly parallelizable tasks
     than research." (High)

F15. Practical detector, combining sources: parallelize a pair of tasks only if (1) predicted write-sets
     are disjoint, (2) neither is in a known overlap zone, (3) co-change coupling between their files is
     below threshold, (4) neither depends on the other in the DAG, (5) neither touches a contract that
     is not yet frozen, (6) the shared state they mutate (schema, config, global registry) is owned by
     one of them only. Otherwise: same worker, sequential. Rule of thumb: "If two tasks both require
     touching the same service ... they should be sequential tasks for the same agent, not parallel tasks
     for different agents." (Medium; synthesis)

F16. Parallel WRITERS carry a specific risk that parallel READERS do not: "actions carry implicit
     decisions" (style, edge cases, patterns) which conflict when made independently (Cognition). The
     inverse-Conway kit's rule "One writer per work item. Fan out only reading, research, review and
     work on separate files" and "Independent peer agents amplify errors far more than a validating
     centre does" is the conservative default. Research/review/hypothesis fan-out is nearly always safe;
     implementation fan-out is safe only with disjoint zones + frozen contracts. (Medium; one source
     unread directly, one untested design)

### E. Isolation and integration

F17. Worktree per writer is the isolation baseline (`claude --worktree`, subagent `isolation: worktree`,
     `/batch`), and Claude Code enforces it (blocks edits/commands/git redirects into the main checkout).
     Base new worktrees on the remote default branch ("fresh") unless the work must build on unpushed
     commits ("head"); copy .env via `.worktreeinclude`. But worktrees only isolate text, not semantics:
     "you can create merge conflicts between them without knowing" (GitButler, via search). (High)

F18. Integrate serially, dry-run first, re-verify after every landing. `git merge-tree --write-tree
     <base> <branch>` performs the merge in memory (exit 1 = conflicts; parse the conflicted-file section)
     so an integrator agent can detect textual conflicts without touching the tree. Merge one branch at a
     time onto an integration branch, run the full check after each merge (green-on-its-own branches
     can break when combined), and rebase remaining branches. For dependent slices use stacked PRs
     (gh-stack: each PR's base is the branch below; cascading rebase from trunk; auto `--onto` when a
     lower PR merges). (High)

F19. Footprint-based commutation is the scalable version: record the footprint (files, tests, generated
     artifacts) of every landed change; two changes with disjoint footprints can be validated and landed
     concurrently, intersecting ones are serialized ("whose green went stale"). This is exactly the
     zone-disjointness rule applied at merge time, so the zone map from decomposition doubles as the
     merge-queue footprint. (Medium; Base Power post unread directly)

F20. Empirical baseline: agent PRs conflict 27.67% of the time (vs ~10-20% human); cross-agent co-active
     PR pairs conflict 41.7% vs 19.8% for same-agent pairs; 79-95% of agent PRs are co-active with
     another agent PR. Mixed-tool fleets and long-lived parallel branches are the highest-risk
     configuration; short-lived, small, single-tool, zone-disjoint branches are the low-risk one.
     (High for 27.67%; medium for the rest)

### F. Verification structure that decomposition must feed

F21. Separate the doer from the judge. Anthropic harness: "Separating the agent doing the work from the
     agent judging it proves to be a strong lever" because self-evaluation "confidently prais[es] the
     work". Claude Code: reviewer subagent "sees only the diff and the criteria you give it, not the
     reasoning that produced the change"; `/goal` uses "a fresh model rather than the one doing the
     work"; TaskCompleted/Stop hooks exit 2 to refuse "done". MAST: ~23% of failures are verification
     failures, and "Weak Verification" = checks exist but are partial. (High)

F22. Decomposition must produce, per unit, the machine check that decides done ("Whoever writes the code
     does not define done. Machine-produced evidence decides."). Units without a runnable check are not
     ready for distribution. End-to-end user-level testing ("as a human user would", Playwright) catches
     what unit tests and curl miss. (High)

F23. Cost accounting: multi-agent = ~15x chat tokens / 3-10x single agent; workflows warn above 25 agents
     or 1.5M projected tokens. Use fan-out where value/parallelism justify it (research, review, disjoint
     slices, migrations of many files) and a single writer elsewhere. (High)

---

## Anti-patterns (with why)

- AP1. Phase/layer decomposition for parallel agents (schema agent -> API agent -> UI agent): nothing
  runs end-to-end until the end; integration bugs surface at 70-100% completion; token budget burned
  (superpowers #1173; Anthropic harness).
- AP2. Discipline-based roles (frontend/backend/QA agents) instead of ownership-based zones: telephone
  game, context loss at each handoff, tests written by someone without the feature context (Anthropic
  multi-agent blog; inverse-Conway kit).
- AP3. Vague briefs ("investigate X", "research the shortage"): duplicated work and coverage gaps
  (Anthropic research system); MAST "Disobey Task Specification" and "Task Derailment".
- AP4. Over-spawning: "Spawning 50 subagents for simple queries"; five scattered teammates vs three
  focused; coordination cost > benefit (Anthropic; Claude Code docs).
- AP5. Two writers on one file / on an overlap zone (auth, config, contracts, migrations): overwrites
  in agent teams; textual + semantic conflicts at merge (Claude Code docs; Codacy/Autonoma).
- AP6. Treating worktrees as full isolation: they isolate text, not behaviour; "green on its own, red
  when combined" (GitButler quote; ctx.rs; Paola).
- AP7. Merging many agent branches at once / long-lived parallel branches: conflicts compound; each
  resolved conflict changes the base and invalidates the others' assumptions (Paola; Nimbalyst guide).
- AP8. Large agent PRs: conflict probability rises steeply with churn; reviews are shallower (Google
  small-CLs; 2607.04697).
- AP9. Letting the implementer grade itself or declare done: over-praise, premature termination,
  "see that progress had been made, and declare the job done" (Anthropic harness posts; MAST).
- AP10. Reviewer told to "find gaps" without a correctness filter: manufactures findings -> over-
  engineering (Claude Code best practices).
- AP11. Independent peer agents debating without a validating centre for coupled implementation work:
  errors amplify (inverse-Conway kit; Cognition).
- AP12. Kitchen-sink sessions / correcting >2 times / over-long CLAUDE.md: context pollution; rules
  get lost (Claude Code best practices).
- AP13. Agent teams for sequential, same-file, or dependency-heavy work (Claude Code docs explicitly).
- AP14. Mixed-tool fleets on the same repo at the same time: cross-agent conflict rate double the
  intra-agent rate (2607.04697).
- AP15. Elaborate multi-agent architecture where "improved prompting on a single agent achieved
  equivalent results" (Anthropic blog).

---

## Open questions

- Q1. No published numeric rule for "fits in one context". METR shows success falling exponentially
  with task length and 80%-reliability horizons far shorter than 50% ones, but the mapping from
  "human-hours" to "one Claude Code session" is unknown. Practical proxy: one feature + its tests +
  its e2e check, roughly a 100-400 line diff.
- Q2. Why do cross-agent PR pairs conflict 2x more than same-agent pairs? Style divergence? Different
  formatting? Untested; implication is that a fleet should use one tool/style config per repo.
- Q3. MAST category percentages differ between paper versions and summaries (44/32/24 vs other
  reported splits); the ranking of the top modes is stable.
- Q4. Semantic-conflict detection has no standard tool; footprint/merge-train systems (Base Power) are
  in-house. Cheapest approximation: re-run full checks after each serial landing + co-change coupling.
- Q5. Does agent-team "debate" improve correctness enough to pay 3-10x tokens for implementation, or is
  it only worth it for hypothesis/research phases? Anthropic's 90% gain was on research evals; no
  equivalent published coding number.
- Q6. Cognition's follow-up "Multi-Agents: What's Actually Working" was unreadable here; their current
  position may have softened toward read-only/research fan-out plus single writer.
- Q7. Base for worktrees: "fresh" (remote default) vs "head" — fresh reduces stale-base drift but
  breaks when slices depend on unpushed prior slices; stacked PRs address this but add restack cost.
- Q8. The inverse-Conway kit's file-based coordination (no agent messaging) vs Claude Code's mailbox
  model: which is more robust for the funnel? Untested by its own author.

---

## Design implications for the funnel

1. Intake (wide mouth): Interview -> self-contained spec (files, interfaces, out-of-scope, e2e
   verification step). Nothing enters decomposition without a runnable definition of done.
2. Hypothesis check BEFORE implementation: plan mode / architect subagent produces (a) zone map,
   (b) contracts, (c) Slice 0 walking skeleton as the executable hypothesis. If Slice 0 fails, loop
   back to intake — cheaply, before 70% of the plan is built.
3. Decomposition: vertical slices from the spec (nine splitting patterns), each sized to one context
   (one feature + tests + check; ~100-400 line diff target), expressed as a DAG with explicit deps.
   Run co-change coupling over the touched files; merge coupled units; mark overlap-zone units as
   serial-first.
4. Ownership zones: a CODEOWNERS-style `zones` map (path patterns -> worker role) checked into the repo;
   PreToolUse hook denies writes outside a worker's zone and to frozen contracts/migrations. One writer
   per zone; reading is unrestricted.
5. Distribution: fan out only eligible DAG nodes; 3-5 writers max by default; each writer in its own
   worktree (fresh base) with the brief template (objective, output format, tools, boundaries, owned
   paths, contract, check, evidence). Research/review fan-out can be wider (workflows, 16+ agents).
6. Execution: worker implements one unit, runs its own check, returns evidence + diff summary
   (1-2k tokens). TaskCompleted hook refuses completion without passing check output.
7. Integration: integrator agent dry-runs `git merge-tree --write-tree` for each branch against the
   integration branch, lands one at a time in DAG order, re-runs the full suite after each landing,
   rebases the rest; dependent slices as stacked PRs. Footprint ledger = zone map.
8. Independent reviewers (fresh context, diff + spec + criteria only; correctness-only findings) can
   send a unit back to step 3/5 with the gap list; the implementing worker fixes and re-submits.
9. Outsider verdict: a reviewer with NO process context gets only the running app / acceptance
   criteria and drives it "as a human user would" (Playwright-style), plus `/goal`-style separate
   evaluator for the final condition. Verdict: ship / back to intake.
10. Cost guardrails: scale fan-out to complexity; single writer for coupled or sequential work;
    record per-phase token spend; prefer the simplest topology that passes the checks.
