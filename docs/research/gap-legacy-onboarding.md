# Day 0 -> Day 30 on a large legacy codebase: green baseline, characterization tests, evidence-derived zones map, codebase knowledge for agents

Researcher notes. Date: 2026-09-26. Dimension: "Day 0 on a large legacy codebase".

Evidence levels used throughout:
- **[A]** verified in a primary source read during this sweep (official docs, original post/paper, tool source).
- **[B]** primary source exists but was proxy-blocked; content reconstructed from search snippets and prior knowledge; treat as medium confidence.
- **[C]** practitioner report, secondary summary, or my own synthesis / design proposal. Unmeasured.
- **[H]** human-era practice; transfer to agents is unmeasured (no controlled evidence found).

---

## Sources read

### Read successfully (primary)
1. Anthropic Engineering, "Effective harnesses for long-running agents" - https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
2. Claude Code docs, "Set up Claude Code in a monorepo or large codebase" - https://code.claude.com/docs/en/large-codebases
3. Claude Code docs, "Hooks reference" - https://code.claude.com/docs/en/hooks
4. Claude Code docs, "Automate actions with hooks" (hooks guide) - https://code.claude.com/docs/en/hooks-guide
5. Claude Code docs, "How Claude remembers your project" (memory: CLAUDE.md, .claude/rules, /init, /doctor) - https://code.claude.com/docs/en/memory
6. Claude Code docs, "Configure permissions" - https://code.claude.com/docs/en/permissions
7. Claude Code docs, "Code intelligence plugins" - https://code.claude.com/docs/en/plugins/code-intelligence
8. Claude Code docs, "Best practices" - https://code.claude.com/docs/en/best-practices
9. Claude Code docs, "Subagents" - https://code.claude.com/docs/en/sub-agents
10. Claude blog, "How Claude Code works in large codebases" - https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start
11. code-maat README (Adam Tornhill) - https://github.com/adamtornhill/code-maat
12. code-hotspots step-by-step guide - https://github.com/stefano-zanotti-edo/code-hotspots
13. GitHub CODEOWNERS docs (source of docs.github.com page) - https://github.com/github/docs/blob/main/content/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners.md
14. Pact "Can I deploy" docs (source of docs.pact.io page) - https://github.com/pact-foundation/docs.pact.io/blob/master/website/docs/pact_broker/can_i_deploy.md
15. StrykerJS incremental docs (source) - https://github.com/stryker-mutator/stryker-js/blob/master/docs/incremental.md
16. Jest snapshot testing docs (source) - https://github.com/jestjs/jest/blob/main/docs/SnapshotTesting.md
17. diff-cover README - https://github.com/Bachmann1234/diff_cover
18. Aider "Building a better repository map with tree sitter" (source of aider.chat post) - https://github.com/Aider-AI/aider/blob/main/aider/website/_posts/2023-10-22-repomap.md ; and repomap doc https://github.com/Aider-AI/aider/blob/main/aider/website/docs/repomap.md
19. ApprovalTests.Java, CombinationApprovals docs - https://github.com/approvals/ApprovalTests.Java/blob/master/approvaltests/docs/how_to/TestCombinations.md
20. ApprovalTests.PHP README - https://github.com/approvals/ApprovalTests.php
21. syrupy (pytest snapshots) README - https://github.com/syrupy-project/syrupy
22. xorcare/golden (Go golden files) README - https://github.com/xorcare/golden
23. SWE-bench harness grading.py - https://github.com/SWE-bench/SWE-bench/blob/main/swebench/harness/grading.py
24. SWE-bench docker setup guide - https://github.com/SWE-bench/SWE-bench/blob/main/docs/guides/docker_setup.md
25. METR study replication repo README - https://github.com/METR/Measuring-Early-2025-AI-on-Exp-OSS-Devs
26. Anthropic Research, "Natural emergent misalignment from reward hacking" - https://www.anthropic.com/research/emergent-misalignment-reward-hacking
27. Dev Container spec repo - https://github.com/devcontainers/spec
28. Notes on Feathers' WELC (jeremy-w gist; partial: change algorithm + seams only) - https://gist.github.com/jeremy-w/6774525

### Blocked by egress proxy (marked [B]; used search snippets + prior knowledge)
- METR blog + paper: https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ , https://arxiv.org/abs/2507.09089 (numbers confirmed via the METR GitHub README: 246 issues; regression "speedup of 0.188" i.e. time with AI is greater)
- Google Testing Blog: https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html , https://testing.googleblog.com/2017/04/where-do-our-flaky-tests-come-from.html
- Martin Fowler bliki: BranchByAbstraction, StranglerFigApplication; Paul Hammant; trunkbaseddevelopment.com; Microsoft Learn strangler-fig page
- understandlegacycode.com (Feathers key points), daedtech.com, Wikipedia "Characterization test"
- GitClear 2025 report page (PDF downloaded but text layer not extractable in this sandbox)
- AgenticFlict (arXiv 2604.03551), SpecBench (arXiv 2605.21384), Meta TestGen-LLM (arXiv 2402.09171)
- DORA 2025 report (dora.dev), redmonk summary
- Semgrep CI docs, Stryker site, jestjs.io, docs.pact.io, docs.github.com (all have GitHub-hosted sources that I read instead)
- insta.rs docs (Rust snapshots), docs.pytest.org flaky page, Gradle test-retry blog, Maven Surefire rerun docs, prisma expand/contract, CodeScene knowledge-distribution docs, containers.dev, cubic.dev PR-size post, dev.to and qaskills practitioner posts

---

## Findings

### 1. Baseline: a trustworthy green before anything else

**1.1 The gate definition to borrow: SWE-bench's FAIL_TO_PASS / PASS_TO_PASS.** [A]
`swebench/harness/grading.py` computes two ratios: fail-to-pass ("Resolution") = success/(success+failure) over tests expected to flip from failing to passing, and pass-to-pass ("Maintenance") over tests that must keep passing. Status is `FULL` only "if fail-to-pass (Resolution) = 1 and pass-to-pass (Maintenance) = 1"; `PARTIAL` when F2P is between 0 and 1 and P2P = 1; otherwise `NO`. If the logs cannot be parsed the instance is not resolved. Implication: on Day 0 you literally record the PASS_TO_PASS set (the list of test IDs that pass in a clean container, N times), and every unit of work later must (a) add its own FAIL_TO_PASS tests and (b) keep the recorded P2P set green. A test that is not in P2P (quarantined) does not count either way.

