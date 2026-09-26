# Воронка без Claude Code: Cursor, Codex, Gemini CLI, любой чат, команда людей

Сепаратор — это файлы и один CLI. Claude Code лишь удобный драйвер. Тот же цикл можно крутить
чем угодно, потому что **вся логика живёт в `sep next`**, а не в промптах.

## Цикл драйвера (одинаковый для всех)

```
sep epic new "<запрос>"            # → epic id
loop:
  step = sep next <epic>           # JSON: {step, units, questions, ...}
  switch step:
    triage       → роль «триаж» пишет ACCEPTANCE.md + triage.json; роль «проверка намерения» читает ТОЛЬКО request.md;
                   сравнить списки → intent-check.json; затем: sep epic classify <epic>
    ask          → показать questions.md человеку; sep answer <epic> "<ответы>"
    cartography  → роль «картограф» дописывает зоны в zones.json; sep epic classify <epic>
    plan|replan  → роль «планировщик» пишет dag.json; sep plan check <epic>
    audit        → роль «аудитор плана» читает ТОЛЬКО dag.json; сравнить с ACCEPTANCE.md; sep mark <epic> audited=true
    spike        → для каждого юнита роль «пробер» в отдельном worktree: sep unit start … --role prober,
                   красный приёмочный тест, sep unit finish; записать spike.json; sep mark <epic> <u> stage=spiked
    human        → показать карточку (sep card); sep approve <epic> <unit> | --contracts | --kill
    units        → для каждого юнита: исполнитель (sep unit start --role executor … sep unit finish) →
                   sep gate → инспекторы (пишут inspect-<lens>.json) → sep ratchet → sep blind --lens … →
                   sep decide → sep merge | sep card | новый раунд
    merge        → sep merge <epic> <unit>
    learn        → sep check-integration; роль «ученик» дописывает lessons.md; sep mark <epic> stage=done
    done         → конец
```

Каждая роль получает **только свой пакет**: `sep unit packet <epic> <unit> --for <role>` печатает всё, что
роли можно знать. Кто пакет не получил — того не существует для этой роли.

## Как получить роль в другом инструменте

| Роль | Cursor | Codex / Gemini CLI / `claude -p` | Люди |
|---|---|---|---|
| системный промпт | `.cursor/agents/<role>.md` = тело `.claude/agents/sep-<role>.md` | `--system-prompt-file .claude/agents/sep-<role>.md` (или тело в промпте) | распечатанная карточка роли |
| изоляция | новый чат на каждую роль; `readonly: true` для ревьюеров | один headless-вызов на роль, cwd = worktree юнита | другой человек на каждую стадию |
| слепота | `sep sandbox` + агент, которому дан только каталог песочницы | `sep blind --lens cold` (использует `claude -p --restricted`; для другого вендора: запустить его CLI из каталога песочницы с тем же промптом и схемой) | zip песочницы стороннему ревьюеру, без ссылки на PR |
| принуждение | git-хуки (`.githooks/pre-push`), CI `separator-gate` | то же | branch protection; одобрения ботов не считаются |

Структурированный вывод: любая роль должна вернуть JSON по схеме; для `claude -p` это флаг
`--json-schema`, для Codex/Gemini — просьба в промпте + `sep validate <file> --schema <name>`.

## Bash-драйвер (минимальный)

```sh
#!/bin/sh
# sep-drive.sh <epic>  — крутит цикл, роли вызываются через claude -p; замените CLAUDE=… на другой CLI
set -e
E="$1"; SEP="node .separator/bin/sep.cjs"
role() { # $1 role, $2 prompt, $3 cwd
  (cd "${3:-.}" && claude -p "$2" --system-prompt-file ".claude/agents/sep-$1.md" --output-format json --max-turns 40 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).result))')
}
while :; do
  N=$($SEP next "$E"); STEP=$(echo "$N" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).step))')
  case "$STEP" in
    done|ask|human) echo "$N"; exit 0;;
    triage) role triage "Epic $E: read .separator/epics/$E/request.md, write ACCEPTANCE.md and triage.json as your card says"; $SEP epic classify "$E";;
    plan|replan) role planner "Epic $E: write .separator/epics/$E/dag.json as your card says"; $SEP plan check "$E" || true;;
    audit) $SEP mark "$E" audited=true;;   # or run the auditor role
    *) echo "step $STEP: see docs/PLAYBOOK-other-tools.md for the role to run"; exit 2;;
  esac
done
```

Этот скрипт нарочно неполный: он показывает форму. Полный драйвер для Claude Code —
`.claude/workflows/sep-run.js` (около 250 строк), и его можно перевести на любой язык один к одному.

## Уровни деградации

| Возможность | L3 Claude Code | L2 Cursor / агенты без хуков | L1 один контекст (CLI, чат) | L0 команда людей |
|---|---|---|---|---|
| изоляция стадий | субагент + worktree + без CLAUDE.md | отдельный чат/агент на стадию, `readonly` для ревью | один headless-вызов на стадию, `/clear` между стадиями в чате | другой человек на стадию |
| оркестрация | воркфлоу `sep-run` | оркестратор-агент по этому файлу или `sep-drive.sh` | `sep-drive.sh` | чек-лист в шаблоне PR |
| принуждение | хуки + pre-push + CI | pre-commit `sep lint`, pre-push, CI | то же | CI + branch protection |
| слепота | песочница + `--restricted` + хук + канарейка | песочница + агент только с этим каталогом + канарейка | песочница как единственный вход | zip песочницы стороннему |
| память | CLAUDE.md → @AGENTS.md; правила по путям | AGENTS.md; `.cursor/rules/*.mdc` с glob | AGENTS.md | AGENTS.md читают люди |

Артефакты одинаковы на всех уровнях: переход между уровнями ничего не ломает.
