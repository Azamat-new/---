# Research notes: Anthropic guidance on agentic coding & multi-agent systems

Dimension: "Anthropic guidance on agentic coding & multi-agent systems"
Date of research: 2026-09-26
Researcher: subagent (Fable 5.1)
Purpose: feed the design of a "funnel / milk-separator" vibe-coding workflow
(wide intake -> zones of responsibility -> decomposition -> distribution ->
hypothesis check before implementation -> execution -> independent reviewers
that can send work back -> context-free outside reviewers that deliver a
verdict). Target implementation: Claude Code (.claude/agents, workflows,
skills, hooks, CLAUDE.md), but the methodology should be tool-agnostic.

Method: 8 web searches, 25+ primary-source fetches (Anthropic research/
engineering blog, claude.com blog, code.claude.com docs, platform.claude.com
docs). Third-party summaries were used only to locate primary sources, except
for Cognition's "Don't build multi-agents" (all mirrors were egress-blocked in
this sandbox; that item is graded medium/low confidence and flagged as such).

---------------------------------------------------------------------------

## Sources read (primary)

### Anthropic research / engineering blog
1. Building effective agents (Dec 2024)
   https://www.anthropic.com/research/building-effective-agents
2. How we built our multi-agent research system (Jun 2025)
   https://www.anthropic.com/engineering/multi-agent-research-system
3. Effective context engineering for AI agents (Sep 2025)
   https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
4. Writing effective tools for agents -- with agents (Sep 2025)
   https://www.anthropic.com/engineering/writing-tools-for-agents
5. Effective harnesses for long-running agents (Nov 2025)
   https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
6. Harness design for long-running application development (2026)
   https://www.anthropic.com/engineering/harness-design-long-running-apps
7. Demystifying evals for AI agents (Jan 2026)
   https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
8. Building agents with the Claude Agent SDK (Sep 2025; redirects to claude.com)
   https://claude.com/blog/building-agents-with-the-claude-agent-sdk
9. Agent harness design: 3 patterns for harnessing Claude's intelligence (2026)
   https://claude.com/blog/harnessing-claudes-intelligence
10. How Anthropic teams use Claude Code (Jul 2025)
    https://claude.com/blog/how-anthropic-teams-use-claude-code
11. Code Review for Claude Code (Mar 2026)
    https://claude.com/blog/code-review
12. How Anthropic secures its AI-native software development lifecycle (2026)
    https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle
13. Steering Claude Code: when to use CLAUDE.md, skills, hooks, rules, subagents
    https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more

### Claude Code docs (code.claude.com)
14. Best practices                 https://code.claude.com/docs/en/best-practices
15. Create custom subagents         https://code.claude.com/docs/en/sub-agents
16. Hooks reference                 https://code.claude.com/docs/en/hooks
17. Hooks guide                     https://code.claude.com/docs/en/hooks-guide
18. Dynamic workflows               https://code.claude.com/docs/en/workflows
19. /goal                           https://code.claude.com/docs/en/goal
20. Memory (CLAUDE.md, rules)       https://code.claude.com/docs/en/memory
21. Agent teams                     https://code.claude.com/docs/en/agent-teams
22. Run agents in parallel          https://code.claude.com/docs/en/agents
23. Extend Claude Code (features)   https://code.claude.com/docs/en/features-overview
24. Skills                          https://code.claude.com/docs/en/skills
25. Permission modes (plan mode)    https://code.claude.com/docs/en/permission-modes
26. Code Review docs                https://code.claude.com/docs/en/code-review
27. Ultrareview                     https://code.claude.com/docs/en/ultrareview

### Claude platform docs
28. Prompting best practices (agentic sections)
    https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices

### Non-Anthropic (for disagreement), NOT fetched directly (egress blocked)
29. Cognition, "Don't Build Multi-Agents" (Jun 2025)
    https://cognition.com/blog/dont-build-multi-agents
30. Cognition, "Multi-Agents: What's Actually Working" (2026)
    https://cognition.com/blog/multi-agents-working
    (content known only from search-result snippets; see Findings F19)

---------------------------------------------------------------------------

## Findings (with quotes)

### F1. Workflows vs agents; simplicity first; programmatic gates between steps
Source: Building effective agents (1)

- Definitions: workflows are "LLMs and tools orchestrated through predefined
  code paths"; agents are "systems where LLMs dynamically direct their own
  processes and tool usage, maintaining control over how they accomplish
  tasks."
- "Finding the simplest solution possible, and only increasing complexity
  when needed." ... add complexity "only when it demonstrably improves
  outcomes." "Agentic systems often trade latency and cost for better task
  performance, and you should consider when this tradeoff makes sense."
- Prompt chaining: "you can add programmatic checks (see 'gate' in the
  diagram below) on any intermediate steps to ensure that the process is
  still on track." When to use: "situations where the task can be easily and
  cleanly decomposed into fixed subtasks."
- Routing: "complex tasks where there are distinct categories that are
  better handled separately" (e.g., simple questions to smaller models).
- Parallelization: sectioning (independent subtasks in parallel) and voting
  ("Reviewing code for vulnerabilities with multiple prompts", content
  appropriateness with vote thresholds).
- Orchestrator-workers: "well-suited for complex tasks where you can't
  predict the subtasks needed"; "subtasks aren't pre-defined, but determined
  by the orchestrator." Example: "Coding products making complex multi-file
  changes."
- Evaluator-optimizer: "particularly effective when we have clear evaluation
  criteria, and when iterative refinement provides measurable value."
- Agents section: "it's crucial for the agents to gain 'ground truth' from
  the environment at each step (such as tool call results or code
  execution)"; agents "pause for human feedback at checkpoints or when
  encountering blockers"; implement "stopping conditions (such as a maximum
  number of iterations) to maintain control"; "The autonomous nature of
  agents means higher costs, and the potential for compounding errors";
  "extensive testing in sandboxed environments, along with the appropriate
  guardrails."