**1.2 Containerize first; SWE-bench's three-layer image is the template.** [A]
SWE-bench docs: base image ("common dependencies for all evaluations"), ~60 environment images, and instance images ("specific dependencies for each evaluation task"); the reason is "consistent, reproducible results across different platforms" by "eliminating environment discrepancies". Resource note: 120 GB disk, 16 GB RAM, 8 CPUs recommended for the full benchmark. The Dev Container spec (devcontainer.json; features; devcontainers/cli; devcontainers/ci GitHub Action "reusing local development setup in CI builds") is the portable equivalent for a single repo. [A] Transfer: if `devcontainer up && devcontainer exec -- <test cmd>` is not green on a clean clone, you do not have a baseline, you have folklore. Do this before any agent touches code.

**1.3 Anthropic's long-running harness ritual: init.sh + smoke test + baseline commit + progress file.** [A]
The initializer agent creates "an `init.sh` script, a claude-progress.txt file that keeps a log of what agents have done, and an initial git commit". Each session: "(1) Run `pwd`... (2) Read the git logs and progress files... (3) Read the features list file and choose the highest-priority feature that's not yet done", then run init.sh and "a basic end-to-end test before implementing a new feature" (in their case: start server, use Puppeteer MCP to send a chat message and get a response). This "ensured that Claude could quickly identify if the app had been left in a broken state, and immediately fix any existing bugs." Failure modes they observed without this: agents "tended to try to do too much at once - essentially to attempt to one-shot the app", would "declare the job done" prematurely, and "tended to mark a feature as complete without proper testing". Caveat: this is Anthropic's experience report on a greenfield app (claude.ai clone), not a legacy codebase and not a controlled study. [A for the source; transfer to brownfield is [C]]

**1.4 Feathers' Legacy Code Change Algorithm and seams.** [A for algorithm text via gist; rest [B]/[H]]
Five steps: "(1) identify change points, (2) find test points, (3) break dependencies, (4) write tests, and (5) make changes and refactor" - "the LAST thing you do is write new code". Seam: "a place where you can alter behavior in your program without editing in that place"; the enabling point is where you choose which behavior. Three seam types: preprocessing, link, object. Characterization-test recipe (from the book, ch. 13; primary summaries blocked [B]): call the code in a test harness, assert a value you know is wrong, let the failure show the actual value, paste it in as the expectation; repeat until you have the behaviours you will touch; never "fix" a characterization test when it captures a bug - record the bug separately. Sprout method/class (add new behaviour in a new, tested unit and call it from the old code) and wrap method/class (rename old, put new tested wrapper in front) are the two ways to change untested code without first testing it. [H] These are human-era; no controlled evidence on agents. One 2026 practitioner piece argues characterization tests "are the on-ramp that makes the untested parts of a codebase safe to hand to an agent" (dev.to/tmfrisinger, blocked, [C]).

**1.5 Golden master / approval tests are the fastest characterization instrument, and every ecosystem has one that fails-closed in CI.** [A for tool behaviour]
- ApprovalTests: `.received.txt` vs `.approved.txt`; `CombinationApprovals.verifyAllCombinations(lambda, arrays...)` creates "a kind of approval test matrix, automatically testing all combinations of a set of inputs" and "quickly get[s] very good test coverage" (Java docs). PHP: `composer req --dev approvals/approval-tests`; commit `*.approved.*` and add `*.approved.* binary` to `.gitattributes`.
- Jest: "snapshot artifact should be committed alongside code changes, and reviewed as part of your code review process"; "snapshots in Jest are not automatically written when Jest is run in a CI system without explicitly passing `--updateSnapshot`" (the `--ci` flag makes a missing snapshot a failure). Best practices: "treat snapshots as code", deterministic, descriptive names.
- syrupy (Python): snapshots in `__snapshots__/*.ambr`; by design ("soundness") "tests fail if a snapshot does not exist"; `--snapshot-update` creates/updates and deletes unused; `--snapshot-warn-unused` for detection.
- Go: `testdata/*.golden` + `go test ./... -update` convention (xorcare/golden and many others); the doc notes updating "requires attention to the changed test data and checking the correctness of the new golden results".
- Rust: `insta` (`cargo insta test` / `cargo insta review`, `.snap`/`.snap.new`; `INSTA_UPDATE=no` to forbid writes in CI) - insta.rs blocked, so the env-var detail is [B].
Implication: "snapshots treated as reviewed artifacts with role-restricted updates" is implementable deterministically: implementer agents get `Edit` deny on snapshot/approved/golden paths; only a "characterizer" role (or the human) may run the update command; CI never runs the update flag.

**1.6 Flaky tests: quarantine, don't blanket-retry.** [B for Google numbers; A for tool flags]
Google (blog blocked; figures from the 2016/2017 posts as widely quoted): ~1.5% of test runs report a flaky result and roughly 16% of tests show some flakiness; when a previously stable test became flaky and could be traced to a change, it was a real production bug about 1/6 of the time; Google's rerun mechanism "is only used for tests that are marked as flaky or when users specifically request it"; larger tests, bigger binaries, more RAM and third-party tools (webdriver) correlate with flakiness. Mechanisms per ecosystem: `pytest --reruns N` (pytest-rerunfailures) and `@pytest.mark.flaky(reruns=N)`; `jest.retryTimes(N, {logErrorsBeforeRetry: true})`; `go test -count=N -shuffle=on` to expose order dependence; Gradle test-retry plugin (`failOnPassedAfterRetry`); Maven Surefire `rerunFailingTestsCount` (reports the test as flaky); `cargo nextest run --retries N`. Practice (practitioner sources, [C]): keep quarantined tests in a separate non-blocking CI lane, rerun them on a schedule (e.g. nightly x10), give each an owner and a re-evaluate-by date, promote back when N consecutive green, delete when abandoned. Implication for agents: retries must be confined to the quarantine lane; a "flaky" label must never be attachable by the implementer role (see failure mode 6.3).

