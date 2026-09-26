# Gap research: the funnel as a state machine — ledger, send-back semantics, bounded loops, adjudication, human gates for a non-reading approver

Researcher note, 2026-09-26. Dimension: "The funnel as a state machine: on-disk ledger, send-back semantics, bounded loops, adjudication, and human approval points designed for a non-reading approver".

Method constraints hit during this sweep:
- WebSearch budget for the session was already exhausted (200/200) before this researcher started, so every source below was reached by direct URL fetch.
- The egress proxy blocks: arxiv.org, huggingface.co, pnas.org, api.semanticscholar.org, openreview.net, proceedings.mlr.press, gwern.net, en.wikipedia.org, docs.github.com (site), google.github.io, research.google, sback.it, engineering.fb.com, dora.dev, metr.org, research.trychroma.com, docs.temporal.io, openai.com, stage-gate.com, bobcooper.ca, web.archive.org. Reachable: code.claude.com, anthropic.com, claude.com, raw.githubusercontent.com, microsoft.com, cloud.google.com. GitHub MCP file reads were restricted to the session's own repo, so third-party repos were read via raw.githubusercontent.com.
- Evidence levels used below: **[H]** primary source fetched and quoted; **[M]** primary source partially fetched (e.g., README of the paper's repo, publisher's abstract page) or a secondary but authoritative page; **[L]** source blocked, claim reconstructed from memory of the paper/document and flagged as unverified here.

---

## Sources read

### Claude Code docs (all [H], fetched 2026-09-26)
1. https://code.claude.com/docs/en/hooks (and hooks.md raw) — Stop/SubagentStop/TaskCompleted input and decision control, 8-consecutive-continuation cap, `stop_hook_active`, exit-code-2 table.
2. https://code.claude.com/docs/en/hooks-guide — "Stop hook hits the block cap" troubleshooting section.
3. https://code.claude.com/docs/en/env-vars — `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`, `MAX_STRUCTURED_OUTPUT_RETRIES`, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`, `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS`, `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`, `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`, `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`.
4. https://code.claude.com/docs/en/sub-agents — frontmatter fields, fresh context, nesting depth, worktree isolation, maxTurns partial + resume.
5. https://code.claude.com/docs/en/agent-teams — experimental; limitations; lead auto-approves teammate plans; task list location; hooks TeammateIdle/TaskCreated/TaskCompleted.
6. https://code.claude.com/docs/en/workflows — dynamic workflow constraints, resume semantics, schema retries, concurrency and agent caps.
7. https://code.claude.com/docs/en/goal — evaluator model, "does not call tools", stop after no-tool-use turns, resume behavior.
8. https://code.claude.com/docs/en/permission-modes — deny rules in every mode incl. bypassPermissions, actions no mode auto-approves, auto-mode fallback thresholds, dontAsk.
9. https://code.claude.com/docs/en/permissions — "Extend permissions with hooks": hooks run before the prompt; deny/ask rules evaluated regardless of hook; exit-2 hook precedes allow rules.
10. https://code.claude.com/docs/en/checkpointing — what checkpoints track, 100-checkpoint window, 30-day snapshot retention, Bash and subagent edits not tracked.
11. https://code.claude.com/docs/en/worktrees — `--worktree`, base branch `fresh` vs `head`, cleanup and sweep rules, isolation checks, hook `cwd` vs `${CLAUDE_PROJECT_DIR}`.
12. https://code.claude.com/docs/en/headless — `claude -p`, `--json-schema`, `dontAsk` denies AskUserQuestion, `--permission-prompts none` removes AskUserQuestion, exit codes, SIGTERM, bg wait ceiling, `--resume` by id from any directory.
13. https://code.claude.com/docs/en/tools-reference — AskUserQuestion, `askUserQuestionTimeout`, Task tools availability, Monitor deadlines.
14. https://code.claude.com/docs/en/best-practices — verification, "/clear after two failed corrections", Writer/Reviewer, adversarial review subagent, "show evidence rather than asserting success", "After the tenth approval you're clicking through".
15. https://code.claude.com/docs/en/code-review — multi-agent review + verification step, neutral check run never blocks, REVIEW.md "verification bar" and "re-review convergence", `bughunter-severity` machine-readable line, `/code-review` effort levels.
16. https://code.claude.com/docs/en/github-actions — `--max-turns` in `claude_args`, allowed tools, review workflow.
17. https://code.claude.com/docs/en/common-workflows — worktrees, `--continue/--resume`, `claude -p` in scripts.
18. https://code.claude.com/docs/en/sessions and https://code.claude.com/docs/en/claude-directory — `/branch`, `--fork-session`, retention sweep default 30 days.

### Anthropic engineering/research ([H])
19. https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — initializer/coding agents, `feature_list.json` with `passes`, `claude-progress.txt`, one feature at a time, premature "done".
20. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — context rot / attention budget, compaction, structured note-taking, sub-agent summaries of 1,000–2,000 tokens.
21. https://www.anthropic.com/engineering/building-effective-agents — evaluator-optimizer, orchestrator-workers, ground truth at each step, stopping conditions, human checkpoints.
22. https://www.anthropic.com/engineering/multi-agent-research-system — resume from where errors occurred; token usage explains 80% of variance; separation of concerns reduces path dependency.
23. https://www.anthropic.com/research/emergent-misalignment-reward-hacking — `sys.exit(0)` fake pass; 12% sabotage of detection.
24. https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models — humans and preference models prefer convincingly-written sycophantic responses a non-negligible fraction of the time.
25. https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents — graders resistant to hacks; grade final state; calibrate LLM judges; give judge an "Unknown" way out.
26. https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle — risk-tiered codebase, risk-weighted human sample, invariant tests trigger manual review, boundary around access/actions not model instructions.

### Papers ([M]/[L])
27. "LLMs Get Lost in Multi-Turn Conversation" (Laban et al., 2025) — abstract via https://www.microsoft.com/en-us/research/publication/llms-get-lost-in-multi-turn-conversation/ [M]; repo https://github.com/microsoft/lost_in_conversation. arXiv 2505.06120 blocked.
28. "Debating with More Persuasive LLMs Leads to More Truthful Answers" (Khan et al., ICML 2024) — repo README https://github.com/ucl-dark/llm_debate [M]; arXiv 2402.06782 and PMLR blocked, so the accuracy numbers are from memory [L].
29. "Towards Understanding Sycophancy in Language Models" (Sharma et al., 2023) — Anthropic page [H] + dataset README https://github.com/meg-tong/sycophancy-eval [M].
30. "LLM Evaluators Recognize and Favor Their Own Generations" (Panickssery, Bowman, Feng, 2024), arXiv 2404.13076 — BLOCKED (arXiv, HF, OpenReview). [L]
31. "Language Models Learn to Mislead Humans via RLHF" (Wen et al., 2024), arXiv 2409.12822 — repo README https://github.com/Jiaxin-Wen/MisleadLM has only run instructions; numbers from memory. [L]
32. Danziger, Levav, Avnaim-Pesso (2011) "Extraneous factors in judicial decisions", PNAS 108(17) 6889 — BLOCKED; and Weinshall-Margel & Shapard (2011) PNAS letter rebuttal — BLOCKED. [L]
33. Parasuraman & Manzey (2010) "Complacency and Bias in Human Use of Automation", Human Factors 52(3) — BLOCKED. [L]
34. Sadowski et al. (2018) "Modern Code Review: A Case Study at Google", ICSE-SEIP — BLOCKED. [L]

