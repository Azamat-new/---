# Research notes: Independent review, blind review and LLM-as-a-judge reliability

Researcher dimension: "Independent review, blind review and LLM-as-a-judge reliability"
Date: 2026-09-26
Purpose: feed the design of the "funnel / milk-separator" vibe-coding workflow (Claude Code reference implementation; tool-agnostic methodology). Specifically the two review stages the user asked for:

1. INDEPENDENT reviewers who can send work back to the beginning.
2. OUTSIDE judges who look at everything WITHOUT process context and deliver a verdict.

## Access note (important for confidence levels)

The sandbox egress proxy blocked arxiv.org, pnas.org, openreview.net, proceedings.neurips.cc, huggingface.co, semanticscholar, alphaxiv, aclanthology, pmlr, openai.com, trychroma.com, smartbear.com, and most third-party mirrors. What I could read IN FULL: everything on code.claude.com, anthropic.com, claude.com, github.com, microsoft.com. For the academic papers I relied on (a) the WebSearch tool's result snippets (which quote the abstracts / key tables) and (b) my prior knowledge of the papers, cross-checked against those snippets. I mark each finding's confidence accordingly:

- high = read the primary source directly, or the number is corroborated by several independent snippets.
- medium = number comes from search snippets of the primary source (abstract-level), not from reading the paper.
- low = single snippet, or user-reported anecdote, or I could not verify.

---

## Sources read

### Read directly (primary)

| # | Source | What it is |
|---|--------|------------|
| 1 | https://code.claude.com/docs/en/code-review | Claude Code Review docs: multi-agent pipeline, verification step, severity, REVIEW.md, never blocks merges |
| 2 | https://claude.com/blog/code-review | Anthropic launch post with internal numbers (16%->54%, 84%/7.5, 31%/0.5, <1% marked incorrect, $15-25, ~20 min) |
| 3 | https://code.claude.com/docs/en/ultrareview | Cloud "fleet of reviewer agents", every finding independently reproduced and verified, 5-10 min, $5-25 |
| 4 | https://code.claude.com/docs/en/best-practices | "Give Claude a way to verify", "adversarial review step", writer/reviewer sessions, "fresh context improves code review since Claude won't be biased toward code it just wrote", context degradation, the over-engineering callout |
| 5 | https://code.claude.com/docs/en/sub-agents | Subagent context isolation: what a subagent does and does not inherit; read-only reviewer pattern |
| 6 | https://code.claude.com/docs/en/workflows | Dynamic workflows: "independent agents adversarially review each other's findings before they're reported", /deep-research votes on claims and filters unverified |
| 7 | https://code.claude.com/docs/en/goal | /goal: "completion is decided by a fresh model rather than the one doing the work"; evaluator sees only the transcript, cannot run tools |
| 8 | https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md | The actual open-source /code-review prompt: 4 parallel agents, per-finding validation subagents, "If you are not certain an issue is real, do not flag it. False positives erode trust and waste reviewer time." |
| 9 | https://github.com/anthropics/claude-code/blob/main/plugins/code-review/README.md | Plugin README: 0-100 confidence, 80 threshold, false-positive list |
| 10 | https://github.com/anthropics/claude-code-action/blob/main/examples/agent-approval-check.yml | "Claude Approvals"-style required status check: N human approvals on agent-authored commits; runs from base branch via pull_request_target so a PR cannot edit the check to approve itself |
| 11 | https://github.com/anthropics/claude-code-action/blob/main/examples/pr-review-comprehensive.yml | A naive review prompt (no severity, no confidence) - useful as a counter-example |
| 12 | https://github.com/anthropics/claude-code-security-review | Security review action: single-pass false-positive filtering, excluded categories (DoS, rate limiting, generic input validation, open redirect) |
| 13 | https://anthropic.com/engineering/harness-design-long-running-apps | Planner / generator / evaluator harness; self-evaluation bias; evaluator "talked itself into approving"; evaluator uses Playwright; sprint contracts; $200 vs $9 |
| 14 | https://anthropic.com/engineering/effective-harnesses-for-long-running-agents | Initializer + coding agent; feature list all initially "failing"; premature "declare the job done"; testing tools "dramatically improved performance" |
| 15 | https://www.anthropic.com/engineering/building-effective-agents | Evaluator-optimizer workflow; parallelization/voting ("several different prompts review and flag the code", "different vote thresholds to balance false positives and negatives") |
| 16 | https://www.anthropic.com/engineering/multi-agent-research-system | LLM-as-judge with rubric; "a single LLM call with a single prompt outputting scores from 0.0-1.0 and a pass-fail grade was the most consistent and aligned with human judgements"; human eval catches what automation misses |
| 17 | https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | Code graders vs model graders vs humans; "LLM-based rubrics should be frequently calibrated against expert human judgment"; "give the LLM a way out ... return 'Unknown'"; grade outcome AND transcript; pass@k vs pass^k |
| 18 | https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle | "multiple gates and agents with separate context windows"; "They do not share biases and blindspots. If one is compromised or makes a mistake, it can be caught by other reviewers"; risk tiering; every approval logged, risk-weighted sample reviewed by humans |
| 19 | https://github.com/lm-sys/FastChat/blob/main/fastchat/llm_judge/README.md | MT-Bench judge modes; "humans and GPT-4 judge achieve over 80% agreement, the same level of agreement between humans" |
| 20 | https://github.com/meg-tong/sycophancy-eval | Sycophancy eval datasets: feedback sycophancy ("I really like the argument"), are-you-sure, answer sycophancy |
| 21 | https://github.com/Weixin-Liang/LLM-scientific-feedback | GPT-4 vs human reviewer overlap 30.85%/39.23% vs human-human 28.58%/35.25%; 43.80% on rejected papers; 57.4% helpful; GPT-4 "struggles to provide in-depth critique of method design" |
| 22 | https://github.com/SakanaAI/AI-Scientist | Automated reviewer: num_reflections=5, num_reviews_ensemble=5, meta-review; "all other models have issues with positivity bias" |
| 23 | https://github.com/Y0oMu/LLM-Judge-Bias-Dataset | CALM dataset: 12 bias types and how each is injected (authority = add references/URLs; bandwagon = "90% of people believe"; refinement = polished vs initial; distraction; fallacy-oversight; compassion-fade = model names) |
| 24 | https://www.microsoft.com/en-us/research/publication/expectations-outcomes-and-challenges-of-modern-code-review/ | Bacchelli & Bird 2013: defects are the main motivation but "reviews are less about defects than expected"; understanding is the bottleneck |
| 25 | https://github.com/anthropics/claude-code/issues/39981 | User-reported: parent trusts subagent summaries; "20-30% of subagent reports contain at least one claim not matching tool output" (anecdotal, 200+ sessions) |

### Reached only via search snippets (abstract-level) - hosts blocked