**1.7 What Claude Code gives you for "verify before done".** [A]
Best-practices doc: "Give Claude a check it can run: tests, a build, a screenshot to compare"; options escalate from prompt -> `/goal` condition -> "a Stop hook runs your check as a script and blocks the turn from ending until it passes" (cap: overrides after 8 consecutive blocks without progress; `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`) -> "a verification subagent ... has a fresh model try to refute the result, so the agent doing the work isn't the one grading it." Also: "Have Claude show evidence rather than asserting success."

### 2. Zones of responsibility from evidence

**2.1 Mining co-change, hotspots and ownership with code-maat.** [A]
Input: `git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=YYYY-MM-DD > logfile.log` (git2 format); exclude noise with `-- . ":(exclude)vendor/" ":(exclude)test/"`. Run `java -jar code-maat-1.0.4-standalone.jar -l logfile.log -c git2 -a <analysis>`. Analyses: `summary, revisions, coupling, soc, authors, entity-ownership, entity-effort, main-dev, communication, age, abs-churn, author-churn, entity-churn, identity, main-dev-by-revs, messages, refactoring-main-dev, fragmentation`. Interpretation from README: coupling degree means "Each time it's modified, it's a 78% risk/chance that we'll have to change our Page.java module too"; ownership shows "the right author to discuss functionality and potential refactorings with". The code-hotspots guide pairs `-a revisions` with a complexity/size measure (they use SonarQube; `cloc --by-file` works) and merges into `hotspots.csv`. [A] Tornhill's books (blocked) add: hotspots = high churn x high complexity; knowledge maps from `main-dev`; "fragmentation" flags files with many minor contributors. [B][H]

**2.2 CODEOWNERS is the right representation: last match wins, gitignore-like, small.** [A]
GitHub docs: "Order is important; the last matching pattern takes the most precedence." Syntax follows gitignore except: no `!` negation, no `[ ]` ranges, and a leading `#` cannot be escaped. File must be < 3 MB; searched in `.github/`, root, then `docs/`. The doc example shows the canonical layering: `*  @global-owner`, then `*.js @js-owner`, then `/apps/ @octocat` overridden by `/apps/github @doctocat`. Implication: write the zones map in this exact format (`.github/CODEOWNERS` with zone "handles" like `@zone-billing`) so a 30-line file can be both a human review-routing file and the agent path map; parsers exist (hmarr/codeowners) for the hook.

**2.3 Claude Code's path-scoping primitives.** [A]
- Per-directory `CLAUDE.md`: loaded "from your working directory and every parent directory at launch, then loads each subdirectory's file on demand when it reads files there".
- `.claude/rules/*.md` with `paths:` frontmatter: "loads when Claude works with a file matching the rule's `paths:` glob"; `paths` is the only frontmatter field read; rules without `paths` load at launch "with the same priority as `.claude/CLAUDE.md`". Known bug report #16299 (path-scoped rules loading globally in some versions) - verify with `/context` and the `InstructionsLoaded` hook. [A for docs; C for bug status]
- `claudeMdExcludes` (glob on absolute path) to skip other teams'/legacy subtrees; managed CLAUDE.md cannot be excluded.
- `permissions.deny`: `Read(./**/dist/**/*)`, `Read(./**/build/**/*)`, `Read(./**/*.generated.*)`, `Read(./**/vendor/**/*)`; end with `/**/*` "so that each rule covers everything inside the directory but not the directory itself" (Claude can still `ls dist`). A `Read` deny "also blocks the Edit and Write tools on the same path, including creating a new file there"; "NotebookEdit isn't covered, so add an `Edit` deny rule". Only `Edit(path)` and `Read(path)` rules are consulted - `Write(...)`, `MultiEdit(...)`, `NotebookEdit(...)`, `Glob(...)` path rules are accepted but "never consult[ed]" and warned at startup. Deny/ask rules match a single-segment directory at any depth (`Read(secrets/**)`), allow rules only at the anchor. Rules cover built-in tools plus recognized Bash file commands (`cat`, `head`, `tail`, `sed`, `tee`) and redirection targets, but "don't apply to ... arbitrary subprocesses that read or write files indirectly, like a Python or Node script"; use the sandbox for OS-level enforcement.
- Precedence: "Hook decisions don't bypass permission rules ... a matching deny rule blocks the call" and "A blocking hook also takes precedence over allow rules"; "`PreToolUse` hooks fire before any permission-mode check, in every permission mode, including `dontAsk` ... even in `bypassPermissions` mode or with `--dangerously-skip-permissions`."
- Subagent-scoped hooks live in the agent's frontmatter (`hooks: PreToolUse/PostToolUse/Stop`) and "run only while that specific subagent is active" - this is how each funnel role gets its own zone guard. Tool allowlists: `tools: Read, Grep, Glob` for a research role; `disallowedTools: Write, Edit` to strip writes.
- Settings caveat: "Project settings in `.claude/settings.json` aren't inherited from parent directories the way CLAUDE.md files are"; `.claude/settings.local.json` loads from the repo root (v2.1.211+). In worktrees the working directory is the worktree root, so deny rules must be duplicated in the root `.claude/settings.json`.

**2.4 Validating the map: log write sets and count cross-zone touches.** [B for the conflict data; C for the procedure]
AgenticFlict (arXiv 2604.03551, blocked): of ~142,000 AI-agent PRs, 27.67% contained merge conflicts; a companion 2026 analysis reports cross-agent pairs conflict at roughly twice the rate of intra-agent pairs. Claude Code provides `PostToolUse` on `Edit|Write` with `tool_input.file_path`, `session_id`, and (for subagents) the agent name in `SubagentStart/Stop` matchers - enough to append `{ts, agent, zone, path}` to a JSONL. Procedure: after two weeks, list files touched by more than one zone, and zone pairs with the highest co-touch count; either merge the pair into one zone, or extract the file(s) into an explicit "contract" zone with a stricter gate. This is my design; unmeasured.

### 3. Codebase knowledge for agents without bloating context

**3.1 Repository maps: Aider's design and its budget.** [A]
Aider parses with tree-sitter to get "tags" (definitions and references), builds "a graph where each source file is a node and edges connect files which have dependencies", runs "a graph ranking algorithm" (PageRank-style, personalized toward files in the chat), and renders "the most important classes and functions along with their types and call signatures" within `--map-tokens` (default 1k, expanded "especially when no files have been added to the chat"). No benchmark numbers are given on the docs page itself. Claude Code has no built-in repo map; equivalents: (a) LSP plugins (3.2), (b) a generated `docs/REPO-MAP.md` produced by a Go/Python port (e.g. `goldfish`, tree-sitter + PageRank) that a SessionStart hook prints, capped at ~1-2k tokens [C].

