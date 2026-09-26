# Quality systems from manufacturing / aviation / medicine mapped onto the "milk separator" AI-coding funnel

Researcher notes. Date: 2026-09-26. Dimension: process-quality systems (TPS, Stage-Gate, TOC, checklists/CRM,
Swiss-cheese, separation of duties, trust-but-verify) and how each principle reduces error WITHOUT reducing throughput,
mapped onto a Claude Code pipeline (subagents, hooks, workflows, skills, CLAUDE.md).

## Research conditions (read this first)

* The session's shared WebSearch budget was exhausted after 3 searches (TPS, Stage-Gate, TOC). Search snippets for those
  three are quoted below and marked `[SEARCH-SNIPPET]`.
* The cloud environment's egress allowlist blocked almost every non-Anthropic / non-GitHub host: toyota, bmj, pmc/ncbi,
  nejm, hbr, deming.org, kanbanguides.org, kanban.university, csrc.nist.gov, csf.tools, faa.gov, ntrs.nasa.gov, nasa.gov,
  who.int, ecfr.gov, pnas.org, eurocontrol.int, lean.org, asq.org, skybrary.aero, psnet.ahrq.gov, jointcommission.org,
  dora.dev, docs.cloud.google.com, aws.amazon.com, docs.aws.amazon.com, martinfowler.com, learn.microsoft.com,
  standards.doe.gov, stage-gate.com, bobcooper.ca, tocinstitute.org, leanproduction.com, wikipedia, arxiv, sre.google,
  google.github.io, docs.github.com, web.mit.edu, newyorker.com, mfagan.com.
* What WAS reachable: code.claude.com docs, anthropic.com engineering posts, claude.com blog, raw.githubusercontent.com and
  github.com (so Google's eng-practices repo, GitHub's own docs repo, Microsoft's engineering playbook, OWASP cheat sheets,
  and public mirrors of NIST control text were readable).
* Consequence: the AI-pipeline side of the mapping is backed by fetched primary docs (marked `[FETCHED]`). The classic
  quality-system sources are backed either by search snippets or by prior knowledge and are marked
  `[NOT FETCHED - from prior knowledge; verify]` with lowered confidence. I have not invented any URL; every URL below is
  the canonical location of the named document, but the ones marked NOT FETCHED were not opened in this session.

---

## Sources read

### Fetched in full or in relevant part `[FETCHED]`

