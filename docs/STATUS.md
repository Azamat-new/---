# STATUS — где мы и как продолжить (файл передачи)

Дата: 2026-09-26. Сессия остановлена по лимиту; фоновые результаты сохранены частично в docs/design/*-journal-partial.json и docs/smoke/ (артефакты незавершённого дымового теста: триаж, критерии, проверка намерения). Ветка: `claude/pensive-knuth-lvfjko`. Схема: https://www.figma.com/board/7VgCIMCMOK2WroyMvOEAxT

## Что достигнуто (проверено)

| Компонент | Состояние | Как проверить |
|---|---|---|
| Методология | `SEPARATOR.md` (RU), полная спецификация `docs/SPEC.md` (EN, v1 после панели судей), плейбук для других инструментов | прочитать |
| CLI `.separator/bin/sep.cjs` | все команды: epic/plan/unit/gate/sandbox/blind/ratchet/decide/merge/card/next/answer/approve/check-integration/lint/selftest/hook | `node .separator/bin/sep.cjs selftest` → 16/16; `node .separator/bin/sep.cjs lint` |
| Хуки принуждения | `.claude/settings.json` → `guard-write`, `guard-bash` (по `agent_type` и worktree) | selftest; в этой сессии подтверждено, что хуки подхватываются без перезапуска |
| Физическая слепота S7 | `sep sandbox` + `sep blind` (headless `claude -p --restricted` из каталога вне проекта + хук `guard-blind` + канарейка) | e2e-прогон: чтение файла проекта из песочницы и `git log` были **запрещены**; линзы дали вердикты с исполненными командами |
| Механический сквозной прогон | эпик → триаж → классификация → план → пробер (красный тест) → исполнитель → шлюз (поймал выжившего мутанта = непокрытый критерий) → cold + customer линзы → вердикт MERGE → merge в `integration` с трейлерами → карточка | повторить по `docs/STATUS.md` § «Ручной прогон» |
| Оркестрация `.claude/workflows/sep-run.js` | тонкий цикл вокруг `sep next`; роли через `agentType` с запасным режимом (карточка роли как промпт) | `sep lint` парсит скрипт; дымовой тест с агентами **не завершён** (см. ниже) |
| Роли `.claude/agents/sep-*.md` (12) | написаны, lint проходит | регистрируются при старте сессии |
| Скиллы `/sep`, `/sep-blind` | написаны | — |
| Демо `examples/demo` | todo-CLI с тестами | `cd examples/demo && npm test` |
| CI / git-хуки | `.github/workflows/separator-gate.yml`, `.githooks/pre-push` | — |

## Что не завершено

1. **Дымовой тест `sep-run` с настоящими агентами.** Первый запуск упал на формате ответа раннера (исправлено: раннер
   возвращает JSON текстом, скрипт парсит). Второй запуск дошёл до S0 (триаж написал 9 критериев приёмки хорошего
   качества), но проверка намерения получила «undefined» вместо текста запроса из-за той же проблемы раннера — исправлено,
   прогон остановлен. **Следующий шаг:** перезапустить и довести до `status: done`, исправляя всё, что вскроется.
2. **Адверсариальная проверка спецификации** (8 линз → опровержение → патч, до сухого остатка) шла в фоне; результаты
   (SPEC-v2.md, V1-SCOPE.md) появятся в scratchpad сессии и **должны быть перенесены в `docs/design/`**. Если сессия
   умерла — раунд можно повторить по описанию в § «Как повторить проверку».
3. **Дайджест исследования** (`DIGEST.md`) не успел записаться; сырые заметки по 10 направлениям лежат в `docs/research/`.
4. **FigJam:** есть базовый конвейер; не добавлены секции со стадиями, классами, шлюзами для человека и протоколом слепоты.
5. Не реализовано из спецификации (v2): S1b bootstrap характеризационных тестов, панель дизайнов для T3, `sep-judge` при
   расколе линз, cross-vendor линза, SubagentStop-хук с быстрым шлюзом, дайджест H4 как команда, `sep revert`, `sep escape`.

## Как продолжить (новая сессия Claude Code в этом репозитории)

```
node .separator/bin/sep.cjs selftest && node .separator/bin/sep.cjs lint
# дымовой тест (агенты уже зарегистрированы, т.к. сессия новая):
/sep "Add a `remove` command to the demo todo CLI (examples/demo): `todo remove <id>` prints `removed <id>` and the item disappears from `todo list`; unknown id exits non-zero with `no item <id>`"
# или напрямую инструментом Workflow: scriptPath .claude/workflows/sep-run.js, args {"request": "..."}
```
Ожидаемый результат: `status: done`, merge-коммит в `integration`, карточка в `.separator/epics/<epic>/merge-cards/`.
Если воркфлоу вернул `ask`/`human` — `sep answer` / `sep approve`, затем `/sep resume <epic>`.

## Ручной прогон механики (без агентов, 5 минут)

```
S="node .separator/bin/sep.cjs"; $S epic new "Add a remove command" --id e2e; D=.separator/epics/e2e
# написать $D/triage.json и $D/ACCEPTANCE.md (см. примеры в SEPARATOR.md), затем:
$S epic classify e2e; # написать $D/dag.json с юнитом U1 (writes examples/demo/src/**, test_writes examples/demo/test/acc_U1.test.js, checks)
$S plan check e2e
git worktree add /tmp/wt --detach HEAD && cd /tmp/wt && $S unit start e2e U1 --role prober   # написать красный тест → $S unit finish e2e U1
$S unit start e2e U1 --role executor   # реализовать → $S unit run e2e U1 -- "cd examples/demo && npm test" → $S unit finish e2e U1
cd - && $S gate e2e U1 && $S blind e2e U1 --lens cold && $S blind e2e U1 --lens customer && $S decide e2e U1 && $S merge e2e U1 && $S card e2e U1
```

## Как повторить адверсариальную проверку

Линзы: реализуемость в Claude Code (сверять с `docs/research/claude-code-mechanics.md` — там эмпирические факты этой
сессии), завершаемость/дедлоки, утечки слепоты, ускорение, универсальность, опыт человека, надёжность шлюзов,
согласованность с исследованием. Каждую находку опровергают два независимых скептика; подтверждённые правит патчер в
`docs/SPEC.md`; повторять, пока раунд не даст ноль подтверждённых major-находок.

## Эмпирические факты о Claude Code 2.1.283, от которых зависит реализация

См. `docs/research/claude-code-mechanics.md` § 9: агенты регистрируются только при старте; frontmatter-хуки не
срабатывают; глобальные хуки получают `agent_type` и `cwd` worktree; `claude -p --restricted` ограничивает файловые
инструменты каталогом (Bash — нет, поэтому хук); `--agents`/`--agent` работают из любого каталога; вложенный
`claude -p` из Bash работает; 4 CPU → 2 параллельных агента на воркфлоу.