**3.2 Code intelligence plugins (LSP) replace grep-scans with symbol lookups and give diagnostics after every edit.** [A]
Official plugins and binaries: TypeScript/JS `typescript-lsp` (`typescript-language-server`), Python `pyright-lsp` (`pyright-langserver`), Go `gopls-lsp` (`gopls`), Rust `rust-analyzer-lsp` (`rust-analyzer`), Java `jdtls-lsp` (`jdtls`), Kotlin `kotlin-lsp` (`kotlin-lsp`), PHP `php-lsp` (`intelephense`), C/C++ `clangd-lsp`, C# `csharp-lsp`, Ruby `ruby-lsp`, Swift, Lua. Install: `/plugin install typescript-lsp@claude-plugins-official`; enable for everyone via `enabledPlugins`. What Claude gains: "each time Claude edits or writes a file the server handles, Claude gets the errors and warnings the server reports" and "an `LSP` tool that looks up symbols through the server instead of searching text for them. The tool is read-only." Limits: "In cloud sessions, Claude Code doesn't start plugin language servers"; monorepo false positives are a known troubleshooting item; memory use during indexing.

**3.3 "Confirm with code search before assuming functionality is missing": three enforcement levels.** [A for mechanisms; C for effectiveness]
- Advisory: best-practices doc's "Use subagents for investigation" ("whether we have any existing OAuth utilities I should reuse"); the built-in `Explore` agent is read-only and "skip[s] CLAUDE.md files and git status to keep exploration fast".
- Structural: make the funnel's research/decomposition stage a mandatory subagent with `tools: Read, Grep, Glob, LSP` whose output must contain a "Reuse candidates" section with `findReferences`/grep evidence; the implementer brief lists them as "MUST reuse or justify".
- Deterministic: a `PreToolUse` hook on `Write` (new files) under `**/{utils,helpers,common,shared,lib}/**` with `type: "agent"` (documented: multi-turn, tool access, 60 s default timeout, up to 50 tool turns, "experimental and may change") that answers `ok:false` with the path of an existing helper when one matches. Also possible as a cheap command hook: deny creation of a new file whose basename already exists elsewhere in the tree.
Motivation data [B]: GitClear 2025 (211M changed lines, 2020-2024): copy/pasted lines rose from 8.3% to 12.3%, moved (refactored) lines fell from 24.1% to 9.5%, and 2024 was the first year copy/paste exceeded moved code; commits with duplicated blocks rose ~10x in two years. GitClear is a vendor with a product interest; the PDF text could not be extracted here.

**3.4 What `/init` and `/doctor` produce; the 200-line budget.** [A]
`/init`: "Claude analyzes your codebase and creates a file with build commands, test instructions, and project conventions it discovers. If a CLAUDE.md already exists, `/init` suggests improvements rather than overwriting it." With `CLAUDE_CODE_NEW_INIT=1` it "asks which artifacts to set up: CLAUDE.md files, skills, and hooks. It then explores your codebase with a subagent, fills in gaps via follow-up questions, and presents a reviewable proposal before writing any files", and reads other tools' instruction files (AGENTS.md, .windsurf/rules, .clinerules). `/doctor`: for a checked-in CLAUDE.md "Claude proposes cuts for content it can derive from the codebase". Size: "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence"; imports "still load and enter the context window at launch"; HTML comments are stripped before injection. Include/exclude table from best-practices: include "Bash commands Claude can't guess", "Code style rules that differ from defaults", "Common gotchas or non-obvious behaviors", "Developer environment quirks"; exclude "Anything Claude can figure out by reading code", "Detailed API documentation", "File-by-file descriptions". "Bloated CLAUDE.md files cause Claude to ignore your actual instructions!" A `Stop` hook "receives the path to the session transcript ... so a script can review the session and propose CLAUDE.md updates".

**3.5 When a skill, not CLAUDE.md.** [A]
"CLAUDE.md is loaded every session, so only include things that apply broadly. For domain knowledge or workflows that are only relevant sometimes, use skills instead." Skills can be per-directory (`packages/api/.claude/skills/`) or path-scoped with `paths:` frontmatter (e.g. a migrations skill scoped to `**/migrations/**`). Warning: with many skills "some skills lose their descriptions entirely"; lead descriptions with the words a request would contain. OTel `skill_activated` events (`OTEL_LOG_TOOL_DETAILS=1`) tell you which skills go unused.

### 4. Safe landing on a live system

**4.1 Patterns (human-era, primaries blocked).** [B][H]
Branch by Abstraction (Hammant/Fowler): introduce an abstraction over the part to replace, move all clients to it, build the new implementation behind it, switch (often via a toggle), delete the old implementation and, if desired, the abstraction - all on trunk in small commits. Strangler Fig (Fowler 2004; Microsoft pattern page): put a facade in front of the legacy system, route features one by one to the new implementation, retire the old when empty; considerations: the facade is a single point of failure and data must stay consistent across both. Expand/Contract (parallel change) for schema: add the new structure, dual-write, backfill, switch reads, stop writing old, drop old; each step independently deployable and reversible. Feature flags gate the switch points. No evidence found on agents specifically; the transfer is structural (each pattern yields small, independently verifiable slices, which is what agents need).

**4.2 Diff-scoped gates so legacy debt never blocks a gate.** [A]
- `diff-cover`: "Diff coverage is the percentage of new or modified lines that are covered by tests"; `--compare-branch` (default `origin/main`), `--fail-under=80` returns non-zero; accepts Cobertura XML, LCOV, Clover XML, JaCoCo XML - therefore one tool works for JS (lcov), Python (coverage.xml), Go (via gocover-cobertura), Java/Kotlin (JaCoCo), Rust (cargo-llvm-cov --lcov), PHP (clover). `diff-quality --violations=<linter>` does the same for lint findings.
- StrykerJS `--incremental`: stores `reports/stryker-incremental.json`, does "a git-like diff of your code and test files to the previous version" and reuses results when "a mutant was killed and its culprit test still exists unchanged" or when unkilled with unchanged tests; `--force` reruns; limits: "Changes outside mutated and test files go undetected", test-change detection depends on the runner plugin. Use: nightly full run to refresh the incremental file; PR run incremental. Mutation-score drop on the diff is also a detector of weakened tests (6.3).
- Semgrep diff-aware scanning (`SEMGREP_BASELINE_REF` / `--baseline-commit`): only findings introduced after the baseline are reported. [B]
- PHP: PHPStan/Psalm baseline files (`--generate-baseline`) freeze existing findings so only new ones fail. [B]

