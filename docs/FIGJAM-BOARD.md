# Доска в FigJam: что уже есть и что добавить

Доска: https://www.figma.com/board/7VgCIMCMOK2WroyMvOEAxT — на ней основной конвейер (сгенерирован из Mermaid ниже).
Лимит вызовов Figma MCP на тарифе Starter был исчерпан в сессии сборки, поэтому секции 2–5 добавляются вручную
(FigJam → вставить Mermaid через плагин или `generate_diagram` с `fileKey=7VgCIMCMOK2WroyMvOEAxT`).

## 1. Основной конвейер (уже на доске)

```mermaid
flowchart TD
    input[/"Любой ввод: задача, баг, идея, пачка мелких правок"/]
    subgraph intake ["S0 Приём: широкое горлышко"]
        triage["Триаж: класс риска T0-T3, критерии приёмки, вопросы с дефолтами"]
        intent["Проверка намерения: видит только исходный запрос"]
    end
    h0{{"H0 Вопросы человеку: только T2+ или расхождение"}}
    subgraph plan ["Планирование"]
        zones["S1 Зоны ответственности: zones.json, команды проверки"]
        decompose["S2 Разбор: DAG юнитов, непересекающиеся write-set, контракты"]
        distribute["S3 Распределение: волны, worktree на юнит, бюджеты"]
        spike["S4 Проверка гипотез: спайк, красный приёмочный тест"]
    end
    h1{{"H1 Контракты и дизайн: T2/T3"}}
    subgraph exec ["Исполнение: каждый юнит параллельно"]
        execute["S5 Выполнение: исполнитель в worktree, только карточка"]
        gate["Механический шлюз: тесты, линт, scope, мутанты, секреты"]
    end
    subgraph sep1 ["Первый сепаратор: с контекстом"]
        inspect["S6 Независимое ревью: перепроверяет шлюз, репро или hazard"]
        back6>"Возврат с репро: в S5, S4, S2 или S0"]
    end
    subgraph sep2 ["Второй сепаратор: без контекста"]
        blind["S7 Слепое ревью: чистая песочница, линза клиента и холодная линза"]
        router>"Маршрутизатор: находка в S5, S4, S2 или S0"]
    end
    verdict["S8 Вердикт: таблица решений в коде"]
    h2{{"H2 Карточка слияния: T2/T3, hold"}}
    h3{{"H3 Карточка тупика: счётчик исчерпан"}}
    cream(["Сливки: merge в integration"])
    skim(["Обрат: deferred.md, тикеты"])
    learn["S9 Обучение: метрики, уроки, пороги зон"]
    h4{{"H4 Дайджест: integration в main"}}
    input --> triage
    input --> intent
    triage --> h0
    intent --> h0
    h0 -->|"ответы или дефолты"| zones
    zones --> decompose
    decompose --> distribute
    distribute --> spike
    spike -->|"T0/T1"| execute
    spike -->|"T2/T3"| h1
    h1 --> execute
    triage -.->|"T0: быстрая дорожка"| execute
    execute --> gate
    gate -->|"красный: 1 повтор"| execute
    gate -->|"зелёный"| inspect
    inspect -->|"pass"| blind
    inspect -->|"fix или replan"| back6
    blind --> verdict
    blind -->|"находки с репро"| router
    verdict -->|"merge"| cream
    verdict -->|"вне scope"| skim
    verdict -->|"T2/T3"| h2
    h2 --> cream
    verdict -->|"тупик"| h3
    cream --> learn
    learn --> h4
    style intake fill:#FFECBD,stroke:#FFC943
    style plan fill:#C2E5FF,stroke:#3DADFF
    style exec fill:#DCCCFF,stroke:#874FFF
    style sep1 fill:#FFE0C2,stroke:#FF9E42
    style sep2 fill:#FFCDC2,stroke:#FF7556
    style cream fill:#CDF4D3,stroke:#66D575
    style skim fill:#D9D9D9,stroke:#B3B3B3
```