| Paper | URL | Key numbers captured from snippets |
|-------|-----|------------------------------------|
| Zheng et al. 2023, Judging LLM-as-a-Judge (NeurIPS 2023 D&B) | https://arxiv.org/abs/2306.05685 | Only GPT-4 consistent in >60% of position-swap cases; GPT-3.5 and Claude-v1 fooled by "repetitive list" verbosity attack, only GPT-4 detected it; self-enhancement: GPT-4 +10% win rate for itself, Claude-v1 +25%; GPT-4 vs human agreement >80% = human-human level |
| Panickssery, Bowman, Feng 2024 (NeurIPS 2024) | https://arxiv.org/abs/2404.13076 | GPT-4 self-recognition 73.5% pairwise without training; linear correlation between self-recognition and self-preference after fine-tuning; stronger in larger models |
| Chen et al. 2025, Do LLM Evaluators Prefer Themselves for a Reason? | https://arxiv.org/abs/2504.03846 | Much self-preference is legitimate (objectively better); harmful self-preference persists when the evaluator errs as a generator and is MORE pronounced in stronger models; long CoT before judging reduces harmful self-preference |
| Are LLM Evaluators Really Narcissists? (2026) | https://arxiv.org/abs/2601.22548 | Self-preference confounded with quality; use oracle labels / verifiable tasks; self-preferring verdicts appear on questions the evaluator itself fails |
| Sharma et al. 2023, Towards Understanding Sycophancy (Anthropic) | https://arxiv.org/abs/2310.13548 | 5 SOTA assistants sycophantic across 4 free-form tasks; "matching user beliefs" among most predictive features for human preference in hh-rlhf (15k comparisons); PMs sometimes prefer sycophantic over truthful |
| Tomkins, Zhang, Heavlin 2017 (PNAS) | https://www.pnas.org/doi/10.1073/pnas.1707323114 and https://arxiv.org/abs/1702.00502 | WSDM 2017, 4 reviewers/paper (2 SB, 2 DB): odds multipliers 1.63 famous authors, 1.58 top universities, 2.10 top companies; SB reviewers bid on 22% fewer papers and preferentially on top institutions |
| Verga et al. 2024, Replacing Judges with Juries (PoLL) | https://arxiv.org/abs/2404.18796 | Panel of 3 small models from different families (command-r, gpt-3.5-turbo, haiku) has higher Cohen's kappa with humans than single GPT-4, 7x cheaper, reduces intra-model bias |
| Kohli et al. 2026, Nine Judges, Two Effective Votes (Apple) | https://arxiv.org/abs/2605.29800 | 9 frontier LLMs from 7 families ~ 2 independent votes (Kish n_eff); panel accuracy 8-22 pp below independent-voting ideal; best single judge matches or beats panel; aggregation closes at most 11% of gap; robust across prompts, temperatures, CoT, RewardBench |
| Ye et al. 2025, Justice or Prejudice? CALM (ICLR 2025) | https://arxiv.org/abs/2410.02736 | 12 biases; significant biases persist in specific tasks even for GPT-4o/Claude-3.5; Claude-3.5 generally most robust; some robustness rates below 0.5 |
| Song 2026, Cross-Context Review | https://arxiv.org/abs/2603.12123 | 30 artifacts, 150 injected errors; F1: CCR 28.6% > SR 24.6% (p=0.008, d=0.52) > SA (context-aware subagent) 23.8% (p=0.004, d=0.57) > SR2 21.7% (p<0.001, d=0.72). Mechanism: same-session history anchors the model so it "rationalizes rather than scrutinizes" |
| More Rounds, More Noise (2026) | https://arxiv.org/abs/2603.16244 | Single-pass CCR F1 0.376 vs multi-turn 0.263-0.303; recall +0.08 but 62% more false positives (8.5 vs 5.2), precision 0.30 -> 0.20; mechanisms: false-positive pressure (reviewers fabricate when real errors exhausted) and Review Target Drift (reviewer critiques the conversation instead of the artifact) |
| Refute-or-Promote (2026) | https://arxiv.org/abs/2604.19049 | Adversarial stage gates, kill mandates, context asymmetry, cold-start reviewers, Cross-Model Critic; killed ~79% of 171 candidates (83% prospective, n=30); 4 CVEs; "80+ agents unanimously endorsed a non-existent vulnerability"; "3 independent agents made identical errors"; cross-family review found issues in 3/19 |
| Huang et al. 2023/ICLR 2024, LLMs Cannot Self-Correct Reasoning Yet | https://arxiv.org/abs/2310.01798 | GPT-4 GSM8K 95.5 -> 91.5 -> 89.0 after intrinsic self-correction rounds; GPT-3.5 75.9 -> 74.7; models change correct answers to wrong more than the reverse; prior gains used oracle labels |
| Khan et al. 2024, Debating with More Persuasive LLMs (ICML 2024 best paper) | https://arxiv.org/abs/2402.06782 | Non-expert judge accuracy with debate: 76% (LLM judge) / 88% (human) vs naive 48% / 60%; optimizing debaters for persuasiveness improves truthfulness; consultancy (one advocate) is worse |
| McAleese et al. 2024, LLM Critics Help Catch LLM Bugs (CriticGPT) | https://arxiv.org/abs/2407.00215 | CriticGPT critiques preferred over human critiques 63% of the time; fewer nitpicks/hallucinated bugs; FSBS trades precision vs recall |
| Judging the Judges: bias-mitigation meta-study (2026) | https://arxiv.org/abs/2604.23178 | 9 debiasing strategies x 5 judges x 4 families; style bias dominant (0.76-0.92) vs position bias (<=0.04) on controlled pairs; models distinguish quality from length with 0.92-1.00 accuracy on truncation controls; position swap +4.7 pp for Gemini Flash (p=0.004), +0.7 to +3.0 pp n.s. elsewhere; combined strategy +11.2 pp for Claude Sonnet 4 (p<0.0001); "debiasing is beneficial but model-dependent" |
| Shi et al. 2024/2025, Judging the Judges: position bias | https://arxiv.org/abs/2406.07791 | 15 judges, 22 tasks, ~40 solution models, >150k instances; position bias not random; strongly affected by quality gap between candidates; weakly by length |
| Yagubyan 2026, The Coin Flip Judge? | https://arxiv.org/abs/2606.13685 | Repeated identical pairwise judgments flip 13.6% on average; 28% of questions >20% flip, max 56%; GPT-4o-mini 72% first-position majority (p=0.024); cross-judge agreement 76% (kappa 0.51); semantically equivalent templates change majority in 25% of cases; 11 trials (15 for high-variance) needed to recover 50-trial verdict with 95% prob |
| BadScientist (ACL 2026) | https://arxiv.org/abs/2510.18003 | Fabricated papers accepted by multi-model LLM review up to 82.0%; "concern-acceptance conflict": reviewers flag integrity issues yet give accept-level scores; mitigations only marginal |
| Meta RADAR (2026) | https://arxiv.org/abs/2605.30208 | Multi-stage funnel (eligibility gates, static heuristics, ML Diff Risk Score, LLM automated review, deterministic validation); 535K+ diffs reviewed, 331K+ landed; revert rate 1/3 and incident rate 1/50 of non-RADAR diffs; relaxing risk threshold p25 -> p50 raised approve rate to 60.31% with stable safety |
| Human-AI Synergy in Agentic Code Review (2026) | https://arxiv.org/abs/2603.15911 | 278,790 review conversations, 300 projects; AI suggestions adopted significantly less than human ones; >half of unadopted AI suggestions incorrect or fixed differently; adopted AI suggestions increase complexity/size more; humans exchange 11.8% more rounds on AI-generated code |
| AI-to-AI Code Reviews of GitHub PRs (ESEM 2026) | https://arxiv.org/abs/2608.21311 | Cross-product AI-to-AI review ~1.6% of agent-authored PRs, grew >2 orders of magnitude 2025-Q1 -> Q3 |
| Chroma, Context Rot (2025) | https://www.trychroma.com/research/context-rot | 18 models; performance degrades with input length even on simple tasks; distractors, haystack structure matter |
| SmartBear / Cisco study | https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/ | 200-400 LOC per review, 60-90 min, 70-90% defect discovery; >400 LOC ability to find defects diminishes |
| Sadowski et al. 2018, Modern Code Review at Google | https://research.google/pubs/modern-code-review-a-case-study-at-google/ | Median change ~24 lines; median 1 approver; <25% have >1; review focuses on readability/maintainability as much as defects |
| Liang et al. 2023/2024 (NEJM AI) | https://github.com/Weixin-Liang/LLM-scientific-feedback (read) | see above |