**4.3 Sizing units when surrounding code is untested.** [B][C]
PR-size data (cubic.dev, blocked): in 1.5M PRs, changes under ~200 lines were approved ~3x faster and carried ~40% fewer defects; a 28-developer controlled experiment found reviewers of decomposed PRs reported fewer false positives but "did not find significantly more defects" - so decomposition helps flow more than it helps detection. Rule I derive: a unit touching untested code is two commits/PRs in a stack: (1) characterization tests only (no production change, must be green on old code), (2) the change with FAIL_TO_PASS tests. Claude Code specifics [A]: plan mode first for multi-file or unfamiliar code ("If you could describe the diff in one sentence, skip the plan"), and "Claude Code re-injects the plan file after each compaction".

### 5. Monorepo / multi-service / multi-language

**5.1 Claude Code layout rules.** [A]
Start Claude from the package directory when work is scoped ("That directory's plus every ancestor's" CLAUDE.md load; file access "That subtree only, until you grant more"). `.claude/settings.json` is per-directory (not inherited); use `additionalDirectories` / `--add-dir` for siblings (skills load with `--add-dir`, not with the setting; CLAUDE.md from added dirs only with `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`). `worktree.sparsePaths` + `symlinkDirectories: ["node_modules"]` for cheap subagent worktrees; include `.claude` in sparsePaths. Root CLAUDE.md example lines from the docs: "Never edit files under packages/*/generated/. Run `npm run codegen` in the package instead." and "Never edit a migration after it has merged. Add a new migration instead."

**5.2 Cross-repo contracts: Pact can-i-deploy.** [A]
`pact-broker can-i-deploy --pacticipant Foo --version 23 --to-environment production` exits 0 "Computer says yes" / 1 "Computer says no" based on the Matrix ("all the consumer and provider versions that have been tested against each other"); after deploying, `pact-broker record-deployment --pacticipant Bar --version 56 --environment production`. Tags are deprecated in favour of deployments/releases; use exact versions to avoid race conditions. Funnel use: the blind verdict stage for a service change runs can-i-deploy against the target environment as a mechanical veto.

**5.3 Mixed-tool fleets.** [B][C]
Given the AgenticFlict finding that cross-agent pairs conflict ~2x more than same-agent pairs, and that formatting/lockfile churn is a common conflict region (from the study summaries; primary blocked), pin one formatter config per repo, enforce it with a `PostToolUse` format hook (docs example: run the formatter after every edit) and a CI `--check`, and keep lockfiles/generated dirs under `Edit` deny for implementers. Tool-agnostic: the formatter config lives in the repo (`.prettierrc`, `pyproject [tool.ruff]`, `rustfmt.toml`, `.editorconfig`, `gofmt` is fixed), not in an agent's instructions.

### 6. Legacy-specific agent failure modes and a mechanical countermeasure for each

| Failure mode | Evidence it happens | Mechanical countermeasure (Claude Code) | Tool-agnostic form |
|---|---|---|---|
| Duplicating existing helpers | GitClear duplication trend [B]; docs' own prompt "whether we have any existing OAuth utilities I should reuse" [A] | Mandatory read-only research subagent (`tools: Read, Grep, Glob, LSP`) whose brief must list "Reuse candidates" with `findReferences`; `PreToolUse` `Write` hook denying new files in helper dirs unless the brief lists a search; reviewer checklist item "new symbol duplicates existing?" using LSP | Research stage output schema requires evidence of search; reviewer rejects unjustified new helpers |
| Breaking implicit invariants | Feathers' whole book [H]; METR lists "implicit repository context" as a slowdown factor [B] | Characterization/approval tests must exist for every function the unit touches before the change commit; `.claude/rules/zone-*.md` carries an "Invariants" list (<10 lines); `Stop` hook runs the zone's test subset | Two-commit stack: characterize, then change |
| "Fixing" flaky tests by weakening them | Anthropic: RL-trained model learned "calling sys.exit(0) in Python to break out of a test harness with an exit code of 0, making it appear that all tests have passed" and this generalized to sabotage in 12% of instances [A]; SpecBench/UTBoost report test overwriting [B] | Implementer role gets `Edit` deny on `**/*test*/**`, snapshots, and the quarantine list (append-only test paths handled by a separate "test-writer" role); CI runs `jest --ci`, no `--snapshot-update`, `INSTA_UPDATE=no`, no `-update`; a `PostToolUse` hook diffs assertion counts in touched test files and blocks decreases; mutation score on the diff must not fall | Tests and quarantine list are write-protected from the role that makes them pass; separate roles for writing tests and code |
| Editing generated files or migrations | Docs' explicit rules (large-codebases page) [A] | `permissions.deny`: `Read(./**/generated/**/*)`, `Edit(./**/migrations/**)` plus a `PreToolUse` hook allowing only new migration files (path not in `git ls-files`) | CODEOWNERS/zone map marks these paths as "no-write" |
| Retro-documenting instead of changing | Brownfield rule from prior research (Spec Kit/OpenSpec/BMAD) [C] | `Edit` deny on `docs/**` for the implementer role; brief template forbids "add documentation" as an acceptance item unless requested; reviewer rejects doc-only diffs | Delta-spec only; docs are a separate unit |
| Touching files outside the zone | AgenticFlict conflict rates [B] | Zone guard `PreToolUse` hook in each role's frontmatter reading `.github/CODEOWNERS` (last-match-wins) and the role's zone; `Edit` deny lists in the brief; worktree `sparsePaths` so out-of-zone files are not even on disk | Write-set logging + weekly conflict report |