1. Anthropic, "Building effective agents" - https://www.anthropic.com/research/building-effective-agents
   - Workflow patterns: prompt chaining ("each LLM call processes the output of the previous one"), routing ("classifies an
     input and directs it to a specialized followup task ... separation of concerns"), parallelization (sectioning /
     voting: "Running the same task multiple times to get diverse outputs"), orchestrator-workers ("A central LLM
     dynamically breaks down tasks, delegates them to worker LLMs, and synthesizes their results"), evaluator-optimizer
     ("One LLM call generates a response while another provides evaluation and feedback in a loop ... particularly
     effective when we have clear evaluation criteria").
   - "You should consider adding complexity only when it demonstrably improves outcomes."
2. Claude Code docs, "Hooks reference" - https://code.claude.com/docs/en/hooks
   - Events include PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, Stop, StopFailure, SubagentStart,
     SubagentStop, TaskCreated, TaskCompleted, TeammateIdle, PreCompact, PostCompact, UserPromptSubmit, SessionStart.
   - "Exit 2 means a blocking error. On events that can block, exit 2 blocks whether or not you print JSON: even a JSON
     permissionDecision of "allow" can't override it."
   - "Hooks are user-defined shell commands, HTTP endpoints, MCP tool calls, LLM prompts, or subagents that execute
     automatically at specific points in Claude Code's lifecycle."
3. Claude Code docs, "Hooks guide" - https://code.claude.com/docs/en/hooks-guide
   - "Claude Code runs them at specific points in its lifecycle, which gives you deterministic control: certain actions
     always happen rather than relying on the LLM to choose to run them."
   - "For decisions that require judgment rather than deterministic rules, you can also use prompt-based hooks or
     agent-based hooks that use a Claude model to evaluate conditions."
   - Agent hooks: "spawn a subagent that can read files, search code, and use other tools to verify conditions before
     returning a decision" ... example Stop hook: "Verify that all unit tests pass. Run the test suite and check the
     results."
   - Block cap: "Claude Code overrides a Stop hook after it blocks eight times in a row without progress."
4. Claude Code docs, "Extend Claude Code" (features overview) - https://code.claude.com/docs/en/features-overview
   - Hook: "Always fires on its event; the trigger is guaranteed". Skill: "Claude interprets the instructions; outcome can
     vary."
   - "Put guardrails in hooks. An instruction like "never edit .env" in CLAUDE.md or a skill is a request, not a
     guarantee. A PreToolUse hook that blocks the edit is enforcement. If a rule must hold every time, make it a hook
     rather than a prompt instruction."
   - "A repeated mistake or a recurring review comment is a CLAUDE.md edit, not a one-off correction in chat."
   - "Keep CLAUDE.md under 200 lines." Rules with `paths` frontmatter "only load when Claude works with matching files".
   - Dynamic workflow: "Audit a whole codebase, with a second set of agents verifying each finding."
5. Claude Code docs, "Subagents" - https://code.claude.com/docs/en/sub-agents
   - "Each subagent runs in its own context window with a custom system prompt, specific tool access, and independent
     permissions." Frontmatter: name, description, tools, model. Built-ins Explore and Plan are read-only ("Write and
     Edit are denied"). Example code-reviewer with `tools: Read, Glob, Grep`.
6. Claude Code docs, "Best practices" - https://code.claude.com/docs/en/best-practices
   - "Claude stops when the work looks done. Without a check it can run, "looks done" is the only signal available, and
     you become the verification loop."
   - Gating options: prompt; `/goal` ("A separate evaluator re-checks it after every turn"); "As a deterministic gate: a
     Stop hook runs your check as a script and blocks the turn from ending until it passes"; "By a second opinion: a
     verification subagent or a dynamic workflow that checks its own findings has a fresh model try to refute the result,
     so the agent doing the work isn't the one grading it."
   - "Have Claude show evidence rather than asserting success."
   - Explore -> Plan -> Implement -> Commit. "Letting Claude jump straight to coding can produce code that solves the wrong
     problem." BUT: "Plan mode is useful, but also adds overhead ... If you could describe the diff in one sentence, skip
     the plan."
   - "A fresh context improves code review since Claude won't be biased toward code it just wrote." Writer/Reviewer
     session pattern.
   - "A reviewer running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning
     that produced the change, so it evaluates the result on its own terms."
   - Callout: "A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is
     what it was asked to do. Chasing every finding leads to over-engineering ... Tell the reviewer to flag only gaps that
     affect correctness or the stated requirements, and treat the rest as optional."
   - "If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed
     approaches. Run /clear and start fresh with a more specific prompt ... A clean session with a better prompt almost
     always outperforms a long session with accumulated corrections."
   - Failure patterns: kitchen-sink session; correcting over and over; over-specified CLAUDE.md; "The trust-then-verify
     gap ... If you can't verify it, don't ship it."; infinite exploration.
   - Spec-first: "Once the spec is complete, start a fresh session to execute it ... The most useful specs are
     self-contained: they name the files and interfaces involved, state what is out of scope, and end with an end-to-end
     verification step".
7. Claude Code docs, "Code Review" - https://code.claude.com/docs/en/code-review
   - "multiple agents analyze the diff and surrounding code in parallel ... Each agent looks for a different class of
     issue, then a verification step checks candidates against actual code behavior to filter out false positives. The
     results are deduplicated, ranked by severity".
   - Severity: Important / Nit / Pre-existing. "The check run always completes with a neutral conclusion so it never
     blocks merging" (you gate in your own CI if you want).
   - REVIEW.md patterns: "report at most five nits"; "behavior claims need a file:line citation in the source, not an
     inference from naming"; re-review convergence: "after the first review, suppress new nits and post Important
     findings only"; "Length has a cost: a long REVIEW.md dilutes the rules that matter most."
   - Local `/code-review`: "At low and medium, the review reports only the findings it's most confident in ... high through
     max broaden coverage and may include findings the review is less sure about."
8. Claude Code docs, "Ultrareview" - https://code.claude.com/docs/en/ultrareview
   - "every reported finding is independently reproduced and verified, so the results focus on real bugs rather than
     style suggestions"; "a larger fleet of reviewer agents explores the change in parallel"; runs "in a cloud sandbox";
     5-10 minutes; "$5 to $25" per run after free runs; diff cap 500 files / 8,000 lines.
9. Claude Code docs, "Agent teams" - https://code.claude.com/docs/en/agent-teams
   - "A single reviewer tends to gravitate toward one type of issue at a time. Splitting review criteria into independent
     domains means security, performance, and test coverage all get thorough attention simultaneously."
   - "Sequential investigation suffers from anchoring: once one theory is explored, subsequent investigation is biased
     toward it. With multiple independent investigators actively trying to disprove each other, the theory that survives
     is much more likely to be the actual root cause."
   - "Start with 3-5 teammates ... Three focused teammates often outperform five scattered ones." "Two teammates editing
     the same file leads to overwrites." Quality gates: TeammateIdle / TaskCreated / TaskCompleted hooks, "Exit with code
     2 to prevent completion and send feedback."
   - "A teammate can't approve a permission prompt or supply consent on your behalf, and a teammate that was denied an
     action can't relay it to another teammate to bypass the check."
10. Claude Code docs, "Dynamic workflows" - https://code.claude.com/docs/en/workflows
   - "it can have independent agents adversarially review each other's findings before they're reported, or draft a plan
     from several angles and weigh them against each other".
   - /deep-research: "claims that didn't survive cross-checking already filtered out"; "When the verifier agents can't
     check a claim ... the report lists that claim as unverified instead of counting it as refuted."
   - Limits: 16 concurrent agents default, 1,000 agents per run, "Large workflow" warning above 25 agents / 1.5M tokens.
     "No mid-run user input ... For sign-off between stages, run each stage as its own workflow."
   - `schema` on agent(): structured output validated; fails after five attempts.
11. Claude Code docs, "/goal" - https://code.claude.com/docs/en/goal
   - "completion is decided by a fresh model rather than the one doing the work"; evaluator "doesn't run commands or read
     files independently, so write the condition as something Claude's own output can demonstrate"; "If Claude keeps
     answering the evaluator without making progress (no tool use for several turns in a row), Claude Code stops the
     loop".
   - Good condition: "One measurable end state ... A stated check ... Constraints that matter".
12. Anthropic, "How we built our multi-agent research system" -
    https://www.anthropic.com/engineering/multi-agent-research-system
   - "token usage by itself explains 80% of the variance"; "Each subagent needs an objective, an output format, guidance on
     the tools and sources to use, and clear task boundaries"; scale effort: "Simple fact-finding requires just 1 agent
     with 3-10 tool calls ... complex research might use more than 10 subagents"; LLM-as-judge "single LLM call ... scores
     from 0.0-1.0 and a pass-fail grade was the most consistent"; "Human evaluation catches what automation misses";
     end-state evaluation.
13. Anthropic, "Effective context engineering for AI agents" -
    https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
   - "As the number of tokens in the context window increases, the model's ability to accurately recall information from
     that context decreases." "Specialized sub-agents can handle focused tasks with clean context windows." "Find the
     smallest set of high-signal tokens that maximize the likelihood of your desired outcome."
14. Anthropic, "Demystifying evals for AI agents" -
    https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
   - "it's often better to grade what the agent produced, not the path it took"; "A good task is one where two domain
     experts would independently reach the same pass/fail verdict"; pass@k vs pass^k; "LLM-as-judge graders should be
     closely calibrated with human experts".
15. Anthropic, "Effective harnesses for long-running agents" -
    https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
   - Initializer agent + coding agent; `claude-progress.txt`; features JSON with a `passes` field initially failing;
     "Claude's tendency to mark a feature as complete without proper testing"; "Only mark features as 'passing' after
     careful testing"; failure modes: "one-shot the app", "declare the job done"; start each session by running a basic
     test "to catch any undocumented bugs".
16. Google eng-practices, "Small CLs" - https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md
   - Reviewed more quickly; "Reviewed more thoroughly"; "Less likely to introduce bugs"; "Less wasted work if they are
     rejected"; "Easier to merge"; "Easier to design well"; "Less blocking on reviews"; "Simpler to roll back".
   - "one self-contained change"; "100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large";
     "It's usually best to do refactorings in a separate CL from feature changes or bug fixes"; "CLs should include
     related test code."
17. Google eng-practices, "The Standard of Code Review" -
    https://github.com/google/eng-practices/blob/master/review/reviewer/standard.md
   - "reviewers should favor approving a CL once it is in a state where it definitely improves the overall code health of
     the system being worked on, even if the CL isn't perfect." "Technical facts and data overrule opinions and personal
     preferences." "On matters of style, the style guide is the absolute authority." Escalation path for conflicts.
18. Google eng-practices, "What to look for" -
    https://github.com/google/eng-practices/blob/master/review/reviewer/looking-for.md
   - Design first ("The most important thing to cover in a review is the overall design of the CL"), functionality/edge
     cases/concurrency, "Reviewers should be especially vigilant about over-engineering", tests, naming, comments ("why",
     not "what"), style, consistency, documentation, "look at every line", "look at the CL in a broad context".
19. Google eng-practices, "Speed of code reviews" -
    https://github.com/google/eng-practices/blob/master/review/reviewer/speed.md
   - "One business day is the maximum time it should take to respond"; "it's even more important for the individual
     responses to come quickly than it is for the whole process to happen rapidly"; "If the reviewer requests the same
     substantial changes but responds quickly every time the developer makes an update, the complaints tend to
     disappear"; "Slow reviews also discourage code cleanups, refactorings"; LGTM-with-comments; emergencies section.
   - Also https://github.com/google/eng-practices/blob/master/review/index.md: "A code review is a process where someone
     other than the author(s) of a piece of code examines that code."
20. GitHub docs source, "About protected branches" -
    https://github.com/github/docs/blob/main/content/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches.md
   - "Collaborators can only push changes to a protected branch via a pull request that is approved by the required
     number of reviewers with write permissions." "dismiss stale pull request approvals when commits are pushed that
     affect the diff". "require that the most recent reviewable push must be approved by someone other than the person
     who pushed it." "All required status checks must pass before collaborators can merge". "Requires all comments on the
     pull request to be resolved before it can be merged".
21. GitHub docs source, "About code owners" -
    https://github.com/github/docs/blob/main/content/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners.md
   - "Code owners are automatically requested for review when someone opens a pull request that modifies code that they
     own." "Order is important; the last matching pattern takes the most precedence." With branch protection, "an
     approval from any of the owners is sufficient".
22. NIST SP 800-53 AC-5 "Separation of Duties" text (canonical: https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final ;
    read via public reproductions https://github.com/mendix/docs/blob/development/content/en/docs/private-platform/nist-controls/ac/pmp-nist-ac05.md
    and https://github.com/CyberStrikeus/CyberStrike (SKILL.md for AC-5))
   - "Separation of duties addresses the potential for abuse of authorized privileges and helps to reduce the risk of
     malevolent activity without collusion." Includes "dividing mission or business functions and support functions among
     different individuals or roles, conducting system support functions with different individuals" (system management,
     programming, configuration management, quality assurance, testing, network security) and "ensuring security
     personnel administering access controls do not also administer audit functions".
23. OWASP Cheat Sheet Series, "Secure Product Design" -
    https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Secure_Product_Design_Cheat_Sheet.md
   - "Least Privilege ... users should only be given the minimum amount of access necessary to perform their job."
     "Separation of duties is a fundamental principle of internal control". "Defense-in-Depth ... multiple layers of
     security controls". "Zero Trust ... assumes that all users, devices, and networks are untrusted and must be verified".
     "secure by default".
24. Microsoft Code-With Engineering Playbook, "Code reviews" and "Reviewer guidance" -
    https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/code-reviews/README.md ;
    https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/code-reviews/process-guidance/reviewer-guidance.md
   - Goals: "Improve code quality by identifying and removing defects before they can be introduced into shared code
     branches." Reviewer: "Read every line changed"; "Do all the changes logically fit in this PR, or are there unrelated
     changes?"; "Tests should always be committed in the same PR as the code itself"; "Since parts of reviews can be
     automated via linters and such, human reviewers can focus on architectural and functional correctness."; "take a
     break between the reviews to recover".
25. Anthropic (claude.com blog), "How Anthropic secures its AI-native software development lifecycle" -
    https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle
   - "Multiple agents automatically review it. Each review agent is designed and scoped to a specific, narrow focus";
     deterministic SAST posts findings; "Risk-weighted sample is reviewed by humans"; invariant tests ("User A can never
     read user B's data") trigger manual escalation; incident agent can read logs and write docs but cannot deploy fixes;
     "Human accountability is still central to our process"; "Approximately a third of the bugs behind past claude.ai
     incidents would have been caught".

### Search-snippet evidence `[SEARCH-SNIPPET]` (search results quoted the source; page itself was egress-blocked)

26. Toyota Motor Corporation, "Toyota Production System" -
    https://global.toyota/en/company/vision-and-philosophy/production-system/index.html and Toyota UK glossary
    https://mag.toyota.co.uk/toyota-production-system-glossary/ , https://mag.toyota.co.uk/jidoka-toyota-production-system/
   - Jidoka: "automation with a human touch ... the principle of designing equipment to stop automatically and to detect
     and call attention to problems immediately whenever they occur." "operators are equipped with the means to stop the
     production flow whenever they note anything suspicious, thereby preventing the waste that would result from
     producing a series of defective items."
   - Andon: "the highlighting of a problem, as it occurs, in order to immediately introduce countermeasures to prevent
     re-occurrence ... Activation of the alert - usually by a pull-cord or button - automatically halts production so that
     a solution can be found."
   - Poka-yoke: "any part of a manufacturing process that helps a Toyota member avoid (yokeru) mistakes (poka). Its
     purpose is to eliminate defects by preventing, correcting, or highlighting errors as they occur - for example, a jig
     ... modified to only allow them to be held in the correct arrangement."
27. Robert G. Cooper, "The Stage-Gate Idea to Launch System" (Wiley International Encyclopedia of Marketing) -
    https://onlinelibrary.wiley.com/doi/full/10.1002/9781444316568.wiem05014 ; and
    https://www.bobcooper.ca/articles/next-generation-stage-gate-and-whats-next-after-stage-gate
   - Gates: "either approve the tasks and resources for the next stage (Go), ask for more information (Recycle), or stop
     the project (Kill or Hold)." "Gates must have clear and visible criteria so that senior managers can make go/kill and
     prioritization decisions objectively ... these criteria must be effective - that is, they must be operational (easy
     to use), realistic (make use of available information) and discriminating (differentiate the good projects from the
     mediocre ones)." Model formalized 1986 from a study of 252 launches in 123 firms; now "fifth generation".
28. Theory of Constraints (Goldratt) - https://www.tocinstitute.org/theory-of-constraints.html ,
    https://www.leanproduction.com/theory-of-constraints/
   - Five focusing steps: Identify, Exploit, Subordinate, Elevate, Repeat. Drum-Buffer-Rope: "The "Drum" is the constraint.
     The speed at which the constraint runs sets the "beat" for the process and determines total throughput"; buffer
     "ensures that brief interruptions and fluctuations in non-constraints do not affect the constraint"; rope "identifies
     when inventory has been consumed to trigger more inventory to be released into the process without creating excess."

### Classics cited from prior knowledge `[NOT FETCHED - egress blocked; verify before quoting externally]`

29. James Reason, "Human error: models and management", BMJ 2000;320:768-770 - https://www.bmj.com/content/320/7237/768
   - Swiss-cheese model: defensive layers "are more like slices of Swiss cheese, having many holes"; "the presence of holes
     in any one 'slice' does not normally cause a bad outcome. Usually, this can happen only when the holes in many layers
     momentarily line up"; active failures vs latent conditions; "we cannot change the human condition, but we can change
     the conditions under which humans work"; high-reliability organisations "expect to make errors and train their
     workforce to recognise and recover them". Confidence in these quotes: medium (well-known text).
   - Known critique: Reason, Hollnagel & Paries 2006 (Eurocontrol EEC Note 13/06) note the model is generic and does not
     explain what the holes are or why they line up. https://www.eurocontrol.int/sites/default/files/library/017_Swiss_Cheese_Model.pdf
30. Haynes AB et al., "A Surgical Safety Checklist to Reduce Morbidity and Mortality in a Global Population", NEJM
    2009;360:491-9 - https://www.nejm.org/doi/full/10.1056/NEJMsa0810119
   - 8 hospitals (8 cities worldwide), 3733 patients before / 3955 after; death rate 1.5% -> 0.8%; inpatient complications
     11.0% -> 7.0%. Checklist has three pause points: Sign In (before anaesthesia), Time Out (before incision), Sign Out
     (before leaving OR). Confidence medium-high for the numbers. Caveat: a later population-level study in Ontario
     (Urbach et al., NEJM 2014) found no significant improvement after mandated adoption - i.e., the checklist works
     through implementation culture, not by existing on paper.
31. Gary Klein, "Performing a Project Premortem", HBR Sept 2007 - https://hbr.org/2007/09/performing-a-project-premortem
   - "prospective hindsight - imagining that an event has already occurred - increases the ability to correctly identify
     reasons for future outcomes by 30%". Procedure: assume the project has failed; each member writes reasons; read
     around the room. Confidence medium.
32. Degani A. & Wiener E.L., "Human Factors of Flight-Deck Checklists: The Normal Checklist", NASA CR-177549 (1990) -
    https://ntrs.nasa.gov/citations/19910017830
   - Checklist methods: "challenge-response" (do-verify: task done from memory/flow, then verified item by item by a second
     crew member reading the challenge) vs "call-do-response" (read-do). Observed failures: items checked "from memory",
     "looking without seeing", checklist interrupted and resumed at the wrong place. Recommends the checklist be a mutual
     cross-check between crew members, not a solo activity. Confidence medium.
33. 14 CFR 121.542 "Flight crewmember duties" (sterile cockpit rule) -
    https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-121/subpart-T/section-121.542
   - "(b) No flight crewmember may engage in, nor may any pilot in command permit, any activity during a critical phase of
     flight which could distract any flight crewmember from the performance of his or her duties"; critical phases =
     "all ground operations involving taxi, takeoff and landing, and all other flight operations conducted below 10,000
     feet, except cruise flight." Confidence high for the gist, medium for exact wording.
34. Fagan M.E., "Design and code inspections to reduce errors in program development", IBM Systems Journal 15(3), 1976 -
    https://ieeexplore.ieee.org/document/5388086
   - Phases: overview, preparation, inspection, rework, follow-up; roles: moderator, designer, coder, tester; moderator
     should not be the author's manager; inspection results must not be used for personnel evaluation; reported that
     inspections found ~82% of errors before unit test with a 23% productivity gain in the case study; recommended
     inspection rates (~100-125 non-commentary lines/hour). Confidence medium (numbers from memory).
35. The Kanban Guide (Vacanti & Coleman) - https://kanbanguides.org/english/ ; Kanban University -
    https://kanban.university/kanban-guide/
   - Practices: define/visualize the workflow, actively manage items in the workflow (limit WIP), improve the workflow.
     Little's Law as used in Kanban: average cycle time = average WIP / average throughput (holds over a stable interval
     with conservation of flow). Limiting WIP turns the system into a pull system and "makes problems visible" (Kanban
     University wording: "limit WIP ... implement feedback loops"). Confidence medium.
36. Tomkins, Zhang & Heavlin, "Reviewer bias in single- versus double-blind peer review", PNAS 2017 -
    https://www.pnas.org/doi/10.1073/pnas.1707323114
   - WSDM 2017 experiment: single-blind reviewers were significantly more likely to bid on and accept papers from famous
     authors and top institutions/companies than double-blind reviewers. Note: this is evidence that knowing the AUTHOR
     biases the verdict, not evidence that context-free review finds more defects. Confidence medium.
37. W. Edwards Deming, "14 Points for Management" - https://deming.org/explore/fourteen-points/
   - Point 3: "Cease dependence on inspection to achieve quality. Eliminate the need for inspection on a mass basis by
     building quality into the product in the first place." Confidence high (canonical wording).
38. DORA / Google Cloud, "DevOps capabilities: Streamlining change approval" and "Working in small batches" -
    https://dora.dev/capabilities/streamlining-change-approval/ , https://dora.dev/capabilities/working-in-small-batches/
   - State of DevOps research (2019): external change approval boards (CABs) were negatively correlated with software
     delivery performance and did NOT reduce change-failure rate; peer review (pair/PR) plus automated checks performs
     better. Confidence medium (not fetched this session).
39. Google SRE Book, "Postmortem Culture: Learning from Failure" - https://sre.google/sre-book/postmortem-culture/
   - Blameless postmortems: focus on contributing causes "without indicting any individual or team"; a postmortem is
     written for outages above a threshold; action items tracked. Confidence high for the gist.
40. NASA IV&V Program - https://www.nasa.gov/ivv/ (and IEEE 1012) - IV&V independence has three dimensions: technical,
    managerial, financial. Confidence medium.

---

## Findings (numbered; each maps a quality principle to a mechanism in the AI pipeline)

### F1. Jidoka / andon: stop at the first abnormality, at the point of detection, then fix the cause.
- Evidence: Toyota - equipment "designed ... to stop automatically and to detect and call attention to problems
  immediately"; operators can "stop the production flow whenever they note anything suspicious, thereby preventing the
  waste that would result from producing a series of defective items" [SEARCH-SNIPPET, src 26].
- Why it does not slow throughput: the cost of a defect grows with every downstream step it passes through; stopping one
  item early is cheaper than reworking a batch later (this is the whole economic argument of jidoka; Google's "less wasted
  work if rejected" for small CLs is the software analogue [FETCHED, src 16]).
- Mapping: a failing check at any stage must HALT that item and route it back, not be logged and passed on.
  Claude Code: `PreToolUse` / `Stop` / `TaskCompleted` hooks returning exit 2 ("exit 2 blocks whether or not you print
  JSON") [FETCHED, src 2]; `TaskCompleted` hook: "Exit with code 2 to prevent completion and send feedback" [src 9].
  The andon cord for a subagent = the subagent may (and must) return `status: blocked` with a reason instead of
  improvising around a failing gate.
- Confidence: high for the mapping, medium-high for the TPS quotes.

### F2. Poka-yoke: make the wrong action impossible or immediately visible; prefer prevention to detection.
- Evidence: poka-yoke "eliminate[s] defects by preventing, correcting, or highlighting errors as they occur - for example,
  a jig ... modified to only allow them to be held in the correct arrangement" [src 26]. Claude docs: "An instruction like
  "never edit .env" in CLAUDE.md or a skill is a request, not a guarantee. A PreToolUse hook that blocks the edit is
  enforcement." [FETCHED, src 4].
- Mapping (the "jig"): tool allowlists on subagents (reviewers get `tools: Read, Grep, Glob` and physically cannot edit
  [src 5]); `PreToolUse` deny on protected paths (migrations, secrets, CI config); structured output with `schema` on
  `agent()` so a reviewer cannot return prose where a verdict object is required [src 10]; `--allowedTools` for
  unattended fan-out [src 6]; branch protection "All required status checks must pass" [src 20].
- Confidence: high.

### F3. Deterministic gates belong in hooks/scripts; judgment belongs in agents; prose rules are advisory only.
- Evidence: "Hook: Always fires on its event; the trigger is guaranteed" vs "Skill: Claude interprets the instructions;
  outcome can vary" [src 4]; hooks give "deterministic control: certain actions always happen rather than relying on the
  LLM to choose to run them" [src 3]; prompt-based and agent-based hooks exist "for decisions that require judgment"
  [src 3].
- Mapping: three-tier gate taxonomy for the funnel - (1) command hooks for invariants (tests pass, lint clean, no
  out-of-scope files, diff size cap); (2) prompt/agent hooks for judgment gates (does the diff match the spec?); (3) human
  for risk-sampled sign-off. Anything you would write as "always/never" in CLAUDE.md is a candidate for tier 1.
- Confidence: high.

### F4. Small batches are the single biggest lever for both error rate and speed.
- Evidence: small CLs are "Reviewed more quickly", "Reviewed more thoroughly", "Less likely to introduce bugs", "Less
  wasted work if they are rejected", "Easier to merge", "Simpler to roll back"; "100 lines is usually a reasonable size
  for a CL, and 1000 lines is usually too large"; "It's usually best to do refactorings in a separate CL" [FETCHED,
  src 16]. Ultrareview refuses diffs above 500 files / 8,000 lines [src 8]. DORA "working in small batches" (not fetched,
  src 38) says the same for delivery performance.
- Mapping: the decomposition stage must emit tasks whose expected diff is ~100 lines and "one self-contained change";
  separate refactor tasks from feature tasks; a `TaskCreated` hook can reject tasks without a size estimate or with mixed
  intent; a `Stop`/`TaskCompleted` hook can reject a diff over a line budget and send it back for splitting.
- Confidence: high.

### F5. Review LATENCY, not review rigor, is what makes review feel slow; make gates fast and batch feedback.
- Evidence: "One business day is the maximum time it should take to respond"; "it's even more important for the
  individual responses to come quickly than it is for the whole process to happen rapidly"; "If the reviewer requests the
  same substantial changes but responds quickly every time ... the complaints tend to disappear"; "Slow reviews also
  discourage code cleanups" [FETCHED, src 19].
- Mapping: reviewer subagents run in the background ("The review runs as a background subagent with its own context
  window" [src 7]) and return one consolidated, deduplicated, ranked report - never trickle comments one at a time. The
  human's job shrinks to reading a ranked verdict. Because AI review is minutes not days, the "ceremony cost" the user
  fears is mostly eliminated - provided reviews do not generate noise (see F6, F11).
- Confidence: high.

### F6. Approve on "net improves", block only on verified correctness; a reviewer told to find problems will find them.
- Evidence: "reviewers should favor approving a CL once it is in a state where it definitely improves the overall code
  health of the system being worked on, even if the CL isn't perfect"; "Technical facts and data overrule opinions"
  [src 17]. "A reviewer prompted to find gaps will usually report some, even when the work is sound ... Chasing every
  finding leads to over-engineering ... Tell the reviewer to flag only gaps that affect correctness or the stated
  requirements" [src 6]. Code Review severity Important/Nit/Pre-existing; REVIEW.md: "report at most five nits"; "after the
  first review, suppress new nits and post Important findings only" [src 7].
- Mapping: every reviewer prompt in the funnel carries (a) the approval standard, (b) a severity rubric, (c) a nit cap,
  (d) a re-review convergence rule. This is what prevents the review stage from re-creating the user's linear
  error->fix->error chain in a new form (review->nit->fix->nit).
- Confidence: high.

### F7. Independence = separate context. Two tiers: context-aware reviewers and blind ("outside") reviewers.
- Evidence: "A fresh context improves code review since Claude won't be biased toward code it just wrote"; "A reviewer
  running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced
  the change, so it evaluates the result on its own terms" [src 6]; `/goal`: "completion is decided by a fresh model
  rather than the one doing the work" [src 11]; subagents: "own context window ... independent permissions" [src 5];
  a subagent with `omitClaudeMd` skips CLAUDE.md [src 4] - i.e., you can build a truly context-free reviewer.
  Aviation cross-check (challenge-response between crew members, src 32) and double-blind review (src 36) are the human
  analogues: the verifier must not be the doer, and knowing the author biases the verdict.
- Mapping (matches the user's two reviewer tiers exactly):
  - Tier A "independent reviewers": fresh subagent, receives diff + spec/plan + CLAUDE.md + acceptance criteria; may send
    the task back to any earlier stage (decomposition, hypothesis) with a reason.
  - Tier B "outside reviewers": fresh subagent with `omitClaudeMd: true`, receives ONLY the diff (or the running app
    + tests) and the original user story, NOT the plan, NOT the conversation, NOT prior review findings; delivers a
    verdict object (pass/fail + severity + evidence), no edits. Optionally two Tier-B reviewers with different lenses
    (product behaviour; engineering risk).
- Confidence: high for the mechanism; medium for the claim that blind review catches MORE (see open question Q1).

### F8. Separation of duties: the entity that changes code cannot be the entity that approves it, and approvals expire
  on new commits.
- Evidence: NIST AC-5 - "Separation of duties addresses the potential for abuse of authorized privileges and helps to
  reduce the risk of malevolent activity without collusion ... dividing mission or business functions and support
  functions among different individuals or roles ... (programming, configuration management, quality assurance, testing)"
  [FETCHED reproduction, src 22]. GitHub: "the most recent reviewable push must be approved by someone other than the
  person who pushed it"; "dismiss stale pull request approvals when commits are pushed that affect the diff" [src 20].
  Agent teams: "a teammate that was denied an action can't relay it to another teammate to bypass the check" [src 9].
- Mapping: implementer subagent: Edit/Bash, no verdict authority. Reviewer subagents: read-only tools, verdict authority,
  no edits (if a reviewer "fixes it for you", that fix is now unreviewed - a SoD violation). Verdict agent: read-only.
  Any new commit after a pass invalidates the pass (`PostToolUse` on Edit/Write clears an "approved" marker in the task
  record; `TaskCompleted` hook requires the marker).
- Confidence: high.

### F9. Zones of responsibility = path-scoped owners and path-scoped rules.
- Evidence: CODEOWNERS - "Code owners are automatically requested for review when someone opens a pull request that
  modifies code that they own"; "the last matching pattern takes the most precedence" [src 21]. Claude Code rules with
  `paths` frontmatter "only load when Claude works with matching files" [src 4]. Anthropic SDLC: "Each review agent is
  designed and scoped to a specific, narrow focus" [src 25]; agent teams: "A single reviewer tends to gravitate toward one
  type of issue at a time. Splitting review criteria into independent domains ..." [src 9].
- Mapping: a `ZONES` map (path glob -> zone -> specialist reviewer agent + zone rules file) drives (a) which reviewer
  subagents are spawned for a diff, (b) which `.claude/rules/*.md` load for the implementer, (c) which zones need a
  human sample. This is the "distribution" stage of the funnel.
- Confidence: high.

### F10. Defense in depth works only if the layers fail differently (Swiss cheese).
- Evidence: Reason - holes "momentarily line up" only across many independent layers [NOT FETCHED, src 29]; OWASP
  defense-in-depth [src 23]; Anthropic's SDLC uses deterministic SAST + narrow-focus AI agents + invariant tests +
  risk-weighted human sample, and still expects only "approximately a third of the bugs behind past claude.ai incidents
  would have been caught" [src 25]; multi-agent review splits by issue class and then verifies [src 7].
- Mapping: never run N copies of the same reviewer prompt on the same model with the same context - their holes are
  correlated. Vary the MECHANISM per layer: (1) compiler/tests/lint/type-check (deterministic); (2) narrow-focus AI
  reviewers with different lenses and different context; (3) a refuter that tries to reproduce each finding; (4) a blind
  verdict agent; (5) human risk sample. Optionally vary the model per layer.
- Confidence: high for the design rule; medium for the Reason quotes.

### F11. Verify findings before reporting them (finder -> refuter), and mark unverifiable as "unverified", not "refuted".
- Evidence: "a verification step checks candidates against actual code behavior to filter out false positives. The
  results are deduplicated, ranked by severity" [src 7]; "every reported finding is independently reproduced and verified"
  [src 8]; workflows "have independent agents adversarially review each other's findings before they're reported"; "When
  the verifier agents can't check a claim ... the report lists that claim as unverified instead of counting it as refuted"
  [src 10]; REVIEW.md verification bar: "behavior claims need a file:line citation in the source" [src 7].
- Mapping: the review stage is two-phase inside one workflow: finders (parallel, by zone/lens) -> refuters (one per
  finding, tries to reproduce with a test or a trace) -> dedupe/rank -> only verified Important findings return to the
  implementer. This is the equivalent of Fagan's inspection meeting where the moderator filters (src 34) and the medical
  "independent double check".
- Confidence: high.

### F12. Grade the end state with evidence; acceptance checks are written BEFORE implementation.
- Evidence: "Claude stops when the work looks done. Without a check it can run, "looks done" is the only signal" [src 6];
  "Claude's tendency to mark a feature as complete without proper testing ... Only mark features as 'passing' after careful
  testing" [src 15]; "grade what the agent produced, not the path it took"; "A good task is one where two domain experts
  would independently reach the same pass/fail verdict" [src 14]; `/goal` condition needs "One measurable end state ... A
  stated check ... Constraints that matter" [src 11]; "Have Claude show evidence rather than asserting success" [src 6].
- Mapping: the hypothesis-check stage outputs, per task, a machine-checkable acceptance block (command + expected exit /
  output + must-not-change constraints). `TaskCompleted` hook blocks unless the task record carries evidence (test output
  hash, command run). Reviewers grade against that block, not against their taste.
- Confidence: high.

### F13. Stage gates with explicit, discriminating criteria and four outcomes: Go / Recycle / Hold / Kill.
- Evidence: Cooper - gates "either approve ... (Go), ask for more information (Recycle), or stop the project (Kill or
  Hold)"; criteria must be "operational (easy to use), realistic (make use of available information) and discriminating"
  [SEARCH-SNIPPET, src 27]. Cooper's later work stresses "gates with teeth" and scaling the process to risk
  (Stage-Gate Lite / XPress) [NOT FETCHED, src 27].
- Mapping: every funnel stage ends in a gate whose criteria are written down (in the workflow script), whose outcome is an
  enum {go, recycle:<stage>, hold, kill}, and whose decision is made by a fresh agent (or a script). "Kill" is the
  under-used accelerator: killing a wrong task at hypothesis-check costs minutes; killing it after review costs hours.
- Confidence: medium-high.

### F14. Check the hypothesis before building: plan + premortem, but scale the ceremony to risk.
- Evidence: "Letting Claude jump straight to coding can produce code that solves the wrong problem" and yet "If you could
  describe the diff in one sentence, skip the plan" [src 6]; Klein's premortem increases identified failure reasons by ~30%
  [NOT FETCHED, src 31]; agent teams: "competing hypotheses ... trying to disprove each other" beats sequential
  investigation because of anchoring [src 9]; Anthropic: scale effort to complexity (1 agent / 3-10 calls for simple, >10
  subagents for complex) [src 12].
- Mapping: hypothesis stage = (a) a Plan/Explore read-only subagent writes the approach; (b) a premortem subagent is told
  "this task failed in review - list the three most likely reasons" and the plan is amended; (c) for uncertain tasks, a
  spike (throwaway experiment) proves the risky assumption before real implementation. Risk router: trivial tasks skip
  (b) and (c) entirely.
- Confidence: high for (a),(c); medium for (b).

### F15. Theory of Constraints: find the bottleneck, protect it with a buffer, release work by a rope (WIP limit).
- Evidence: five focusing steps and DBR: "the speed at which the constraint runs sets the beat ... determines total
  throughput"; the rope "identifies when inventory has been consumed to trigger more inventory to be released into the
  process without creating excess" [SEARCH-SNIPPET, src 28].
- Mapping: in an AI funnel the constraint is usually (i) the human (approvals, reading verdicts), (ii) the verifier (slow
  test suite), or (iii) rate limits. Measure per-stage cycle time; keep a buffer of verified-ready items in front of the
  human gate so the human never waits and never gets flooded; release new tasks into implementation only when a slot
  frees (pull). Do not "elevate" (add capacity) upstream of the constraint - more implementers just grow the review queue.
- Confidence: medium-high.

### F16. WIP limits and Little's law: parallelism beyond the WIP limit raises cycle time, not throughput.
- Evidence: Kanban - cycle time = WIP / throughput [NOT FETCHED, src 35]. Claude docs: "Start with 3-5 teammates ... Three
  focused teammates often outperform five scattered ones"; "Two teammates editing the same file leads to overwrites"
  [src 9]; workflow runtime caps 16 concurrent agents and warns above 25 [src 10]; "token usage by itself explains 80% of
  the variance" in agent performance [src 12].
- Mapping: explicit WIP limits per stage (e.g., implementation <= 3 concurrent tasks each in its own worktree; human gate
  WIP = 1), file-ownership partitioning so parallel tasks never touch the same files, and a "size guideline" for
  workflows. The separator's narrowing is literally the WIP limit.
- Confidence: medium-high.

### F17. Retry cap + fresh context beats iterating in a polluted context (this is the antidote to the "straight line").
- Evidence: "If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with
  failed approaches. Run /clear and start fresh with a more specific prompt ... A clean session with a better prompt
  almost always outperforms a long session with accumulated corrections" [src 6]; context rot [src 13]; Stop hook is
  overridden "after it blocks eight times in a row without progress"; `/goal` stops when there is "no tool use for several
  turns in a row" [src 3, 11].
- Mapping: every loop in the funnel has a bounded iteration count (implementer<->tests: N=3; implementer<->reviewer:
  N=2). On exhaustion the item is NOT retried in place; it is recycled to an earlier stage with a rewritten spec that
  encodes what was learned, and a NEW implementer context is spawned. Harness pattern: progress file + feature list with
  `passes` flags survives across contexts [src 15].
- Confidence: high.

### F18. Checklists with pause points, run as challenge-response by someone other than the doer.
- Evidence: WHO checklist trial: deaths 1.5% -> 0.8%, complications 11.0% -> 7.0% across 8 hospitals; three pause points
  (sign in / time out / sign out) [NOT FETCHED, src 30]; Degani & Wiener: challenge-response (do-verify) vs read-do;
  observed failure "looking without seeing", items checked from memory [NOT FETCHED, src 32]; Joint Commission time-out
  requires active participation of the whole team. Caveat: Ontario's mandated rollout showed no effect - checklists are
  only as good as the culture that runs them (src 30 caveat).
- Mapping: three short checklists (5-9 items) at three pause points - Sign-In (task understood: inputs, out-of-scope,
  acceptance check exists), Time-Out (right files, right approach, tests written first, no shared-file conflict),
  Sign-Out (evidence attached, docs updated, nothing outside scope changed, approvals current). Each runs as a hook or a
  fresh agent that CHALLENGES the doer's record rather than the doer ticking boxes itself.
- Confidence: medium (numbers from memory) / high (design).

### F19. Sterile cockpit: one task, narrowed tools, no side quests during implementation.
- Evidence: 14 CFR 121.542 bans non-essential activity during critical phases [NOT FETCHED, src 33]; Claude docs
  "kitchen sink session" failure pattern; "Scope investigations narrowly or use subagents" [src 6]; subagents need
  "clear task boundaries" [src 12].
- Mapping: implementer subagents get one task record, a file allowlist, and a tool allowlist; anything discovered outside
  scope is written to a "parking lot" file (new intake item), not acted on. `PreToolUse` denies edits outside the task's
  file set.
- Confidence: high.

### F20. Humans as risk-weighted samplers and final approvers, not as a universal approval board.
- Evidence: Anthropic SDLC: "Risk-weighted sample is reviewed by humans"; invariant tests trigger "manual escalation";
  "Human accountability is still central" [src 25]; DORA: external CABs correlate with worse performance without lowering
  failure rate [NOT FETCHED, src 38]; Deming point 3 - stop depending on mass inspection, build quality in [NOT FETCHED,
  src 37]; Google Code Review check run "never blocks merging" by default - gating is your CI's decision [src 7].
- Mapping: the human gate sees (a) every item touching a high-risk zone (auth, payments, migrations, CI/secrets), (b) a
  random sample of the rest, (c) every item that was recycled twice. Everything else auto-merges to a staging branch once
  tiers 1-4 pass. This is what keeps the wide mouth wide.
- Confidence: medium-high.

### F21. Close the learning loop: recurring findings become rules or hooks (the separator's return line).
- Evidence: "A repeated mistake or a recurring review comment is a CLAUDE.md edit, not a one-off correction in chat"
  [src 4]; features-overview trigger table ("Claude gets a convention or command wrong twice -> CLAUDE.md"; "You want
  something to happen every time without asking -> hook"); blameless postmortem [NOT FETCHED, src 39]; Toyota's andon
  step 4 = root-cause countermeasure [src 26].
- Mapping: a "retrospective" subagent runs after each batch: clusters review findings; if a class recurs >= 2 times it
  proposes (in order of preference) a hook > a path-scoped rule > a CLAUDE.md line > a skill. CLAUDE.md is kept under
  200 lines by demoting rules to hooks/rules files.
- Confidence: high.

### F22. Keep the whole thing simple; add a layer only when it demonstrably catches something.
- Evidence: "You should consider adding complexity only when it demonstrably improves outcomes" [src 1]; "Length has a
  cost: a long REVIEW.md dilutes the rules that matter most" [src 7]; "Bloated CLAUDE.md files cause Claude to ignore your
  actual instructions" [src 6]; agent teams "add coordination overhead and use significantly more tokens" [src 9].
- Mapping: the funnel must be risk-routed (see F13/F14/F20): trivial tasks take the short path (implement -> tests ->
  one reviewer -> merge); only medium/high-risk tasks take the full separator. Track per-layer "catch rate"; retire
  layers that never catch anything.
- Confidence: high.

---

## Anti-patterns (things known NOT to work, with the reason)

1. N identical reviewers (same prompt, same model, same context) - correlated holes; Swiss-cheese only works with
   independent layers [F10]. Symptom: they all miss the same bug and all flag the same nit.
2. "Find all problems" reviewer prompts without a severity rubric or nit cap - produce findings even when the work is
   sound and drive over-engineering [src 6, F6]; recreates the error->fix loop as nit->fix.
3. Reviewers with edit rights - the "fix" is unreviewed; violates separation of duties [F8].
4. Approvals that survive new commits - the classic "fixed one thing after approval" leak; GitHub explicitly offers
   dismiss-stale-approvals to prevent it [src 20].
5. Big batches - 1000-line diffs are reviewed superficially and wasted entirely if the direction is wrong [src 16].
6. Continuing to iterate in the same context after two failed corrections - "context is cluttered with failed
   approaches" [src 6]; unbounded loops - Claude Code itself caps Stop-hook blocks at eight [src 3].
7. Advisory rules for things that must always hold - CLAUDE.md is "a request, not a guarantee" [src 4].
8. Gate criteria that are opinions - Cooper requires criteria that are "operational, realistic, discriminating";
   Google: "Technical facts and data overrule opinions" [src 17, 27].
9. Over-long CLAUDE.md / REVIEW.md - important rules get lost in noise [src 6, 7].
10. Universal human approval board (CAB-style) - correlates with slower delivery and no better stability [src 38,
    NOT FETCHED]; humans should sample by risk [src 25].
11. Parallel implementers on overlapping files - "leads to overwrites" [src 9].
12. Plan mode / full ceremony for one-sentence diffs - "adds overhead" [src 6]; funnel must be risk-routed.
13. Reporting unverifiable findings as failures - deep-research lists them as "unverified", not refuted [src 10];
    otherwise the pipeline blocks on noise.
14. Checklists ticked by the doer from memory - "looking without seeing" [src 32]; mandated checklists without culture
    showed no effect in Ontario [src 30 caveat].
15. Grading the path instead of the product - brittle; "agents regularly find valid approaches that eval designers
    didn't anticipate" [src 14].
16. Reviewer prompts that inherit the implementer's conversation (forked context) when independence is the goal -
    a fork "loads the parent's conversation" [src 4]; use a fresh subagent, not `context: fork`, for Tier A/B reviewers.

---

## Open questions

Q1. Does a truly blind reviewer (no plan, no CLAUDE.md) catch MORE real defects than a context-aware one, or just
    different ones? Peer-review blinding evidence (src 36) shows blinding removes author bias, not that it improves defect
    detection. No fetched source measures this for code. Recommendation: run both tiers and measure catch rate per tier.
Q2. Optimal number of independent reviewers before diminishing returns. Claude docs give a heuristic (3-5 teammates);
    no data on review specifically. Ultrareview uses "a larger fleet" but does not publish the count.
Q3. Cost/latency budget per risk tier. Ultrareview is $5-25 and 5-10 minutes; Code Review ~$15-25 and ~20 minutes
    [src 7, 8]. What fraction of tasks justify the full separator?
Q4. Do LLM refuters share failure modes with LLM finders (self-preference / same blind spots)? Anthropic advises
    calibrating judges with humans [src 14]; varying the model per layer is plausible but unverified here.
Q5. The DORA change-approval finding (src 38) and the Ontario checklist null result (src 30) could not be re-verified in
    this session; treat as medium confidence.
Q6. Where exactly to put the human gate in the flow (before merge to main vs before deploy) depends on whether the project
    has a staging environment; TOC says put the buffer in front of the constraint, which argues for "before deploy" with
    auto-merge to a staging branch.
Q7. How to make the "recycle to the beginning" verdict actionable without losing the good parts of the work: does the
    recycled task carry the diff as a hint, or start clean? (Fresh-context evidence favours starting clean with a better
    spec; small batches make the loss small.)

---

## Design implications for the funnel (tool-agnostic first, then Claude Code)

### Tool-agnostic principles (one line each)
1. Stop-the-line: any failed check halts THAT item at THAT stage and routes it back; nothing passes on red.
2. Poka-yoke over policing: make wrong actions impossible (permissions, allowlists, schemas) before adding reviewers.
3. Deterministic gates for invariants; judgment gates for semantics; humans for risk-sampled accountability.
4. Small batches: tasks sized to ~100-line self-contained diffs; refactors separate from features.
5. Fast gates, batched feedback, one ranked report per gate; latency kills, rigor does not.
6. Approve on net-improvement; block only on verified correctness/security; cap nits; converge on re-review.
7. Independence by construction: the verifier never shares context with the doer; the outside verdict sees only the
   product and the original ask.
8. Separation of duties: doers edit, reviewers read, verdict agents judge, humans sample; approvals expire on change.
9. Zones of responsibility: path-scoped owners, rules and specialist reviewers.
10. Diverse layers: deterministic -> narrow AI lenses -> refuters -> blind verdict -> human sample.
11. Verify findings before reporting; unverifiable != refuted.
12. Acceptance checks written before implementation; grade the end state with evidence.
13. Gates with written criteria and four outcomes (go / recycle:<stage> / hold / kill); kill early.
14. Hypothesis check scaled to risk: plan + premortem + spike for risky tasks; skip for trivial ones.
15. Find the constraint, buffer it, pull work in by WIP limits; do not add capacity upstream of it.
16. Bounded loops: N retries then recycle with a rewritten spec in a fresh context.
17. Three pause-point checklists run as challenge-response by a different agent than the doer.
18. Sterile cockpit during implementation: one task, file allowlist, parking lot for discoveries.
19. Learning loop: recurring findings become hooks/rules; keep the always-on prompt short.
20. Simplicity: risk-route; measure catch rate per layer; remove layers that never catch.

### Concrete Claude Code mapping of the separator stages

| Funnel stage (user's words)            | Mechanism                                                                                              | Quality principle |
|----------------------------------------|--------------------------------------------------------------------------------------------------------|-------------------|
| Wide mouth (intake)                    | `/intake` skill writes each request to a task record (id, ask, zone, risk, size guess); `TaskCreated` hook rejects records missing fields | Stage-gate entry criteria; poka-yoke |
| Zones of responsibility                | `ZONES` map (glob -> zone -> reviewer agent + `.claude/rules/<zone>.md` with `paths:`)                  | CODEOWNERS; narrow-focus reviewers |
| Decomposition                          | read-only Plan subagent; output schema {tasks[], each <= ~100 lines, files[], acceptance{cmd, expect}, risk} | Small batches; acceptance-before-build |
| Distribution                           | workflow script assigns tasks to implementers by zone, WIP-limited, each in its own worktree, disjoint file sets | TOC rope; WIP limits; no shared files |
| Hypothesis check                       | for risk >= medium: premortem subagent + optional spike; gate outcome go/recycle/kill                    | Klein premortem; Cooper gates |
| Execution                              | implementer subagent: Edit/Bash, file allowlist via `PreToolUse`, tests-first, bounded retries, evidence attached | Sterile cockpit; jidoka; evidence |
| Deterministic gate                     | `TaskCompleted`/`Stop` command hooks: tests, lint, types, diff-size cap, scope check -> exit 2 on red    | Poka-yoke; andon |
| Independent reviewers (Tier A)         | fresh subagents per zone lens (read-only tools), receive diff + spec + rules; may return `recycle:<stage>` | Separation of duties; fresh context |
| Refuters                               | one fresh subagent per finding tries to reproduce (test/trace); unverifiable -> "unverified"            | Verified findings; Fagan moderator |
| Outside reviewers (Tier B)             | fresh subagent, `omitClaudeMd: true`, gets ONLY diff/app + original ask; returns verdict schema          | Blind review; end-state grading |
| Human gate                             | risk-weighted sample + all high-risk zones + twice-recycled items; buffer of ready items                 | TOC buffer; risk-weighted sampling |
| Return line (learning)                 | retrospective subagent clusters findings -> proposes hook > rule > CLAUDE.md line                        | Root cause; blameless postmortem |

### Escape hatches (so the funnel never becomes a new straight line)
- Every loop has a max count; exhaustion => recycle with rewritten spec in a fresh context (never "try again" in place).
- Every gate has a `kill` outcome; a killed task returns to intake as a note, not as work.
- `hold` parks items when the constraint is saturated (buffer full) instead of starting more WIP.
- Unverified findings never block; they are attached as notes for the human sample.