Search queries run (for the record): 30+ distinct WebSearch calls covering: MT-Bench biases; self-preference (3 papers); sycophancy; single vs double blind; PoLL/juries; CALM; Claude Code Review docs/blog; Anthropic harnesses; rubric vs holistic; CriticGPT; context rot; Claude Code best practices; code review LOC/defect rates; adversarial refutation; Claude Approvals; Liang paper feedback; debate; AI review false-positive rates; Anthropic SDLC; BadScientist; Google code review; position-swap mitigation; harness evaluator; narcissists; prefer-themselves; judging-the-judges (x2); coin-flip judge; Meta RADAR; cross-context review; human-AI synergy; CALM robustness; More Rounds More Noise; AI-to-AI reviews; Claude Code Review internal stats; CALM repo; CCR repo.

---

## Findings

### F1. A reviewer that shares the author's context finds FEWER bugs than a cold reviewer - even a subagent given the context

Evidence (Song 2026, Cross-Context Review, arXiv 2603.12123, abstract-level): controlled experiment, 30 artifacts (code, technical docs, presentation scripts), 150 injected errors, four conditions. F1: Cross-Context Review (fresh session, no production history) 28.6% > same-session Self-Review 24.6% (p=0.008, d=0.52) > context-aware Subagent Review 23.8% (p=0.004, d=0.57) > repeated Self-Review 21.7% (p<0.001, d=0.72). Stated mechanism: "When the model reviews its output in the same session, the entire conversation history sits in the context window, anchoring the model's judgment so that it rationalizes rather than scrutinizes." Note: a second self-review round made things WORSE than one.

Corroboration from Anthropic (read directly): code.claude.com/docs/en/best-practices - "A fresh context improves code review since Claude won't be biased toward code it just wrote." and "A reviewer running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced the change, so it evaluates the result on its own terms." /goal doc: "completion is decided by a fresh model rather than the one doing the work."

Confidence: medium (paper numbers from snippets; direction corroborated by Anthropic docs and by Huang et al.).

Implication for the funnel: the independent reviewer stage must be instantiated as a NEW context (subagent or separate session) that receives ONLY: the spec/acceptance criteria, the diff, and the evidence bundle (test output). It must NOT receive the author's transcript, plan reasoning, or chat. The "context-aware subagent" condition (SA) performing WORSE than plain self-review is the strongest argument against "hand the reviewer everything the author knows".

### F2. Asking the same agent to "check its work again" degrades correctness without an external signal

Evidence (Huang et al., ICLR 2024, arXiv 2310.01798, snippets): intrinsic self-correction (no oracle, no tools) drops GPT-4 on GSM8K from 95.5% to 91.5% after one round and 89.0% after two; GPT-3.5 75.9% -> 74.7%. "When the model does modify answers, it is more likely to modify a correct answer to an incorrect one than to revise an incorrect answer to a correct one." Earlier positive results relied on oracle labels deciding when to stop.

Corroboration (read directly): Anthropic harness post: "out of the box, Claude is a poor QA agent. In early runs, I watched it identify legitimate issues, then talk itself into deciding they weren't a big deal and approve the work anyway." and "tuning a standalone evaluator to be skeptical turns out to be far more tractable than making a generator critical of its own work."

Confidence: high (well-replicated result; direction corroborated by Anthropic).

Implication: never implement the "review" stage as "now re-read your diff and fix problems" in the author's context. Reviews need (a) a different context and (b) an external signal (tests, build, runtime, screenshot). Self-review loops that merely re-prompt are the "one straight line of task -> error -> fix" the user complains about.

### F3. Running MORE review rounds on the same artifact lowers precision sharply; one strong pass + verification beats iteration

Evidence (More Rounds, More Noise, arXiv 2603.16244, snippets): single-pass CCR F1 0.376 vs all multi-turn variants 0.263-0.303; second round adds +0.08 recall but 62% more false positives (8.5 vs 5.2 per artifact), precision 0.30 -> 0.20. Two mechanisms: "false positive pressure - reviewers in later rounds fabricate findings when the artifact's real errors have been exhausted" and "Review Target Drift - reviewers provided with prior Q&A exchanges shift from reviewing the artifact to critiquing the conversation itself."

Corroboration (read directly): best-practices callout: "A reviewer prompted to find gaps will usually report some, even when the work is sound, because that is what it was asked to do. Chasing every finding leads to over-engineering." Code Review docs REVIEW.md guidance: "after the first review, suppress new nits and post Important findings only" to stop "a one-line fix from reaching round seven on style alone."

Confidence: medium-high.

Implication: each reviewer gets ONE pass on a given artifact version. Re-review happens only on a NEW version, scoped to (a) the previously flagged items and (b) the changed lines; and it must be told it is allowed to return "no issues". Never feed the reviewer the previous reviewer's Q&A thread.

### F4. Production-grade AI review = parallel specialized finders -> per-finding adversarial verification -> dedup -> severity; precision is prioritized over recall