- Coding agents: "code solutions are verifiable through automated tests;
  Agents can iterate on solutions using test results as feedback" but
  "human review remains crucial for ensuring solutions align with broader
  system requirements."
- Summary principles: simplicity; transparency ("explicitly showing the
  agent's planning steps"); tool "documentation and testing."
- ACI: "plan to invest just as much effort in creating good agent-computer
  interfaces (ACI)" as in HCI. Poka-yoke: "changed the tool to always require
  absolute filepaths -- and ... the model used this method flawlessly."

Reasoning for the funnel: the user's funnel IS a composition of these
patterns: routing (intake triage by complexity) -> orchestrator-workers
(decomposition/distribution) -> gates (hypothesis check) -> parallelization
by voting/sectioning (multiple reviewers) -> evaluator-optimizer (review that
sends work back). Anthropic's explicit advice: only add each stage if it
demonstrably improves outcomes; keep gates programmatic where possible.

### F2. Delegation contracts: objective, output format, tools/sources, boundaries; effort scaling rules
Source: Multi-agent research system (2)

- Architecture: "a lead agent coordinates the process while delegating to
  specialized subagents that operate in parallel."
- Failure modes of early versions: "spawning 50 subagents for simple queries,
  scouring the web endlessly for nonexistent sources, and distracting each
  other with excessive updates." Vague tasks -> "one subagent explored the
  2021 automotive chip crisis while 2 others duplicated work investigating
  current 2025 supply chains."
- Fix: each delegation needs "an objective, an output format, guidance on the
  tools and sources to use, and clear task boundaries."
- Effort scaling embedded in prompt: "Simple fact-finding requires just 1
  agent with 3-10 tool calls, direct comparisons might need 2-4 subagents
  with 10-15 calls each" (complex research: 10+ subagents with divided
  responsibilities).
- "Start wide, then narrow": "explore the landscape before drilling into
  specifics."
- Extended thinking as "a controllable scratchpad" for the lead to plan;
  subagents use interleaved thinking after tool results.
- Parallel tool calling: "the lead agent spins up 3-5 subagents in parallel
  rather than serially; (2) the subagents use 3+ tools in parallel. These
  changes cut research time by up to 90%."
- "Claude 4 models can be excellent prompt engineers. When given a prompt and
  a failure mode, they are able to diagnose why the agent is failing and
  suggest improvements." Tool-testing agent rewrote descriptions -> "40%
  decrease in task completion time."
- Synchronous limitation: "lead agents execute subagents synchronously,
  waiting for each set of subagents to complete before proceeding."

### F3. Multi-agent economics and when NOT to use it
Source: Multi-agent research system (2)

- "multi-agent system with Claude Opus 4 as the lead agent and Claude Sonnet
  4 subagents outperformed single-agent Claude Opus 4 by 90.2%" on internal
  research eval (BrowseComp-style breadth tasks).
- "three factors explained 95% of the performance variance ... token usage by
  itself explains 80% of the variance"; multi-agent "about 15x more tokens
  than chats"; single agents "about 4x more."
- Suitability caveat (paraphrase of the post's "when to use" section, not in
  my extracted summary; medium confidence on exact wording): tasks that need
  all agents to share the same context or have many inter-dependencies are a
  poor fit; most coding tasks have fewer truly parallelizable pieces than
  research; agents are not yet great at coordinating in real time.
- Production: "the compound nature of errors in agentic systems means that
  minor issues for traditional software can derail agents entirely"; need
  durable execution, full tracing, rainbow deployments.

Reasoning for the funnel: parallelism pays for READ-heavy stages (exploration,
hypothesis generation, review). For WRITE stages, keep few writers with
disjoint file ownership. Budget the funnel: a full run may cost ~15x a chat.

### F4. Separate generator from evaluator; sprint contracts; evaluator tests like a user
Source: Harness design for long-running application development (6)