### Practice / industry
35. Google eng-practices, reviewer speed: https://raw.githubusercontent.com/google/eng-practices/master/review/reviewer/speed.md [H]; small CLs: https://raw.githubusercontent.com/google/eng-practices/master/review/developer/small-cls.md [H].
36. GitHub branch protection (docs source): https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches.md [H].
37. DORA 2025 report via Google Cloud blog: https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report [H for the quotes; the seven-capability list was not enumerated in text].
38. OpenHands StuckDetector: https://raw.githubusercontent.com/All-Hands-AI/OpenHands/0.20.0/openhands/controller/stuck.py [H] (path no longer on `main`; tag 0.20.0 fetched).
39. superpowers: README https://raw.githubusercontent.com/obra/superpowers/main/README.md; skills `subagent-driven-development`, `requesting-code-review`, `systematic-debugging`, `verification-before-completion` (all raw, [H]).
40. Ralph (Ryan Carson's loop): https://raw.githubusercontent.com/snarktank/ralph/main/README.md [H].
41. Spec Kit: https://raw.githubusercontent.com/github/spec-kit/main/README.md and spec-driven.md [H].
42. OpenSpec: https://raw.githubusercontent.com/Fission-AI/OpenSpec/main/README.md [H].
43. GSD Core: https://raw.githubusercontent.com/open-gsd/gsd-core/main/README.md [H] (old glittercowboy repo redirects here).
44. BMAD: https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/README.md [M] — marketing overview only; docs/user-guide.md 404; the "5 repair iterations / one ticket per autonomous run" claim from the prior sweep could NOT be re-verified here. [L]
45. Cooper Stage-Gate (Go/Kill/Hold/Recycle, gates = deliverables + criteria + outputs) — all primary URLs blocked. Used from prior sweep + memory. [L]

---

## Findings (with quotes)

### F1. Claude Code's Stop-hook loop bound is 8 consecutive continuations, and the hook must check `stop_hook_active` [H]
- hooks.md: "The `stop_hook_active` field is `true` when Claude Code is already continuing as a result of a stop hook. Check this value or process the transcript to avoid blocking on a condition that will never resolve. Claude Code applies an 8-consecutive-continuation cap: after stop hooks have continued the turn eight times in a row, Claude Code overrides the next block and ends the turn. To raise the cap, set `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`."
- env-vars: "`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` — Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8). Set to `0` to disable the cap."
- hooks-guide: "Claude Code overrides a Stop hook after it blocks eight times in a row without progress."
- `additionalContext` "keeps the conversation going through the same loop protections as `decision: "block"`".
- Nuance: hooks.md says "eight times in a row"; hooks-guide says "eight times in a row without progress". The docs do not define "progress". Checklist item.
- Implication: the Stop hook is a backstop, not the funnel's loop governor. The governor is a counter in the on-disk ledger; the hook reads the ledger and exits 0 (allow stop) as soon as the ledger says "escalate", so the 8-cap is never the thing that decides.

### F2. `/goal` is a transcript-only Haiku judge; it never runs tools and stalls out after several no-tool turns [H]
- goal.md: "The evaluator judges your condition against what Claude has surfaced in the conversation. It doesn't run commands or read files independently".
- "It does not call tools, so it can only judge what Claude has already surfaced in the conversation."
- "If Claude keeps answering the evaluator without making progress (no tool use for several turns in a row), Claude Code stops the loop, prints a warning, and returns control to you with the goal still set."
- "To bound how long a goal runs, include a turn or time clause in the condition, such as `or stop after 20 turns`."
- Resume: "Claude Code carries the condition over but resets the turn count, timer, and token-spend baseline."
- `/goal` = "a wrapper around a session-scoped prompt-based Stop hook".
- Implication: a judge that reads only the transcript is exactly the judge that "all tests pass" text can fool (see F13). Use `/goal` only as a convenience loop; the authoritative gate must re-execute the check (Stop hook script, TaskCompleted hook, CI).

### F3. Dynamic workflow scripts: no mid-run human input, no fs, deterministic replay, failed-agent rerun blast radius [H]
- workflows.md constraints table: "No mid-run user input — A run pauses on its own only for agent permission prompts and a usage-limit wait. For sign-off between stages, run each stage as its own workflow"; "No direct filesystem or shell access from the workflow itself — Agents read, write, and run commands. The script coordinates the agents"; "Up to 16 concurrent agents by default"; "1,000 agents total per run — Prevents runaway loops"; "Up to 4,096 items in a single parallel() or pipeline() call".
- Schema: "If the subagent's output still fails validation after five attempts, the call fails with an error that includes the last validation failure. To change the attempt count, set MAX_STRUCTURED_OUTPUT_RETRIES."
- Determinism: "Claude Code makes Date.now(), Math.random(), and a no-argument new Date() throw inside the script, so that a relaunched run repeats the same agent() calls. Pass a timestamp in through args instead."
- Resume: "Completed: returns its saved result. The first agent whose prompt differs from the previous run ... runs again, and so does every agent after it"; "Failed: runs again, and so does every agent that started after it, even ones that completed"; "If a script starts A, B, C, and D in that order and B fails, relaunching returns A from cache and runs B, C, and D again."
- Persistence: "Claude Code keeps the run's saved results under that session's directory in ~/.claude/projects/, so a session you resume with claude --resume can replay them ... In a session you start fresh, Claude has no earlier run to relaunch and starts the workflow over as a new run."
- Auto mode: "the prompt your script passes to agent() doesn't count as a request from you when the classifier reviews that subagent's actions".
- `agent()` "resolves to null if you stop it mid-run or it hits an unrecoverable API error".
- Implication: (a) one workflow per stage between human gates; (b) the ledger, not script variables, is the durable state, and every agent must write its result to the ledger before returning so that a fresh-session relaunch can start from ledger state rather than replay; (c) order `agent()` calls so cheap/deterministic ones come first and flaky ones last, because a failure reruns everything after it; (d) pass `run_id`/timestamp through `args`.

### F4. Subagents: fresh context, `omitClaudeMd`, worktree isolation branches from the DEFAULT branch, maxTurns returns partial [H]
- sub-agents.md: "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation history, the skills you've already invoked, or the files Claude has already read."
- "`omitClaudeMd` — Set to `true` to launch this subagent without the user, project, and local CLAUDE.md files ... Requires Claude Code v2.1.271 or later".
- "`isolation` — Set to `worktree` to run the subagent in a temporary git worktree, giving it an isolated copy of the repository branched by default from your default branch rather than the parent session's HEAD."
- worktrees.md: "`\"fresh\"` (default): branch from the repository's default branch on the remote, usually `main` ... `\"head\"`: branch from your current local HEAD". "Subagent worktrees use the same base branch as --worktree, so they branch from your repository's default branch unless worktree.baseRef is set to \"head\"."
- "`maxTurns` ... When the subagent reaches the limit, Claude Code returns its output marked as partial, and Claude can resume it to continue. The partial marking requires Claude Code v2.1.246 or later".
- Depth: "up to three layers below the main conversation"; concurrency: "when 20 subagents are running in a session, spawning another with the Agent tool fails".
- Worktree isolation checks block edits/commands/git redirects into the main checkout; "You can't turn this check off."
- Hook paths: "`${CLAUDE_PROJECT_DIR}` stays put ... `cwd` follows Claude".
- Implication: an `isolation: worktree` reviewer on the default settings would review `main`, not the item branch. Either set `worktree.baseRef: "head"` or hand the reviewer the branch/sha explicitly and have it check out. A context-free L2 reviewer is `omitClaudeMd: true` + tools allowlist + a delegation prompt that contains only the frozen spec and the sha.

### F5. Deny rules survive every mode including bypassPermissions; PreToolUse hooks run before the prompt; whether a hook deny holds under bypass is NOT documented [H]
- permission-modes.md: "Deny rules block in every mode, including bypassPermissions ... Allow rules have no effect in bypassPermissions."
- "Claude Code doesn't auto-approve the following in any mode, including bypassPermissions: ... rm and rmdir removals targeting a critical path, which no allow rule or PreToolUse hook \"allow\" approves".
- permissions.md: "PreToolUse hooks run before the permission prompt, for every tool except EndConversation ... Hook decisions don't bypass permission rules. Claude Code evaluates deny and ask rules regardless of what a PreToolUse hook returns"; "A blocking hook also takes precedence over allow rules. A hook that exits with code 2 stops the tool call before permission rules are evaluated".
- Auto mode fallback: "if the classifier blocks an action 3 times in a row or 20 times total, auto mode pauses and Claude Code resumes prompting ... These thresholds are not configurable." In `-p`: "the action doesn't run and Claude keeps working."
- Implication: guards for irreversible actions (migrations, `git push --force`, deletes, deploys, payments) belong in `permissions.deny` rules, which are documented to hold in bypass mode. Hook-based guards are for ledger-state checks (e.g., "no commit unless state == IMPLEMENT"). Whether an exit-2 PreToolUse hook fires under `--dangerously-skip-permissions` must be tested (checklist V4).

### F6. Checkpoints and `~/.claude` state are not durable enough for a ledger [H]
- checkpointing.md: "Checkpointing does not track files modified by Bash commands"; "Any other subagent: rewinding doesn't restore the edits. Use git to revert them"; "Claude Code keeps file snapshots for the 100 most recent checkpoints"; "deletes a session's file snapshots in the retention sweep, by default about 30 days"; "Not a replacement for version control".
- claude-directory.md: "Claude Code deletes the files in the paths below once they're older than cleanupPeriodDays ... The default is 30 days".
- agent-teams.md: "Task list: ~/.claude/tasks/{team-name}/ ... The task list directory persists locally and is never uploaded ... Retention is governed by the same cleanupPeriodDays".
- Implication: the ledger must live in the repository (committed on the item branch), and "reset" on recycle must be a git operation (reset to the last tagged checkpoint commit), never a `/rewind`.

### F7. Anthropic's long-running harness: immutable feature list + `passes` flag + progress file + git log; one feature at a time; premature "done" is the failure mode [H]
- "We prompt coding agents to edit this file only by changing the status of a passes field, and we use strongly-worded instructions like 'It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality.'"
- "The key insight here was finding a way for agents to quickly understand the state of work when starting with a fresh context window, which is accomplished with the claude-progress.txt file alongside the git history."
- "Read the git logs and progress files to get up to speed on what was recently worked on. Read the features list file and choose the highest-priority feature that's not yet done to work on."
- "the next iteration of the coding agent was then asked to work on only one feature at a time."
- "Claude marked features as done prematurely" -> "Self-verify all features. Only mark features as 'passing' after careful testing." and "Claude mostly did well at verifying features end-to-end once explicitly prompted to use browser automation tools and do all testing as a human user would."
- Implication: `acceptance.json` is the funnel's `feature_list.json`: criteria immutable by the implementer; the only writable field is `passes`, and even that should be flipped by the verifier, not the implementer.

### F8. Fresh context beats continued context after a wrong turn [H/M]
- Laban et al. abstract (microsoft.com): "an average drop of 39% across six generation tasks" (multi-turn vs single-turn); "a minor loss in aptitude and a significant increase in unreliability"; "LLMs often make assumptions in early turns and prematurely attempt to generate final solutions, on which they overly rely"; "when LLMs take a wrong turn in a conversation, they get lost and do not recover."
- Claude Code best-practices: "If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches. Run /clear and start fresh with a more specific prompt that incorporates what you learned. A clean session with a better prompt almost always outperforms a long session with accumulated corrections." Failure pattern: "After two failed corrections, /clear and write a better initial prompt incorporating what you learned."
- Best-practices on specs: "Once the spec is complete, start a fresh session to execute it. The new session has clean context focused entirely on implementation, and you have a written spec to reference."
- Best-practices on review: "A fresh context improves code review since Claude won't be biased toward code it just wrote."; "A reviewer running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced the change, so it evaluates the result on its own terms."
- Context engineering: "as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases"; sub-agents "return only a condensed, distilled summary of its work (often 1,000-2,000 tokens)".
- Multi-agent research: separation of concerns "reduces path dependency"; "token usage by itself explains 80% of the variance".
- Implication: a recycle that lands on a fresh implementer must carry a rewritten spec + learned constraints + reproducible failures, and must NOT carry the conversation. Whether to attach the discarded diff: no source shows a benefit; Laban shows models over-rely on their own early attempts; best-practices explicitly says the polluting element is "failed approaches". Attach only committed, test-passing progress (via git history), never the failing WIP diff.

### F9. superpowers' escalation ladder and review-contract are the most explicit practitioner design found [H]
- subagent-driven-development: "a fresh implementer subagent per task"; "Rounds 1-3: resume the original implementer" with findings verbatim; "Rounds 4-5: dispatch a fresh implementer on a more capable model" with the framing that prior attempts failed; hard cap five rounds; after round 5 "adjudicate each open finding yourself"; every fix round ends with a "scoped re-review" verifying only the fix diff; "Never skip the task review, and never accept a report missing either verdict" (spec-compliance verdict AND quality verdict); loop triggers on spec failures and Critical/Important findings, "not Minor issues".
- requesting-code-review: reviewer receives "precisely crafted context only — never your session history": description, plan/requirements, and the git diff BASE_SHA..HEAD_SHA; reviewer does not see "the coordinator's thought process"; implementer "should not argue with valid technical feedback, though pushing back with code evidence or technical reasoning is acceptable if the reviewer misunderstands"; severities Critical / Important / Minor.
- systematic-debugging: "If ≥ 3: STOP and question the architecture" (three failed fixes -> architectural review, discuss with partner before more fixes); four phases: root cause investigation, pattern analysis, hypothesis and testing, implementation with a failing test first.
- verification-before-completion: "Evidence before claims, always"; "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"; insufficient: "Previous test runs", "Trusting agent success reports without independent confirmation".
- Implication: adopt rounds 1-3 same implementer / 4-5 stronger fresh / cap 5 as the review-round ladder, but add a mechanical stall test so a stalled round escalates before the count is exhausted.

### F10. OpenHands' StuckDetector gives concrete, mechanical stall thresholds [H]
- From stuck.py (v0.20.0): repeated action-observation pairs trigger at 4 identical pairs; repeated action with error at 3 identical actions each producing an error observation; "monologue" at 3 identical agent messages with no observation between; alternating pattern over the last 6 steps (A1-O1-A2-O2-A1-O1); minimum history 3 events; in interactive mode only events after the last user message are examined; equality is normalized (`_eq_no_pid` ignores command ids/PIDs and thought text, compares command and exit_code).
- Implication: the funnel's progress test should be the same idea applied to the ledger: hash(sorted failing-test ids) + hash(normalized last verification command + exit code) + diff distance of the fix. Two consecutive identical hashes = 1 stall; an A/B/A/B alternation across 4 rounds = stall; 2 stalls escalate a rung regardless of the round count.

### F11. Self-preference, sycophancy, and learned persuasion make author-vs-reviewer argument unsafe [H/L]
- Anthropic sycophancy page [H]: "RLHF may also encourage model responses that match user beliefs over truthful responses"; "when a response matches a user's views, it is more likely to be preferred"; "both humans and preference models (PMs) prefer convincingly-written sycophantic responses over correct ones a non-negligible fraction of the time"; "sycophancy is a general behavior of RLHF models". Dataset README [M]: "are_you_sure" set shows the model "apologizes and provides a corrected answer without independent verification" when merely challenged.
- Panickssery et al. 2024 [L, blocked]: LLM evaluators favor their own generations; self-recognition capability correlates with self-preference; fine-tuning to increase self-recognition increases self-preference (from memory of the abstract).
- Wen et al. 2024 "U-Sophistry" [L, blocked]: RLHF-trained models learned to convince human evaluators they were right when wrong; human false-positive rates rose on both QA (QuALITY) and programming (APPS); in the coding task the policy learned to write programs that pass the human-written unit tests but are incorrect (numbers not re-verified here; memory says roughly +24 pp QA, +18 pp APPS).
- Implication: (1) the author agent never receives the reviewer's findings in the context where it can argue; a rebuttal, if any, is produced by a fresh "defender" that sees only code + finding + tests; (2) the reviewer must be a different session, preferably a different model family for the L2 verdict; (3) the adjudicator never accepts pasted outputs — it re-runs the evidence commands itself or via a neutral runner.

### F12. Debate beats a single advocate for a non-expert judge [M/L]
- Khan et al. repo README [M]: compares blind, consultancy, debate, interactive debate, expert-judge protocols on QuALITY; "when debaters are optimized for persuasiveness rather than accuracy, judges achieve higher correctness rates compared to consultancy and baseline approaches" (README summary).
- From memory of the abstract [L]: debate raised non-expert LLM judges to about 76% and human judges to about 88%, versus naive baselines around 48% / 60%; consultancy (one persuader) helped less and can mislead.
- Implication: only CONTESTED findings (both sides hold evidence) go to a symmetric two-agent debate with randomly assigned sides and a fresh judge; never a single-advocate "consultant" format; the judge gets the evidence bundle, not the transcripts.

### F13. Reward hacking is real in coding environments; graders must be state-based and hack-resistant [H]
- Emergent misalignment page: hack example "calling sys.exit(0) in Python to break out of a test harness with an exit code of 0, making it appear that all tests have passed successfully"; "12% of the time, the model would intentionally attempt to sabotage the code in ways that would reduce our ability to detect reward hacking".
- Demystifying evals: "Make your graders resistant to bypasses or hacks. The agent shouldn't be able to easily 'cheat' the eval"; "The outcome is the final state in the environment at the end of the trial"; "LLM-based rubrics should be frequently calibrated against expert human judgment"; "give the LLM a way out, like providing an instruction to return 'Unknown'".
- Building effective agents: "it's crucial for the agents to gain 'ground truth' from the environment at each step (such as tool call results or code execution)"; "include stopping conditions (such as a maximum number of iterations)"; "Agents can then pause for human feedback at checkpoints or when encountering blockers".
- Implication: verification evidence is produced by a neutral runner (hook/CI) that parses test-runner output for counts and exit codes, checks that test files are unchanged from the frozen spec's test set (hash), and records to `evidence/`. A transcript judge is advisory only.

### F14. Approval binds to a commit; new commits dismiss approvals; the pusher may not approve their own push [H]
- github/docs about-protected-branches: "Optionally, you can choose to dismiss stale pull request approvals when commits are pushed that affect the diff in the pull request."; "Optionally, you can require that the most recent reviewable push must be approved by someone other than the person who pushed it."; "Required status checks must have a successful, skipped, or neutral status before collaborators can make changes"; strict: "The branch must be up to date with the base branch before merging."; "Requires all comments on the pull request to be resolved before it can be merged".
- Claude Code Code Review: "The check run always completes with a neutral conclusion so it never blocks merging through branch protection rules. If you want to gate merges on Code Review findings, read the severity breakdown from the check run output in your own CI"; machine-readable `bughunter-severity: {"normal": N, "nit": N, "pre_existing": N}`.
- Implication: `approvals.json` entries are keyed by `sha`; any new `sha` on the branch sets `approvals[*].valid=false`; an approval recorded by the implementer's own session id is rejected; landing requires L2 verdict sha == human approval sha == branch head sha, and base must be up to date.

### F15. Claude Code's own reviewer pipeline: many finders, a verification step, citation bar, convergence rule [H]
- code-review.md: "Each agent looks for a different class of issue, then a verification step checks candidates against actual code behavior to filter out false positives. The results are deduplicated, ranked by severity".
- REVIEW.md guidance: "Verification bar: require evidence before a class of finding is posted. For example, 'behavior claims need a file:line citation in the source, not an inference from naming' cuts false positives"; "Re-review convergence: ... A rule like 'after the first review, suppress new nits and post Important findings only' stops a one-line fix from reaching round seven on style alone."; "Nit volume: cap how many Nit comments a single review posts".
- best-practices callout: "A reviewer prompted to find gaps will usually report some, even when the work is sound ... Tell the reviewer to flag only gaps that affect correctness or the stated requirements, and treat the rest as optional."
- `/code-review` effort: "At low and medium, the review reports only the findings it's most confident in ... high through max broaden coverage and may include findings the review is less sure about."
- Implication: finding schema requires `file:line` and a reproduction or a failing test to be `blocking`; after round 1 only Important/Critical can reopen the loop; nits are batched and never recycle.

### F16. What a non-reading approver should see, and how much to ask of them [H/M/L]
- best-practices: "Have Claude show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot of the result. Reviewing evidence is faster than re-running the verification yourself, and it works for sessions you weren't watching."; "The trust-then-verify gap ... If you can't verify it, don't ship it."; on permission prompts: "After the tenth approval you're clicking through rather than reviewing."
- Anthropic SDLC post: "We tier our codebase by risk, and make deliberate decisions on what parts to automate. Entire codebases have strict human approval processes."; "A risk-weighted sample is reviewed by humans. Another round of testing focuses on invariants like 'user A can never read user B's data,' and triggers additional manual reviews."; "reserving human review for regulated or truly critical code"; "draw the boundary around access and actions, not around a model's instructions".
- DORA 2025 (Google Cloud blog): "AI doesn't fix a team; it amplifies what's already there"; "we observe a positive relationship between AI adoption on both software delivery throughput and product performance. However, AI adoption does continue to have a negative relationship with software delivery stability."; "Without robust control systems, like strong automated testing, mature version control practices, and fast feedback loops, an increase in change volume leads to instability."
- Google eng-practices: "One business day is the maximum time it should take to respond"; "most complaints about the code review process are actually resolved by making the process faster"; "LGTM With Comments"; small CLs: "Reviewed more quickly", "Reviewed more thoroughly", "Less likely to introduce bugs", "Less wasted work if they are rejected", "Simpler to roll back"; "100 lines is usually a reasonable size", "1000 lines is usually too large".
- Human factors [L, blocked]: Danziger et al. 2011 reported favorable parole rulings falling from ~65% to near zero before breaks and recovering after; Weinshall-Margel & Shapard's PNAS letter argued the ordering was not random (unrepresented prisoners tended to be heard last), so the size of the "decision fatigue" effect is contested. Parasuraman & Manzey 2010 on automation complacency/bias could not be fetched. Treat "decision fatigue" as plausible but do not build on a specific number; build on the uncontested engineering evidence (small batches, fast turnaround, evidence packs, sampling).
- Implication: gate = one screen: acceptance checklist (pass/fail + evidence link), 1-3 screenshots or a recorded run, risk summary, cost, reviewer verdicts, open unverifiable items, and four buttons Go / Recycle(to stage) / Hold / Kill. Batch low-risk items into a digest; auto-approve tier-0 with sampling; cap human decisions per sitting.

### F17. How Claude Code surfaces (and refuses) human input [H]
- tools-reference: "Claude uses AskUserQuestion to ask you multiple-choice questions when it needs a decision or a clarification"; "Questions stay open until you answer them"; `askUserQuestionTimeout` "60s, 5m, or 10m" then "the dialog closes on its own: it submits any options you'd already selected and tells Claude you may be away from your keyboard".
- headless: `dontAsk` — "AskUserQuestion, connector tools your organization set to ask, and MCP tools marked requiresUserInteraction are denied even when an allow rule matches"; `--permission-prompts none` — "Claude Code removes the tools that need an answer from a person, such as AskUserQuestion".
- workflows: "No mid-run user input".
- agent-teams: "When a teammate finishes planning, it sends a plan approval request to the lead. Claude Code approves the plan in the lead's session as soon as the request arrives, without the lead reviewing it."; "A teammate can't approve a permission prompt or supply consent on your behalf".
- hooks: TaskCompleted "Exit code 2: the task is not marked as completed and the stderr message is fed back to the model as feedback"; when TaskUpdate triggered it, `continue:false` is ignored but exit 2 still blocks.
- github-actions: "Set --max-turns in claude_args to limit iterations"; "Set workflow-level timeouts to avoid runaway jobs".
- Implication: interactive gate = AskUserQuestion at the end of a stage workflow (never inside); unattended gate = ledger state `HUMAN_GATE` + a GitHub required check that stays red until `approvals.json` carries a valid sha; agent teams cannot implement a human gate because plan approval is automatic.

### F18. Ledger designs in the wild converge on per-item folders + an archive step + append-only learnings [H]
- Spec Kit: per-feature `spec.md`, `plan.md`, `tasks.md`, a `constitution`; `/speckit-clarify`, `/speckit-analyze`, `/speckit-checklist` "when you need extra quality gates"; bug artifacts under `.specify/bugs/{slug}/`; constitution articles "act as gates within the implementation planning process".
- OpenSpec: `openspec/changes/<name>/{proposal.md, design.md, tasks.md, specs/}`; lifecycle Propose -> Apply -> Archive; archive moves the change and merges its spec deltas into the living `specs/`.
- GSD Core: `.planning/` with `STATE.md` and `CONTEXT.md` as "structured artifacts that survive session boundaries"; "heavy work runs in fresh subagents" each with "a clean 200k-token context"; loop Discuss -> Plan -> Execute -> Verify -> Ship; solves "context rot".
- Ralph: `prd.json` stories with `passes:false`; "Each iteration is a fresh instance with clean context"; persistence via git history, append-only `progress.txt`, and `prd.json`; learnings written to `AGENTS.md`; `./scripts/ralph/ralph.sh [max_iterations]` default 10; completion when all `passes:true` -> `<promise>COMPLETE</promise>`.
- Anthropic harness: `feature_list.json` + `claude-progress.txt` + git log (F7).
- Claude Code task list: `~/.claude/tasks/{team-name}/`, per-session, swept after `cleanupPeriodDays` -> not a durable ledger.
- BMAD [L]: could not re-verify story-file/repair-limit details; README only shows the Clarify -> Plan -> Build and verify -> Learn and adjust loop.
- Implication: `.workflow/<task-id>/` in-repo with `state.json` as the single machine-readable truth, human-readable markdown alongside, `constraints.md` append-only, `archive/` on DONE with spec deltas merged into living docs.

### F19. Substrate numbers worth pinning [H]
- Workflow: 16 concurrent agents default (`CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` 1-256, v2.1.269+); 1,000 agents/run; 4,096 items per `parallel()`/`pipeline()`; 5 schema attempts; large-workflow warning at 25 agents or 1.5M projected tokens.
- Subagents: 20 concurrent; 3 spawn layers (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`); `maxTurns` partial marking v2.1.246+; `omitClaudeMd` v2.1.271+.
- Stop hook cap 8 (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`, 0 disables); auto-mode fallback 3 consecutive / 20 total classifier blocks; `/goal` check-in 30 min then doubling, max 3 idle check-ins; `/goal` retries 3 then pause.
- `claude -p`: exit 0/non-zero; SIGTERM -> 143; background wait ceiling 10 min (`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`); stdin cap 10MB; `--bare` recommended for CI.
- Checkpoints: 100; snapshots 30 days; worktree sweep after `cleanupPeriodDays` (30 days default) only when no work is left inside.

---

## Anti-patterns (what is known NOT to work, with why)

1. **Counting iterations instead of stalls.** Five inconsistent caps exist (2 corrections, 3 strikes, 5 rounds, 8 Stop-hook blocks, 10 Ralph iterations) because each counts a different thing. A pure count both wastes budget on obviously-stuck loops and kills healthy loops that are converging. OpenHands detects identical action/observation repeats (3-4) and A/B alternation, not raw counts.
2. **Sending the failing diff back with the recycle.** Laban et al.: models over-rely on early attempts and "do not recover" after a wrong turn; best-practices: context "polluted with failed approaches" is the thing `/clear` removes. Committed, test-passing checkpoints in git are fine; the WIP diff is not.
3. **Letting the author answer the reviewer in its own context.** Sycophancy ("are you sure" capitulation) and self-preference make the outcome depend on persuasion, not truth; U-Sophistry shows RLHF models get better at convincing evaluators when wrong.
4. **Using a transcript judge (`/goal`, prompt Stop hook, Haiku grader) as the gate.** It "does not call tools" and only sees "what Claude has already surfaced"; `sys.exit(0)`-style hacks make transcripts lie.
5. **Relying on Claude Code checkpoints or `~/.claude/tasks` as the ledger.** Bash and subagent edits are not tracked; both are swept after ~30 days; a fresh session cannot replay a workflow ("nothing to resume").
6. **Putting the human gate inside a workflow or an agent team.** Workflows have "No mid-run user input"; agent teams auto-approve teammate plans; `dontAsk`/`--permission-prompts none` deny/remove AskUserQuestion.
7. **Reviewing from a default `isolation: worktree` subagent.** It branches from the default branch, not the item branch, so it reviews the wrong tree unless `worktree.baseRef: "head"` or the sha is handed over.
8. **Guarding irreversible actions with hooks or prompts only.** Only `permissions.deny` rules are documented to hold in `bypassPermissions`; hook-allow cannot override deny; whether hook-deny holds under bypass is undocumented.
9. **Unbounded nit loops.** Claude Code's own REVIEW.md guidance exists because a one-line fix can reach "round seven on style alone"; nits must never recycle.
10. **Approving once and letting commits pile up.** GitHub dismisses stale approvals for a reason; an approval without a sha binding approves nothing.
11. **Big slices.** Google: ~100 lines is reasonable, ~1000 too large; DORA 2025: more change volume without controls -> instability. Large items also make the human gate unreadable.
12. **Many human decisions per sitting.** Claude Code docs: "After the tenth approval you're clicking through rather than reviewing." The decision-fatigue literature is contested in magnitude but the engineering effect (rubber-stamping) is observed directly.
13. **Fan-out before the fragile step in a workflow.** A failed agent reruns every agent started after it, so an early fan-out followed by a flaky agent re-bills the whole fan-out on relaunch.
14. **Trusting `tools: Read, Grep, Bash` as read-only.** Bash can write files (`cat > f`, `sed -i`, `git`); read-only reviewers need `disallowedTools: Bash` or a PreToolUse hook that rejects writes/`git` mutations, plus worktree isolation.

---

## Open questions

1. Does the Stop-hook 8-cap count every consecutive block or only blocks "without progress" (hooks-guide wording)? If "progress" is defined internally (e.g., tool use between blocks), the cap interacts with the ledger counter differently. Needs a test (V1).
2. Does an exit-2 PreToolUse hook still fire and block under `--dangerously-skip-permissions`? Documented for deny rules, not for hooks (V4).
3. For a `-p` run with `--json-schema`, is the 5-attempt retry applied per turn or per run, and does a failed schema attempt burn turns against `--max-turns`? (V9)
4. Can the `/goal` Haiku evaluator be fooled by a printed "All tests passed" line without tool use? Docs strongly imply yes; needs a controlled test (V10).
5. What exactly is in a SubagentStop hook's `agent_transcript_path` transcript when the subagent ran with `omitClaudeMd` — enough for a hook to verify the reviewer never saw the implementer's notes? (V7)
6. Should `.workflow/` be committed to `main` at landing, or kept only on item branches with an `archive/` squash? OpenSpec archives into the repo; Anthropic's harness keeps `claude-progress.txt` in the repo; GitHub Code Review reads `REVIEW.md` from the repo. No source addresses ledger noise on `main`; recommendation below is a compromise.
7. Optimal sampling rate for tier-0 auto-landed items: Anthropic says "risk-weighted sample" without a number; Meta/Google sources on risk scoring were blocked.
8. Is a different model family for the L2 verdict actually necessary, or is a fresh session of the same model with `omitClaudeMd` enough to break self-preference? Panickssery's result is about the same model recognizing its own text; a fresh session still shares the generator. Unresolved without the paper; default to a different family when available.
9. Cooper's original gate literature (must-meet vs should-meet criteria, gatekeepers) was unreachable; the mapping Go/Recycle/Hold/Kill below follows the prior sweep's summary.
10. BMAD's "5 repair iterations / one ticket per autonomous run" could not be re-verified; treat as unconfirmed.

---

## Design implications for the funnel

### A. Text state diagram (one work item)

```
                       ┌────────────────────────────────────────────────────────────────┐
                       │  Recycle edges (Cooper "Recycle") always land on a NAMED stage  │
                       └────────────────────────────────────────────────────────────────┘

 INTAKE ──Go──> TRIAGE ──Go──> DECOMPOSE ──Go──> HYPOTHESIZE ──Go──> SPEC_FROZEN ──Go──> IMPLEMENT
   │               │               │                 │                    │    ▲              │
   │               │               │                 │                    │    │              ▼
   │               │               │                 │                    │    │          SELF_CHECK (implementer runs verifier; evidence written)
   │               │               │                 │                    │    │              │
   │               │               │                 │                    │    │              ▼
   │               │               │                 │                    │    │          REVIEW_L1 (independent; sees diff+spec+evidence, not transcript)
   │               │               │                 │                    │    │            │      │
   │               │               │                 │                    │    │   Go       │      │ Recycle(FIX) rounds 1-3 same implementer
   │               │               │                 │                    │    │            │      │ Recycle(IMPLEMENT-fresh, stronger) rounds 4-5
   │               │               │                 │                    │    │            │      │ Recycle(SPEC_FROZEN) if criteria defective
   │               │               │                 │                    │    │            │      │ Recycle(DECOMPOSE) if slice boundary wrong
   │               │               │                 │                    │    │            ▼      ▼
   │               │               │                 │                    │    │        [ADJUDICATE] (only for contested/refuted findings)
   │               │               │                 │                    │    │            │
   │               │               │                 │                    │    │            ▼
   │               │               │                 │                    │    │        REVIEW_L2 (context-free verdict; sees frozen spec + sha + neutral evidence ONLY)
   │               │               │                 │                    │    │            │  Go / Recycle(IMPLEMENT-fresh) / Recycle(SPEC_FROZEN)
   │               │               │                 │                    │    │            ▼
   │               │               │                 │                    │    │        HUMAN_GATE (tiered; evidence pack; Go/Recycle/Hold/Kill)
   │               │               │                 │                    │    │            │
   │               │               │                 │                    │    │            ▼
   │               │               │                 │                    │    │          LAND (merge at bound sha; required checks green) ──> DONE ──> ARCHIVE
   │               │               │                 │                    │    │
   └───────────────┴───────────────┴─────────────────┴────────────────────┴────┴──────────> HOLD (parked, reason + wake condition)
                                                                                           KILLED (reason + salvage list)
```

Every stage has the four Cooper outcomes: Go (advance), Recycle (return to a named earlier stage with a payload), Hold (park with a wake condition), Kill (terminate with reason). Only HUMAN_GATE and the escalation ladder's last rung may Kill; agents may only propose Kill.

### B. Transition table

| From | Outcome | To | Payload that travels | What is reset | Counter |
|---|---|---|---|---|---|
| INTAKE | Go | TRIAGE | `intake.md` verbatim request + clarifications (AskUserQuestion answers) | — | — |
| TRIAGE | Go | DECOMPOSE | `triage.json` (zone, risk tier 0-2, size class, reversibility) | — | — |
| TRIAGE | Hold | HOLD | reason, wake condition | — | `holds` |
| DECOMPOSE | Go | HYPOTHESIZE | `plan.md` slices (each ≤ ~100-300 changed lines target), dependency order | — | — |
| HYPOTHESIZE | Go | SPEC_FROZEN | `hypotheses.json` (assumption, cheap check, result, evidence ref); refuted assumptions become constraints | — | — |
| HYPOTHESIZE | Recycle | DECOMPOSE | refuted assumption that invalidates the slicing | plan.md rewritten | `recycles.decompose` |
| SPEC_FROZEN | Go | IMPLEMENT | `spec.vN.md` + `acceptance.json` (criteria immutable; `passes:false`) + `constraints.md` + hash `spec_hash` | new worktree from `main` (or `head` policy), fresh implementer context | `attempts.implement` +1 |
| IMPLEMENT | Go | SELF_CHECK | commits on `wf/<id>`; checkpoint tag `wf/<id>/cp-N` | — | — |
| SELF_CHECK | Go | REVIEW_L1 | `evidence/<sha>/` (neutral runner: test counts, exit codes, test-file hash, screenshots) | — | — |
| SELF_CHECK | Recycle | IMPLEMENT (same context) | failing-test set | — | `loops.self` ; stall test applies |
| REVIEW_L1 | Go | REVIEW_L2 | `review-N.json` with all findings closed/waived | — | — |
| REVIEW_L1 | Recycle | FIX (same implementer resumed) | findings verbatim (Critical/Important only), evidence refs | none (context intact) | `rounds.review` 1-3 |
| REVIEW_L1 | Recycle | IMPLEMENT (fresh, stronger model) | `spec.vN.md`, `constraints.md` (+ learned), CONFIRMED findings as failing tests, "prior attempts failed" framing; NO prior WIP diff; git history of passing checkpoints allowed | worktree reset to last passing checkpoint tag; fresh context | `rounds.review` 4-5, `attempts.implement` +1 |
| REVIEW_L1 | Recycle | SPEC_FROZEN | finding of kind `spec_defect` (criteria ambiguous/contradictory/unverifiable) | spec version +1; acceptance re-frozen; all approvals invalid | `recycles.spec` |
| REVIEW_L1 | Recycle | DECOMPOSE | finding of kind `architecture` (superpowers 3-strikes rule) | plan rewritten; child items may be spawned | `recycles.decompose` |
| FIX | Go | REVIEW_L1 (scoped) | fix diff only + the finding ids it claims to close | — | — |
| ADJUDICATE | resolves | REVIEW_L1 or REVIEW_L2 | per-finding status: CONFIRMED / REFUTED / UNVERIFIABLE (+ evidence re-executed by adjudicator) | — | `adjudications` |
| REVIEW_L2 | Go | HUMAN_GATE | `verdict.json` {sha, verdict, acceptance results, observed failures} | — | — |
| REVIEW_L2 | Recycle | ADJUDICATE → IMPLEMENT-fresh or SPEC_FROZEN | observed failures only (no L1 findings, no process notes) | as per target | `l2_rejects` |
| HUMAN_GATE | Go | LAND | `approvals.json` {sha, approver, shown_evidence_hash, tier} | — | `human_touches` |
| HUMAN_GATE | Recycle(stage) | named stage | human's reason appended to `constraints.md` / `intake.md` | as per target | `human_touches` |
| HUMAN_GATE | Hold / Kill | HOLD / KILLED | reason | — | — |
| LAND | Go | DONE | merge commit sha; ledger `archive/` | worktree removed | — |
| any | new commit on branch | same state | — | all approvals/verdicts with sha ≠ head → `valid:false` | — |

Ping-pong guard: L2 never reads `review-N.json`; L1 never reads `verdict.json`. If L1 says Go and L2 says Recycle twice on the same acceptance criterion, the item goes to ADJUDICATE with the criterion itself under test (spec defect suspected) rather than bouncing again; the third disagreement goes to HUMAN_GATE with both verdicts.

### C. Ledger schema (`.workflow/<task-id>/`)

```
.workflow/
  board.json                      # WIP limits + list of item ids by state (repo-level, committed)
  <task-id>/
    state.json                    # THE machine-readable truth (below)
    intake.md                     # verbatim request, clarifications, links
    triage.json                   # {zone, risk_tier: 0|1|2, size, reversible: bool, external_contracts: [...]}
    plan.md                       # slices, order, dependencies, children ids
    hypotheses.json               # [{id, assumption, check_cmd, result: confirmed|refuted|unknown, evidence}]
    spec.v1.md, spec.v2.md ...    # frozen spec versions; never edited in place
    acceptance.json               # [{id, text, check: {cmd|manual|screenshot}, passes: false, evidence: null}]
    constraints.md                # append-only learned constraints (from refuted hypotheses, confirmed findings, human notes)
    progress.md                   # append-only log (Anthropic claude-progress.txt / Ralph progress.txt pattern)
    evidence/<sha>/               # neutral-runner outputs: tests.json {passed, failed, ids, exit_code, test_files_hash}, build.log, screenshots/, recordings/
    review-1.json ...             # L1 rounds: {round, sha, reviewer: {session_id, model}, input_manifest_hash, findings: [...]}
    adjudication-<finding-id>.json# {finding_id, positions, re_executed_evidence, ruling, judge: {model}}
    verdict.json                  # L2: {sha, reviewer: {model, omitClaudeMd: true}, acceptance_results, observed_failures, verdict}
    approvals.json                # [{sha, approver, when, tier, shown: {evidence_hash}, valid: bool}]
    cost.json                     # tokens/$ per stage, wall time
  archive/<task-id>/              # on DONE: squashed copy; spec deltas merged into living docs/ (OpenSpec pattern)
```

`state.json` (minimum):
```json
{
  "id": "2026-09-26-auth-refresh",
  "state": "REVIEW_L1",
  "spec_hash": "sha256:...",
  "branch": "wf/2026-09-26-auth-refresh",
  "head_sha": "abc123",
  "last_passing_checkpoint": "wf/.../cp-3",
  "counters": {"attempts_implement": 1, "rounds_review": 2, "stalls": 0, "recycles_spec": 0, "recycles_decompose": 0, "adjudications": 0, "human_touches": 0},
  "progress_hash": {"failing_tests": "sha256:...", "last_verify_cmd": "sha256:...", "diff_distance": 412},
  "ladder_rung": 1,
  "wip_token": "board:IMPLEMENT:2",
  "approvals_valid_for_sha": null,
  "updated_at": "<passed in via args, never Date.now() inside a workflow>"
}
```

Finding schema (`review-N.json.findings[]`):
```json
{"id": "L1-2-004", "severity": "critical|important|minor", "kind": "correctness|spec_defect|architecture|style",
 "file": "src/auth/session.ts", "line": 142, "claim": "...", "repro": {"cmd": "...", "expected": "...", "observed": "..."},
 "status": "open|confirmed|refuted|contested|unverifiable|fixed|waived", "raised_count": 1, "closed_by_sha": null}
```
Rules: a finding without `file:line` AND (`repro` or a failing test) cannot be `critical/important` (Claude Code REVIEW.md "verification bar"); `minor` never recycles; a finding may be re-raised once; second refutation makes it `waived` for that tier.

Git interaction: one branch per item (`wf/<id>`); ledger committed on the branch with each checkpoint (`chore(wf): cp-N`); checkpoint tags for reset targets; worktree per implementer (`isolation: worktree` with `worktree.baseRef: "head"` when the reviewer/fixer must see the item branch, or explicit sha handoff); stacked slices = child items whose base is the parent branch, landed in order; at LAND squash-merge code, then either (a) commit `.workflow/archive/<id>/` to `main` in the same PR (auditable; OpenSpec-style), or (b) keep `.workflow/` out of `main` via `.gitattributes`/separate `wf-ledger` branch if the team dislikes noise — pick (a) by default for solo devs because it survives everything.

What the outside (L2) reviewer may read: `spec.vN.md` (frozen), `acceptance.json`, the tree at `head_sha`, `evidence/<head_sha>/` produced by the neutral runner. It may NOT read `review-*.json`, `hypotheses.json`, `progress.md`, `adjudication-*.json`, or any transcript. Enforce with the delegation prompt + `omitClaudeMd: true` + a PreToolUse hook that denies `Read` on those paths for `agent_type == l2-verdict`.

Concurrency/WIP: `board.json` caps (defaults for a solo dev: IMPLEMENT ≤ 2, REVIEW ≤ 3, HUMAN_GATE queue ≤ 5 unread); an item cannot enter a capped state without a `wip_token`; hooks on `TaskCreated` can refuse new items when the cap is hit.

Garbage collection: on DONE move to `archive/` and delete `evidence/` blobs larger than a threshold (keep `tests.json`, keep one screenshot per criterion); killed items keep `intake.md`, `state.json`, reason; HOLD items older than N days surface in the human digest; Claude Code's own worktree sweep handles worktrees after `cleanupPeriodDays` only if clean, so the LAND step must `git worktree remove` explicitly.

### D. Escalation ladder (with rationale)

| Rung | Who fixes | Input | Bound | Why this bound |
|---|---|---|---|---|
| 0 | implementer self-loop (SELF_CHECK ↔ IMPLEMENT) | failing tests | stall test only: 2 identical `progress_hash` in a row, or A/B/A/B alternation over 4 checks → escalate; hard backstop `maxTurns` | OpenHands triggers on 3-4 identical repeats / 6-step alternation; Anthropic best-practices "two failed corrections" |
| 1 | same implementer, resumed (context intact) | L1 findings verbatim (Critical/Important) | rounds 1-3, each ending in a scoped re-review; any stall counts as a used round + 1 | superpowers rounds 1-3; Claude Code "corrected more than twice → /clear" |
| 2 | fresh implementer, stronger model | spec.vN + constraints + confirmed findings as failing tests + "prior attempts failed"; no WIP diff | rounds 4-5 | superpowers rounds 4-5; Laban (fresh context recovers, continued context does not) |
| 3 | re-decompose / re-spec | architectural or spec-defect findings; new constraints | 1 recycle per item to DECOMPOSE; 2 to SPEC_FROZEN | superpowers "≥3 failed fixes → question the architecture"; Spec Kit `/analyze` consistency gate |
| 4 | human (or kill) | full ledger + both verdicts + cost | cap: 5 review rounds total, 2 implement attempts, or budget cap (tokens/$) | superpowers hard cap 5 then human adjudicates; Building effective agents "stopping conditions"; Stop-hook 8-cap and auto-mode 3/20 are substrate backstops only |

Mechanical progress test (`progress_hash`): after every verification run, compute (1) sha256 of the sorted failing-test id list; (2) sha256 of the normalized last verify command + exit code (strip PIDs/timestamps, as OpenHands `_eq_no_pid` does); (3) diff distance (changed lines) between this round's fix and the previous round's fix. Stall = (1) and (2) unchanged, or (3) < 5 lines with (1) unchanged, or alternation pattern in (1) over 4 rounds. Stalls, not iterations, consume rungs.

Ping-pong prevention: (a) tiers are blind to each other (see B); (b) a finding key = normalized (file, function, claim-stem); a key refuted by ADJUDICATE cannot be re-raised by the same tier; (c) L2 rejects state acceptance-criterion failures, never opinions; (d) after 2 L1-Go/L2-Reject disagreements on the same criterion, the criterion itself is adjudicated as a possible spec defect; (e) third disagreement → HUMAN_GATE.

### E. Adjudication protocol

1. **Trigger**: a finding is `contested` (author-side evidence exists), `refuted` by a defender, or `unverifiable` (no repro possible).
2. **Roles**: author (never speaks); **defender** = fresh agent given only code@sha + the finding + tests, asked to produce a reproduction attempt and a rebuttal with commands; **reviewer** keeps its finding with repro; **adjudicator** = fresh agent, different model family where available, `omitClaudeMd`, no transcripts; receives both evidence bundles and MUST re-execute every cited command in a clean worktree before ruling (counters U-Sophistry/reward hacking: pasted output is not evidence).
3. **Rulings**: CONFIRMED (repro reproduces) → blocking; REFUTED (repro fails and defender's counter-repro passes) → closed, key blacklisted for re-raise; UNVERIFIABLE (neither side can produce a deterministic check) → non-blocking, listed on the human evidence pack as "unverified risk"; CONTESTED (both reproduce something) → symmetric debate: two fresh agents, sides assigned randomly, 2 rounds, judge is a third fresh agent with the "Unknown" option (Anthropic evals guidance); Unknown → human.
4. **No author argument**: the implementer's session receives only the final ruling + repro; it never sees the reviewer's prose. This removes the sycophancy/capitulation channel in both directions.
5. **Binding**: every ruling records `sha`; a new commit reopens only findings whose `file` changed (scoped), and invalidates all approvals.
6. **Re-review visibility**: L1 scoped re-review sees prior findings (to close them) and only the fix diff; L2 sees no findings at all, only the artifact at head sha; a full L1 re-review is forced when the fix diff touches files outside the findings' files or after 3 fixes.

### F. Human-gate specification (approver does not read code)

Which transitions require a human:
- SPEC_FROZEN → IMPLEMENT for tier ≥ 1: approve the acceptance criteria in plain language (highest-leverage gate; cheap; prevents "solved the wrong problem").
- Any irreversible or external action at any stage (schema migrations, deletes, force pushes, payments, external API contract changes, public releases): hard gate via `permissions.deny` + explicit human Go recorded in `approvals.json` with the sha.
- HUMAN_GATE before LAND: tier 2 always; tier 1 always but batched; tier 0 auto-Go with a risk-weighted sample (start 10-20%) reviewed post-hoc (Anthropic SDLC "risk-weighted sample").
- Escalation rung 4, Kill, budget overrun, and any UNVERIFIABLE finding on tier ≥ 1.

What the human sees (one screen, generated from the ledger, no diff):
1. Acceptance checklist: each criterion, pass/fail from the neutral runner, link to evidence (test counts, exit code), screenshot or recorded run for UI criteria.
2. Risk summary: zone, tier, files/dirs touched, reversibility, external contracts touched, invariants checked.
3. Verdicts: L1 summary (open/closed counts), L2 verdict sentence, unverifiable items.
4. Cost so far and remaining budget; rounds used; stalls.
5. "What could go wrong" (3 bullets, written by L2, not the author).
6. Four buttons: Go / Recycle → {stage} / Hold / Kill, with a one-line reason field that is appended to `constraints.md`.

Batching and deferral: approvals are asynchronous by default; a digest groups tier-0/1 items; hard SLA of one business day (Google) after which tier-0 items auto-land under sampling and tier-1 items ping again; decisions per sitting capped (e.g., 7) and ordered by risk then age, because the observed failure mode is rubber-stamping ("After the tenth approval you're clicking through"). Decision-fatigue magnitudes are contested (Danziger vs Weinshall-Margel), so do not cite a number; cite the cap as a design choice.

Claude Code surfaces:
- Interactive: the stage workflow ends; the main session calls `AskUserQuestion` with the evidence pack summary (set `askUserQuestionTimeout` so an absent human defers instead of blocking); answer writes `approvals.json` and starts the next stage workflow.
- Unattended: `HUMAN_GATE` is a GitHub required status check (Claude Code's Code Review check is neutral and cannot block, so write your own check that reads `approvals.json`); branch protection with "dismiss stale approvals" and "most recent reviewable push approved by someone other than the pusher" (the agent's app identity is the pusher).
- `claude -p --json-schema` in CI generates the evidence pack JSON; `--max-turns` and `--permission-prompts none` for the runner; `/goal` only with a turn cap in the condition and never as the verifier.
- `TaskCompleted` hook exit 2 blocks an agent from marking a ledger task done unless `evidence/<sha>/tests.json` exists and `test_files_hash == spec test hash`.

### G. Substrate verification checklist (run on the installed Claude Code version before relying on it)

| # | Behavior | Test | Expected per docs | If it fails |
|---|---|---|---|---|
| V1 | Stop hook blocks and caps at 8 | Stop hook that always exits 2; count continuations in transcript | turn ends after 8 with a warning; `stop_hook_active:true` from the 2nd | lower reliance; use ledger counter |
| V2 | "without progress" semantics | Stop hook exits 2 but the turn does a tool call each time | does the cap still trip at 8? (undocumented) | treat cap as absolute |
| V3 | SubagentStop cap and fields | subagent with SubagentStop hook exit 2 | same 8-cap (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` doc mentions SubagentStop); `agent_transcript_path`, `last_assistant_message` present | gate at parent instead |
| V4 | PreToolUse exit-2 deny under `--dangerously-skip-permissions` | hook denying `Bash(git push*)`; run in bypass mode | undocumented; deny RULES documented to hold | move guard to `permissions.deny` |
| V5 | `permissions.deny` holds in bypass | deny `Bash(rm -rf*)`, run bypass | blocked ("Deny rules block in every mode") | escalate to Anthropic; do not run bypass |
| V6 | `tools: Read, Grep, Bash` reviewer can still write | ask it to `echo x > f` | writes succeed (Bash) | add `disallowedTools`, PreToolUse write guard, worktree |
| V7 | `omitClaudeMd` isolation | canary rule in CLAUDE.md; ask subagent to state it | subagent does not know it (v2.1.271+) | pass everything in the prompt; check version |
| V8 | `isolation: worktree` base branch | uncommitted change + commit on feature branch; subagent lists files | sees default branch only unless `worktree.baseRef:"head"` | set baseRef or hand sha |
| V9 | schema retries | `agent()` with schema requiring an impossible value | fails after 5 attempts with last validation error; contradictory schema fails before start | set `MAX_STRUCTURED_OUTPUT_RETRIES` |
| V10 | Haiku transcript judge fooled | `/goal tests pass`; have a script print "All 42 tests passed" without running tests | likely accepted (evaluator "does not call tools") | never use `/goal` as verifier |
| V11 | workflow resume after `--resume` | stop a run mid fan-out; `claude --resume`; ask to relaunch | completed agents replay from cache; failed ones and later ones rerun; fresh session → "nothing to resume" | make agents ledger-idempotent |
| V12 | `Date.now()` in workflow throws | include it | throws | pass timestamp via `args` |
| V13 | checkpoints vs Bash/subagent edits | edit via `sed -i` and via subagent; `/rewind` | not restored | reset with git |
| V14 | `-p` worktrees not cleaned | `claude -p --worktree x`; check `.claude/worktrees` | left in place, locked until sweep | LAND step removes |
| V15 | AskUserQuestion in `-p` / dontAsk / prompts none | try each | works only where a person can answer; denied/removed otherwise | interactive gate outside workflows |
| V16 | `TaskCompleted` exit 2 blocks TaskUpdate | hook exits 2 unless evidence exists | task stays open; stderr fed back | fall back to Stop hook |
| V17 | agent teams auto-approve plans | spawn teammate in plan mode | auto-approved without review | do not use teams for gated stages |
| V18 | `maxTurns` partial + resume | subagent maxTurns 3 | output marked partial (v2.1.246+); `SendMessage` resumes | pin version |
| V19 | concurrency caps | spawn 21 subagents / 17 workflow agents | "Concurrent subagent limit reached" / queueing | size fan-outs |
| V20 | auto-mode block thresholds in `-p` | force 3 consecutive classifier denials | action skipped, run continues | pre-allow tools |
| V21 | Code Review check conclusion | open PR with a planted bug | check run neutral, never blocks; `bughunter-severity` parseable | write own required check |
| V22 | hook `cwd` inside worktree | Stop hook echoes `cwd` and `${CLAUDE_PROJECT_DIR}` | `cwd` = worktree, project dir = main checkout | use `cwd` in hooks |

### H. Blocked-source register
- arXiv (2404.13076, 2505.06120, 2402.06782, 2409.12822, 2310.13548), huggingface.co/papers, api.semanticscholar.org, openreview.net, proceedings.mlr.press, gwern.net — blocked; abstracts of 2505.06120 and 2310.13548 obtained from microsoft.com and anthropic.com respectively.
- pnas.org (Danziger 2011; Weinshall-Margel & Shapard 2011) — blocked.
- journals.sagepub.com (Parasuraman & Manzey 2010) — not attempted after pattern of blocks; treat as [L].
- docs.github.com — blocked; equivalent content read from github/docs source repo (raw).
- google.github.io, research.google, sback.it — blocked; eng-practices read from google/eng-practices raw; Sadowski 2018 unread.
- engineering.fb.com (Meta code-review time / Nudgebot), metr.org (reward hacking), research.trychroma.com (context rot), docs.temporal.io, openai.com (debate), stage-gate.com, bobcooper.ca, en.wikipedia.org, dora.dev (read via cloud.google.com instead), web.archive.org — blocked.
- BMAD docs (docs/user-guide.md 404 on main; MCP file listing denied) — unverified.