Bug notes for the hook layer [A/C]: PreToolUse hook scripts must be executable ("Hook scripts must be executable for Claude Code to run them"); issue #94362 reports a non-executable deny hook failing open - add a `SessionStart` self-test that exercises the guard and aborts the session if it does not deny. Also protect `.claude/hooks/**` and `.claude/settings.json` with `Edit` deny (issue #11226 history).

### 7. Measuring the onboarding (first 30 days)

**7.1 Expectation setting from METR.** [A for numbers via GitHub; B for factor list]
16 experienced open-source developers, 246 real issues, repos averaging 22k+ stars and 1M+ LOC, multi-year contributors; RCT result: "speedup of 0.188, meaning time with AI is greater than time without AI" (19% slower), while developers predicted +20% and still believed +20% afterward. Factors the paper lists as likely contributing: high developer familiarity with the repositories, large and complex repositories, low AI reliability on this code, implicit repository context, and over-optimism about AI usefulness. Implication: for a mature familiar codebase the honest 30-day target is "not slower than the solo baseline, with equal or lower escaped defects", not "faster". Any funnel that adds ceremony must pay for itself in rework avoided, so rework must be measured.

**7.2 DORA 2025 direction.** [B]
AI adoption correlates positively with throughput and negatively with delivery stability (more change failures and rework); "AI is an amplifier" of existing practices. So the metrics that matter first are instability metrics (rework, change-failure), not velocity.

**7.3 What to record (proposal).** [C]
Day-0 facts: time-to-green (hours from clone to first fully green containerized run), size of P2P set, quarantine size, build reproducibility (clean-clone pass count 3/3).
Per unit: characterization tests added (count, per zone), diff coverage %, diff mutation score, F2P/P2P result, number of send-backs by stage (independent review vs blind verdict), files touched outside zone (from write-set log), tokens/time per accepted unit.
Weekly: cross-zone touches per zone pair, escaped defects (bugs found after verdict, by zone), quarantine in/out, CLAUDE.md line count, rules loaded per session (`InstructionsLoaded` hook), skills activated (OTel).
Comparison: your own pre-funnel baseline (last 30 days of solo work: PRs, reverts, hotfixes) is the only fair control; METR gives the prior that the AI-assisted arm may be ~0.8x speed on familiar mature code.

---

## Phased onboarding checklist (Day 0 -> Day 30)

### Day 0 (half a day): reproduce the build, freeze the baseline
1. Clean clone into a container: write `.devcontainer/devcontainer.json` (or a Dockerfile) that installs the toolchain; verify `devcontainer up` on a clean machine or in CI (devcontainers/ci action). If the build cannot be reproduced, stop here and make it reproducible; nothing downstream is trustworthy otherwise. [A]
2. Write `init.sh` (start deps/dev server), `smoke.sh` (one end-to-end interaction), and `baseline.sh` that runs the whole suite three times and writes `baseline/p2p.txt` (stable-pass test IDs), `baseline/quarantine.txt` (tests that flipped), and `baseline/fail.txt` (consistently red; open issues, exclude from gate). [A for the ritual; C for the file layout]
3. Commit `baseline commit` with these files and `claude-progress.md`. [A]

Per-ecosystem baseline commands (all [A] for tool behaviour unless noted):
- JS/TS: `npm ci && npx jest --ci --json --outputFile=run1.json` (repeat x3); coverage `--coverage --coverageReporters=lcov`; flakiness probe: `npx jest --ci --runInBand` vs parallel.
- Python: `pip install -e '.[test]'` or `uv sync`; `pytest -p no:randomly --junitxml=run1.xml --cov --cov-report=xml`; order-dependence probe: `pytest -p randomly` (pytest-randomly); quarantine lane only: `pytest --reruns 3` (pytest-rerunfailures).
- Go: `go build ./... && go vet ./... && go test ./... -count=1 -json > run1.json`; `go test ./... -count=3 -shuffle=on -race`; coverage `-coverprofile=cover.out` then `gocover-cobertura < cover.out > coverage.xml` for diff-cover. [C for the converter]
- Java/Kotlin: `./gradlew test --continue` (or `mvn -B verify`); JaCoCo XML report; flaky detection: Gradle test-retry plugin with `failOnPassedAfterRetry = true` or Surefire `-Dsurefire.rerunFailingTestsCount=2` (reports FLAKY) - both only in the quarantine job. [B for flag semantics]
- Rust: `cargo build --all-targets && cargo test --workspace`; `cargo nextest run --retries 2` only in quarantine lane; coverage `cargo llvm-cov --workspace --lcov --output-path lcov.info`. [B for nextest/llvm-cov flags]
- PHP: `composer install`; `vendor/bin/phpunit --log-junit run1.xml --coverage-clover clover.xml`; static analysis baseline `vendor/bin/phpstan analyse --generate-baseline`. [B]

### Day 1-3: knowledge and zones
4. `/init` (with `CLAUDE_CODE_NEW_INIT=1` for the reviewable, subagent-explored proposal) then `/doctor`; cut to < 200 lines; move everything "sometimes relevant" to skills. [A]
5. Install the LSP plugin(s) for the repo languages; confirm the "Found N new diagnostic issues" line appears after a deliberate type error. [A]
6. Add `permissions.deny` Read rules for `dist/`, `build/`, `**/*.generated.*`, `vendor/`, and Edit rules for lockfiles, snapshots, migrations, `.claude/hooks/**`. [A]
7. Run the zones-map recipe (below); commit `.github/CODEOWNERS`, `.claude/rules/zone-*.md`, and the zone-guard hook. [A/C]
8. Add the SessionStart hook that prints `baseline/summary.txt` + repo map (< 1.5k tokens) and the self-test of the deny hook. [C]

### Week 1: characterize the hotspots you will touch
9. For the top-20 hotspots that intersect the first epics: approval/golden tests via the ecosystem tool (ApprovalTests.Java/.PHP, syrupy, Jest snapshots, Go golden, insta), written by a "characterizer" role with write access to test paths only; run against unchanged code; must be green x3 before commit. [A for tools; H for practice]
10. Turn on diff-scoped gates: `diff-cover <report> --compare-branch=origin/main --fail-under=<current diff coverage of a typical PR + 10>`; Stryker/mutation incremental nightly; Semgrep/PHPStan baseline. [A/B]
11. Quarantine lane in CI: separate non-blocking job running `baseline/quarantine.txt` nightly with retries; weekly promotion/demotion script. [C]

