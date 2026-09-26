# DIGEST — исследование для «воронки / сепаратора» vibe-coding на больших проектах

Дата синтеза: 2026-09-26. Входы: 13 заметок (anthropic-agents, spec-driven, review-judging, decomposition, hypothesis, failure-modes, quality-systems, verification-tech, gap-intake-extraction, gap-risk-router-telemetry, gap-state-machine-loops-human-gates, gap-outside-verdict-blackbox, gap-legacy-onboarding) + список слабых/противоречивых утверждений от критика.

Пометки достоверности (стоят у цифр и спорных утверждений):
- **[F]** — первоисточник прочитан (code.claude.com, anthropic.com, claude.com, github.com/raw, microsoft.com, cloud.google.com).
- **[S]** — первоисточник заблокирован прокси; данные из поисковых сниппетов/зеркал; цифры НЕ перепроверены.
- **[M]** — по памяти исследователя; перед внешним цитированием проверить.
- **[V]** — vendor-reported (самоотчёт Anthropic или производителя инструмента), не независимое измерение.

Правило чтения: всё, что помечено [S]/[M]/[V], в дизайне используется как *направление*, а не как *число*. Где источники расходятся — раздел 4. Где исследование не решает — раздел 5.

---

## 1. Ключевые принципы (правила дизайна воронки)

**П1. Маршрутизируй по риску и размеру; полный процесс — только для тяжёлого.**
Воронка имеет три пути (LIGHT / MEDIUM / HEAVY) с детерминированными «полами» (миграции, auth, контракты, зависимости, user-declared HIGH → минимум MEDIUM/HEAVY) и аддитивным скорингом (строки, файлы, модули, overlap-зоны, co-change, churn, новизна, отсутствие тестов, неоднозначность). Веса — только prior; калибруются по своей телеметрии после ~50 задач. «If you could describe the diff in one sentence, skip the plan» [F]. На PR <50 строк managed Code Review находит что-то в 31% случаев (0.5 находки), на >1000 строк — 84% (7.5) [V].
Источники: https://code.claude.com/docs/en/best-practices ; https://claude.com/blog/code-review ; https://www.microsoft.com/en-us/research/publication/mining-metrics-to-predict-component-failures/

**П2. Инварианты — в hooks/скриптах/CI; CLAUDE.md и skills — только советы.**
«Unlike CLAUDE.md instructions which are advisory, hooks are deterministic» [F]. Exit 2 в PreToolUse блокирует вызов даже при JSON allow [F]. Всё, что в CLAUDE.md написано словами «always/never», — кандидат в hook. Управляемые/managed settings — единственный способ организационной гарантии [F].
Источники: https://code.claude.com/docs/en/hooks ; https://code.claude.com/docs/en/features-overview ; https://code.claude.com/docs/en/memory

**П3. Тот, кто делает, не оценивает; оценщик — свежий контекст с скептическим мандатом.**
Самооценка: агенты «confidently praising the work — even when… obviously mediocre» [F]; «tuning a standalone evaluator to be skeptical turns out to be far more tractable» [F]. Даже свежий evaluator «talked itself into approving» — нужен контракт с жёсткими бинарными порогами: «if any one fell below it, the sprint failed» [F].
Источники: https://www.anthropic.com/engineering/harness-design-long-running-apps ; https://code.claude.com/docs/en/best-practices ; https://code.claude.com/docs/en/goal

**П4. «Done» = исполненные проверки с артефактами, а не текст в транскрипте.**
«Claude stops when the work looks done. Without a check it can run, "looks done" is the only signal» [F]. Evidence bundle = команда + полный вывод + exit code + JUnit/JSON-отчёт + скриншот; парсить количество тестов (не только exit 0: `sys.exit(0)` подделывает успех [F]). Транскриптовые судьи (`/goal`, prompt-hook) «don't run commands or read files» [F] — только вспомогательный гейт.
Источники: https://code.claude.com/docs/en/best-practices ; https://www.anthropic.com/research/emergent-misalignment-reward-hacking ; https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md

**П5. Маленькие партии: одна фича, один контекст, ~100–300 изменённых строк.**
«100 lines is usually a reasonable size for a CL, and 1000 lines is usually too large» [F]; «work on only one feature at a time… critical to addressing the agent's tendency to do too much at once» [F]; ultrareview отказывает >8000 строк [F]. Рефакторинг — отдельная единица.
Источники: https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md ; https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents ; https://code.claude.com/docs/en/ultrareview

**П6. Свежий контекст на каждую стадию; состояние живёт на диске в репозитории, не в чате.**
Context rot — измеренная, плавная деградация [F, Chroma README; цифры S]. «After two failed corrections, /clear» [F]. Субагенты не видят историю разговора [F]; workflow-скрипт хранит промежуточные результаты только в переменных прогона, resume — только в той же сессии, упавший агент перезапускает всех после себя [F]. Значит: ledger `.workflow/<id>/state.json` + evidence + spec + acceptance — в git; каждый агент пишет результат на диск до возврата.
Источники: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents ; https://code.claude.com/docs/en/workflows ; https://code.claude.com/docs/en/sub-agents

**П7. Циклы ограничены по застою (stall), а не по счётчику; исчерпание → recycle на более раннюю стадию с переписанным spec в новом контексте, никогда «try again» на месте.**
Пять несовместимых лимитов в источниках (2 исправления, 3 strikes, 5 раундов, 8 Stop-блоков, 10 Ralph-итераций) считают разное. Механический тест прогресса из OpenHands StuckDetector: 3–4 идентичных action/observation, A/B/A/B чередование [F]. Лестница: rung0 self-loop (только stall-test) → rung1 раунды 1–3 тот же implementer → rung2 раунды 4–5 свежий на более сильной модели → rung3 re-decompose → rung4 человек/kill. Stop-hook cap 8 и auto-mode 3/20 — подстраховка подложки, не регулятор.
Источники: https://code.claude.com/docs/en/best-practices ; https://raw.githubusercontent.com/All-Hands-AI/OpenHands/0.20.0/openhands/controller/stuck.py ; https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md

**П8. Тесты, snapshots, CI-конфиг, `.claude/**` — защищённый актив; implementer к ним не прикасается; RED до GREEN — с записью.**
«It is unacceptable to remove or edit tests» [F]; обученная модель вызывала `sys.exit(0)` и в 12% случаев саботировала детекторы [F]; агентные коммиты чаще трогают тесты (23% vs 13%) и добавляют mocks (36% vs 26%) [S]. Sandbox runtime сам запрещает запись в `.claude/agents`, `.mcp.json`, `.git/hooks` [F]. Отдельная роль test-author; гейт «новые тесты падают на base, проходят на head» (SWE-bench FAIL_TO_PASS/PASS_TO_PASS [F]).
Источники: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents ; https://www.anthropic.com/research/emergent-misalignment-reward-hacking ; https://github.com/SWE-bench/SWE-bench/blob/main/swebench/harness/grading.py

**П9. Ревью = finders (разные линзы) → refuter на каждую находку → dedupe/severity → только подтверждённое возвращается автору; «unverified ≠ refuted».**
Так устроены managed Code Review и ultrareview («every reported finding is independently reproduced and verified») [F]; /deep-research «lists that claim as unverified instead of counting it as refuted» [F]. Плагин: «If you are not certain an issue is real, do not flag it» [F]. Severity выводится из подтверждённого последствия по file:line, не из тона модели; do-not-flag список; cap 5 nits; после первого раунда — только Important.
Источники: https://code.claude.com/docs/en/code-review ; https://code.claude.com/docs/en/workflows ; https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/code-review/commands/code-review.md

**П10. Независимость ревьюера обеспечивается структурно, а не инструкцией: отдельный контекст, отдельная модель/семейство где возможно, изоляция записи, гейт вне ветки под ревью.**
`tools: Read, Grep, Glob, Bash` НЕ read-only — Bash пишет файлы; нужны `disallowedTools: Edit, Write` + PreToolUse-guard на записи/git-мутации + worktree/clone. Проверка-гейт запускается с base-ветки (`pull_request_target`), «so a PR cannot edit this check to approve itself» [F]. «Use a different model to evaluate than the model used to generate» [F]; агенты с разными контекстами «do not share biases and blindspots» [F].
Источники: https://code.claude.com/docs/en/sub-agents ; https://raw.githubusercontent.com/anthropics/claude-code-action/main/examples/agent-approval-check.yml ; https://platform.claude.com/docs/en/test-and-evaluate/develop-tests

**П11. Внешний вердикт видит контракт и артефакт, но не процесс.**
Ни один проверенный рецепт не даёт «аутсайдеру» только исходную просьбу: всегда есть критерии/контракт [F best-practices, harness-design]. «Без контекста» = без плана, транскрипта, прошлых ревью, provenance (модель/автор/число итераций), PR-прозы и комментариев — это измеренные каналы authority/bandwagon/refinement-bias [S CALM; определения F по README датасета] и скрытых инъекций [F security.md]. Два декоррелированных под-тира: B (поведенческий, только артефакт@sha + baseline@merge-base + критерии) и C (читает diff без комментариев + base tree). Ни один не видит другого.
Источники: https://code.claude.com/docs/en/best-practices ; https://raw.githubusercontent.com/anthropics/claude-code-action/main/docs/security.md ; https://raw.githubusercontent.com/Y0oMu/LLM-Judge-Bias-Dataset/main/README.md

**П12. Вердикт вычисляет правило из бинарных критериев; «unknown» — первоклассный исход.**
«A good task is one where two domain experts would independently reach the same pass/fail verdict» [F]; «single LLM call… 0.0–1.0 and a pass-fail grade was the most consistent» [F]; «give the LLM a way out… "Unknown"» [F]. Никаких холистических 1–10 и попарных «что лучше» в вердикте (position bias, flips [S]). Any confirmed FAIL блокирующего критерия → FAIL; unknown → hold/человек, не fail и не pass; PASS привязан к sha.
Источники: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents ; https://www.anthropic.com/engineering/multi-agent-research-system ; https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets.md

**П13. Автор не спорит с ревьюером прозой: ответ — новая версия + evidence; спорное решает свежий адъюдикатор, который сам переисполняет команды.**
Сикофантия: модели меняют правильный ответ под давлением, RLHF поощряет «matching user beliefs» [F Anthropic research page; величины S]; в одностороннем «consultancy» судья хуже, чем в симметричном debate [S; репо F]. Находки возвращаются implementer'у как входные данные (verbatim, Critical/Important, с repro), а не как диалог; возражение «кодом» (тест, воспроизведение) допустимо, возражение словами — нет.
Источники: https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models ; https://github.com/ucl-dark/llm_debate ; https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/SKILL.md

**П14. Гипотезы проверяются до кода: «что должно быть истинно» → importance × evidence → ≤5 → самый дешёвый фальсифицирующий тест с заранее объявленным критерием; spike одноразовый и изолированный; 2–3 альтернативы параллельно, судит третий.**
«Letting Claude jump straight to coding can produce code that solves the wrong problem» [F]; feature-dev плагин запускает «2–3 code-architect agents with different focuses» и не стартует «without explicit user approval» [F]; «Sequential investigation suffers from anchoring» [F]; spec-kit `/clarify` ≤5 вопросов по Impact × Uncertainty [F]. Порядок проверок: grep/`--help`/компиляция (секунды) → 3-строчный скрипт/один падающий тест → spike в worktree → walking skeleton. Каждый новый import/API/флаг разрешается против установленного артефакта (галлюцинации пакетов: 19.7% на моделях 2024 [S], 4.6–6.1% на когорте 2025–26 [S]; проверка стоит секунды независимо от ставки).
Источники: https://github.com/anthropics/claude-code/tree/main/plugins/feature-dev ; https://code.claude.com/docs/en/agent-teams ; https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/clarify.md

**П15. Зоны ответственности: один писатель на файл; чтение/ревью/spikes параллелятся свободно, запись — только по непересекающимся путям с замороженными контрактами.**
«Two teammates editing the same file leads to overwrites» [F]; «most coding tasks involve fewer truly parallelizable tasks than research» [F]; Cognition: «actions carry implicit decisions» [S]. Карта зон в формате CODEOWNERS (last match wins) [F], выводится из co-change/hotspots (code-maat) [F инструмент; польза для агентов — не измерена], усиливается PreToolUse-guard по роли; overlap-зоны (auth, config, migrations, contracts, shared helpers) — serial-first или один владелец.
Источники: https://code.claude.com/docs/en/agent-teams ; https://www.anthropic.com/engineering/multi-agent-research-system ; https://github.com/github/docs/blob/main/content/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners.md

**П16. Scope формулируется буквально (пути, запрещённые действия) и компилируется в PreToolUse deny; irreversible по умолчанию запрещено.**
Удаление одного предложения о scope подняло overeager-rate 0.0% → 17.1% [S, один препринт, одна модель]; Anthropic: классификатор auto-mode ловит ~83% overeager, «Design for containment at the environment layer first» [F]. Рекомендованный текст: «Don't add features, refactor code, or make 'improvements' beyond what was asked» [F].
Источники: https://www.anthropic.com/engineering/how-we-contain-claude ; https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices ; https://raw.githubusercontent.com/CMander02/DailyAgentPapers/main/data/2026/05/18/overeager-coding-agents-measuring-out-of-scope-actions-on-benign-tasks.md