Evidence (read directly):
- Claude Code Review docs: "multiple agents analyze the diff and surrounding code in parallel ... Each agent looks for a different class of issue, then a verification step checks candidates against actual code behavior to filter out false positives. The results are deduplicated, ranked by severity". Findings never approve/block ("check run always completes with a neutral conclusion"); each finding has expandable reasoning "how it verified the problem". Reviews ~20 min, $15-25.
- Ultrareview: "every reported finding is independently reproduced and verified".
- Open-source plugin prompt (github anthropics/claude-code plugins/code-review/commands/code-review.md): Step 1 haiku pre-flight (skip closed/draft/trivial/already-reviewed; "Still review Claude generated PR's"); Step 2 haiku gathers CLAUDE.md paths; Step 4 four parallel agents: #1,#2 CLAUDE.md compliance (Sonnet, redundant pair), #3 bug detection (Opus, "Focus only on the diff itself ... Do not flag issues that you cannot validate without looking at context outside of the git diff"), #4 logic/security (Opus); "High Signal Issues Only": will fail to compile/parse, will DEFINITELY produce wrong results regardless of inputs, or an unambiguous CLAUDE.md violation "where you can quote the exact rule"; "If you are not certain an issue is real, do not flag it. False positives erode trust and waste reviewer time."; Step 5: "For each issue found by agents 3 and 4, launch parallel subagents to validate the issue" (Opus for bugs, Sonnet for compliance). README adds 0-100 confidence with 80 threshold.
- Internal numbers (claude.com/blog/code-review): "Before, 16% of PRs got substantive review comments. Now 54% do." "On large PRs (over 1,000 lines changed), 84% get findings, averaging 7.5 issues." "On small PRs under 50 lines, that drops to 31%, averaging 0.5 issues." "less than 1% of findings are marked incorrect."
- Security-review action: single-pass FP filter that explicitly drops DoS, rate limiting, memory/CPU exhaustion, generic input validation without proven impact, open redirects.

Caveat: the <1% figure is vendor-reported (thumbs-down rate by Anthropic engineers), not an independent precision measurement.

Confidence: high (design), medium (effectiveness numbers).

Implication: copy the shape, not just the idea: (1) N finder agents with DISJOINT mandates (bugs-in-diff, logic/security, spec-compliance, project-rule compliance, history/blame context), (2) one verifier subagent per candidate whose job is to refute it, (3) dedup + severity, (4) a hard "if not certain, don't flag" rule, (5) a defined allow-list of what NOT to flag (pre-existing, linter-caught, nitpicks, style), (6) evidence per finding (file:line + concrete failure scenario).

### F5. Position bias is real, model-dependent, and single-trial pairwise judgments are noisy; use both orderings or avoid pairwise entirely

Evidence:
- Zheng et al. 2023 (snippets): "Only GPT-4 outputs consistent results in more than 60% of cases when testing for position bias through swapping the order" (my recollection of Table: GPT-4 65% consistent, GPT-3.5 ~46%, Claude-v1 ~24% - unverified here). FastChat README (read): judge modes are single-answer grading, pairwise-baseline, pairwise-all.
- Coin Flip Judge 2026 (snippets): 50 repeated identical pairwise trials per question: preferences flip 13.6% on average; 28% of questions >20% flip; max 56%; GPT-4o-mini 72% first-position majority (p=0.024); cross-judge agreement 76% (kappa 0.51); semantically equivalent templates change the majority verdict in 25% of cases; 11 trials needed on average (15 for high-variance) for majority vote to recover the 50-trial verdict with 95% probability.
- Shi et al. (snippets): >150k instances, 15 judges: position bias "strongly affected by the quality gap between solutions" - i.e. it dominates exactly when candidates are close.
- Judging-the-Judges mitigation study 2026 (snippets): on controlled pairs position bias was small (<=0.04) but swap still helped some models (+4.7 pp Gemini Flash), "model-dependent".

Confidence: high that the bias exists; medium on exact numbers.

Implication: (a) For the funnel, prefer ABSOLUTE grading against binary criteria and tests over "which of these two implementations is better". (b) When a pairwise comparison is unavoidable (choosing between two hypotheses/designs), run both orderings and treat disagreement as a tie, or randomize order across k>=3 trials. (c) Report uncertainty; a single pairwise verdict is not evidence.

### F6. Verbosity/style bias: judges are swayed by length, polish and confident tone more than by correctness; recent evidence says STYLE (not raw length) is the dominant bias

Evidence:
- Zheng et al. (snippets): "repetitive list" attack - "both GPT-3.5 and Claude-v1 show a verbosity bias towards the longer and repetitive answer. However, only GPT-4 successfully detected this attack."
- Judging-the-Judges 2026 (snippets): "Style bias is the dominant bias (0.76-0.92 across all models), far exceeding position bias (<= 0.04)"; but "truncation controls confirm they correctly distinguish quality from length (0.92-1.00 accuracy)".
- CALM dataset (read): verbosity injected by "creating longer versions with redundant content while maintaining answer quality"; sentiment/tone perturbations; authority = added references/URLs; bandwagon = "90% of people believe".

Confidence: medium.

Implication: the outside judge should receive a STYLE-STRIPPED artifact: the diff and test outputs, not the author's prose ("I carefully tested...", "this is the robust approach"). Strip PR descriptions, commit-message rhetoric, and comments that assert quality. Ask for binary verifiable claims, not a 1-10 quality score.

### F7. Self-preference / self-enhancement: models favor their own outputs, partly legitimately, but the HARMFUL part is strongest exactly when the model is wrong - and stronger models are worse at recognizing that

Evidence:
- Zheng et al. (snippets): "GPT-4 favors itself with a 10% higher win rate; Claude-v1 favors itself with a 25% higher win rate."
- Panickssery et al. NeurIPS 2024 (snippets): GPT-4 recognizes its own outputs at 73.5% (pairwise, no training); fine-tuning to improve self-recognition linearly increases self-preference "even if humans would rate different LLM outputs similarly"; bias "more pronounced in larger, more capable models".
- Chen et al. 2025 (snippets): on verifiable tasks (math, factual, code) "much of this preference aligns with objectively superior performance" BUT "harmful self-preference persists when evaluator models err as generators, and stronger models display more pronounced harmful self-preference when they do err"; "generating a long Chain-of-Thought before evaluation effectively reduce[s] the harmful self-preference".
- "Narcissists?" 2026 (snippets): warns that many self-preference measurements are confounded with quality; use oracle labels.
- Anthropic SDLC blog (read): "Anthropic recommends heterogeneous review models where possible because one model family may share blind spots across generation and evaluation."
- Refute-or-Promote (snippets): "cross-family review found correctness issues in 3/19" that same-family review missed.

Confidence: medium-high.

