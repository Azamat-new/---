---
name: sep-blind
description: Слепое ревью текущих незакоммиченных изменений или ветки вне воронки: собирает чистую песочницу и запускает холодную линзу (ревьюер без контекста) headless. Полезно для быстрой проверки «поймёт ли посторонний, что я сделал, и найдёт ли дефект».
argument-hint: [<branch-or-ref>] (по умолчанию: рабочее дерево против HEAD)
disable-model-invocation: true
---
# /sep-blind — слепое ревью без эпика

Цель: получить вердикт ревьюера, который видит только код до и после, без плана, чата и истории.

Аргументы: `$ARGUMENTS`

Шаги:
1. Если аргумент — ветка или ref, `ref="$ARGUMENTS"`, база = `git merge-base HEAD <ref>` (или `HEAD` если ref впереди). Если аргумента нет: зафиксируй рабочее дерево во временной ветке: `git stash create` → `git branch sep/adhoc/<короткий id> <sha>` (или закоммить во временную ветку `sep/adhoc/...` с нейтральным сообщением `adhoc change set 1`), база = `HEAD`.
2. Создай временный эпик и юнит, чтобы воспользоваться той же механикой: 
   `node .separator/bin/sep.cjs epic new "adhoc blind review" --id adhoc-<id>` и `dag.json` с одним юнитом `U1` (`writes: ["**"]`, `checks: []`, `acceptance: []`), `node .separator/bin/sep.cjs plan check adhoc-<id>`, затем переименуй ветку в `sep/adhoc-<id>/U1`.
3. `node .separator/bin/sep.cjs blind adhoc-<id> U1 --lens cold --rebuild` (и `--lens customer`, если есть `ACCEPTANCE.md`, который ты можешь написать со слов человека).
4. Покажи человеку: `inferred_intent` (тест обратного перевода: совпадает ли с тем, что он хотел), вердикт, находки с репро, `leak_check`. Если `inferred_intent` не совпадает с намерением — это находка сама по себе: изменение непонятно постороннему.
5. Убери временный эпик и ветку (`rm -rf .separator/epics/adhoc-<id>`, `git branch -D sep/adhoc-<id>/U1`).