**П17. Слои защиты должны падать по-разному: детерминированные проверки → узкие AI-линзы → refuters → слепой вердикт → выборочный человек; не N клонов одного промпта.**
Anthropic SDLC: SAST + узкие агенты + инвариантные тесты + риск-взвешенная выборка — и всё равно «approximately a third of the bugs… would have been caught» [F]. 9 судей из 7 семейств ≈ 2 эффективных голоса; «80+ agents unanimously endorsed a non-existent vulnerability» [S]; панель из 3 малых моделей разных семейств бьёт одного GPT-4 [S]. Голоса — для маршрутизации, не как истина.
Источники: https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle ; https://www.anthropic.com/engineering/building-effective-agents ; https://arxiv.org/abs/2404.18796

**П18. Человек — риск-взвешенный сэмплер и утверждающий по evidence-pack (один экран, без diff), гейт вне workflow, approval привязан к sha.**
«A risk-weighted sample is reviewed by humans»; «Human accountability is still central» [F]. Workflows: «No mid-run user input… run each stage as its own workflow» [F]; agent teams авто-одобряют планы без чтения [F]. «After the tenth approval you're clicking through» [F]. GitHub: «dismiss stale approvals», «most recent reviewable push must be approved by someone other than the person who pushed it» [F].
Источники: https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle ; https://code.claude.com/docs/en/workflows ; https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches.md

**П19. Замыкай петлю обучения и подрезай харнесс: повторяющаяся находка → hook > path-scoped rule > строка CLAUDE.md > skill; CLAUDE.md < 200 строк; слой, который ничего не ловит, — убрать; переоценивать при смене модели.**
«A repeated mistake or a recurring review comment is a CLAUDE.md edit» [F]; «Bloated CLAUDE.md files cause Claude to ignore your actual instructions» [F]; «every component in a harness encodes an assumption about what the model can't do on its own» — после Opus 4.6 из харнесса убрали per-sprint evaluator и context resets [F].
Источники: https://code.claude.com/docs/en/features-overview ; https://claude.com/blog/harnessing-claudes-intelligence ; https://www.anthropic.com/engineering/harness-design-long-running-apps

**П20. Ускорение измеряется только по time-to-land, rework, escaped defects, cost/landed, human-minutes/landed на сопоставимых задачах и pass^k; никогда по строкам, коммитам, числу находок и самоотчёту.**
DORA 2025: AI ↑ throughput, но «negative relationship with software delivery stability» [F]; GitClear: moved-lines 24.1% → 9.5%, copy/paste 8.3% → 12.3% (2020–24) [F PDF; vendor]; METR 2025: −19% при ожидаемых +24% [S; метод изменён в 2026]. Слой ревью с нулём уникальных подтверждённых находок и precision <50% за 30 прогонов — отключается.
Источники: https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report ; https://gitclear-public.s3.us-west-2.amazonaws.com/GitClear-AI-Copilot-Code-Quality-2025.pdf ; https://github.com/METR/Measuring-Early-2025-AI-on-Exp-OSS-Devs

---

## 2. Что известно о каждой стадии воронки