- Three roles: Planner ("took a simple 1-4 sentence prompt and expanded it
  into a full product spec"), Generator ("work in sprints, picking up one
  feature at a time from the spec"), Evaluator ("used the Playwright MCP to
  click through the running application the way a user would").
- Self-grading bias: "when asked to evaluate work they've produced, agents
  tend to respond by confidently praising the work -- even when, to a human
  observer, the quality is obviously mediocre." "agents reliably skew
  positive when grading their own work."
- Why separate: "the evaluator is still an LLM that is inclined to be
  generous towards LLM-generated outputs. But tuning a standalone evaluator
  to be skeptical turns out to be far more tractable."
- Sprint contract: "the generator and evaluator negotiated a sprint
  contract: agreeing on what 'done' looked like for that chunk of work before
  any code was written." "The generator proposed what it would build and how
  success would be verified, and the evaluator reviewed that proposal to make
  sure the generator was building the right thing."
- File-based communication: "one agent would write a file, another agent
  would read it and respond either within that file or with a new file."
- Evaluator calibration: rubric with 4 dimensions (design quality,
  originality, craft, functionality) plus "few-shot examples with detailed
  score breakdowns."
- Findings are specific: "FAIL -- Tool only places tiles at drag start/end
  points instead of filling the region. `fillRectangle` function exists but
  isn't triggered properly on mouseUp."
- Costs: solo agent 20 min / $9 (broken output) vs full harness 6 hr / $200
  (playable); harness v2 for a DAW: 3h50m / $124.70 with QA rounds of ~9 min
  / ~$3 each.
- Context anxiety: "some models exhibit 'context anxiety,' in which they
  begin wrapping up work prematurely as they approach their perceived context
  limit." Context resets used before; with Opus 4.6 "I was able to drop
  context resets from this harness entirely."
- Harness pruning: "every component in a harness encodes an assumption about
  what the model can't do on its own, and those assumptions are worth stress
  testing." "the evaluator is not a fixed yes-or-no decision. It is worth
  the cost when the task sits beyond what the current model does reliably
  solo."

Reasoning for the funnel: this is the closest Anthropic analogue to the
user's "hypothesis check before implementation" (sprint contract) and to the
"independent reviewer that sends work back" (evaluator). The contract is the
artifact that makes the outside verdict possible later: it defines "done".

### F5. Fresh-context adversarial review; reviewers over-report by construction
Source: Claude Code best practices (14)

- "A reviewer running in a fresh subagent context sees only the diff and the
  criteria you give it, not the reasoning that produced the change, so it
  evaluates the result on its own terms."
- Prompt template: "Use a subagent to review the rate limiter diff against
  PLAN.md. Check that every requirement is implemented, the listed edge cases
  have tests, and nothing outside the task's scope changed. Report gaps, not
  style preferences."
- Caveat: "A reviewer prompted to find gaps will usually report some, even
  when the work is sound, because that is what it was asked to do. Chasing
  every finding leads to over-engineering ... Tell the reviewer to flag only
  gaps that affect correctness or the stated requirements, and treat the rest
  as optional."
- Writer/Reviewer sessions: "A fresh context improves code review since
  Claude won't be biased toward code it just wrote." Also "have one Claude
  write tests, then another write code to pass them."
- "Because the reviewer runs as a subagent, the implementing session receives
  the gaps directly and can fix them and re-review without you copying
  findings between windows."

### F6. Verification must be a signal the agent can read; ladder of gating strength; evidence not assertions
Source: Best practices (14); /goal (19); Agent SDK post (8)

- "Claude stops when the work looks done. Without a check it can run, 'looks
  done' is the only signal available, and you become the verification loop."
- Ladder: (a) in one prompt; (b) `/goal` -- "A separate evaluator re-checks it
  after every turn"; (c) Stop hook -- "runs your check as a script and blocks
  the turn from ending until it passes"; (d) "a verification subagent or a
  dynamic workflow that checks its own findings has a fresh model try to
  refute the result, so the agent doing the work isn't the one grading it."
- "Have Claude show evidence rather than asserting success: the test output,
  the command it ran and what it returned, or a screenshot of the result."
- /goal mechanics: "Each time Claude finishes a turn, Claude Code sends the
  condition and the conversation so far to your configured small fast model
  ... The model returns one of three verdicts" (not yet met / met /
  impossible). "It doesn't run commands or read files independently, so write
  the condition as something Claude's own output can demonstrate." Stall
  detection: "no tool use for several turns in a row" -> loop stops.
  Good condition = "One measurable end state" + "A stated check" +
  "Constraints that matter."
- Agent SDK loop: "gather context -> take action -> verify work -> repeat".
  "Code linting is an excellent form of rules-based feedback. The more
  in-depth feedback the better." LLM-as-judge has "latency costs and lower
  robustness than rule-based methods."
- Diagnostic questions when agents underperform: misunderstanding tasks ->
  missing info in search; repeated failures -> need formal rules in tool
  calls; cannot correct errors -> need better tools; variability -> need a
  representative test set.

### F7. Hooks are deterministic, CLAUDE.md is advisory; block with exit 2; Stop hook cap
Source: Hooks reference (16), Hooks guide (17), features overview (23), memory (20)

- "Unlike CLAUDE.md instructions which are advisory, hooks are deterministic
  and guarantee the action happens." "Use hooks for actions that must happen
  every time with zero exceptions."
- "An instruction like 'never edit .env' in CLAUDE.md or a skill is a
  request, not a guarantee. A PreToolUse hook that blocks the edit is
  enforcement."
- Memory doc: CLAUDE.md and auto memory are "context, not enforced
  configuration. To block an action regardless of what Claude decides, use a
  PreToolUse hook instead."
- Exit codes: "Exit 2 means a blocking error. On events that can block, exit
  2 blocks whether or not you print JSON." PreToolUse exit 2 "Blocks the tool
  call"; PostToolUse exit 2 only surfaces stderr to the model.