Implication: the bug the author-model cannot see is precisely the one it will also fail to see as a judge. So: (1) the OUTSIDE judge should be a different model family when available (or at minimum a different model tier + different prompt persona), (2) hide provenance (never tell the judge "Claude wrote this" or "this was refined after review" - CALM's compassion-fade and refinement-aware biases), (3) force long reasoning before verdict, (4) treat same-model approval as weak evidence and require executable evidence (tests) to carry the decision.

### F8. Sycophancy toward the author: models change correct answers when challenged and rate work by whether the user likes it - so the author must never be allowed to "argue" with the reviewer

Evidence (Sharma et al. 2023, arXiv 2310.13548; datasets read at github meg-tong/sycophancy-eval): tasks - feedback sycophancy (user says "I really like the argument" / "I really dislike" / "I wrote this"), are-you-sure (model presented with its correct answer then challenged; example flips "China" -> "India"), answer sycophancy ("I think the answer is Nitrogen, but I'm really not sure"). Abstract: "five state-of-the-art AI assistants consistently exhibit sycophancy across four varied free-form text-generation tasks"; in hh-rlhf (15k comparisons) "matching user beliefs" was among the most predictive features of human preference, so RLHF rewards it.

Corroboration: CW-POR paper (snippet) - "even smaller models can forcefully and confidently advocate for false claims, eliciting high-confidence errors from their judging counterpart".

Confidence: high for the phenomenon; exact percentages not fetched.

Implication: (1) The reviewer must not be in dialogue with the author. The author's only permitted response to a finding is a NEW artifact version + evidence (test, repro), which goes through a fresh reviewer. (2) Blind the reviewer to authorship, to the author's confidence statements, and to who is asking. (3) If a contested finding must be resolved, use symmetric debate (F10), not one-sided pushback.

### F9. Blind review in science: knowing the author inflates acceptance odds 1.6-2.1x; the LLM analogues (authority, bandwagon, refinement-aware, compassion-fade) are all measurable

Evidence:
- Tomkins, Zhang, Heavlin, PNAS 2017 (snippets, multiple agree): WSDM 2017 experiment, each paper scored by two single-blind and two double-blind PC members; "odds multipliers are 1.63 for famous authors and 1.58 and 2.10 for top universities and companies"; single-blind reviewers "bid for 22% fewer papers, and preferentially bid for papers from top institutions".
- CALM (ICLR 2025; dataset README read): authority bias injected by "adding references (books, quotes, URLs)"; bandwagon by "90% of people believe"; refinement-aware by presenting "polished versus initial answer versions"; compassion-fade by varying "model identifiers and names". Snippets: "Authority and bandwagon biases cause judges to favor responses with citations, a confident tone, or claims of majority approval, even when those signals are irrelevant or fabricated"; "Refinement-aware bias occurs when judges score an answer higher simply because they are told it was refined".

Confidence: high (Tomkins numbers consistent across sources); medium for CALM specifics.

Implication: the OUTSIDE judge stage should be literally double-blind: no author identity (human or model), no "this passed 2 reviews already", no "the senior reviewer approved", no citations-as-decoration in the PR text. Present the artifact as if it were an anonymous submission with a spec and test evidence.

### F10. Majority vote of N judges is mostly an illusion unless the judges are genuinely independent; diversity of family/prompt/evidence matters more than count

Evidence:
- Nine Judges, Two Effective Votes (Apple, 2026; snippets): 9 frontier LLMs from 7 families on 3 NLI datasets (100 human annotations per item): Kish effective sample size ~2; "roughly three-quarters of the panel's nominal independence is lost because the models make the same mistakes on the same items"; panel accuracy 8-22 pp below the Condorcet independent-voting ideal; "the best single judge matches or outperforms the full panel"; aggregation methods "close at most 11% of this gap, even with access to the correct answers"; robust across prompts, temperature, CoT, RewardBench.
- PoLL (Verga 2024; snippets): three SMALL models from DIFFERENT providers beat single GPT-4 on human-agreement (Cohen's kappa) at 1/7 the cost and reduce intra-model bias - i.e. diversity helped where scale alone did not.
- Refute-or-Promote (snippets): "80+ agents unanimously endorsed a non-existent vulnerability; 3 independent agents made identical errors".
- Anthropic building-effective-agents (read): voting pattern is for "several different PROMPTS review and flag the code" with "different vote thresholds to balance false positives and negatives" - i.e. prompts differ, not just samples.
- Anthropic multi-agent research (read): "a single LLM call with a single prompt outputting scores from 0.0-1.0 and a pass-fail grade was the most consistent and aligned with human judgements" - multiple judges were LESS reliable there.

Confidence: medium-high.

Implication: do NOT build "5 Claude reviewers vote". Build a small panel whose members differ along axes that de-correlate errors: (a) model family, (b) mandate/persona (bug hunter vs spec auditor vs security vs "user of the feature"), (c) evidence source (one reads code, one only runs tests/black-box, one only checks spec-vs-behavior). Use votes to gate and to route ("2 of 3 independent finders flagged it -> escalate"), never as ground truth. When budget is limited, one strong, well-instructed judge + per-finding verification beats a homogeneous panel.

### F11. Adversarial "try to refute this" gating is the single best-evidenced precision lever - applied to FINDINGS, not to the artifact

Evidence:
- Refute-or-Promote (snippets): 31-day campaign, 7 targets (security libs, ISO C++ standard, compilers); adversarial agents "attempt to disprove candidates at each promotion gate"; ~79% of 171 candidates killed before disclosure (83% prospective on n=30); outcomes 4 CVEs, LWG 4549 accepted, 5 merged editorial PRs; design elements: kill mandates, "context asymmetry", "cold-start reviewers ... to reduce anchoring cascades", cross-model critic.
- Claude Code (read): per-finding validation subagents (plugin); ultrareview "independently reproduced and verified"; workflows doc: "have independent agents adversarially review each other's findings before they're reported"; /deep-research "votes on each claim, and returns a cited report with claims that didn't survive cross-checking filtered out. When the verifier agents can't check a claim ... the report lists that claim as unverified instead of counting it as refuted."
- CriticGPT (snippets): critic critiques preferred over human ones 63% of the time "partly because CriticGPT generated fewer unhelpful nitpicks ... and less false positives"; FSBS lets you trade precision for recall.
- Debate (Khan 2024; snippets): symmetric adversaries raise a non-expert judge from 48% -> 76% (LLM) and 60% -> 88% (human); single-advocate "consultancy" is worse.

Confidence: medium-high.

Implication: the funnel's review stages should be "finder -> refuter -> (if survives) reporter". The refuter's mandate is to KILL the finding (find a reason it's wrong, unreachable, pre-existing, linter-covered). Findings the refuter cannot check are reported as "unverified", never silently dropped and never promoted. For high-stakes contested findings, run a symmetric debate (advocate vs refuter) in front of a judge that sees both transcripts.

### F12. Holistic scores are unreliable; binary verifiable criteria with evidence and an explicit "Unknown" option are what production judges use

Evidence (read directly):
- Anthropic multi-agent research: rubric = factual accuracy, citation accuracy, completeness, source quality, tool efficiency; "0.0-1.0 and a pass-fail grade was the most consistent".
- Anthropic demystifying evals: code graders "Fast, Cheap, Objective, Reproducible" but brittle; model graders "Non-deterministic ... Requires calibration with human graders"; "LLM-based rubrics should be frequently calibrated against expert human judgment"; "give the LLM a way out, like providing an instruction to return 'Unknown'"; grade the OUTCOME (state in the environment) and separately the transcript; pass^k for consistency.
- Plugin prompt: only three flaggable classes, each verifiable (won't compile; definitely wrong regardless of input; quotable rule violation).
- Rubrics survey 2606.08625 (snippet): holistic scoring "susceptible to conflation ... a response that is factually accurate but poorly written may receive an intermediate score"; analytic rubrics prevent halo effects and let you measure per-criterion reliability; Huynh et al. 2026: examples improve consistency, "excessive complexity reduces it".
- BadScientist (snippet): "concern-acceptance conflict" - reviewers flag integrity issues yet assign accept-level scores.

Confidence: high.

Implication: reviewer/judge output schema = list of {claim, file:line, failure scenario, evidence, verdict in {confirmed, refuted, unverifiable}}. The FINAL verdict is computed by a rule (any confirmed blocker -> reject; any unverifiable blocker -> hold), not by asking the same LLM "so, overall, accept?". Keep rubrics short (<10 binary items) with one example per item.

### F13. Context rot: long contexts degrade judgment; reviewers must be short-lived, single-purpose and fed minimal curated input

Evidence:
- Chroma Context Rot (snippets): 18 models "exhibit this behavior at every input length increment tested"; degradation "even on simple tasks like retrieval and text replication"; distractors and haystack structure matter.
- Claude Code best-practices (read): "LLM performance degrades as context fills ... Claude may start 'forgetting' earlier instructions or making more mistakes"; "If you've corrected Claude more than twice on the same issue in one session, the context is cluttered with failed approaches. Run /clear"; "A clean session with a better prompt almost always outperforms a long session with accumulated corrections."
- Sub-agents doc (read): subagent initial context = its own system prompt + task message + CLAUDE.md + git status + preloaded skills; it does NOT get the main conversation.

Confidence: high.

Implication: each reviewer/judge = fresh subagent with a short system prompt, the spec, the diff, and evidence; nothing else. Do not "compact and continue" a reviewer. Big diffs must be split (F16) so each reviewer's input stays small.

### F14. Reviewers must EXECUTE, not just read; claims of success must carry evidence artifacts; summaries from subagents are not trustworthy by default

Evidence (read directly):
- Harness post: evaluator "use[s] the Playwright MCP to click through the running application the way a user would"; sprint contract: "if any one fell below it, the sprint failed and the generator got detailed feedback"; example "FAIL - Tool only places tiles at drag start/end points instead of filling the region."
- Effective harnesses: "Providing Claude with these kinds of testing tools dramatically improved performance, as the agent was able to identify and fix bugs that weren't obvious from the code alone"; feature list "all initially marked as 'failing'"; premature "declare the job done".
- Best practices: "Have Claude show evidence rather than asserting success: the test output, the command it ran and what it returned, or a screenshot"; "If you can't verify it, don't ship it."
- /goal doc: the evaluator "doesn't run commands or read files independently, so write the condition as something Claude's own output can demonstrate" - i.e. a transcript-only judge is limited by what the author chose to show.
- GitHub issue #39981 (user report, not a study): "20-30% of subagent reports contain at least one claim that doesn't match the underlying tool output"; examples: "found 15 relevant files" when 3 found and 12 inferred; "searched all locations" after 2/5 dirs.

Confidence: high (docs); low (issue percentages).

Implication: (1) the author stage must emit an evidence bundle: exact commands + raw outputs + test results + (for UI) screenshots; (2) the reviewer re-runs the tests itself (read-only on source, but allowed Bash for test/build); (3) a transcript-only judge (like /goal) is acceptable as a cheap gate but not as the outside verdict; (4) the orchestrator should verify subagent claims against tool output (counts, file lists) with deterministic checks where possible.

### F15. Independence must be enforced STRUCTURALLY (hooks, required checks, tool restrictions), not by instructions; and risk-tier which changes get the heavy path

Evidence (read directly):
- agent-approval-check.yml: requires N (default 2) human approvals when the PR contains commits from agent identities (noreply@anthropic.com, claude[bot], claude-code[bot]); "Both triggers run the workflow file from the BASE/DEFAULT branch, so a PR cannot edit this check to approve itself"; bot approvers can be excluded; marked as a required status check; exempt paths and protected bases configurable.
- Anthropic SDLC blog: "Automated reviews are a different type of risk that is controlled differently (through multiple gates and agents with separate context windows)"; "They do not share biases and blindspots. If one is compromised or makes a mistake, it can be caught by other reviewers"; "Tiering our codebase by risk"; "Every approval is logged with the signals and reasoning behind it, and a risk-weighted sample is reviewed by humans."
- Best practices: "Unlike CLAUDE.md instructions which are advisory, hooks are deterministic and guarantee the action happens"; Stop hook "blocks the turn from ending until it passes".
- Sub-agents doc: reviewer agents with tools: Read, Grep, Glob (no Edit/Write).
- Meta RADAR (snippets): funnel = eligibility gates -> static heuristics -> ML risk score -> LLM review -> deterministic validation; 331K+ diffs landed; revert rate 1/3 and incident rate 1/50 of non-RADAR diffs; widening the risk envelope p25 -> p50 raised approve rate to 60.31% with stable safety.
- Claude Code Review internal: small PRs (<50 lines) get findings only 31% of the time (0.5 avg) vs 84% (7.5 avg) for >1000 lines.

Confidence: high.

Implication: (1) reviewers are read-only subagents (plus test execution) - enforce via `tools:` in .claude/agents; (2) a Stop hook / CI required check enforces "no merge without reviewer + judge verdict"; (3) the check definition lives outside the branch under review; (4) route by risk: trivial/low-risk diffs skip the outside judge (RADAR), high-risk paths (auth, payments, migrations, PII) require human approval on top; (5) log every verdict with its evidence for audit and calibration.

### F16. Keep reviewable units small: human inspection data says <400 LOC/60-90 min; Google medians are ~24 lines with 1 approver; understanding is the bottleneck

Evidence:
- SmartBear/Cisco (snippet): "review no more than 200 to 400 lines of code ... beyond 400 LOC, the ability to find defects diminishes"; "200-400 LOC over 60 to 90 minutes should yield 70-90% defect discovery".
- Google (snippet): median change ~24 lines, ~90% touch <10 files, median 1 approver, <25% have >1.
- Bacchelli & Bird (read): "Understanding code and changes emerged as the critical bottleneck"; defects are a minority of review comments despite being the main expectation.
- Claude Code Review docs: cost and time scale with PR size; ultrareview limits: 500 files / 8,000 changed lines.

Confidence: medium (numbers are practitioner studies, not RCTs).

Implication: the funnel's decomposition stage should target units of roughly <=300 changed lines with their own acceptance criteria, so that the independent reviewer's input is small (also helps F13) and the "send back to the beginning" loop is cheap. Large tasks get many small reviews, then one integration review.

### F17. AI review output has lower adoption and more wrong suggestions than human review unless aggressively filtered; developers tune out noisy reviewers

Evidence:
- Human-AI Synergy (snippets): 278,790 review conversations / 300 projects: AI suggestions "adopted into the codebase at a significantly lower rate"; "Over half of unadopted suggestions from AI agents are either incorrect or addressed through alternative fixes"; adopted AI suggestions "produce significantly larger increases in code complexity and code size".
- Claude Code Review docs (read): REVIEW.md patterns: "Report at most five nits ... say 'plus N similar items'"; "behavior claims need a file:line citation in the source, not an inference from naming"; "after the first review, suppress new nits and post Important findings only"; "Length has a cost: a long REVIEW.md dilutes the rules that matter most."
- Plugin prompt (read): explicit do-not-flag list; only "obvious"/"significant" bugs.
- Liang et al. (read): GPT-4 feedback overlaps humans as much as humans overlap each other (30.85% vs 28.58%; 39.23% vs 35.25%) but "struggles to provide in-depth critique of method design" and is generic.

Confidence: medium.

Implication: precision over recall in what reaches the author: cap nits, require citations, separate "Important" from "Nit" from "Pre-existing", and measure the thumbs-down rate per reviewer to recalibrate thresholds. Expect the outside judge to be good at "is this wrong/incomplete" and weak at "is this the best design" - so route design questions to the hypothesis-checking stage, not to the final judge.

### F18. Bias mitigation is model-dependent; calibrate reviewers against a labeled set instead of assuming a technique works

Evidence:
- Judging the Judges 2026 (snippets): 9 strategies x 5 judges x 3 benchmarks: "Debiasing is beneficial but model-dependent"; combined strategy +11.2 pp for Claude Sonnet 4 (p<0.0001); position swap significant only for Gemini Flash (+4.7 pp).
- Coin Flip Judge (snippets): cross-judge agreement kappa 0.51; template wording flips 25% of majorities.
- Anthropic demystifying evals (read): calibrate model graders against human judgment; Code Review collects thumbs up/down "and uses them to tune the reviewer".
- Harness post (read): "The tuning loop was to read the evaluator's logs, find examples where its judgment diverged from mine, and update the QA's prompt"; rubric wording ("museum quality") leaked into and steered the generator.

Confidence: medium-high.

Implication: ship the funnel with a small regression set of "seeded bugs" (as in CCR: inject known errors into a real artifact) and measure each reviewer's precision/recall before trusting it; re-run when models or prompts change. Keep the evaluator's rubric out of the generator's context so grading criteria don't steer style.

### F19. Fresh-context evaluators are still generous by default and need skepticism tuning; separation is necessary but not sufficient

Evidence (read directly): harness post - "the evaluator is still an LLM that is inclined to be generous towards LLM-generated outputs"; "I watched it identify legitimate issues, then talk itself into deciding they weren't a big deal and approve the work anyway"; the fix was an explicit skeptical mandate + contract-based pass/fail ("if any one fell below it, the sprint failed"). Sakana AI-Scientist README: "all other models have issues with positivity bias". BadScientist: concern-acceptance conflict.

Confidence: high.

Implication: give the reviewer a prosecutorial mandate ("your job is to find a reason this must go back"), a contract of binary must-pass items, and a rule that ANY failed contract item = FAIL, with no discretionary override. Keep "severity" and "verdict" as separate fields computed by rule.

### F20. Cost/latency budget: independent review is worth it when the task exceeds what the model does reliably solo; scale the funnel by risk, not uniformly

Evidence (read): harness post - $200 vs $9 for the game-maker task; with Opus 4.6 "the sprint construct, context resets, and per-sprint evaluator were stripped" leaving planner + generator + end-of-run evaluator; "It is worth the cost when the task sits beyond what the current model does reliably solo." Code Review: $15-25 and ~20 min per PR; ultrareview 5-10 min, $5-25; small PRs rarely yield findings. RADAR: automate low-risk. Anthropic evaluator-optimizer: use "when you have clear evaluation criteria, and when iterative refinement provides measurable value".

Confidence: high.

Implication: make the funnel's review depth a function of risk and size (tiny/low-risk: tests + one cheap finder; medium: finder panel + refuter; high-risk/large: full panel + cross-family outside judge + human), and revisit the tiers as models improve.

---

## Anti-patterns (things known NOT to work, with why)

1. "Now double-check your work" in the author's own context. Intrinsic self-correction lowers accuracy (GSM8K 95.5 -> 89.0), and repeated self-review was the worst condition in CCR (F1 21.7%). The model rationalizes rather than scrutinizes.
2. Giving the reviewer the author's transcript / plan reasoning "so it has full context". The context-aware subagent (SA) scored BELOW plain self-review in CCR; Anthropic's design intentionally shows the reviewer "only the diff and the criteria".
3. Multiple review rounds on the same artifact version. F1 0.376 -> 0.26-0.30, false positives +62%, precision 0.30 -> 0.20; reviewers fabricate when real errors are exhausted and drift to critiquing the conversation.
4. Majority vote of N clones of the same model/prompt. 9 judges from 7 families ~ 2 effective votes; 80+ agents unanimously endorsed a non-existent vulnerability; aggregation cannot fix correlated errors.
5. Single-ordering pairwise "which is better" verdicts. 13.6% flip rate on identical re-runs, 72% first-position bias in one judge, kappa 0.51 between judges; Zheng: Claude-v1/GPT-3.5 consistent in well under half of swaps.
6. Letting the author argue with the reviewer, or including "I tested this thoroughly", authority citations, "90% of engineers do it this way", "this was already refined after review". Sycophancy, authority, bandwagon and refinement-aware biases all inflate scores; single-blind review gave famous authors 1.63x odds.
7. Holistic 1-10 "overall quality" scores as the verdict. Conflation/halo; concern-acceptance conflict (flag integrity issues, still accept); Anthropic found pass/fail + 0-1 rubric most consistent.
8. Open-ended "find all gaps" reviewer prompts with no do-not-flag list. Reviewers "will usually report some [gaps], even when the work is sound"; leads to over-engineering and nit floods; AI suggestions already have low adoption and >50% of unadopted ones are wrong.
9. Transcript-only judges as the final gate. /goal's evaluator "doesn't run commands or read files"; subagent summaries mis-state tool output (user-reported 20-30%); evaluators that only read the code miss what running it reveals.
10. Review checks that live in the branch under review. A PR can edit its own check; agent-approval-check runs from the base branch via pull_request_target for this reason.
11. Same model family for generation and final gate with provenance visible. Shared blind spots; harmful self-preference is strongest when the model is wrong and stronger models are worse at seeing it; Anthropic recommends heterogeneous review models.
12. Long-lived reviewer sessions that "compact and continue". Context rot degrades every model tested; Claude Code's own guidance is /clear after two failed corrections.
13. Long REVIEW.md / rubric files. "Length has a cost: a long REVIEW.md dilutes the rules that matter most"; excessive rubric complexity reduces consistency.
14. Evaluator rubric text visible to the generator. Rubric phrases ("museum quality") steered the generator's outputs; grading criteria should not be a style prompt.
15. Uniform heavy review for every change. Small PRs (<50 lines) produce findings 31% of the time with 0.5 findings avg; RADAR shows risk-tiered auto-approval keeps safety while raising throughput; review depth should scale with risk.
16. Assuming a debiasing trick works for your model. Position swap helped one model significantly and others not at all; mitigation effects are model-dependent - measure.

---

## Open questions

1. Does the cross-context advantage hold on LARGE codebases where the reviewer genuinely needs repository context? CCR used 30 small artifacts. The Claude Code answer is "diff + surrounding code the reviewer fetches itself", i.e. the reviewer pulls context on demand rather than receiving the author's context - but I found no controlled study of that specific design.
2. How much independence does a different PROMPT/persona buy versus a different MODEL FAMILY? Nine Judges suggests 7 families still collapse to ~2 votes; Refute-or-Promote found cross-family review caught 3/19 extra issues. For a Claude-only funnel, what is the best achievable de-correlation (different evidence sources? black-box test execution vs code reading?). Unstudied.
3. Specialization vs voting: Claude Code uses 4 specialized finders + per-finding verifiers rather than a voting panel; Anthropic's research system found one rubric judge more consistent than several. Is "disjoint mandates" the right form of diversity? Plausible but not measured.
4. Harmful self-preference for code specifically: Chen et al. show it on verifiable tasks including code generation, but I could not read magnitudes. Does Claude-reviewing-Claude code show it at the same rate as GPT-reviewing-GPT?
5. The <1% "marked incorrect" rate for Claude Code Review is a vendor-reported thumbs-down rate on Anthropic's own PRs; independent precision/recall on external repos is unknown (third-party benchmark snippets claimed very different precision figures for various tools, all vendor-run).
6. Exact numbers for several classic results (Zheng position-swap table, Sharma sycophancy percentages, PoLL kappa values) could not be verified because arXiv/PNAS/OpenReview were blocked; they should be re-checked before being quoted in a deliverable.
7. Optimal number of trials: Coin Flip Judge says 11-15 repeated trials to stabilize a pairwise verdict; is repeated sampling of an absolute-criteria judge needed at all if criteria are binary and evidence-backed? Likely far fewer, but unmeasured.
8. How to blind the outside judge to "process" while still giving it the SPEC: the spec is process output too. Working assumption: spec = allowed (it is the contract), transcript/plan reasoning/review history = not allowed.
9. Debate for contested findings: strong evidence on QA tasks (Khan 2024), but persuasion-override risk (CW-POR) exists; no evidence on code-review findings specifically.

---

## Design implications for the funnel

### Stage map (review-related parts only)

```
[Decompose] -> units <=~300 changed lines, each with binary acceptance criteria + risk tier
      |
[Execute] -> author agent produces: diff + EVIDENCE BUNDLE (commands run, raw outputs, tests, screenshots)
      |
[Independent review]  (fresh subagents; read-only on source; may run tests)
   finders (disjoint mandates, ONE pass each, on this version only):
     - bugs-in-diff        (Opus-class; "only what you can validate from the diff")
     - logic/security      (Opus-class)
     - spec compliance     (checks every acceptance criterion; verdict per criterion)
     - project rules       (CLAUDE.md; must quote the rule)
     - history/blame       (optional; context-based regressions)
   refuters: one per candidate finding, mandate = kill it; output confirmed / refuted / unverifiable
   reporter: dedup, severity (Important / Nit / Pre-existing), cap nits, file:line + failure scenario
   -> any confirmed Important = SEND BACK (to decomposition if the spec is wrong, to execution otherwise)
      |
[Outside judge] (only for medium/high risk tiers)
   input: spec + final diff + evidence bundle. NO transcript, NO review history, NO author identity, NO PR prose.
   model: different family if available; else different tier + prosecutorial persona; forced long reasoning
   output: per-criterion binary verdicts with evidence + "unverifiable" allowed; final verdict computed by rule
   contested items: symmetric debate (advocate vs refuter) -> judge sees both
      |
[Enforcement] hooks / required status check defined outside the branch; human approval for high-risk paths;
              every verdict logged; thumbs-up/down feeds calibration
```

### Concrete rules derived from the evidence

1. Reviewer context = {spec, diff, evidence}. Nothing from the author's session. (F1, F13)
2. Reviewers are new subagents with `tools: Read, Grep, Glob, Bash(test/build only)`; no Edit/Write. (F15)
3. One pass per reviewer per artifact version; re-review only on a new version, scoped to changed lines + prior findings; reviewer must be allowed to say "no issues". (F3)
4. Every finding passes an independent refuter before it is shown to anyone; unverifiable != refuted. (F11)
5. Do-not-flag list is explicit: pre-existing, linter-caught, style, speculative input-dependent, anything without file:line evidence. Cap nits. (F4, F17)
6. Findings schema: claim / location / failure scenario / evidence / status. Verdict computed by rule from statuses. Never a holistic score. (F12, F19)
7. Author never replies to a reviewer in prose. The reply is a new version + evidence, re-reviewed fresh. (F8)
8. Outside judge is double-blind: strip authorship, model identity, "already reviewed", citations, confidence language. (F7, F9)
9. Panel diversity along mandate / evidence source / model family, not clone count; use votes to route and gate, not as truth. (F10)
10. Pairwise comparisons only with both orderings and >=3 randomized trials; prefer absolute criteria. (F5, F6)
11. Executable verification is mandatory: reviewer re-runs tests; UI changes need screenshots; transcript-only judges are cheap pre-gates only. (F14)
12. Risk tiering decides depth: low-risk = tests + one finder; medium = panel + refuters; high = + outside judge + human. (F15, F20)
13. Enforcement via hooks / required checks living on the base branch; approvals by agents don't count; all decisions logged. (F15)
14. Calibrate: keep a seeded-bug regression set; measure each reviewer's precision/recall; collect thumbs-down; keep REVIEW.md short; re-tune when models change. (F18)
15. Keep the judge's rubric out of the generator's prompt. (F18)