## 2. Контроль циклов (добавить)

```mermaid
flowchart LR
    finding["Находка ревьюера"] --> kind{"Есть репро или класс опасности?"}
    kind -->|"нет"| note["Заметка: бесплатно, в уроки"]
    kind -->|"репро"| sig["Сигнатура находки"]
    kind -->|"опасность без репро"| hold["HOLD: верификатор, затем человек"]
    sig --> seen{"Сигнатура уже была?"}
    seen -->|"да"| up["Эскалация на уровень выше: S5 → S2 → H3"]
    seen -->|"нет"| ratchet["Храповик: репро становится тестом regress_sig"]
    ratchet --> counter{"Счётчик стадии исчерпан?"}
    counter -->|"нет"| target["Возврат: S5 код, S4 контракт, S2 разбор, S0 запрос"]
    counter -->|"да"| h3{{"H3 Карточка тупика"}}
    target --> progress{"Тот же хеш диффа после возврата?"}
    progress -->|"да"| h3
    progress -->|"нет"| next["Новый раунд"]
    style h3 fill:#FFECBD,stroke:#FFC943
    style hold fill:#FFCDC2,stroke:#FF7556
```

## 3. Протокол слепоты S7 (добавить)

```mermaid
flowchart LR
    plan["План, карточки, история, CLAUDE.md, .separator"] -. "никогда" .-> box
    base["git archive base_sha"] --> strip["Strip-список: CLAUDE.md, .claude, .separator, CHANGELOG, .env"]
    head["git archive head_sha"] --> strip
    strip --> box["Песочница вне проекта: 2 нейтральных коммита base и change"]
    box --> proc["Отдельный процесс: claude -p --restricted, файловые инструменты только в каталоге, хук guard-blind"]
    proc --> cold["Холодная линза: knowledge_statement, inferred_intent, SAFE/UNSAFE/ILLEGIBLE"]
    proc --> cust["Клиентская линза: ACCEPTANCE.md + команды, PASS/FAIL по критериям"]
    cold --> leak{"Канарейка в вердикте? Нарратив в диффе?"}
    cust --> leak
    leak -->|"да"| invalid["Панель недействительна: пересборка, инцидент харнесса"]
    leak -->|"нет"| bt{"inferred_intent совпадает с критериями?"}
    bt -->|"нет"| illegible["Находка: изменение непонятно постороннему"]
    bt -->|"да"| verdict["В таблицу вердиктов"]
    style box fill:#FFCDC2,stroke:#FF7556
    style invalid fill:#FFCDC2,stroke:#FF7556
```

## 4. Классы риска × стадии (таблица для доски)

| Класс | S2 | S4 | S6 | S7 | Слияние | Человек |
|---|---|---|---|---|---|---|
| T0 | 1 юнит | — | — | холодная | авто | H4 дайджест |
| T1 | да | да | 1 линза | клиентская | авто | H4 дайджест |
| T2 | + аудит | + проверка контракта | 2 линзы | клиентская + холодная | карточка | H1, H2 |
| T3 | + панель дизайнов | + план отката | 2 линзы | + security | карточка | H1, H2 |

## 5. Стикеры-принципы (по одному на стикер)

- Артефакты — единственная память.
- Кто пишет ≠ кто проверяет ≠ кто судит; обеспечено физически.
- Каждый шлюз объективен: код выхода, схема, множество, хеш.
- Свидетельства, не заявления: только записанные запуски.
- Тесты проверяют, а не определяют: acc_* и regress_* заморожены.
- Самое дешёвое опровержение — первым.
- Возвраты только вверх, со свидетельством, со счётчиком.
- Человек на цикле в пяти точках, а не внутри него.
- Строгость оплачивается классом риска.
- Утечка дефекта — единственная метрика, автоматически повышающая строгость.