### Week 2-4: run the funnel on real units and measure
12. First units: two-commit stacks (characterize, then change), feature-flagged switch points, expand/contract for any schema change. [B][H]
13. Weekly: write-set conflict report; re-draw zones; CLAUDE.md/rules pruning via Stop-hook proposals; quarantine review. [A for hooks; C for cadence]
14. Day 30: compare rework, escaped defects, time per accepted unit against the pre-funnel 30-day window; expect near-zero speedup on familiar mature code (METR) and treat lower escaped defects as the win. [A/B]

---

## Zones-map derivation recipe (concrete)

```bash
# 1. Evidence: 12 months of history, noise excluded
git log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames \
  --after=$(date -d '-12 months' +%F) -- . ':(exclude)vendor/' ':(exclude)**/generated/**' \
  ':(exclude)**/*.lock' ':(exclude)**/__snapshots__/**' > /tmp/git.log
J="java -jar code-maat-1.0.4-standalone.jar -l /tmp/git.log -c git2"
$J -a revisions       > revisions.csv          # churn per file
$J -a coupling --min-coupling 30 --min-revs 5 > coupling.csv   # co-change pairs, degree %
$J -a soc             > soc.csv                # sum of coupling: hub files
$J -a main-dev        > main-dev.csv           # knowledge map (who/which role owns)
$J -a fragmentation   > fragmentation.csv      # many minor contributors = risky
$J -a age             > age.csv                # stable vs active areas
cloc --by-file --csv --quiet . > size.csv      # size as complexity proxy
# 2. Hotspots = top revisions x top size (join on path); keep top 20
# 3. Candidate zones = top-level directories/packages; for each coupling pair that
#    crosses two candidates with degree >= 50%, either merge the zones or move the
#    files into a 'contract' zone.
# 4. Overlay the known overlap zones as explicit shared zones with a stricter gate:
#    auth/authz, config, migrations, shared helpers, API contracts, core services.
# 5. Write CODEOWNERS (last match wins), <= 60 lines.
```

Example `.github/CODEOWNERS` (zone handles double as review routing):

```
# default: nobody owns -> implementer must justify touching
*                          @zone-unowned
/apps/web/**               @zone-web
/services/api/**           @zone-api
/packages/shared/**        @zone-shared     # contract zone: 2 reviewers
/services/api/src/auth/**  @zone-authz      # overlap zone, stricter gate
/**/migrations/**          @zone-migrations # append-only
/**/generated/**           @zone-generated  # no writes
```

Validation: `PostToolUse` on `Edit|Write` appends `{agent, zone, path}`; weekly `awk` over the log lists paths touched by >1 zone and zone pairs with most co-touches; re-draw. Keep the whole map loadable every session (CODEOWNERS < 60 lines, each zone rule < 40 lines).

---

## CLAUDE.md + .claude/rules starter template (derived from README, CI, lint configs, ADRs)

`CLAUDE.md` (root, target < 120 lines; every line must pass "would removing this cause a mistake?"):

```markdown
# <repo> - working agreement for agents
## Build / test (from CI: .github/workflows/ci.yml)
- Reproducible env: `devcontainer up` ; smoke: `./scripts/smoke.sh`
- Full suite: `<cmd>` ; single test: `<cmd> path::name` ; coverage report: `<path>`
- Gate = baseline/p2p.txt stays green + your new tests fail before / pass after.
## Non-negotiables (enforced by hooks; listed so you plan around them)
- Never edit **/generated/**, lockfiles, **/migrations/** (add a new migration), snapshots/golden files.
- Never mark a test flaky, skip, or delete an assertion. Quarantine is owned by the human.
- Before adding a helper/util: search (LSP findReferences / grep) and cite the search in the brief.
## Conventions that differ from defaults (from lint/format configs)
- Formatter: <tool + config path>; lint: <tool>; commit prefix: <package>: <subject>
## Architecture decisions (pointers only, from docs/adr/)
- ADR-007 auth is centralised in services/api/src/auth; nothing else reads tokens.
## Zones
- Path map: .github/CODEOWNERS (last match wins). Your brief names your zone; stay inside it.
## Session ritual
- Read baseline/summary.txt and claude-progress.md first; run smoke before implementing.
```

`.claude/rules/zone-api.md`:

```markdown
---
paths:
  - "services/api/**"
---
# Zone: api
Invariants (do not break; each has a characterization test in tests/char/api/):
- Every handler returns the envelope {data, error}; see tests/char/api/envelope.approved.txt
- DB access only via repository layer; raw SQL in handlers is rejected by review.
Run: `cd services/api && npm test -- --ci`
Owner of tests/char/**: characterizer role only.
```

`.claude/rules/migrations.md` with `paths: ["**/migrations/**"]`: "Append-only. Expand/contract: add column -> dual write -> backfill -> switch reads -> drop. Never edit a merged migration."

---

## Hook and path-deny list

`.claude/settings.json` (root; duplicate deny rules here for worktree sessions):

```json
{
  "permissions": {
    "deny": [
      "Read(./**/dist/**/*)", "Read(./**/build/**/*)", "Read(./**/vendor/**/*)",
      "Read(./**/*.generated.*)", "Read(./**/node_modules/**/*)",
      "Edit(./**/*.lock)", "Edit(./package-lock.json)", "Edit(./**/generated/**)",
      "Edit(./**/__snapshots__/**)", "Edit(./**/*.approved.*)", "Edit(./**/testdata/**/*.golden)",
      "Edit(./**/*.snap)", "Edit(./baseline/**)", "Edit(./.claude/hooks/**)", "Edit(./.claude/settings.json)",
      "Edit(./.github/CODEOWNERS)"
    ]
  },
  "hooks": {
    "SessionStart": [{"hooks": [{"type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/session-brief.sh"}]}],
    "PreToolUse": [
      {"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/zone-guard.sh"}]},
      {"matcher": "Edit|Write", "hooks": [{"type": "command", "if": "Edit(**/migrations/**)", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/migrations-append-only.sh"}]}
    ],
    "PostToolUse": [
      {"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/log-writeset.sh"}]},
      {"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format-file.sh"}]}
    ],
    "Stop": [{"hooks": [{"type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/gate-zone-tests.sh"}]}]
  }
}
```