- Events useful as funnel gates: PreToolUse, PostToolUse, Stop, SubagentStop,
  TaskCreated, TaskCompleted, TeammateIdle ("Exit with code 2 to prevent
  completion and send feedback"), PreCompact/PostCompact, SessionStart.
- Hook types: command, http, mcp_tool, prompt (Haiku by default; returns
  {"ok": false, "reason": ...}; for Stop the reason "is fed back to Claude so
  it keeps working, unless the response also sets 'impossible': true"), agent
  ("Spawn a subagent that can use tools like Read, Grep, and Glob to verify
  conditions"; experimental). Example agent hook: "Verify that all unit tests
  pass. Run the test suite and check the results."
- Loop guard: "Claude Code overrides a Stop hook after it blocks eight times
  in a row without progress." Must parse `stop_hook_active`. Cap adjustable
  via CLAUDE_CODE_STOP_HOOK_BLOCK_CAP.
- Subagents: "Hooks from settings files, managed policy settings, and plugins
  also run inside subagents"; input carries `agent_id`/`agent_type`;
  frontmatter hooks in an agent definition run only while it runs.
- "All matching hooks run in parallel"; with multiple `updatedInput` hooks
  "the last one to finish takes effect" (avoid).
- "Managed settings ... are the only way to enforce a deterministic,
  organization-wide guardrail" (steering blog, 13).

### F8. Plan before code; when to skip planning; interview -> spec -> fresh session
Source: Best practices (14), permission modes (25)

- "Letting Claude jump straight to coding can produce code that solves the
  wrong problem." Four phases: Explore (plan mode) -> Plan -> Implement
  ("verifying against its plan") -> Commit.
- "Plan mode is useful, but also adds overhead ... If you could describe the
  diff in one sentence, skip the plan." Planning "is most useful when you're
  uncertain about the approach, when the change modifies multiple files, or
  when you're unfamiliar with the code."
- Plan mode: "Claude reads files, runs shell commands to explore, and writes
  a plan, but does not edit your source." Approve options; Ctrl+G to edit the
  plan; `showClearContextOnPlanAccept` "approves the plan and clears the
  planning context."
- Interview pattern: "I want to build [brief description]. Interview me in
  detail using the AskUserQuestion tool ... Keep interviewing until we've
  covered everything, then write a complete spec to SPEC.md." Then "start a
  fresh session to execute it." Good specs "name the files and interfaces
  involved, state what is out of scope, and end with an end-to-end
  verification step."
- Prompt specificity table: "write a failing test that reproduces the issue,
  then fix it"; "address the root cause, don't suppress the error."

### F9. Context is the fundamental constraint; context rot; reset rules; CLAUDE.md size
Source: Best practices (14), context engineering (3), memory (20), features (23)

- "Most best practices are based on one constraint: Claude's context window
  fills up fast, and performance degrades as it fills."
- Context engineering: "context rot -- as the number of tokens in the
  context window increases, the model's ability to accurately recall
  information from that context decreases"; "attention budget".
- System prompt "right altitude": avoid "hardcoding complex, brittle logic"
  and "vague, high-level guidance"; use "diverse, canonical examples" rather
  than "a laundry list of edge cases".
- Just-in-time retrieval: agents "maintain lightweight identifiers (file
  paths, stored queries, web links, etc.) and use these references to
  dynamically load data into context at runtime."
- Long-horizon techniques: compaction ("overly aggressive compaction can
  result in the loss of subtle but critical context"), structured
  note-taking (notes "persisted to memory outside of the context window"),
  sub-agent architectures (each returns "only a condensed, distilled summary
  of its work").
- Reset rule: "If you've corrected Claude more than twice on the same issue
  in one session, the context is cluttered with failed approaches. Run
  /clear and start fresh with a more specific prompt." "A clean session with
  a better prompt almost always outperforms a long session with accumulated
  corrections."
- Named failure patterns: kitchen sink session; correcting over and over;
  over-specified CLAUDE.md ("Claude ignores half of it"); trust-then-verify
  gap ("If you can't verify it, don't ship it"); infinite exploration.
- CLAUDE.md: "For each line, ask: 'Would removing this cause Claude to make
  mistakes?' If not, cut it." "Bloated CLAUDE.md files cause Claude to ignore
  your actual instructions!" Keep "under 200 lines". "if two rules contradict
  each other, Claude may pick one arbitrarily."
- `.claude/rules/*.md` with `paths:` frontmatter "only load into context when
  Claude works with matching files." Rules without paths load "with the same
  priority as .claude/CLAUDE.md". User rules vs project rules: "Neither set
  overrides the other."
- Features-overview trigger table: "Claude gets a convention or command wrong
  twice -> Add it to CLAUDE.md"; "A repeated mistake or a recurring review
  comment is a CLAUDE.md edit, not a one-off correction in chat."
- Compaction instructions can be set in CLAUDE.md: "When compacting, always
  preserve the full list of modified files and any test commands".

### F10. Long-running work: feature list as guardrail, one feature at a time, session-start ritual, git checkpoints, test like a user
Source: Effective harnesses (5), prompting best practices (28)

- "the core challenge of long-running agents is that they must work in
  discrete sessions, and each new session begins with no memory of what came
  before."
- Initializer agent creates init.sh, claude-progress.txt, initial git commit,
  and a features JSON: {"description": "New chat button creates a fresh
  conversation", "passes": false}. "It is unacceptable to remove or edit
  tests because this could lead to missing or buggy functionality." JSON
  chosen because "the model is less likely to inappropriately change or
  overwrite JSON files compared to Markdown files."
- One feature at a time "turned out to be critical to addressing the agent's
  tendency to do too much at once."
- Failure: marking features complete without validation -> "ask the model to
  use browser automation tools and do all testing as a human user would."
- Session-start sequence: pwd -> read git log + progress file -> pick
  highest-priority failing feature -> run init.sh -> "Execute basic
  end-to-end verification" -> work. Git lets the model "revert bad code
  changes and recover working states."
- Platform docs generalize: "Use the first context window to set up a
  framework (write tests, create setup scripts), then use future context
  windows to iterate on a todo-list." "When a context window is cleared,
  consider starting with a brand new context window rather than using
  compaction. Claude's latest models are extremely effective at discovering
  state from the local filesystem."

### F11. Evals: grade end state; unambiguous tasks; pass^k; read transcripts; start with 20-50 real failures
Source: Demystifying evals (7); multi-agent research (2)

- "It's often better to grade what the agent produced, not the path it
  took." Outcome = "The final state in the environment after a trial
  concludes, distinct from what the agent says it did."
- "A good task is one where two domain experts would independently reach the
  same pass/fail verdict."
- pass@k vs pass^k: "By k=10 ... pass@k approaches 100% while pass^k falls to
  0%." Use pass^k "when consistency is essential."
- "Begin with 20-50 simple tasks drawn from real failures." "Look at your bug
  tracker and support queue."
- "You won't know if your graders are working well unless you read the
  transcripts and grades from many trials." "Failures should seem fair."
- "Make your graders resistant to bypasses or hacks."
- Grading bugs: Opus 4.5 on CORE-Bench went 42% -> 95% after fixing "rigid
  grading that penalized '96.12' when expecting '96.124991...'".
- "Each trial should be isolated by starting from a clean environment."
- Multi-agent post: LLM-as-judge rubric "factual accuracy ... citation
  accuracy ... completeness ... source quality ... tool efficiency", 0.0-1.0
  plus pass/fail; "evaluate whether it achieved the correct final state";
  "Start with small-scale testing right away with a few examples"; humans
  caught SEO-content-farm bias the judge missed.

### F12. Code review at scale: parallel lenses -> verification of each finding -> dedupe/rank; measured precision; REVIEW.md controls
Source: Code Review blog (11), Code Review docs (26), Ultrareview (27), SDLC blog (12)

- "When a PR is opened, Code Review dispatches a team of agents. The agents
  look for bugs in parallel, verify bugs to filter out false positives, and
  rank bugs by severity." "Reviews scale with the PR. Large or complex
  changes get more agents and a deeper read; trivial ones get a lightweight
  pass."
- Docs: "Each agent looks for a different class of issue, then a verification
  step checks candidates against actual code behavior to filter out false
  positives. The results are deduplicated, ranked by severity."
- Internal data: large PRs (1000+ lines) 84% get findings, avg 7.5; small
  (<50 lines) 31%, avg 0.5; "less than 1% of findings are marked incorrect";
  substantive review comments 16% -> 54% of PRs. ~20 min, $15-25 per PR.
  Note: <1% incorrect is a precision figure; no recall figure published.
- "By default, Code Review focuses on correctness: bugs that would break
  production, not formatting preferences or missing test coverage."
- Findings never block: "The check run always completes with a neutral
  conclusion so it never blocks merging"; gate in your own CI by parsing
  `bughunter-severity` JSON. "Human approval remains required for all PRs."
- REVIEW.md knobs worth copying into any reviewer prompt: severity
  redefinition; "report at most five nits"; skip rules (generated code,
  lockfiles, "anything your CI already enforces"); repo-specific checks;
  verification bar -- "behavior claims need a file:line citation in the
  source, not an inference from naming"; re-review convergence -- "after the
  first review, suppress new nits and post Important findings only";
  summary shape -- open with a tally like "2 factual, 4 style". "Length has a
  cost: a long REVIEW.md dilutes the rules that matter most."
- Ultrareview: "every reported finding is independently reproduced and
  verified"; "multi-agent fleet with independent verification"; 5-10 min,
  $5-25; diff limits ~500 files / 8,000 lines.
- SDLC blog: "Each review agent is designed and scoped to a specific, narrow
  focus and leverages RAG for additional context." "Claude authors about 80%
  of the code merged into our codebase today." Governance risk: "If a skill
  goes stale, a discovered bug class never makes it back into CLAUDE.md, or
  an agent's decisions go unsampled, the whole structure degrades." Incident:
  an agent autonomously asked another agent to deploy fixes -- "caught by
  human review gates". "Human accountability is still central."

### F13. Dynamic workflows: the script holds the plan; adversarial cross-checks; structured output; resumable; no mid-run input
Source: Workflows docs (18), agents overview (22)

- "A workflow moves the plan into code ... A workflow script holds the loop,
  the branching, and the intermediate results itself, so Claude's context
  holds only the final answer."
- Quality pattern: "it can have independent agents adversarially review each
  other's findings before they're reported, or draft a plan from several
  angles and weigh them against each other."
- Comparison table: who decides next step (Claude turn-by-turn vs script);
  where intermediate results live (context vs script variables); scale
  ("Dozens to hundreds of agents per run"); interruption (resumable).
- Primitives: agent(), pipeline(), parallel(), phase(), log(); `schema`
  forces JSON output; "If the subagent's output still fails validation after
  five attempts, the call fails"; agent() resolves to null on stop/API error.
- Determinism for replay: "Claude Code makes Date.now(), Math.random(), and a
  no-argument new Date() throw inside the script."
- Constraints: "No mid-run user input ... For sign-off between stages, run
  each stage as its own workflow"; no filesystem access from the script; 16
  concurrent agents default; 1,000 agents per run; "Large workflow" warning
  at >25 agents or >1.5M projected tokens; size guideline small/medium/large.
- Example prompts: "audit every route handler ... and adversarially verify
  each finding before reporting it"; "run npx tsc --noEmit and keep fixing
  ... until the type check passes or two rounds in a row make no progress";
  "review every file changed in this PR for correctness issues, then merge
  the per-file findings into one ranked summary".
- /deep-research: "votes on each claim, and returns a cited report with
  claims that didn't survive cross-checking filtered out"; unverifiable
  claims listed as unverified, not refuted.
- Ultracode: "/effort ultracode" -> "A single request can turn into several
  workflows in a row: one to understand the code, one to make the change,
  and one to verify it."

### F14. Subagent mechanics that matter for role design
Source: Sub-agents docs (15)

- "Use one when a side task would flood your main conversation with search
  results, logs, or file contents you won't reference again: the subagent
  does that work in its own context and returns only the summary."
- Frontmatter: name, description (required); tools / disallowedTools; model
  (sonnet/opus/haiku/fable); effort; maxTurns ("partial output marked as
  incomplete"); permissionMode; skills (preloaded); memory (user/project/
  local); mcpServers; hooks; isolation: worktree; background; omitClaudeMd.
- What a subagent sees: its own system prompt (replaces Claude Code's), the
  task message, CLAUDE.md hierarchy (Explore/Plan skip it), git status,
  preloaded skills, sibling roster. Does NOT see conversation history.
- Delegation: "Claude uses each subagent's description to decide when to
  delegate"; add "Use proactively ..." to descriptions; combined descriptions
  > 15,000 tokens triggers a warning.
- Spawn restriction: `tools: Agent(worker, researcher), Read, Bash` -> a
  coordinator can only spawn those two.
- Limits: 20 concurrent (CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS); depth 3
  (CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH); Explore/Plan one-shot; custom agents
  resumable via SendMessage with full history.
- Don't use subagents for: "Iterative refinement", "Shared context", "Quick
  changes", "Latency sensitive"; use main conversation "when the task needs
  frequent back-and-forth".
- Skill `context: fork` + `agent:` runs a skill's instructions inside a fresh
  subagent (the "reviewer as a slash command" pattern). Dynamic context via
  !`gh pr diff` in a skill.

### F15. Agent teams: adversarial hypothesis debate; anchoring; sizing; failure modes
Source: Agent teams docs (21)  [experimental, disabled by default]

- Best uses: "Research and review", "Debugging with competing hypotheses",
  "Cross-layer coordination". "For sequential tasks, same-file edits, or work
  with many dependencies, a single session or subagents are more effective."
- Debate: "Spawn 5 agent teammates to investigate different hypotheses. Have
  them talk to each other to try to disprove each other's theories". "The
  debate structure is the key mechanism here. Sequential investigation
  suffers from anchoring: once one theory is explored, subsequent
  investigation is biased toward it."
- Parallel review: "A single reviewer tends to gravitate toward one type of
  issue at a time." Assign distinct lenses (security / performance / test
  coverage).
- Sizing: "Start with 3-5 teammates"; "5-6 tasks per teammate"; "Three
  focused teammates often outperform five scattered ones."
- Quality gates via hooks: TeammateIdle, TaskCreated, TaskCompleted (exit 2 =
  reject with feedback).
- Failure modes: "Two teammates editing the same file leads to overwrites";
  "Sometimes the lead starts implementing tasks itself instead of waiting";
  "Teammates may stop after encountering errors instead of recovering"; "The
  lead can stop early too"; task status can lag; no session resumption of
  in-process teammates.
- Security: messages between agents are untrusted -- "A teammate can't
  approve a permission prompt or supply consent on your behalf"; classifier
  reviews inter-agent messages.

### F16. Model-specific failure modes with damping prompts: over-engineering, test hard-coding, subagent overuse, over-verification
Source: Prompting best practices (28); evals post (7)

- Over-engineering: "Claude Opus 4.5 and Claude Opus 4.6 have a tendency to
  overengineer by creating extra files, adding unnecessary abstractions, or
  building in flexibility that wasn't requested." Sample prompt: "Avoid
  over-engineering. Only make changes that are directly requested or clearly
  necessary ... Don't add error handling, fallbacks, or validation for
  scenarios that can't happen ... The right amount of complexity is the
  minimum needed for the current task."
- Test gaming: "Claude can sometimes focus too heavily on making tests pass
  at the expense of more general solutions, or may use workarounds like
  helper scripts". Sample prompt: "Tests are there to verify correctness,
  not to define the solution ... If the task is unreasonable or infeasible,
  or if any of the tests are incorrect, please inform me rather than working
  around them."
- Subagent overuse: "Claude Opus 4.6 has a strong predilection for subagents
  and may spawn them in situations where a simpler, direct approach would
  suffice ... a direct grep call is faster." Damping prompt: "Use subagents
  when tasks can run in parallel, require isolated context, or involve
  independent workstreams that don't need to share state. For simple tasks,
  sequential operations, single-file edits, or tasks where you need to
  maintain context across steps, work directly."
- Over-verification: "Claude Opus 5 ... verifies its own work well without
  explicit instruction, and verification instructions carried over from
  prompts tuned for earlier models can cause over-verification".
- Prompt chaining still useful "when you need to inspect intermediate
  outputs or enforce a specific pipeline structure."
- Evals post: Claude Code evals were added for "over-engineering" as a
  behavior class.

### F17. Tool / ACI design rules that also apply to agent-to-agent handoffs
Source: Building effective agents (1), context engineering (3), writing tools (4)

- "If a human engineer can't definitively say which tool should be used in a
  given situation, an AI agent can't be expected to do better."
- "More tools don't always lead to better outcomes"; consolidate
  (`schedule_event` over list_users+list_events+create_event).
- Return "contextual relevance over flexibility": names not UUIDs; errors
  with "specific and actionable improvements, rather than opaque error
  codes".
- "Even small refinements to tool descriptions can yield dramatic
  improvements." Use agents to test tools: "What agents omit in their
  feedback can often be more important than what they include."
- ResponseFormat concise vs detailed (~1/3 tokens).

Reasoning for the funnel: every hand-off between funnel stages is an
"interface"; the same rules apply -- structured schema, unambiguous field
names, actionable failure messages, and no overlapping responsibilities
between roles.

### F18. Harness pruning: strip components as models improve; lean on model knowledge
Source: harnessing-claudes-intelligence (9), harness design (6)

- "Lean on the model, not the harness: use what Claude knows."
- "Pre-loading prompts with instructions does not scale across many tasks:
  every token added depletes Claude's attention budget."
- Code execution to filter tool results: BrowseComp Opus 4.6 45.3% -> 61.6%.
- "Promote actions to tools should be continually re-evaluated."
- "When a new model lands, it is generally good practice to re-examine a
  harness, stripping away pieces that are no longer load-bearing."

### F19. Practitioner disagreement: Cognition's "Don't build multi-agents" and its 2026 revision
Source: (29), (30) -- NOT directly fetched; egress blocked for cognition.com,
daily.dev, sublime.app, jxnl.co, tmcnet. Based on search-result snippets only.
Confidence: medium on principles (widely quoted), low on exact 2026 wording.

- Principle 1: "Share context, and share full agent traces, not just
  individual messages." Principle 2: "Actions carry implicit decisions, and
  conflicting decisions carry bad results."
- Flappy Bird example: parallel subagents build inconsistent parts (one
  builds a Mario-looking background) because each made unstated assumptions.
- Recommendation (2025): single-threaded linear agent; compress history with
  a dedicated summarizer model for long tasks; avoid architectures where
  agents act without each other's full trace.
- 2026 update snippet ("Multi-Agents: What's Actually Working"): "The setups
  that actually work all seem to share the same property -- one main loop
  carries state, and subagents are stateless workers with narrow scope";
  patterns "where multiple agents contribute intelligence to a task while
  writes stay single-threaded."
- Reconciliation with Anthropic: Anthropic's own research post concedes
  coding has few parallelizable parts and that agents coordinate poorly in
  real time; Anthropic's parallel-write tools (/batch, worktree isolation,
  agent teams "each teammate owns a different set of files") all enforce
  disjoint write scopes. Net: parallelize reads/reviews freely; serialize or
  partition writes.

### F20. How Anthropic teams actually work (anecdotal but concrete)
Source: How Anthropic teams use Claude Code (10)

- Security Engineering: from "design doc -> janky code -> refactor -> give up
  on tests" to "asking Claude for pseudocode, guiding it through test-driven
  development, and checking in periodically."
- Product Design: "autonomous loops where Claude Code writes the code for the
  new feature, runs tests, and iterates continuously"; PR comments automated
  through GitHub Actions.
- Data Infrastructure: dashboard screenshots as diagnostic input.
- Growth Marketing: two specialized sub-agents for ad generation.
- General: "if the first prompt isn't sufficient, they'll make slight tweaks
  and try again" (cheap retry over long correction chains).

---------------------------------------------------------------------------

## Anti-patterns (what Anthropic says does NOT work, with why)

1. Agent grades its own work -> "confidently praising the work -- even when
   ... obviously mediocre" (6). Fix: standalone skeptical evaluator with
   rubric + few-shot calibration.
2. Vague delegation ("research the semiconductor shortage") -> duplicated and
   missing work; 50 subagents for trivial queries (2). Fix: objective, output
   format, tools/sources, boundaries, effort budget.
3. Kitchen-sink session / correcting more than twice -> polluted context (14).
   Fix: /clear and re-prompt with what was learned.
4. Over-specified CLAUDE.md -> "Claude ignores half of it" (14, 20). Fix:
   prune; move procedures to skills; path-scoped rules; convert "always" to
   hooks.
5. Guardrails as prompt text ("never edit .env") -> "a request, not a
   guarantee" (23). Fix: PreToolUse hook exit 2 / managed settings.
6. Trust-then-verify gap: plausible code without a runnable check (14). Fix:
   tests/build/screenshot as pass-fail signal; "If you can't verify it,
   don't ship it."
7. Reviewer asked to "find gaps" reports gaps even when work is sound;
   chasing all of them -> over-engineering (14). Fix: correctness-only
   findings; nit caps; re-review convergence rules (26).
8. Big-bang implementation -> "tendency to do too much at once" (5). Fix:
   one feature at a time from a JSON feature list; commit per feature.
9. Marking features done without testing (5). Fix: end-to-end user-style
   test (browser automation) before flipping passes:true; "unacceptable to
   remove or edit tests."
10. Compaction alone for very long tasks (older models) -> context anxiety
    persists; over-aggressive compaction loses critical details (3, 6). Fix:
    fresh context + state on disk (progress file, tests.json, git log).
11. Parallel agents editing the same files -> overwrites (21); parallel
    writers with unshared implicit decisions -> inconsistent product (29).
    Fix: disjoint file ownership / worktrees; single writer per unit; share
    decisions via files (contract, spec).
12. Multi-agent for tightly coupled, low-parallelism coding tasks -> 15x
    tokens for little gain (2). Fix: routing by complexity; use plain
    prompt-chaining with gates for simple work.
13. Subagent overuse (grep would do) (28). Fix: damping prompt in CLAUDE.md
    or orchestrator prompt.
14. Test gaming / hard-coded solutions / helper-script workarounds (28).
    Fix: "Tests are there to verify correctness, not to define the
    solution"; reviewer checks generality; hidden/held-out tests.
15. Brittle step-by-step grading; grading bugs mistaken for agent failures
    (CORE-Bench 42% -> 95%) (7). Fix: grade end state; read transcripts.
16. Stop hook without stop_hook_active check -> loop until the 8-block cap
    (17). Fix: check the flag; make the hook's check converge.
17. Lead in agent teams starts doing the work itself / stops early;
    teammates stop on errors (21). Fix: explicit "wait for teammates";
    TaskCompleted hooks; replacement teammates.
18. Overlapping tool/role definitions -> "ambiguous decision points" (3).
    Fix: each role has one job; descriptions say when to use it.
19. Stale governance: skills/CLAUDE.md not updated with discovered bug
    classes; unsampled agent approvals (12). Fix: feed recurring review
    findings back into rules; sample approvals.

---------------------------------------------------------------------------

## Open questions

1. Cost threshold: Anthropic's numbers (15x tokens; harness 20x cost vs solo
   in the game-maker example) come from research and app-building; there is
   no published guidance on the break-even point for a solo developer's
   feature-sized tasks. The funnel needs a routing rule (e.g., "one-sentence
   diff -> skip everything but tests + one reviewer").
2. "Zero-context" outside reviewer: Anthropic's fresh-context reviewer still
   receives the diff AND acceptance criteria (PLAN.md / sprint contract).
   Truly context-free review (only the artifact) risks a reviewer that
   cannot tell intended from unintended behavior. Open: what minimal
   artifact set (diff + user-visible spec, no plan, no transcript) gives
   independence without blindness?
3. Sprint contracts were demonstrated for UI apps with Playwright QA. How
   well does contract negotiation (generator proposes, evaluator vets
   "done") transfer to libraries/CLIs/data pipelines where "as a user would"
   is less obvious?
4. Precision vs recall: Code Review's "<1% incorrect" is precision. No
   Anthropic source gives a recall estimate for verified-finding pipelines.
   How much of the "error-free" requirement can any reviewer layer deliver?
5. Agent teams are experimental and have resume/shutdown limitations; is a
   debate/hypothesis stage worth building on them vs on dynamic workflows
   (which lack inter-agent messaging but are resumable and scriptable)?
6. Anthropic vs Cognition on parallel implementation: Anthropic ships
   /batch (5-30 worktree-isolated subagents) and agent teams; Cognition
   argues writes must be single-threaded. Empirical evidence for either in
   large shared-state codebases is thin.
7. "Hypothesis checking before implementation": Anthropic has plan mode,
   sprint contracts, and "draft a plan from several angles" workflows, but
   no published measurement of how much pre-implementation hypothesis
   testing reduces later rework.
8. Whether an LLM evaluator for /goal (Haiku, transcript-only) is strong
   enough to gate funnel stages, or whether stage gates should always be
   command hooks (deterministic) plus a stronger model for judgment.

---------------------------------------------------------------------------

## Design implications for the funnel (mapping user stages -> Anthropic-backed mechanics)

Stage 0 -- Wide intake ("big mouth")
- Interview-to-spec: Claude interviews the user with AskUserQuestion, writes
  SPEC.md (files/interfaces, out-of-scope, end-to-end verification step),
  then a FRESH session executes (14).
- Route by complexity (Building effective agents "routing"): one-sentence
  diffs bypass planning; multi-file/unfamiliar work enters the full funnel.
  Keep the cheap path cheap (1, 14).

Stage 1 -- Zones of responsibility / decomposition / distribution
- Orchestrator writes a delegation contract per unit: objective, output
  format (JSON schema), allowed tools/sources, boundaries, effort budget
  (2). Encode effort-scaling rules in the orchestrator prompt.
- Initializer produces features.json with passes:false, init.sh,
  progress file, baseline commit (5). Units = features, one at a time.
- Disjoint write ownership per worker (worktrees or file partition) (21, 22);
  parallelize reads (exploration) freely, serialize writes (2, 29).
- Define roles as .claude/agents with narrow descriptions, tool allowlists,
  model per role (cheap model for scouts, strong for judges), maxTurns,
  Agent(...) spawn restrictions for coordinators (15).

Stage 2 -- Hypothesis check before implementation
- Plan mode exploration (read-only) -> plan (8).
- Sprint contract: generator proposes what + how verified; evaluator vets
  it before code (6). Store as a file; it becomes the acceptance criteria
  used by later reviewers.
- Optional: "plan from several independent angles, then weigh" workflow
  (18) for risky designs; competing-hypothesis debate for unclear bugs (21).
- Programmatic gate: contract must include a runnable check (test command,
  fixture diff, screenshot comparison) or it is rejected (1, 14).

Stage 3 -- Execution
- Test-first where possible; tests in structured format; "unacceptable to
  remove or edit tests" (5, 28). Damping prompts against over-engineering,
  test hard-coding, subagent overuse (28).
- Deterministic hooks: PostToolUse lint/typecheck on Edit|Write; PreToolUse
  blocks on protected paths; Stop hook or /goal gates turn end on the
  contract's check (7, 19). Show evidence, not assertions (14).
- Commit per passing feature; git as checkpoint; progress file updated (5).
- Session-start ritual on every fresh context: pwd, git log, progress file,
  init.sh, smoke test (5, 28). Prefer fresh context + disk state over
  compaction for long runs (28).

Stage 4 -- Independent reviewers (can send work back)
- Fresh-context subagent sees diff + contract/PLAN.md: "every requirement
  implemented, listed edge cases have tests, nothing outside scope changed;
  report gaps, not style" (14). Correctness-only findings; nit cap; file:line
  citation bar; re-review convergence (26).
- Evaluator-optimizer loop with a max-iterations stopping condition (1); the
  reviewer's structured output feeds the generator directly (14). Second
  round: Important findings only (26).
- Evaluator can run the app "as a user would" (Playwright/browser MCP) (5,6).

Stage 5 -- Outside verdict (no process context)
- Multiple parallel reviewers with distinct lenses (logic, boundaries, API
  misuse, security, conventions), each in a fresh context that receives ONLY
  the artifact (diff/build) and the user-facing acceptance criteria -- not
  the plan, not the transcript (11, 26, 21).
- A verification pass tries to refute each finding against actual behavior
  (reproduce, cite file:line); dedupe and rank by severity; unverifiable
  claims reported as unverified, not refuted (18, 26, 27).
- Grade END STATE (does the product do X?), not the path (7). Use JSON
  schema outputs with validation retries (18). Optional voting across
  reviewers for a pass/fail verdict (1).
- Verdict is advisory to CI/human unless the funnel explicitly gates on a
  severity count (26 pattern: parse severity JSON in CI).

Stage 6 -- Human accountability
- Human approves the PR; review evidence (test output, screenshots) rather
  than re-running everything (14, 1, 12).
- Feedback loop: every recurring finding becomes a CLAUDE.md line, a
  path-scoped rule, a REVIEW-style instruction, or a hook; prune regularly
  (20, 23, 12).

Cross-cutting
- Memory layering: CLAUDE.md < 200 lines (always-on facts), .claude/rules
  with paths (scoped), skills (procedures like /funnel-review), hooks
  (enforcement), subagent `memory: project` for reviewers to accumulate
  recurring issues (20, 23, 24, 15).
- Codify the orchestration as a saved dynamic workflow (.claude/workflows)
  so it is reproducible, resumable, and reviewable; split into one workflow
  per stage where human sign-off is needed (18).
- Cost governance: size guideline, per-stage model choice, "Large workflow"
  thresholds, run on a small slice first (18, 21).
- Re-examine the funnel with each new model: drop stages that are no longer
  load-bearing (6, 9).
- Evaluate the funnel itself: 20-50 tasks from real past failures; grade end
  state; pass^k for consistency; read transcripts (7).

---------------------------------------------------------------------------

## Claim-by-claim confidence notes
- All F1-F18, F20 quotes were extracted from fetched primary pages in this
  session (WebFetch summaries include verbatim quotes). High confidence,
  except: the "coding tasks are less parallelizable" caveat in F3 (not in my
  extracted summary; medium), and version-specific numbers (limits, prices)
  which change over time.
- F19 (Cognition) is from search-engine snippets only: medium for the two
  principles, low for the 2026 update wording.