### 2.0. Предусловие — Day 0 на legacy-кодовой базе (без этого гейты либо всегда красные, либо ослаблены)
- **Практики [F]:** воспроизводимая сборка в контейнере (devcontainer/Dockerfile; SWE-bench-стиль трёхслойных образов); `baseline.sh` прогоняет весь suite ×3 и пишет `p2p.txt` (стабильно зелёные id), `quarantine.txt` (мигают), `fail.txt` (стабильно красные, исключены из гейта); `init.sh` + `smoke.sh` + `claude-progress.md` + baseline-commit (ритуал Anthropic). Diff-scoped гейты, чтобы legacy-долг не блокировал: diff-cover `--fail-under`, Stryker `--incremental`, Semgrep baseline, PHPStan baseline. `/init` (с `CLAUDE_CODE_NEW_INIT=1` — subagent-обзор и proposal), `/doctor`; CLAUDE.md < 200 строк, всё «иногда нужное» — в skills; LSP-плагины (диагностика после каждого edit); `permissions.deny` на `dist/`, `build/`, `vendor/`, `*.generated.*`, lockfiles, snapshots, migrations, `.claude/hooks/**`.
- **Провалы:** flaky-ретраи на главном гейте (Google: rerun только помеченных flaky; новая флакость ≈ 1/6 — реальный баг [S]); ретро-документирование всей базы («Writing specs for code you aren't changing feels productive and usually isn't» [F OpenSpec]); характеризационные тесты «исправляются» вместо фиксации бага; неисполняемый hook-скрипт падает открытым (issue #94362 [F]) — нужен SessionStart self-test.
- **Дёшево:** характеризовать только hotspots, пересекающиеся с первыми эпиками (approval/golden/snapshot: ApprovalTests, syrupy, Jest `--ci`, Go golden, insta); двухкоммитный стек «характеризация → изменение»; квартантин-лейн nightly ×10, промоушн по N зелёных подряд. Честная цель на 30 дней для знакомого зрелого репо: «не медленнее и меньше escaped defects», не «быстрее» [S METR].

### 2.1. Intake — «широкое горлышко»
- **Практики [F]:** стадия capture → type → route, не spec. Типизация (spec-kit assess: `new-capability|improvement|fix|exploration|cost-saving|compliance|other`; практично 7 типов `bug|feature|refactor|chore|question|idea|improve`) — первый ключ маршрутизатора: question → ответ без артефакта; chore/«диф в одно предложение» → напрямую с проверкой; bug → repro-first (repro не выполнен → `partial|not-run`, никогда `verified`); idea/improve → assess/spike с исходом go/needs-clarification/kill; feature/refactor → полная воронка. BMAD-триада для всего, что идёт в воронку: что должно быть истинно / что не должно измениться / что вне scope. Порядок: поиск в коде и backlog («Search the codebase before assuming functionality is missing» — семейство Ralph-промптов) → assume стандартные практики с записанными дефолтами и `revisit_when` → spike для эмпирических вопросов → ≤5 человеческих вопросов, по одному, multiple-choice с recommended, Impact × Uncertainty, только если ответ «materially change implementation or validation strategy» → HALT `needs-clarification` при оставшейся high-impact развилке. Все вопросы — до запуска workflow («No mid-run user input»). Acceptance criteria в EARS или Given/When/Then, каждая с `check` (команда + exit code/фикстура), наблюдаемая на внешней поверхности («Surface-anchored: ACs observe outermost surface, never internal proxies» BMAD). Литеральный scope-блок + NFR-envelope (perf/security/compat/out-of-scope/irreversible=false/footprint cap/tests-may-not-be-edited). Артефакт `intake.json` со схемой; отдельный `verdict_view` — подмножество для слепого судьи (goal, AC text+check, scope statement, out_of_scope), без verbatim-просьбы, assumptions, open_questions, risk signals.
- **Провалы:** тихие допущения на high-impact развилке; бесконечное интервью; вопросы, на которые отвечает `rg`; HOW-утечка (стек, API, сигнатуры) в spec; неразделённые составные просьбы («и», несколько поверхностей); bug без RED-прогона; нелитеральный/пустой scope; неградируемые AC (fast, clean, robust без числа); «make it better» принятое как feature; intake разросся в design doc; потеря нюанса при переводе RU → EN (обратный перевод свежим субагентом, одно подтверждение).
- **Дёшево:** маршрутизатор — bash/python-скрипт с нулём токенов + Haiku-классификатор только для того, чего git не видит (с явным `unknown`); каждое решение — строка JSONL. Два свежих Haiku-грейдера на синтетических pass/fail транскриптах проверяют, что AC однозначны («two experts, same verdict»); чеклист-грейдинг повышает согласие (+5.8% exact agreement, IAA 0.194 → 0.256 [S TICK]). Human view ≤ 1 страница.

### 2.2. Зоны ответственности
- **Практики [F]:** зона = набор путей, которые роль пишет эксклюзивно; карта в `.github/CODEOWNERS` (last match wins, ≤60 строк; handle-и `@zone-*` двойного назначения: routing ревью + guard); выводится из 12 месяцев истории: code-maat `revisions`, `coupling --min-coupling 30 --min-revs 5`, `soc`, `main-dev`, `fragmentation`, `age` + `cloc` как размер → hotspots = churn × size; пара с coupling ≥50% через границу зон → слить зоны или вынести в «contract»-зону со строгим гейтом; известные overlap-зоны (auth/authz, config, migrations, API contracts, core services, shared helpers) — явные shared-зоны. Per-zone `.claude/rules/zone-*.md` с `paths:` (инварианты <10 строк, команда тестов зоны). Enforcement: PreToolUse `zone-guard.sh` (exit 2), `permissions.deny` (`Edit(path)`/`Read(path)` — `Write(...)`/`MultiEdit(...)` path-правила принимаются, но не проверяются [F]), deny-правила дублируются в корневом settings для worktree-сессий. Роли как `.claude/agents/*.md` с `tools`/`disallowedTools`/`model`/`maxTurns`/`hooks` в frontmatter (hooks роли работают только пока она активна).
- **Провалы:** деление по дисциплинам/фазам для параллельных писателей (frontend-agent/backend-agent/QA-agent → «telephone game», тесты пишет тот, у кого нет контекста фичи [F Anthropic multi-agent blog]); два писателя на overlap-зоне; deny-правила не достают до подпроцессов (Python/Node-скрипт, открывающий файлы сам) — для OS-уровня нужен sandbox; path-scoped rules могли грузиться глобально в некоторых версиях (issue #16299) — проверять `/context`/`InstructionsLoaded`.
- **Дёшево:** одна PostToolUse-строка `{agent, zone, path}` на каждый Edit/Write; еженедельно `awk`: файлы, тронутые >1 зоной, и пары зон с наибольшим co-touch → перерисовать. Зоны нужны только когда есть параллельные писатели; для одного писателя — просто scope-блок задачи.

### 2.3. Декомпозиция
- **Практики [F]:** вертикальные срезы / tracer bullets, не горизонтальные слои («All layers… get built before anything runs end-to-end» — superpowers #1173; «Tracer code is not disposable» [S Pragmatic Programmer]); Slice 0 = walking skeleton, когда ничего end-to-end нет; порядок срезов по зависимости → ценности → снятию неопределённости. Единица = «smallest unit that carries its own test cycle» (superpowers), «self-contained… a function, a test file, or a review» (agent-teams), помещается в один контекст (Ralph: «small enough to complete in one context window»; Anthropic: одна фича из feature-list на сессию); цель ≤~300 изменённых строк, ≤~10 файлов, один коммит. Каждая единица несёт: objective, output format, tools/sources, boundaries (Anthropic delegation contract) + owned/forbidden paths, contract, check, evidence-to-return. Задачи как DAG с явными deps; `[P]` только при «different files, no dependencies»; Foundational-фаза блокирует истории (spec-kit). Паттерны разбиения: Lawrence 9 / SPIDR / hamburger [S, воспроизведены в нескольких репо]; spike — последний паттерн. Единица без runnable check не готова к раздаче («Whoever writes the code does not define done. Machine-produced evidence decides» — inverse-Conway kit, не проверен на реальном проекте). Read-only research-субагент (Read/Grep/Glob/LSP) выдаёт «Reuse candidates» с `findReferences`-evidence и «Invariants touched».
- **Провалы:** одна большая spec, исполняемая в одном контексте («run smoothly through specify/plan/tasks, then degrade during implementation» — spec-kit complex-features [F]); «5h token budget consumed in one run»; обнаружение неверного допущения на 70% плана; дублирование существующих helper-ов (GitClear: коммиты с 5+ строками дубликата 0.45% → 6.66% 2022–24 [F PDF, vendor]); сиротский код между шагами (Harper Reed [S]).
- **Дёшево:** plan-checker (свежий Haiku/Sonnet, видит только intake + план): покрыты ли все AC, ничего вне scope, нет ли неоднозначности, из-за которой параллельные исполнители разойдутся (GSD). Читать 200 строк плана дешевле, чем 2000 строк кода (HumanLayer ACE-FCA [F]). Размер единиц — при планировании, не при выборе задачи (ralph-orchestrator anti-pattern).

### 2.4. Распределение
- **Практики [F]:** оркестрация в workflow-скрипте (`agent()`, `pipeline()`, `parallel()`, `phase()`, `schema` с 5 попытками валидации; детерминизм: `Date.now()`/`Math.random()` бросают; 16 concurrent, 1000 агентов/прогон; `budget.total` — жёсткий потолок), а не в длинном чате; один workflow на стадию между человеческими гейтами. Fan-out только на eligible DAG-узлы; писателей 3–5 максимум («Three focused teammates often outperform five scattered ones»), 5–6 задач на писателя; читателей/ревьюеров — сколько угодно (workflows до 16+). Каждый писатель — в своём worktree (`isolation: worktree`; база «fresh» = remote default branch, `head` — если срез строится на незапушенном; `.worktreeinclude` для `.env`; `sparsePaths` + `symlinkDirectories` для дешёвых worktree). Kontrakt-first: интерфейсы/схемы/миграции замораживаются до fan-out, PreToolUse deny на `contracts/**`, `migrations/**`. Интеграция: `git merge-tree --write-tree` как dry-run (exit 1 = конфликт), landing по одному в порядке DAG, полный прогон после каждого, rebase остальных; зависимые срезы — stacked PRs (gh-stack). Порядок `agent()` в скрипте: дешёвые/детерминированные раньше, хрупкие позже (падение перезапускает всё после).
- **Провалы:** agent teams как позвоночник — experimental, выключены по умолчанию, только интерактивно (нет `-p`/SDK), без вложенности, статус задач отстаёт, нет resume, лид авто-одобряет планы, ~7× токенов в plan mode [F]; параллельные писатели на shared files; worktree ≠ семантическая изоляция («green on its own, red when combined»); mixed-tool fleets — cross-agent пары конфликтуют 41.7% vs 19.8% [S]; агентные PR конфликтуют 27.67% vs 10–20% у людей [F README AgenticFlict]; merge tax суперлинейный (Paola [S]).
- **Дёшево:** одинаковые `agentType`/model/effort/tools/schema у всех линз-ревьюеров (линза в промпте) → общий cached prefix; `subagentPromptCacheTtl: 1h` при долгих send-back циклах; не менять модель/effort у implementer посреди сессии (сброс кэша); `workflowSizeGuideline: small` для LIGHT/MEDIUM; `maxTurns` + `--max-budget-usd`. Одна фаза = один footprint-ledger (карта зон = merge-queue footprint).

### 2.5. Проверка гипотез до реализации
- **Практики [F]:** сначала классификация неизвестного: requirement-unknown → вопрос (не код); feasibility-unknown → spike (throwaway); integration/architecture-unknown → walking skeleton / tracer bullet (kept). Gate-вопросы (каждый — одна строка; пусто = не готово): что должно быть истинно (Roger Martin WWHTBT [S]); importance-if-false × evidence-we-have; самый дешёвый фальсифицирующий эксперимент + наблюдаемый pass; все новые import/API/флаги разрешены против установленного артефакта; есть ли RED-тест, падающий по правильной причине («If you didn't watch the test fail, you don't know if it tests the right thing» — superpowers TDD; Agentless доверяет repro-тесту только если он падает на исходном репо [F]); тончайший end-to-end путь запускается; какие альтернативы живы и что убьёт каждую; ADR-lite (что проверили, что увидели, что выбрали, что заставит пересмотреть) + assumption log с owner/trigger; pre-mortem одной строкой («это отгрузили и сломалось — самая вероятная причина?»); бюджет spike с эскалацией при «inconclusive». Sprint contract (Anthropic harness): генератор предлагает «что и как проверим», evaluator вычитывает до кода. Set-based: 2–3 параллельных spike в worktree, свежий судья по evidence (feature-dev плагин: minimal/clean/pragmatic архитекторы + сравнение [F]; agent-teams «try to disprove each other's theories» [F]). Debugging = та же стадия: одна гипотеза, одна переменная, ≥3 неудачных фикса → «STOP and question the architecture» (superpowers); «After two failed corrections, /clear» [F].
- **Провалы:** point-based серийный «попробуем A, не вышло — B» (это и есть «прямая линия»); горизонтальные слои; самооценка гипотезы; implementer правит тесты (Kent Beck: «The genie doesn't want to do TDD» [S]; ezyang: Claude Code «relaxed test conditions» [F]); тесты после кода («pass immediately, proving nothing»); заполнение пробелов правдоподобными догадками (spec-kit `[NEEDS CLARIFICATION]` именно против этого); код spike утекает в прод (граница — worktree + отчёт-only handoff); исчерпывающие аудиты (spec-kit cap 5; «Chasing every finding leads to over-engineering»); доверие к бенчмаркам агента (Hashimoto: «88ms → 2ms», оказавшийся в 75× медленнее ручной версии [S]); un-timeboxed spikes.
- **Дёшево:** cap 5 гипотез, остальное — assumption log; порядок проверок от секундных (grep/`--help`/`tsc --noEmit`) к минутным; параллельные spikes на Sonnet, судья на Opus; trivial exit (одно предложение, один файл, без новых зависимостей) — без gate. Claude Code: `hypothesis-scout` (read-only), `spike-runner` (`isolation: worktree`, `maxTurns`, отчёт по схеме, никогда не мержит), `hypothesis-judge` (свежий; GO/PIVOT/CLARIFY); PreToolUse deny implementer'у на `tests/**`; Stop hook требует записанный RED→GREEN evidence-блок.

### 2.6. Выполнение
- **Практики [F]:** одна единица на свежую сессию/субагента; session-start ритуал: `pwd` → git log + progress → feature list/ledger → `init.sh` → smoke → работа; implementer = Edit/Bash в worktree с file-allowlist (sterile cockpit: находки вне scope — в parking-lot файл, не в код); test-first: test-author пишет F2P-тесты, implementer лишён права их менять; PostToolUse на Edit|Write — formatter/lint/typecheck по файлу; Stop/TaskCompleted-hook — быстрый объективный гейт (F2P pass, P2P pass, diff-cover `--fail-under`, diff-quality, snapshot `--ci`, diff-size cap, scope-diff «files touched ⊆ allow_paths», test-manifest не уменьшился, нет `skip/xit/only` в diff), с проверкой `stop_hook_active` и cap 8; гейт исполняется из чистого checkout/контейнера, не из shell агента; anti-hack framing в каждом промпте («write a high quality, general purpose solution. If the task is unreasonable or infeasible, or if any of the tests are incorrect, please tell me. Do not hard code any test cases» — снижает hack-rate ~2.5× на impossible tasks у Claude 4 [S system card mirror F]); легальный выход «declare infeasible» назад к стадии гипотез; commit на каждую прошедшую фичу, checkpoint-теги как цели reset; damping-промпты против over-engineering и subagent-overuse (Opus 4.5/4.6 склонны к обоим [F]); evidence bundle вместо прозы; решения — в ADR/AgDR-файлах, коммитятся рядом с кодом.
- **Провалы:** одноразовое «one-shot the app» → контекст кончается посреди реализации; преждевременное «declare the job done»; feature помечена passing без e2e-теста; doom loop (патчи меняются, ошибка нет — «диагноз неверен, а не патчи»); удаление/ослабление тестов, over-mocking, правка CI, чтобы стало зелёным (typia-инцидент [S]); scope creep (fullsend #2372: просили одно поле, агент перестроил volume mounts, 6 итераций фикса [F]); hallucinated packages; `/rewind`-checkpoints не покрывают Bash/subagent-правки и удаляются через 30 дней — reset только через git.
- **Дёшево:** Sonnet для implementer в LIGHT/MEDIUM, Opus — HEAVY; diff-scoped проверки (секунды), тяжёлые (mutation, Schemathesis, contract) — на стадии ревью или nightly; кэш промптов (5-минутный TTL у субагентов по умолчанию). Ориентировочная стоимость [оценка, заменить после 10 прогонов]: LIGHT $0.5–1.2 / 5–15 мин; MEDIUM $4.5–16 / 25–55 мин; HEAVY $25–90 (+$5–25 ultrareview) / 60–150 мин.

### 2.7. Независимое ревью с возвратом (L1)
- **Практики [F]:** свежие субагенты, ОДИН проход на версию артефакта; вход = spec/AC + diff (base..head) + evidence bundle + CLAUDE.md/правила зоны; НЕ вход = транскрипт автора, рассуждения, прошлый Q&A ревьюеров. Finders с непересекающимися мандатами (bugs-in-diff «only what you can validate from the diff», logic/security, spec-compliance по критериям, project-rules «must quote the rule», scope-diff, test-diff, decision-log consistency); каждая находка → refuter с мандатом «убить» (воспроизвести/цитировать file:line/пометить pre-existing или linter-covered) → `confirmed|refuted|unverifiable`; reporter: dedupe, severity `Important|Nit|Pre-existing` из подтверждённого последствия, cap 5 nits, «report gaps, not style preferences», tally в начале. Ревьюер выполняет, а не только читает (тесты/сборку в изолированном worktree; Playwright «as a user would»). Send-back адресный: `missing/partial` → FIX/IMPLEMENT; `contradicts/unrequested` или spec_defect → SPEC_FROZEN; architecture (3 strikes) → DECOMPOSE; раунды 1–3 — тот же implementer (resume via SendMessage, контекст сохранён), 4–5 — свежий на более сильной модели без WIP-diff, только spec + constraints + подтверждённые находки как падающие тесты; scoped re-review только по fix-diff + закрытым находкам; после первого раунда — только Important; ключ находки (file, function, claim-stem), опровергнутый адъюдикатором, не поднимается повторно тем же тиром; approvals инвалидируются новым sha.
- **Провалы:** «now double-check your work» в контексте автора (intrinsic self-correction ухудшает: GSM8K 95.5 → 89.0 [S]; повторное self-review — худшее условие в CCR [S]); context-aware субагент (получил контекст автора) хуже холодного [S, 30 артефактов]; повторные раунды на той же версии (F1 0.376 → 0.26–0.30, FP +62% [S]) — «false-positive pressure» и «Review Target Drift»; открытый «find all gaps» без do-not-flag; ревьюер с правом правки (фикс не отревьюирован — нарушение SoD); ревью через `context: fork` (наследует контекст родителя); длинный REVIEW.md («Length has a cost»); доверие к сводкам субагентов (пользовательский отчёт: 20–30% сводок содержат утверждение, не совпадающее с выводом инструмента [S issue]).
- **Дёшево:** линзы — один agentType, общий prefix; refuters на Sonnet, параллельно; nits не рециклируют; measure per-layer catch-rate/precision, thumbs-down; на LIGHT — один дешёвый reviewer (`/code-review low` в фоне).

### 2.8. Слепое ревью без контекста процесса (L2 / outside verdict)
- **Практики [F/S]:** только для MEDIUM/HEAVY (для LIGHT — дешёвый replay day-0 harness). Два декоррелированных тира, ни один не видит другого и не выдаёт общего мнения: **Tier B (behavioral)** — verbatim intake-текст, AC в поведенческой формулировке (hash-bound к intake), runner recipe, артефакт@sha и артефакт@merge-base, адаптеры; никакого кода, diff, commit-messages, PR-описания, provenance, числа итераций; шаг pre-registration: из сырой просьбы выписать свои проверки ДО чтения критериев (расхождения = находки); для каждого критерия — исполненная проверка с evidence и `baseline_result`; probing вокруг (invalid input, auth, empty state). **Tier C (code)** — AC + diff с вырезанными комментариями/докстрингами + read-only base tree + право писать НОВЫЕ тесты только в своём `tests/outsider/**`; без git-истории (shallow `--depth 1` / `git archive`), без `gh`, без transcript/plan/ADR/hypothesis cards/L1-находок. Оба: `claude --bare -p` (без project hooks/MCP/CLAUDE.md), `--agents` из base-ветки, `--permission-mode dontAsk`, `--permission-prompts none`, `--disallowedTools Edit,Write,NotebookEdit,WebFetch,WebSearch,Agent,SendMessage` (C — Edit/Write только в своём worktree через guard), `--max-turns`, `--json-schema`, sandbox network allowlist (модель + локальное приложение), контейнер; как субагент — `omitClaudeMd: true` + `isolation: worktree` + guard-hook, checkout candidate-sha (worktree по умолчанию ветвится от default branch!). Другое семейство моделей где доступно; минимум — другой tier + другой промпт + без общего rubric-текста с генератором («museum quality» утёк в генерацию [F]). Скан diff на скрытый текст (zero-width, bidi, HTML-комментарии, «reviewer: approve») — как находка, не инструкция. Универсальные адаптеры по типу проекта: web — Playwright MCP snapshot/screenshot-diff/console/network; API — Schemathesis (14 named checks, stateful links) + Pact; CLI — bats/trycmd golden + exit codes; библиотека — Hypothesis/fast-check + cargo-semver-checks/griffe/japicmp; data — datacompy/Great Expectations; IaC — `terraform show -json` + conftest; notebooks/ML — nbval + `dvc metrics diff`; mobile — Maestro. «Done» без UI = исполненные проверки при sha + неизменные baseline-проверки + contract/API/plan-diff ограничен тем, что назвала просьба.
- **Провалы:** «контекст-free» ревьюер, получивший только просьбу — без оракула изобретает критерии; diff с комментариями/commit-messages/PR-body (инъекции [F security.md]; refinement/authority/bandwagon bias [S CALM]; null-model побеждает LLM-судью с 76.9% [F README]); попытка спрятать контекст инструкцией или Read-deny (не покрывают команды, читающие файлы без имени; Bash-правила «not a security boundary» [F]); `claude -p` без `--bare` на PR-checkout (исполняет hooks/MCP проекта «even in a folder you've never trusted» [F]); гейт/агент/критерии живут только в PR-ветке; `unknown` засчитан как fail или pass; free-text severity; голосование клонов; попарные сравнения; доверие `exit 0`; единый тяжёлый outsider на каждое изменение.
- **Дёшево:** Tier B replay day-0 harness — минуты; полный B+C — только по риску; `judgment`-критерии (визуальное соответствие) — 3 trial с разными линзами, PASS только единогласно; `command/test/http/diff`-критерии — 1 исполнение; ultrareview как второй vendor-run Tier C ($5–25, 5–10 мин, exit 0/1, `--json`).

### 2.9. Вердикт, человеческий гейт, landing
- **Практики [F]:** rule engine (скрипт) вычисляет: severity = f(status, consequence-class, introduced_here); BLOCK для confirmed ∧ {data_loss, security, wrong_result, crash, contract_break, scope_violation, test_weakened} ∧ introduced_here; WARN для perf/docs; PRE_EXISTING никогда не блокирует; UNVERIFIED — в «unknown budget» (≤20%); FAIL = любой confirmed FAIL блокирующего критерия в любом trial или BLOCK-находка; UNKNOWN при `max_turns_hit`, schema-fail, commit ≠ PR head; PASS — все блокирующие критерии pass во всех trials, pre-registered checks покрыты, ни одного BLOCK. Вердикт JSON несёт `commit`, `merge_base`, `packet_sha256`, `agent_def_sha256`; CI пересчитывает и отвергает несовпадение; любой push инвалидирует. Human gate: SPEC_FROZEN → IMPLEMENT для tier ≥1 (утверждение AC простым языком — самый дешёвый и самый ценный гейт), любое irreversible действие (deny-правила + явный Go с sha в `approvals.json`), перед LAND: tier 2 всегда, tier 1 батчами, tier 0 auto-Go с post-hoc выборкой 10–20% (число — дизайн-выбор), rung 4/Kill/budget overrun/UNVERIFIABLE на tier ≥1. Экран человека без diff: чеклист AC (pass/fail + ссылка на evidence + скриншот), risk summary (зона, tier, footprint, reversibility, контракты), вердикты L1/L2 + unverifiable, стоимость/раунды/stalls, «что может пойти не так» (3 пункта, пишет L2), кнопки Go / Recycle→{stage} / Hold / Kill с одной строкой причины → `constraints.md`. Асинхронно, digest, SLA 1 рабочий день (Google), ≤7 решений за присест (дизайн-выбор; «After the tenth approval you're clicking through» [F]). Интерактивно: AskUserQuestion по завершении stage-workflow с `askUserQuestionTimeout`; unattended: собственный required status check с base-ветки (managed Code Review check всегда neutral — не блокирует [F]), «dismiss stale approvals», «most recent push approved by someone other than the pusher» (app-identity агента — pusher). LAND: squash-merge по привязанному sha, base up to date, `git worktree remove` явно, ledger → `archive/`, spec-дельты — в living docs (OpenSpec). Kill — «successful, not a failure» (spec-kit assess).
- **Провалы:** universal CAB-стиль (DORA 2019: внешние change-approval boards коррелируют с худшей производительностью без снижения change-failure [M]); гейт внутри workflow/agent team; approval без sha; человек читает 1000-строчные diff-ы; Code Review check как блокер.
- **Дёшево:** буфер verified-ready единиц перед человеком (TOC: buffer перед constraint, не наращивать implementers выше по потоку); WIP-лимиты на стадиях (`board.json`: IMPLEMENT ≤2, REVIEW ≤3, HUMAN_GATE ≤5 непрочитанных для соло).

### 2.10. Обратная линия (learning) и телеметрия
- Retrospective-субагент после батча кластеризует находки; класс ≥2 повторов → предлагает hook > path-scoped rule > строка CLAUDE.md > skill; per-epic ретро (BMAD: «the helper written twice, the file that grew a little in every session»); «signs» в промпты после наблюдаемого провала (Ralph); compound learnings в `docs/solutions/` (compound engineering). Телеметрия: hooks → JSONL (`session_id`, `prompt_id`, `agent_id`, `agent_type`, gate results, send-backs), OTel (`CLAUDE_CODE_ENABLE_TELEMETRY=1`, `OTEL_LOG_TOOL_DETAILS=1` — иначе имена агентов заменяются на «custom»), `claude -p --output-format json` (`total_cost_usd` включает субагентов, `usage` — нет), nightly-экспорт транскриптов/journals (удаляются через `cleanupPeriodDays`=30), git notes с task_id/tier. Метрики: TTG/TTL (median, p90 по пути), rework rate, C14 churn, defect escape rate, catch-rate/precision/unverified/cost-per-confirmed по слою, CPL, HPL, pass^3, route accuracy (promotions/demotions). Калибровка: 20–30 seeded-defect + known-good items ×3, precision BLOCK ≥0.9, recall ≥0.7 (B)/0.8 (C), unknown ≤20%, pass^3 ≥0.9; 10-item canary при смене model/agent-def/tool/image; слой retire при 0 уникальных catch ∧ precision <50% за 30 прогонов; ретюнинг при новой модели.

---

## 3. Анти-паттерны (чего не делать; источники)

1. Агент оценивает собственную работу / «now double-check» в том же контексте — самовосхваление [F harness-design], intrinsic self-correction ухудшает [S Huang 2310.01798], повторное self-review хуже всего [S CCR 2603.12123].
2. Ревьюеру передают транскрипт/рассуждения автора «для контекста» — context-aware субагент хуже холодного [S CCR]; Anthropic намеренно даёт «only the diff and the criteria» [F best-practices]; «A dispatch prompt describes one task, not the session's history» [F superpowers].
3. Несколько раундов ревью на одной и той же версии — FP +62%, precision 0.30 → 0.20 [S 2603.16244]; «round seven on style alone» [F code-review docs].
4. Голосование N клонов одной модели/промпта — ~2 эффективных голоса из 9 [S 2605.29800]; «80+ agents unanimously endorsed a non-existent vulnerability» [S 2604.19049]; Swiss-cheese работает только на независимых слоях [M Reason].
5. Попарные «что лучше» в одном порядке — flips 13.6% [S 2606.13685]; position bias [S Zheng].
6. Автор спорит с ревьюером; «I tested this thoroughly», ссылки-декорации, «уже прошёл 2 ревью» — sycophancy [F Anthropic research], authority/bandwagon/refinement bias [S CALM], single-blind даёт известным авторам 1.63× odds [S Tomkins].
7. Холистический 1–10 как вердикт — «concern-acceptance conflict» [S BadScientist]; Anthropic: pass/fail + 0–1 рубрика стабильнее [F].
8. «Find all gaps» без do-not-flag и nit-cap — «will usually report some, even when the work is sound» [F best-practices]; >50% непринятых AI-предложений неверны [S 2603.15911].
9. Транскриптовый судья (`/goal`, prompt-hook, Haiku) как финальный гейт — «doesn't run commands or read files» [F goal]; `sys.exit(0)` [F].
10. Гейт/агент/критерии живут в ветке под ревью — PR правит собственную проверку [F agent-approval-check.yml].
11. Одно семейство моделей на генерацию и финальный гейт с видимым provenance — harmful self-preference сильнее там, где модель ошибается [S Chen 2504.03846]; Anthropic рекомендует гетерогенные ревью-модели [F SDLC].
12. Долгоживущий ревьюер «compact and continue» — context rot [F/S]; `/clear` после двух неудач [F].
13. Длинный REVIEW.md / рубрика — «dilutes the rules that matter most» [F]; сложность рубрики снижает согласованность [S].
14. Рубрика оценщика видна генератору — «museum quality» утекла в генерацию [F harness-design].
15. Единый тяжёлый процесс на каждое изменение — <50 строк: 31%/0.5 находки [V]; харнесс 20× дороже соло [F]; RADAR: риск-тиринг держит безопасность при росте approve-rate [S 2605.30208].
16. Инварианты в CLAUDE.md вместо hooks — «a request, not a guarantee» [F]; >200 строк — «Claude ignores half of it» [F].
17. `tools: Read, Grep, Bash` как «read-only» — Bash пишет (`cat > f`, `sed -i`, `git`); нужны `disallowedTools` + guard + worktree [F sub-agents].
18. Implementer правит тесты/snapshots/CI/`.claude/**` — typia: «gutted the algorithm… deleted every failing test»; CI workflow отредактирован, чтобы исключить 5 категорий [S]; sandbox runtime запрещает `.claude/agents`, `.mcp.json`, `.git/hooks` по той же причине [F].
19. Регенерация snapshots при падении — Jest: «regenerating snapshots… instead of examining the root causes» [F]; запускать с `--ci`.
20. Доверие `exit 0` без разбора отчёта — счётчик тестов может упасть; парсить JUnit/JSON, сравнивать с baseline [F verification-tech].
21. Гейт исполняется в shell/worktree агента — env, подменённые бинарники, изменённый conftest; Bash-sandbox не покрывает MCP/hooks [F sandbox-environments].
22. Repo-wide coverage/mutation пороги на legacy — падают вечно или снижаются; только diff-scoped [F diff-cover, Stryker incremental].
23. Полный mutation-run на каждый edit — минуты–часы; инкрементально, на diff, позже по воронке [F].
24. Blanket-ретраи flaky на главном гейте — Google rerun только помеченных [S]; 1/6 новой флакости — реальный баг [S].
25. Отсутствие явного scope-предложения — 0.0% → 17.1% overeager [S, один препринт]; классификатор пропускает ~17% [F].
26. Фазовая/слойная декомпозиция для параллельных агентов (schema → API → UI) — ничего не работает end-to-end до конца; интеграционные баги на 70–100% [F superpowers #1173].
27. Дисциплинарные роли (frontend/backend/QA-агенты) — «telephone game» [F Anthropic multi-agent blog]; тесты пишет тот, у кого нет контекста.
28. Два писателя на одном файле / overlap-зоне — overwrites [F agent-teams]; текстовые + семантические конфликты [S Codacy/Autonoma].
29. Over-spawning — «Spawning 50 subagents for simple queries» [F]; Opus 4.6 «strong predilection for subagents» [F prompting best-practices].
30. Agent teams для последовательной/same-file/dependency-heavy работы — «a single session or subagents are more effective» [F]; ~7× токенов в plan mode [F costs].
31. Один гигантский spec в одном контексте — «degrade during implementation» [F spec-kit].
32. Ретро-документирование всей кодовой базы — OpenSpec «usually isn't» productive [F]; BMAD «over-documentation nobody reads» [F].
33. Полная церемония для однострочных диффов — Kiro «turned trivial bug fixes into multi-user-story ceremonies» [S Böckeler]; «skip the plan» [F].
34. Spec-как-псевдокод — «you've written the program twice» [S]; spec-kit запрещает HOW [F].
35. Предположение «функциональности нет» без поиска — «Achilles' heel» (Ralph); дублирование helper-ов [F GitClear PDF].
36. Устаревшие PRD вместо текущего кода в brownfield — «contradiction, ambiguity, and context-window bloat» [F BMAD].
37. Утверждённый spec как доказательство — «A reviewed-and-approved wrong spec is still wrong, now with more authority» [F field study].
38. Unbounded loops / exact-string completion promise — Ralph plugin: «Always rely on --max-iterations as your primary safety mechanism» [F].
39. Счётчик итераций вместо детектора застоя — пять несовместимых лимитов; OpenHands считает повторы, не итерации [F stuck.py].
40. Recycle с падающим WIP-diff — модели «overly rely» на ранние попытки и «do not recover» [F Laban abstract]; передавать только committed passing checkpoints + переписанный spec.
41. Checkpoints/`~/.claude/tasks` как ledger — не трекают Bash/subagent-правки, удаляются через 30 дней [F].
42. Человеческий гейт внутри workflow / agent team — «No mid-run user input»; teammate-планы авто-одобряются [F].
43. Approval, переживающий новые коммиты — GitHub «dismiss stale approvals» существует ради этого [F].
44. Много решений за присест — «After the tenth approval you're clicking through» [F]; decision-fatigue-магнитуды спорны [M Danziger vs Weinshall-Margel].
45. Ревью из `isolation: worktree`-субагента по умолчанию — ветвится от default branch, ревьюит не ту ветку [F worktrees].
46. Защита irreversible только hooks/промптом — только `permissions.deny` документированно держится в bypassPermissions [F permission-modes]; hook-deny под bypass — см. 4.11.
47. Fan-out до хрупкого шага в workflow — упавший агент перезапускает всех после себя [F].
48. Измерение ускорения строками/коммитами/самоотчётом — GitClear [F], DORA 2024 (−1.5% throughput, −7.2% stability на +25% adoption) [F], METR perception gap [S].
49. Подсчёт находок ревьюера как ценности — over-report [F]; полезность комментариев падает с размером [F Bosu MSR 2015]; считать только refuter-confirmed.
50. Наказание за «task infeasible / test is wrong» — убирает честный выход, загоняет hacking в obfuscated формы [S OpenAI CoT monitoring; F system-card prompt].
51. Custom subagent names → «custom» в OTel без `OTEL_LOG_TOOL_DETAILS=1`; транскрипты как хранилище телеметрии (30 дней) [F].
52. Ревью через `context: fork` — наследует разговор родителя; для независимости — свежий субагент [F features-overview].
53. Чеклисты, которые доер ставит галочками сам — «looking without seeing» [M Degani & Wiener]; Anthropic: агенты помечают фичи done без тестов [F] → challenge-response другим агентом/hook.
54. Grading пути вместо результата — «too rigid… brittle» [F demystifying-evals]; grading-bugs принимались за провалы агента (CORE-Bench 42% → 95%) [F].

---

## 4. Спорные вопросы (где источники расходятся; обе стороны; рабочая позиция)

**4.1. Что видит независимый ревьюер: только diff+критерии, diff+план, или полностью слепой?**
Сторона A: Anthropic best-practices — «sees only the diff and the criteria you give it» и одновременно рецепт «review… against PLAN.md» с правом тянуть контекст репо [F]. Сторона B: CCR — контекст-aware субагент (23.8) хуже холодного (28.6) и даже self-review (24.6) [S, 30 артефактов]; критик: эффект мал, значимость неизвестна. Сторона C: quality-systems/outside-verdict предлагают tier «no plan». Рабочая позиция: различать **контракт** (spec/AC/план как перечень требований, hash-bound) и **процесс** (транскрипт, рассуждения, history ревью, provenance). L1 получает контракт + diff + evidence + может тянуть репо-контекст сам; L2 получает AC (после pre-registration из сырой просьбы) + артефакт, но не план/hypothesis cards/ADR (это «аргументы» = каналы authority/refinement-bias [S]). «Спец разрешён, транскрипт нет» — рабочее допущение без прямого измерения; мерить catch-rate по тирам.

**4.2. «Read-only через tools-allowlist» vs «ревьюер должен исполнять».**
`tools: Read, Grep, Glob, Bash` — Bash пишет файлы [F]. Реконсиляция: (а) `disallowedTools: Edit, Write, NotebookEdit` + PreToolUse-guard на записи/`git` мутации/redirects + `isolation: worktree`/контейнер; (б) или объективные проверки исполняет нейтральный runner (hook/CI), а ревьюер получает отчёт и остаётся без Bash. Проверить на установленной версии (V6).

**4.3. «Автор никогда не спорит» vs эталонный паттерн «находки возвращаются implementer'у, который решает, что чинить, и re-review».**
Реконсиляция: implementer получает находки как **вход** (verbatim, Critical/Important, с repro), производит новую версию + evidence; он не отвечает ревьюеру в его контексте. Возражение «кодом» (контр-репро, тест) допустимо — superpowers: «pushing back with code evidence… is acceptable». Спорное/опровергнутое/непроверяемое → состояние ADJUDICATE: свежий defender (только код@sha + находка + тесты) и свежий adjudicator (другое семейство, `omitClaudeMd`), который переисполняет все цитируемые команды; CONTESTED → симметричный 2-раундовый debate со случайными сторонами и третьим судьёй с «Unknown»; Unknown → человек. Адъюдикация — ни в контексте автора, ни ревьюера.

**4.4. «Больше раундов — ниже precision» vs «converge on re-review» и «approvals истекают на новом коммите».**
Цифры (0.376 → 0.26–0.30) [S] относятся к повторному ревью **той же** версии тем же/переспрошенным ревьюером. Re-review **новой** версии — другой случай: один проход на версию, scoped по fix-diff + прежним находкам, с правом сказать «no issues», без Q&A-треда прежнего ревьюера. Обе позиции совместимы.

**4.5. Насколько велик эффект «отдельный контекст»?**
F1 28.6 vs 24.6 vs 23.8 на 30 артефактах [S] — малая разница, значимость не перепроверена. Но направление подтверждают Anthropic docs [F], harness-post [F] и Huang self-correction [S]. Позиция: «свежий контекст» — дёшевый дефолт с умеренной уверенностью, не «доказанный большой эффект»; рейтинг high в трёх заметках завышен.

**4.6. Стоимость мультиагентности: 15× / 3–10× / 20× — что применимо к кодингу?**
15× — research-система [F]; 3–10× — блог о мультиагентности [F]; 20× ($9 → $200) — app-building харнесс [F]. Кодинг-специфичных измерений нет; конкретные цифры только у Code Review ($15–25, ~20 мин) и ultrareview ($5–25, 5–10 мин) [V]. Таблица путей LIGHT/MEDIUM/HEAVY — оценка; заменить после 10 прогонов на путь.

**4.7. «<1% findings incorrect», «16% → 54%».**
Это thumbs-down-rate на PR самой Anthropic [V], не precision/recall; recall не опубликован. Использовать как «precision-first pipeline осуществим», не как число.

**4.8. «Делить по владению, не по дисциплине/фазе» vs воронка, которая сама фазовая (plan → implement → review).**
Реконсиляция: фазовое разделение — для **последовательной** обработки **одной** единицы (норма); ownership-разделение обязательно только для **параллельных писателей**. Дисциплинарные параллельные роли (frontend/backend/QA-агенты на одной фиче) — анти-паттерн. Разделение test-author/implementer — намеренное исключение ради separation of duties, а не ради throughput.

**4.9. «Workflow-скрипт держит план и промежуточные результаты, resumable и детерминированный» — переоценка персистентности.**
Документировано [F]: у скрипта нет fs/shell; результаты — в переменных прогона; resume только в той же сессии/`--resume`; упавший агент перезапускает всех после себя; в новой сессии — «nothing to resume». Позиция: durable-состояние пишут агенты на диск (ledger в репо), скрипт — координатор; один workflow на стадию; timestamp через `args`.

**4.10. Shared task list агентских команд как позвоночник.**
Правда, что зависимости блокируют claim с file-locking [F], но: experimental, off by default, interactive-only, non-nesting, лаг статуса, без resume, авто-одобрение планов [F]. Позиция: teams — только для debate/review fan-out; позвоночник — workflow-скрипты + субагенты + ledger.

**4.11. PreToolUse deny под `--dangerously-skip-permissions`.**
verification-tech.md и gap-legacy.md цитируют hooks-guide: «PreToolUse hooks fire before any permission-mode check, in every permission mode, including dontAsk… blocks the tool even in bypassPermissions mode» [F по их fetch]; gap-state-machine.md и критик: не найдено в hooks reference/guide, задокументировано только для `permissions.deny`. Позиция: считать «задокументировано в одной версии страницы, не подтверждено в другой» → тест V4 на установленной версии; irreversible-действия защищать `permissions.deny` (документированно держится в bypass) + hook как второй слой.

**4.12. «Субагенты не для итеративного back-and-forth».**
Устарело частично: именованные субагенты resumable через SendMessage с полной историей, `maxTurns` возвращает partial + resume [F]. Позиция: implementer может резюмироваться (rung1, раунды 1–3); ревьюеры — никогда (свежий контекст).

**4.13. Merge-conflict rates агентов.**
27.67% — README AgenticFlict [F]; 41.7% vs 19.8% и «10% при 2 строках → 30% при 25» — arXiv 2607.04697 [S]; причинная история (стилевая дивергенция) — догадка. Позиция: мотивация для коротких, малых, zone-disjoint веток и одного formatter-конфига; логировать конфликты по зонам.

**4.14. Галлюцинации пакетов.**
19.7% — 2024, старые модели [S]; 4.62–6.10% — релизы до марта 2026 [S]; текущие — неизвестно. Позиция: гейт «resolve against installed artefact» стоит секунды — оставить; ставку не цитировать.

**4.15. «45% AI-кода с security-дефектами, не улучшается».**
Единственный vendor-отчёт (Veracode) [S]. Позиция: не обосновывает обязательный security-тир сам по себе; SAST в детерминированный гейт (дёшево) + security-линза в HEAVY; мерить.

**4.16. TDD «40–90% меньше дефектов за 15–35% времени».**
Nagappan 2008, четыре человеческие команды, case study [F PDF]; перенос на агентов не измерен (TiCoder +45.97% pass@1, Consort — [S]). Позиция: в AI-пайплайне test-first обосновывается не числом, а separation of duties (implementer не может подогнать тесты) и RED-evidence; время — токены.

**4.17. Scope-предложение 0.0% → 17.1%.**
Один нереплицированный препринт, одна модель/фреймворк [S через зеркала]; авторы: агент «matching declared text rather than inferring boundaries». Позиция: дёшево — принять как литеральное path-level утверждение + hook; величину не цитировать.

**4.18. LLM-judge цифры (style bias 0.76–0.92, 9 судей ≈ 2 голоса, 13.6% flips, 80+ agents, 11–15 trials).**
Все [S], arXiv 2605/2606 не прочитаны. Позиция: использовать качественные правила (разнообразие вместо количества; абсолютные бинарные критерии вместо попарных; обе перестановки при неизбежном попарном; 3 trial только для judgment-критериев) без цифр.

**4.19. Бюджет diff для AI-ревью.**
SmartBear 200–400 LOC — человеческие инспекции 2006 [S]; Google 100/1000 [F]; ultrareview 8000 cap [F]; Code Review: находки растут с размером [V]; churn → конфликты [S]. Согласованного AI-числа нет (D4: 100–400; D7: ~100; D8: 1000 «too large»). Позиция: цель ≤~300 изменённых строк на единицу, жёсткий cap ~1000 → split; мерить catch-rate vs size.

**4.20. Лимиты циклов: 2 / 3 / 5 (1–3 тот же, 4–5 сильнее) / 5 (BMAD, не переверифицировано) / 8 / 10.**
Каждый считает своё. Позиция: считать **застой** (progress_hash: sorted failing-test ids + normalized last command+exit + diff distance; A/B/A/B за 4 раунда), лестница rung0–4, жёсткие cap: 5 review-раундов, 2 implement-попытки, бюджет; Stop-hook 8 и auto-mode 3/20 — подложка.

**4.21. Когда отдельный evaluator окупается.**
«Separate the evaluator from the generator» [F] vs «после Opus 4.6 per-sprint evaluator убран, оставлен end-of-run» [F] vs «worth the cost when the task sits beyond what the current model does reliably solo» [F]. Позиция: слой ревью — с датой истечения; seeded-defect калибровка решает; retire при нуле уникальных catch.

**4.22. Default-heavy (superpowers «when in doubt take the heavier path») vs default-light (Claude Code «skip the plan for one-sentence diffs»).**
Сравнительных измерений нет. Позиция: не «дефолт», а маршрутизатор: детерминированные полы + размер; на большом проекте «in doubt» = незнакомый код/несколько файлов → MEDIUM; LIGHT только при одном предложении, без зон, с runnable check.

**4.23. Sycophancy-данные 2023 на старых моделях.**
Величины для текущих Claude неизвестны; но Anthropic harness-post 2026 наблюдал «talked itself into approving» [F]. Позиция: правило «без диалога автор–ревьюер» остаётся, цифры не цитировать.

**4.24. «AGENTS.md: перечисленные тестовые команды выполняются автоматически».**
FAQ agents.md описывает конвенцию некоторых инструментов [F], не поведение Claude Code. Позиция: enforcement только hooks/CI.

**4.25. SDD: Mercari 1.6×/150%, Ralph $297, Kitchen Loop zero regressions, ~50% меньше ошибок — самоотчёты; Thoughtworks «Assess»; Marmelab «1300 строк markdown на date-display», Böckeler «false sense of control».**
Позиция: брать из SDD артефакты и гейты (spec с Independent Test, `[NEEDS CLARIFICATION]`, checklist как «unit tests for requirements», analyze, converge с gap-классами missing/partial/contradicts/unrequested), не церемонию; delta-specs для brownfield; «Spec-first won by becoming a feature» (plan mode + короткий spec).

**4.26. METR −19%.**
Early-2025 инструменты (Cursor + Claude 3.5/3.7), зрелые знакомые репо, метод изменён в 2026 [S]. Позиция: доказательство, что ускорение надо мерить; целевая планка на 30 дней для зрелого репо — «не медленнее, меньше escapes».

**4.27. Классики (Reason, Haynes, Klein, Degani & Wiener, DORA CAB, Ontario «no effect without culture»).**
Все [M], не прочитаны. Позиция: метафоры дизайна, не evidence; «чеклист, который доер ставит сам, не работает» опирается на Anthropic-наблюдение (feature done без теста) сильнее, чем на Degani.

**4.28. «Dumb zone» 60–70% заполнения контекста.**
Фольклор (Ralph, HumanLayer 40–60%); Chroma — плавная, distractor-sensitive деградация [F README; S цифры]. Позиция: бюджет с запасом и свежий контекст на единицу; не привязываться к проценту.

**4.29. Set-based design (2–3 параллельных spike).**
Toyota [S] + Hashimoto [S] + feature-dev плагин (2–3 архитектора) [F] + agent-teams debate [F]. Контролируемого сравнения для кодинга нет. Позиция: дёшево с субагентами; применять к архитектурным неизвестным; мерить долю PIVOT.

**4.30. Co-change analysis перед зонами.**
Инструмент есть [F]; снижение конфликтов агентов не измерено. Позиция: medium; валидировать write-set логами.

**4.31. «Grade the end state, not the path» vs множество процессных ограничений (sterile cockpit, чеклисты, обязательный RED, hooks на последовательности).**
Реконсиляция: **гейты** = машинно-проверяемые инварианты, защищающие грейдинг (тесты не тронуты, scope ⊆ allow_paths, RED-evidence существует, evidence bundle существует, диф-размер, contract-freeze); **advisory** = процедуры (sterile cockpit, чеклисты, порядок шагов). Вердикт — только по end state + evidence; процессные правила никогда не входят в рубрику; hooks исполняют только список гейтов.

**4.32. Stop-hook cap: 3 или 8.**
hooks reference, hooks guide, env-vars: 8, `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` (0 отключает) [F]; «three» в failure-modes.md — устаревшее чтение. Формулировка «without progress» не определена → cap = подстраховка, регулятор = ledger-счётчик; тест V1/V2.

**4.33. Anthropic (/batch, worktrees, teams) vs Cognition («writes single-threaded»).**
Cognition 2026 [S]: «one main loop carries state, and subagents are stateless workers with narrow scope». Реконсиляция: чтение/ревью параллельно свободно; запись параллельно только disjoint zones + frozen contracts; иначе один писатель.

**4.34. Бюджет вопросов: 5 (spec-kit) / 3 маркера / unbounded interview (Claude Code, Harper Reed) / generate-then-iterate (Kiro) / ask nothing + assumptions[] (BMAD headless).**
Данных нет. Позиция: 3 при ≤2 items, 5 иначе; никаких tech-вопросов; вопросы до workflow.

**4.35. `TaskCompleted` exit 2: блокирует (agent-teams page) vs «no blocking effect» (один fetch hooks page).**
Тест V16; fallback — Stop hook.

**4.36. Worktree base: fresh (default) vs head.**
Fresh снижает stale-base drift, ломает срезы на незапушенных предшественниках; head/stacked PRs решают ценой restack.

**4.37. Обязательно ли другое семейство моделей для L2?**
Рекомендация Anthropic [F], SDLC [F], PoLL/Nine Judges [S]; необходимость для кода не измерена; свежая сессия той же модели всё ещё делит генератор. Позиция: другое семейство, если доступно; иначе другой tier + промпт + evidence-source (B поведенческий vs C код) как декорреляция.

**4.38. Ledger в `main` или только на ветке.**
OpenSpec архивирует в репо; Anthropic держит progress-файл в репо; шум в main никем не обсуждается. Позиция для соло: коммитить `archive/<id>/` в main тем же PR.

---

## 5. Открытые вопросы для дизайна (исследование не решает — решает дизайнер)

1. **Пороги маршрутизатора.** Веса и границы LIGHT 0–2 / MEDIUM 3–7 / HEAVY ≥8 — prior; какие из 14 сигналов несут информацию для AI-авторских изменений — неизвестно (вся defect-prediction литература о людях). Решение: полы как политика, веса — логистическая регрессия после ~50 задач; правила promote (2 неудачи гейта, контакт с зоной, размер ×2, dependency manifest) / demote (только на PLAN, один раз).
2. **Размер единицы.** ≤300 изменённых строк / ≤10 файлов / один контекст — выбор; альтернатива — «80%-reliability horizon» по METR (много короче 50%-horizon) [S]. Мерить catch-rate и send-backs по размеру.
3. **Что именно получает L2.** AC — да (после pre-registration), scope statement и out_of_scope — вероятно да (помогают судить scope creep, риск anchoring), hypothesis cards/ADR/L1-вердикты/provenance — нет. Убирать ли комментарии из diff для Tier C (теряется легитимное понимание) — A/B на seeded set.
4. **Семейство моделей и effort по стадиям.** Доступен ли второй провайдер; Fable 5.1 как L2 vs Opus 5 при 2× цене — решает калибровка.
5. **Расположение ledger** (`main` vs ветка) и что удалять при GC evidence.
6. **Выборка человека для tier 0** (10–20% — произвольно), место человеческого гейта (перед merge vs перед deploy; TOC → перед deploy при наличии staging), лимит решений за присест (7 — произвольно), SLA.
7. **Payload recycle.** Переписанный spec + constraints + подтверждённые находки как падающие тесты + committed passing checkpoints; WIP-diff — нет. Не измерено, сколько знания теряется.
8. **Стоимость day-0 harness по типу проекта** (web: build + DB fixture + browser); при какой длительности Tier B на изменение соло-разработчик его отключит.
9. **Пороги diff-coverage/mutation на legacy** (типичный PR 20% diff coverage — число не обосновано); flaky-политика (nightly ×N, промоушн по N зелёных).
10. **Список «гейт vs advisory».** Какие процессные правила становятся hooks (тесты не тронуты, scope, RED evidence, evidence bundle, diff cap, contract freeze, no irreversible), какие остаются текстом (чеклисты Sign-In/Time-Out/Sign-Out, sterile cockpit).
11. **Бюджетные потолки по tier** (`--max-budget-usd`, `budget.total`, `maxTurns`) и что делать при исчерпании (stop, partial report, человек).
12. **Строить ли что-то на agent teams** (debate для гипотез) или заменить workflow-«draft a plan from several angles» без inter-agent messaging.
13. **Правило retire слоя** (0 уникальных catch ∧ precision <50% за 30 прогонов — выбор) и частота повторной калибровки при смене модели.
14. **Язык.** Intake на русском, артефакты на английском: хранить verbatim, back-translation свежим субагентом, одно подтверждение при расхождении.
15. **Pre-registration** для outsider: снижает ли anchoring без роста FP — не измерено.
16. **Число trials для judgment-критериев** (3, единогласно) и что делать при неединогласии (unknown → человек).
17. **Верификация подложки** перед доверием: V1–V22 (Stop cap, «without progress», SubagentStop поля, hook-deny под bypass, deny в bypass, Bash-write у «read-only», `omitClaudeMd`, worktree base, schema retries, `/goal` обманывается, workflow resume, `Date.now()`, checkpoints vs Bash, `-p` worktrees не чистятся, AskUserQuestion в `-p`/dontAsk, `TaskCompleted` exit 2, teams auto-approve, `maxTurns` partial, лимиты concurrency, auto-mode пороги в `-p`, Code Review check neutral, hook `cwd` в worktree).
18. **Как автоматически атрибутировать escaped defects** (blame/bisect) в соло-репо без трекера.
19. **Kill как исход.** Кто может kill (человек и rung 4; агенты только предлагают) — выбор; что сохраняется от убитого (intake, state, reason, salvage list).
20. **Debate для спорных находок кода** — evidence только на QA-задачах [S]; риск persuasion-override; вводить ли вообще или ограничиться adjudicator с переисполнением.

---

## 6. Полный список источников (дедуплицированный)

Пометка после URL: [F] прочитан; [S] заблокирован, сниппеты/зеркало; [M] по памяти.

### Anthropic — engineering / research / блог
- https://www.anthropic.com/engineering/building-effective-agents [F] (также доступен как /research/building-effective-agents)
- https://www.anthropic.com/engineering/multi-agent-research-system [F]
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents [F]
- https://www.anthropic.com/engineering/writing-tools-for-agents [F]
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents [F]
- https://www.anthropic.com/engineering/harness-design-long-running-apps [F]
- https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents [F]
- https://www.anthropic.com/engineering/how-we-contain-claude [F]
- https://www.anthropic.com/research/emergent-misalignment-reward-hacking [F]
- https://www.anthropic.com/research/towards-understanding-sycophancy-in-language-models [F]
- https://www.anthropic.com/claude-sonnet-4-5-system-card [S]
- https://www.anthropic.com/claude-4-system-card [S]
- https://claude.com/blog/building-agents-with-the-claude-agent-sdk [F]
- https://claude.com/blog/harnessing-claudes-intelligence [F]
- https://claude.com/blog/how-anthropic-teams-use-claude-code [F]
- https://claude.com/blog/code-review [F]
- https://claude.com/blog/how-anthropic-secures-its-ai-native-software-development-lifecycle [F]
- https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more [F]
- https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them [F]
- https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start [F]
- https://claude.com/code-with-claude/session/tyo-mercari-human-on-the-loop [F]
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices [F]
- https://platform.claude.com/docs/en/test-and-evaluate/define-success [F]
- https://platform.claude.com/docs/en/test-and-evaluate/develop-tests [F]
- https://platform.claude.com/docs/en/build-with-claude/prompt-caching [F]

### Claude Code — документация (code.claude.com)
- https://code.claude.com/docs/en/best-practices [F]
- https://code.claude.com/docs/en/sub-agents [F]
- https://code.claude.com/docs/en/hooks [F]
- https://code.claude.com/docs/en/hooks-guide [F]
- https://code.claude.com/docs/en/workflows [F]
- https://code.claude.com/docs/en/goal [F]
- https://code.claude.com/docs/en/memory [F]
- https://code.claude.com/docs/en/agent-teams [F]
- https://code.claude.com/docs/en/agents [F]
- https://code.claude.com/docs/en/features-overview [F]
- https://code.claude.com/docs/en/skills [F]
- https://code.claude.com/docs/en/permission-modes [F]
- https://code.claude.com/docs/en/permissions [F]
- https://code.claude.com/docs/en/code-review [F]
- https://code.claude.com/docs/en/ultrareview [F]
- https://code.claude.com/docs/en/worktrees [F]
- https://code.claude.com/docs/en/commands [F]
- https://code.claude.com/docs/en/cross-session-messaging [F]
- https://code.claude.com/docs/en/common-workflows [F]
- https://code.claude.com/docs/en/sandboxing [F]
- https://code.claude.com/docs/en/sandbox-environments [F]
- https://code.claude.com/docs/en/github-actions [F]
- https://code.claude.com/docs/en/tools-reference [F]
- https://code.claude.com/docs/en/costs [F]
- https://code.claude.com/docs/en/prompt-caching [F]
- https://code.claude.com/docs/en/monitoring-usage [F]
- https://code.claude.com/docs/en/claude-directory [F]
- https://code.claude.com/docs/en/agent-sdk/cost-tracking [F]
- https://code.claude.com/docs/en/agent-sdk/subagents [F]
- https://code.claude.com/docs/en/model-config [F]
- https://code.claude.com/docs/en/settings-reference [F, частично]
- https://code.claude.com/docs/en/env-vars [F]
- https://code.claude.com/docs/en/checkpointing [F]
- https://code.claude.com/docs/en/headless [F]
- https://code.claude.com/docs/en/sessions [F]
- https://code.claude.com/docs/en/cli-reference [F]
- https://code.claude.com/docs/en/security [F]
- https://code.claude.com/docs/en/chrome [F]
- https://code.claude.com/docs/en/large-codebases [F]
- https://code.claude.com/docs/en/plugins/code-intelligence [F]

### Anthropic — GitHub
- https://github.com/anthropics/claude-code/blob/main/plugins/code-review/commands/code-review.md [F]
- https://github.com/anthropics/claude-code/blob/main/plugins/code-review/README.md [F]
- https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md [F]
- https://github.com/anthropics/claude-code/tree/main/plugins/feature-dev [F]
- https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md [F, неинформативно]
- https://github.com/anthropics/claude-code/issues/39981 [F, пользовательский отчёт]
- https://github.com/anthropics/claude-code-action/blob/main/examples/agent-approval-check.yml [F]
- https://github.com/anthropics/claude-code-action/blob/main/examples/pr-review-comprehensive.yml [F]
- https://github.com/anthropics/claude-code-action/blob/main/docs/security.md [F]
- https://github.com/anthropics/claude-code-security-review [F]
- https://raw.githubusercontent.com/anthropics/cwc-long-running-agents/main/claude-code-config/.claude/CLAUDE.md [F]
- https://raw.githubusercontent.com/anthropics/cwc-long-running-agents/main/claude-code-config/.claude/agents/evaluator.md [F]

### Spec Kit (GitHub)
- https://github.com/github/spec-kit/blob/main/spec-driven.md [F]
- https://github.com/github/spec-kit/blob/main/README.md [F]
- https://github.com/github/spec-kit/blob/main/templates/spec-template.md [F]
- https://github.com/github/spec-kit/blob/main/templates/plan-template.md [F]
- https://github.com/github/spec-kit/blob/main/templates/tasks-template.md [F]
- https://github.com/github/spec-kit/blob/main/templates/commands/clarify.md [F]
- https://github.com/github/spec-kit/blob/main/templates/commands/specify.md [F]
- https://github.com/github/spec-kit/blob/main/templates/commands/analyze.md [F]
- https://github.com/github/spec-kit/blob/main/templates/commands/checklist.md [F]
- https://github.com/github/spec-kit/blob/main/templates/commands/implement.md [F]
- https://github.com/github/spec-kit/blob/main/templates/commands/converge.md [F]
- https://github.com/github/spec-kit/blob/main/docs/guides/existing-projects.md [F]
- https://github.com/github/spec-kit/blob/main/docs/guides/evolving-specs.md [F]
- https://github.com/github/spec-kit/blob/main/docs/guides/monorepo.md [F]
- https://github.com/github/spec-kit/blob/main/docs/concepts/complex-features.md [F]
- https://github.com/github/spec-kit/blob/main/docs/concepts/spec-persistence.md [F]
- https://github.com/github/spec-kit/blob/main/extensions/assess/README.md [F]
- https://github.com/github/spec-kit/blob/main/extensions/assess/commands/speckit.assess.intake.md [F]
- https://github.com/github/spec-kit/blob/main/extensions/assess/commands/speckit.assess.decide.md [F]
- https://github.com/github/spec-kit/blob/main/extensions/bug/README.md [F]
- https://github.com/github/spec-kit/blob/main/extensions/bug/commands/speckit.bug.assess.md [F]

### BMAD Method (GitHub)
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/README.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/reference/skills-and-agents.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/plan/choose-a-planning-path.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/plan/define-requirements-and-a-specification.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/plan/break-work-into-stories-and-track-it.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/build-a-change.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/review-a-change.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/autonomous-development-loops.md [F; в поздней проверке 404 — детали «5 итераций / один тикет» не переверифицированы]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/walk-through-a-change.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/test-completed-work.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/build/finish-an-epic.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/existing-codebases/theory-of-project-context.md [F]
- https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/existing-codebases/start-in-an-existing-codebase.md [F]
- https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/skills/bmad-build-auto/step-01-clarify-and-route.md [F]
- https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/skills/bmad-build-auto/workflow.md [F]
- https://raw.githubusercontent.com/bmad-code-org/BMAD-METHOD/main/skills/bmad-build-auto/step-02-plan.md [F]
- https://github.com/wolverin0/bmad-claude-agents [F, вторичный]

### Ralph Wiggum / loops
- https://github.com/ghuntley/how-to-ralph-wiggum/blob/main/README.md [F]
- https://github.com/ghuntley/how-to-ralph-wiggum/blob/main/files/PROMPT_build.md [F]
- https://github.com/ghuntley/how-to-ralph-wiggum/blob/main/files/PROMPT_plan.md [F]
- https://ghuntley.com/ralph/ [S]
- https://github.com/snarktank/ralph [F]
- https://raw.githubusercontent.com/mikeyobrien/ralph-orchestrator/main/AGENTS.md [F]

### Superpowers (obra)
- https://github.com/obra/superpowers [F]
- https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md [F]
- https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md [F]
- https://github.com/obra/superpowers/blob/main/skills/subagent-driven-development/SKILL.md [F]
- https://github.com/obra/superpowers/blob/main/skills/requesting-code-review/SKILL.md [F]
- https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md [F]
- https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md [F]
- https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md [F]
- https://github.com/obra/superpowers/issues/1173 [F]

### Другие фреймворки и практики (GitHub)
- https://github.com/Fission-AI/OpenSpec [F] (README, docs/concepts.md, docs/existing-projects.md, docs/reviewing-changes.md)
- https://github.com/open-gsd/gsd-core [F] (README, docs/explanation/the-phase-loop.md)
- https://github.com/EveryInc/compound-engineering-plugin/blob/main/README.md [F]
- https://github.com/cline/cline [F]
- https://github.com/gotalab/cc-sdd [F]
- https://github.com/cremich/promptz.lib/blob/main/steering/kiro-specs.md [F]
- https://github.com/kirodotdev/Kiro [F]
- https://raw.githubusercontent.com/gotalab/claude-code-marimo/main/.claude/commands/kiro/spec-requirements.md [F]
- https://raw.githubusercontent.com/Kanevry/session-orchestrator/main/docs/adr/0005-ears-notation-plan.md [F]
- https://github.com/ianhxu/agentic-engineering-field-study/blob/main/04-spec-driven-development.md [F, вторичный синтез]
- https://github.com/agentsmd/agents.md [F] (README, components/FAQSection.tsx, components/AboutSection.tsx)
- https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md [F]
- https://github.com/IjzerenHein/agent-org-inverse-conway [F, не применялся на реальном проекте]
- https://github.com/me2resh/agent-decision-record [F]
- https://github.com/ezyang/ai-blindspots [F] (walking-skeleton, read-the-docs, scientific-debugging, requirements-not-solutions, know-your-limits, stop-digging)
- https://github.com/joelparkerhenderson/architecture-decision-record [F]
- https://github.com/adr/madr/blob/develop/template/adr-template.md [F]
- https://github.com/OpenAutoCoder/Agentless [F]
- https://github.com/risk-first/website/blob/master/docs/thinking/Meeting-Reality.md [F]
- https://github.com/risk-first/website/blob/master/docs/thinking/De-Risking.md [F]
- https://github.com/risk-first/website/blob/master/docs/practices/Development-And-Coding/Prototyping.md [F]
- https://github.com/VILA-Lab/Dive-into-Claude-Code [F]
- https://github.com/ai-boost/awesome-harness-engineering [F]
- https://github.com/wondelai/skills/blob/main/pragmatic-programmer/references/tracer-bullets.md [F]
- https://github.com/fullsend-ai/fullsend/issues/2372 [F]
- https://github.com/johnzfitch/claude-wiki/blob/master/15-Claude-AI-Features/claude-opus-4-1-system-card.md [F, зеркало]
- https://github.com/chroma-core/context-rot [F README]
- https://github.com/Spracks/PackageHallucination [F README]
- https://raw.githubusercontent.com/harperreed/harper.blog/main/content/post/2025-02-16-llm-codegen-and-you/index.md [F, зеркало]
- https://github.com/crabbuild/crab (AGENTS.md), https://github.com/tradestreamhq/tradestream (dev/ralph-loop/PROMPT_plan.md), https://github.com/NoamHadad12/secure-research-image-upload (AGENTS.md) [F, code-search hits]
- https://raw.githubusercontent.com/borghei/Claude-Skills/main/project-management/execution/backlog-refinement/references/invest-and-splitting-guide.md [F, вторичный]
- https://raw.githubusercontent.com/citypaul/.dotfiles/main/claude/.claude/skills/story-splitting/resources/source-notes.md [F, вторичный]
- https://raw.githubusercontent.com/cucumber/docs/main/content/docs/bdd/better-gherkin.md [F]
- https://raw.githubusercontent.com/conventional-commits/conventionalcommits.org/master/content/v1.0.0/index.md [F]
- https://raw.githubusercontent.com/CMander02/DailyAgentPapers/main/data/2026/05/18/overeager-coding-agents-measuring-out-of-scope-actions-on-benign-tasks.md [F, digest]
- https://raw.githubusercontent.com/deusyu/harness-engineering/main/works/arxiv-overeager-coding-agents-translation.md [F, перевод]
- https://raw.githubusercontent.com/agentpatterns-ai/website/main/verification/overeager-behavior-elicitation-scope-trap-fragments.md [F]
- https://raw.githubusercontent.com/memgrafter/research-digests/main/ml_research_analysis_2024/2410.03608_ticking-all-the-boxes-generated-checklists-improve-llm-evaluation-and-generation_20260214_234746.md [F, digest]
- https://gist.github.com/jeremy-w/6774525 [F, конспект Feathers]

### LLM-судьи, мультиагентные провалы, бенчмарки (GitHub / репо)
- https://github.com/lm-sys/FastChat/blob/main/fastchat/llm_judge/README.md [F]
- https://raw.githubusercontent.com/lm-sys/FastChat/main/fastchat/llm_judge/data/judge_prompts.jsonl [F]
- https://github.com/meg-tong/sycophancy-eval [F]
- https://github.com/Weixin-Liang/LLM-scientific-feedback [F]
- https://github.com/SakanaAI/AI-Scientist [F]
- https://github.com/Y0oMu/LLM-Judge-Bias-Dataset [F]
- https://github.com/sail-sg/Cheating-LLM-Benchmarks [F]
- https://github.com/ucl-dark/llm_debate [F README]
- https://github.com/Jiaxin-Wen/MisleadLM [F README]
- https://github.com/microsoft/lost_in_conversation [F]
- https://www.microsoft.com/en-us/research/publication/llms-get-lost-in-multi-turn-conversation/ [F abstract]
- https://github.com/multi-agent-systems-failure-taxonomy/MAST [F definitions]
- https://github.com/unlv-evol/AgenticFlict [F README]
- https://github.com/SqueezeAILab/LLMCompiler [F README]
- https://github.com/METR/eval-analysis-public [F]
- https://github.com/METR/Measuring-Early-2025-AI-on-Exp-OSS-Devs [F]
- https://github.com/Codium-ai/AlphaCodium [F]
- https://github.com/microsoft/CodeT/tree/main/CodeT [F]
- https://github.com/csmith-project/csmith [F]
- https://github.com/SWE-bench/SWE-bench [F] (README, swebench/harness/grading.py, docs/guides/docker_setup.md)
- https://raw.githubusercontent.com/sierra-research/tau-bench/main/README.md [F]
- https://raw.githubusercontent.com/All-Hands-AI/OpenHands/0.20.0/openhands/controller/stuck.py [F]

### Microsoft Research / Google / DORA / GitClear
- https://www.microsoft.com/en-us/research/publication/expectations-outcomes-and-challenges-of-modern-code-review/ [F]
- https://www.microsoft.com/en-us/research/publication/use-of-relative-code-churn-measures-to-predict-system-defect-density/ [F]
- https://www.microsoft.com/en-us/research/publication/dont-touch-my-code-examining-the-effects-of-ownership-on-software-quality/ [F] (+ PDF https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/bird2011dtm.pdf)
- https://www.microsoft.com/en-us/research/publication/predicting-defects-using-network-analysis-on-dependency-graphs/ [F]
- https://www.microsoft.com/en-us/research/publication/mining-metrics-to-predict-component-failures/ [F]
- https://www.microsoft.com/en-us/research/publication/characteristics-of-useful-code-reviews-an-empirical-study-at-microsoft/ [F]
- https://www.microsoft.com/en-us/research/publication/code-reviews-do-not-find-bugs-how-the-current-code-review-best-practice-slows-us-down/ [F abstract]
- https://www.microsoft.com/en-us/research/wp-content/uploads/2009/10/Realizing-Quality-Improvement-Through-Test-Driven-Development-Results-and-Experiences-of-Four-Industrial-Teams-nagappan_tdd.pdf [F]
- https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/code-reviews/README.md [F]
- https://github.com/microsoft/code-with-engineering-playbook/blob/main/docs/code-reviews/process-guidance/reviewer-guidance.md [F]
- https://github.com/google/eng-practices/blob/master/review/developer/small-cls.md [F]
- https://github.com/google/eng-practices/blob/master/review/reviewer/standard.md [F]
- https://github.com/google/eng-practices/blob/master/review/reviewer/looking-for.md [F]
- https://github.com/google/eng-practices/blob/master/review/reviewer/speed.md [F]
- https://github.com/google/eng-practices/blob/master/review/index.md [F]
- https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report [F]
- https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report [F]
- https://gitclear-public.s3.us-west-2.amazonaws.com/GitClear-AI-Copilot-Code-Quality-2025.pdf [F]
- https://research.google/pubs/modern-code-review-a-case-study-at-google/ [S]
- https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html [S]
- https://testing.googleblog.com/2017/04/where-do-our-flaky-tests-come-from.html [S]
- https://dora.dev/capabilities/streamlining-change-approval/ [M]
- https://dora.dev/capabilities/working-in-small-batches/ [M]
- https://sre.google/sre-book/postmortem-culture/ [M]

### GitHub docs (исходники) и git
- https://github.com/github/docs/blob/main/content/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners.md [F]
- https://github.com/github/docs/blob/main/content/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches.md [F]
- https://raw.githubusercontent.com/github/docs/main/content/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets.md [F]
- https://raw.githubusercontent.com/github/docs/main/content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md [F]
- https://github.com/github/gh-stack [F]
- https://github.com/git/git/blob/master/Documentation/git-merge-tree.adoc [F]

### Инструменты верификации и анализа (GitHub)
- https://github.com/adamtornhill/code-maat [F]
- https://github.com/stefano-zanotti-edo/code-hotspots [F]
- https://github.com/Bachmann1234/diff_cover [F]
- https://github.com/stryker-mutator/stryker-js [F] (README, docs/configuration.md, docs/incremental.md)
- https://github.com/boxed/mutmut [F]
- https://github.com/HypothesisWorks/hypothesis [F] (README, hypothesis/docs/stateful.rst)
- https://github.com/dubzzz/fast-check [F]
- https://github.com/schemathesis/schemathesis [F] (+ src/schemathesis/specs/openapi/checks.py, checks.py)
- https://github.com/pact-foundation/pact-specification [F]
- https://github.com/pact-foundation/docs.pact.io/blob/master/website/docs/pact_nirvana.md [F]
- https://github.com/pact-foundation/docs.pact.io/blob/master/website/docs/consumer/contract_tests_not_functional_tests.md [F]
- https://github.com/pact-foundation/docs.pact.io/blob/master/website/docs/pact_broker/can_i_deploy.md [F]
- https://github.com/semgrep/semgrep [F]
- https://github.com/approvals/ApprovalTests.Net [F]
- https://github.com/approvals/ApprovalTests.Java/blob/master/approvaltests/docs/how_to/TestCombinations.md [F]
- https://github.com/approvals/ApprovalTests.php [F]
- https://github.com/jestjs/jest/blob/main/docs/SnapshotTesting.md [F]
- https://github.com/syrupy-project/syrupy [F]
- https://github.com/xorcare/golden [F]
- https://github.com/itsallcode/openfasttrace [F] (README, .agents/skills/openfasttrace/SKILL.md)
- https://github.com/microsoft/playwright-mcp [F]
- https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/test-snapshots-js.md [F]
- https://github.com/obi1kenobi/cargo-semver-checks [F]
- https://raw.githubusercontent.com/mkdocstrings/griffe/main/docs/guide/users/checking.md [F]
- https://raw.githubusercontent.com/siom79/japicmp/master/README.md [F]
- https://raw.githubusercontent.com/assert-rs/snapbox/main/crates/trycmd/README.md [F]
- https://github.com/bats-core/bats-core [F] (+ docs/source/usage.md)
- https://github.com/computationalmodelling/nbval [F]
- https://raw.githubusercontent.com/iterative/dvc.org/main/content/docs/command-reference/metrics/diff.md [F]
- https://github.com/capitalone/datacompy [F]
- https://raw.githubusercontent.com/great-expectations/great_expectations/develop/README.md [F]
- https://raw.githubusercontent.com/hashicorp/web-unified-docs/main/content/terraform/v1.14.x/docs/internals/json-format.mdx [F]
- https://github.com/open-policy-agent/conftest [F]
- https://github.com/mobile-dev-inc/Maestro [F]
- https://github.com/Aider-AI/aider/blob/main/aider/website/_posts/2023-10-22-repomap.md [F]
- https://github.com/Aider-AI/aider/blob/main/aider/website/docs/repomap.md [F]
- https://github.com/devcontainers/spec [F]
- https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/Secure_Product_Design_Cheat_Sheet.md [F]
- https://raw.githubusercontent.com/OWASP/www-project-top-10-for-large-language-model-applications/main/2_0_vulns/LLM01_PromptInjection.md [F]
- https://github.com/mendix/docs/blob/development/content/en/docs/private-platform/nist-controls/ac/pmp-nist-ac05.md [F, репродукция NIST AC-5]
- https://github.com/CyberStrikeus/CyberStrike [F, репродукция NIST AC-5]
- https://github.com/peitor/scrumguide , https://github.com/SSWConsulting/SSW.Rules.Content [F, копии Scrum Guide 2020]

### Академические статьи (arXiv и др.) — заблокированы; только сниппеты/зеркала
- https://arxiv.org/abs/2306.05685 Zheng et al., Judging LLM-as-a-Judge [S]
- https://arxiv.org/abs/2404.13076 Panickssery et al., self-preference [S]
- https://arxiv.org/abs/2504.03846 Chen et al., Do LLM Evaluators Prefer Themselves for a Reason? [S]
- https://arxiv.org/abs/2601.22548 Are LLM Evaluators Really Narcissists? [S]
- https://arxiv.org/abs/2410.21819 Wataoka et al., self-preference bias [S]
- https://arxiv.org/abs/2310.13548 Sharma et al., sycophancy [S]
- https://arxiv.org/abs/1702.00502 / https://www.pnas.org/doi/10.1073/pnas.1707323114 Tomkins et al., single vs double blind [S]
- https://arxiv.org/abs/2404.18796 Verga et al., PoLL [S]
- https://arxiv.org/abs/2605.29800 Kohli et al., Nine Judges, Two Effective Votes [S]
- https://arxiv.org/abs/2410.02736 Ye et al., CALM [S]
- https://arxiv.org/abs/2603.12123 Song, Cross-Context Review [S]
- https://arxiv.org/abs/2603.16244 More Rounds, More Noise [S]
- https://arxiv.org/abs/2604.19049 Refute-or-Promote [S]
- https://arxiv.org/abs/2310.01798 Huang et al., LLMs Cannot Self-Correct Reasoning Yet [S]
- https://arxiv.org/abs/2402.06782 Khan et al., Debating with More Persuasive LLMs [S]
- https://arxiv.org/abs/2407.00215 McAleese et al., CriticGPT [S]
- https://arxiv.org/abs/2604.23178 Judging the Judges: bias mitigation [S]
- https://arxiv.org/abs/2406.07791 Shi et al., position bias [S]
- https://arxiv.org/abs/2606.13685 Yagubyan, Coin Flip Judge [S]
- https://arxiv.org/abs/2510.18003 BadScientist [S]
- https://arxiv.org/abs/2605.30208 Meta RADAR [S]
- https://arxiv.org/abs/2603.15911 Human-AI Synergy in Agentic Code Review [S]
- https://arxiv.org/abs/2608.21311 AI-to-AI Code Reviews of GitHub PRs [S]
- https://arxiv.org/abs/2503.13657 MAST [S; определения F]
- https://arxiv.org/abs/2604.03551 AgenticFlict [S; README F]
- https://arxiv.org/abs/2607.04697 AI Agent PRs: merge conflict rates [S]
- https://arxiv.org/abs/2307.03172 Lost in the Middle [S]
- https://arxiv.org/abs/2503.11926 / https://openai.com/index/chain-of-thought-monitoring/ [S]
- https://arxiv.org/abs/2605.18583 Overeager Coding Agents [S; зеркала F]
- https://arxiv.org/abs/2602.00409 Over-Mocked Tests (MSR 2026) [S]
- https://arxiv.org/abs/2406.10279 Spracklen et al., package hallucination [S]
- https://arxiv.org/abs/2605.17062 package hallucination 2026 cohort [S]
- https://arxiv.org/abs/2404.10100 TiCoder [S]
- https://arxiv.org/pdf/2608.16742 TDD-Agent [S]
- https://arxiv.org/pdf/2609.09671 Consort [S]
- https://arxiv.org/abs/2606.04967 process taxonomy of agent frameworks [S, только заголовок]
- https://arxiv.org/abs/2603.25697 Kitchen Loop [S]
- https://arxiv.org/abs/2601.03878 spec-driven codegen empirical [S]
- https://arxiv.org/abs/2602.00180 SDD: code to contract [S]
- https://arxiv.org/abs/2410.03608 TICK checklists [S; digest F]
- https://arxiv.org/abs/2505.06120 Laban et al., Lost in Multi-Turn [S; abstract F]
- https://arxiv.org/abs/2409.12822 Wen et al., U-Sophistry [S]
- https://arxiv.org/abs/2102.11378 Petrović et al., mutation testing at Google [M]
- https://arxiv.org/abs/2402.09171 Meta TestGen-LLM [M]
- https://arxiv.org/abs/2203.11171 Self-Consistency [M]
- https://arxiv.org/abs/2507.09089 METR paper [S]
- https://arxiv.org/abs/2203.04374 Tornhill & Borg, Code Red [M]
- https://arxiv.org/abs/2605.21384 SpecBench [S]
- https://openreview.net/pdf?id=VfyYOT9yIa LLM Sycophancy Under User Rebuttal [S]
- https://www.pnas.org/doi/10.1073/pnas.1018033108 Danziger et al. (и письмо Weinshall-Margel & Shapard) [M]
- Knight & Leveson 1986 (IEEE TSE 12(1)) [M]; Kamei et al. 2013 JIT (TSE) [M]; Hassan 2009 [M]; Shin et al. 2011 [M]; Mockus & Weiss 2000 [M]; Parasuraman & Manzey 2010 [M]; Fagan 1976 https://ieeexplore.ieee.org/document/5388086 [M]; Gao/Bird/Barr ICSE 2017 [M]

### Практики, блоги, вендоры — заблокированы (сниппеты)
- https://cognition.com/blog/dont-build-multi-agents [S]
- https://cognition.com/blog/multi-agents-working [S]
- https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/ [S]
- https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/ [S]
- https://metr.org/blog/2026-02-24-uplift-update/ [S]
- https://www.trychroma.com/research/context-rot [S]
- https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/ [S]
- https://typia.io/blog/ai-deleted-my-tests-and-said-all-tests-pass/ [S]
- https://getunblocked.com/blog/ai-agent-doom-loop/ [S]
- https://proxify.io/articles/stanford-study-of-100000-developers-on-engineering-productivity [S]
- https://www.veracode.com/blog/genai-code-security-report/ [S]
- https://marmelab.com/blog/2025/11/12/spec-driven-development-waterfall-strikes-back.html [S]
- https://brooker.co.za/blog/2026/04/09/waterfall-vs-spec.html [S]
- https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/ [S; зеркало F]
- https://docs.devin.ai/essential-guidelines/when-to-use-devin [S]
- https://www.thoughtworks.com/en-us/radar/techniques/complacency-with-ai-generated-code [S]
- https://martinfowler.com/articles/pushing-ai-autonomy.html [S]
- https://simonwillison.net/2025/Mar/2/hallucinations-in-code/ [S]
- https://mitchellh.com/writing/non-trivial-vibing [S]
- https://mrzacsmith.medium.com/tracer-bullets-the-right-way-to-structure-work-for-ai-coding-agents-6bf429d94d85 [S]
- https://newsletter.pragmaticengineer.com/p/tdd-ai-agents-and-coding-with-kent [S]
- https://tidyfirst.substack.com/p/augmented-coding-beyond-the-vibes [S]
- https://davepaola.com/writing/stop-parallelizing-your-ai-agents/ [S]
- https://inside.basepowercompany.com/p/merge-dont-queue [S]
- https://blog.codacy.com/does-your-engineering-team-have-a-parallelization-strategy-for-ai-coding-agents-2026 [S]
- https://getautonoma.com/blog/parallel-ai-agent-prs [S]
- https://www.projectmanagementdocs.com/template/project-documents/assumption-log/ [S]
- https://www.agilehour.org/blog/spike-work-in-agile-how-teams-de-risk-delivery-without-losing-speed [S]
- https://www.strategyzer.com/library/how-assumptions-mapping-can-focus-your-teams-on-running-experiments-that-matter [S]
- https://www.producttalk.org/assumption-testing/ [S]
- https://barryoreilly.com/explore/blog/how-to-implement-hypothesis-driven-development/ [S]
- https://thecynefin.co/safe-fail-probes/ [S]
- https://rogermartin.medium.com/what-would-have-to-be-true-83dac5bd2189 [S]
- https://www.svpg.com/flavors-of-prototypes/ [S]
- https://gojko.net/2014/06/09/forget-the-walking-skeleton-put-it-on-crutches/ [S]
- https://pragprog.com/titles/rmrfsd/ ; https://se-radio.net/2026/05/se-radio-721-rob-moffat-on-risk-first-software-development/ [S]
- https://sloanreview.mit.edu/article/toyotas-principles-of-setbased-concurrent-engineering/ [S]
- https://blog.codinghorror.com/the-last-responsible-moment/ [S]
- http://c2.com/xp/SpikeSolution.html ; http://www.extremeprogramming.org/rules/spike.html [S]
- https://www.oreilly.com/library/view/the-pragmatic-programmer/9780135956977/f_0030.xhtml [S]
- https://en.wikipedia.org/wiki/Spiral_model ; https://en.wikipedia.org/wiki/Pre-mortem [S]
- https://kiro.dev/docs/specs (и /correctness/) [S]
- Cursor Plan Mode / Windsurf Planning Mode docs [S]
- cubic.dev PR-size post [S]; dev.to «Test Deletion Is a Privileged Operation» [S]; dev.to/tmfrisinger characterization tests [S]; tessl.io (Huntley on compaction) [S]

### Quality systems — классика (не прочитано; [M]/[S])
- https://global.toyota/en/company/vision-and-philosophy/production-system/index.html ; https://mag.toyota.co.uk/toyota-production-system-glossary/ ; https://mag.toyota.co.uk/jidoka-toyota-production-system/ [S]
- https://onlinelibrary.wiley.com/doi/full/10.1002/9781444316568.wiem05014 ; https://www.bobcooper.ca/articles/next-generation-stage-gate-and-whats-next-after-stage-gate [S]
- https://www.tocinstitute.org/theory-of-constraints.html ; https://www.leanproduction.com/theory-of-constraints/ [S]
- https://www.bmj.com/content/320/7237/768 (Reason) ; https://www.eurocontrol.int/sites/default/files/library/017_Swiss_Cheese_Model.pdf [M]
- https://www.nejm.org/doi/full/10.1056/NEJMsa0810119 (Haynes) [M]
- https://hbr.org/2007/09/performing-a-project-premortem (Klein) [M]
- https://ntrs.nasa.gov/citations/19910017830 (Degani & Wiener) [M]
- https://www.ecfr.gov/current/title-14/chapter-I/subchapter-G/part-121/subpart-T/section-121.542 [M]
- https://kanbanguides.org/english/ ; https://kanban.university/kanban-guide/ [M]
- https://deming.org/explore/fourteen-points/ [M]
- https://www.nasa.gov/ivv/ [M]
- https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final (NIST AC-5; текст через репродукции [F]) [M]