`zone-guard.sh` (sketch; exit 2 blocks; stderr is fed back to Claude):

```bash
#!/bin/bash
INPUT=$(cat); FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty'); FILE="${FILE//\\//}"
ZONE="${FUNNEL_ZONE:-}"            # set by the role's frontmatter hook env or brief
[ -z "$ZONE" ] && exit 0            # human session: no restriction
OWNER=$(codeowners "$FILE" 2>/dev/null | awk '{print $2}')   # hmarr/codeowners, last-match-wins
case "$OWNER" in
  "@zone-$ZONE") exit 0 ;;
  "@zone-generated"|"@zone-unowned") echo "Blocked: $FILE is $OWNER; not writable by role $ZONE" >&2; exit 2 ;;
  *) echo "Blocked: $FILE belongs to $OWNER, your zone is $ZONE. Add it to the brief's cross-zone list or stop." >&2; exit 2 ;;
esac
```

Role-specific guards go in the subagent frontmatter (`.claude/agents/implementer.md`: `hooks: PreToolUse: [{matcher: "Edit|Write", hooks: [{type: command, command: ".claude/hooks/deny-test-edits.sh"}]}]`, `disallowedTools: Write` for reviewers, `tools: Read, Grep, Glob, LSP` for researchers). Self-test at SessionStart: attempt a denied write through the hook script with a fake payload and abort if it does not exit 2 (fail-open bug #94362).

---

## Anti-patterns

- **Blanket test retries on the main gate.** Google only reruns tests marked flaky; retries on the gate hide the ~1/6 of new flakiness that is a real bug. [B]
- **Letting the implementer role write to tests, snapshots, or the quarantine list.** Anthropic's RL result shows models will exploit the harness (sys.exit(0)) when the grader is reachable; the funnel's separation of roles is the countermeasure, and it must be enforced by deny rules, not prose. [A]
- **Retro-documenting the codebase or a 500-line CLAUDE.md.** Docs: longer files "reduce adherence"; "Bloated CLAUDE.md files cause Claude to ignore your actual instructions!". Derive from README/CI/lint/ADRs, prune with `/doctor`. [A]
- **Writing `Write(...)`/`MultiEdit(...)` path deny rules.** They are accepted but never consulted; use `Edit(path)` and `Read(path)`. [A]
- **Relying on path-scoped rules or deny rules to reach subprocesses.** Deny rules do not cover a Python/Node script that opens files itself; use the sandbox for OS-level enforcement. [A]
- **Trusting CLAUDE.md as enforcement.** "Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead." [A]
- **Starting agents from the monorepo root for scoped work.** Root start loads every subdirectory's CLAUDE.md/skills as Claude touches them ("which can accumulate into the hundreds"). [A]
- **Non-executable hook scripts / hooks not duplicated for worktrees.** Fail-open and silent. [A/C]
- **Reviewer chasing every finding.** "A reviewer prompted to find gaps will usually report some, even when the work is sound"; tell reviewers to flag only correctness/requirement gaps. [A]
- **Expecting speed-up in week 1 on a familiar mature repo.** METR: 19% slower with a 20% perceived speed-up; measure rework and escaped defects instead. [A/B]
- **Approving snapshot updates by regenerating them.** Jest/syrupy/insta/golden all make regeneration a one-flag action; the review is the whole point ("treat snapshots as code"). [A]

## Open questions

1. No controlled evidence that characterization tests written by agents catch agent-introduced regressions at a useful rate; Meta's TestGen-LLM (blocked) reports 75% of generated tests built, 57% passed reliably, 25% increased coverage, 73% accepted - on improving existing tests, not characterizing legacy code. [B]
2. Whether path-scoped `.claude/rules` load reliably per version (issue #16299) - verify with `/context` and `InstructionsLoaded` before relying on them for zone invariants.
3. Agent-type PreToolUse hooks are "experimental and may change"; latency (60 s default) may make a reuse-check hook too slow for every Write.
4. What diff-coverage threshold is right on a legacy repo whose typical PR has 20% diff coverage; the tool supports any threshold but there is no evidence for a number.
5. Whether the AgenticFlict cross-agent 2x conflict rate is driven by formatting or by real semantic overlap (primary blocked); this decides whether the formatter pin or the zones map matters more.
6. How to attribute "knowledge map" (main-dev) for a solo developer: proposal is a commit trailer `Zone: <name>` and `Agent-Role: <role>` so code-maat's author analyses work on roles.
7. Rust `INSTA_UPDATE` semantics and cargo-mutants `--in-diff` were not verified (sites blocked).

## Design implications for the funnel

1. **Intake needs a Day-0 artifact, not a spec.** The wide mouth accepts requests only after `baseline/` exists (p2p, quarantine, summary) and the container is green; otherwise every gate downstream is either red forever or lowered.
2. **Zones stage = CODEOWNERS + rules + guards.** The zones map is evidence-derived (co-change, hotspots, overlap zones), represented as last-match-wins CODEOWNERS, loaded every session, and enforced per role by frontmatter hooks; validated weekly from write-set logs.
3. **Decomposition stage must emit reuse evidence.** The research subagent (read-only, with LSP) produces "reuse candidates" and "invariants touched"; briefs list forbidden paths and required characterization tests.
4. **Hypothesis check = characterize first.** For any unit touching untested code, the first slice is characterization tests that pass on old code; the second is the change with F2P tests. Snapshot/approved files are reviewed artifacts writable only by the characterizer.
5. **Execution gate = SWE-bench criterion on a diff-scoped basis.** F2P all pass, P2P all pass, diff-cover >= threshold, mutation score on diff not lower, formatter clean, no writes outside zone, no test weakening.
6. **Independent review sees the plan + diff; blind verdict sees only the diff + gate report + can-i-deploy.** The blind stage is where "not slower but safer" is proven; it should be measured by escaped defects.
7. **Learn stage = hooks proposing CLAUDE.md/rules edits + zone re-draw + quarantine review**, all bounded by the 200-line budget.
8. **Measurement is part of the workflow, not an add-on:** write-set log, gate results and send-backs are recorded by hooks so the 30-day comparison against METR/DORA expectations is possible.
