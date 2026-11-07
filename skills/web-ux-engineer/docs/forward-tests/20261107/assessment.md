# Оценка поведенческих проб

Оценщик — автор кандидата; это не независимый skill-review verdict. Критерии [зафиксированы заранее](criteria.md). Выводы привязаны к [trial snapshot](candidate-active.json). Сырые ответы сохранены без исправлений.

| Проверка | Baseline | Candidate | Основание |
|---|---|---|---|
| Выбор 1/2/6, сценарный UX | web-ui-reviewer / frontend-design / frontend-design | web-ux-engineer во всех трёх | Новый владелец выбран по каталогу; это не доказательство host autoload |
| Выбор 3/4/5, соседние области | frontend-design / web-ui-reviewer / react-spa-engineer | те же владельцы | PASS; смешанная задача имеет одного ведущего и конкретные вопросы соседям |
| A, контекст и сбой SPA | PASS | PASS | Потеря ввода, контекст возврата, неизвестный timeout, ограничения retry/reread; вывод о remount условный, не выдан за наблюдение |
| B, корректная плотная таблица | PASS | PASS | Нет вкусового уменьшения 12 нужных колонок; оба вывода limited по текстовым материалам |
| C, кодовый аудит | PASS | PASS | Поддержанные проблемы имён и полезные исправления; без браузерной/WCAG сертификации и без blanket blocked |
| D, простая правка | PASS | PASS | Одна точная строка, прочие исходники одинаковы; [контроль side effects](task-side-effects.json) |
| E, пробел бизнес-правила | PASS | PASS | Подпись предложена, права/статусы/API не выдуманы; ограничена зависимая часть |
| F, mutation lifetime | PASS | PASS | Устойчивый владелец, identities/fencing, receipt ≠ проекция, combined cache/remount/context/reread-failure falsifier |
| G, UI completeness | PASS | PASS | Принятый search/detail/history нельзя скрыть красивым overview; статус findings по данным задания |
| H, визуальная стратегия | PASS | PASS | Нет strategy-ready без покрытия обязательных представлений; библиотека не выдана за интеграцию |

D baseline дополнительно запускал lint: общая проверка упала на неизменённом `button.tsx`, локальная App.tsx прошла. Candidate ограничился точной source-проверкой. Это допустимые границы конкретной строковой правки; ни один результат не заявляет проверенную отрисовку. Численное преимущество времени/токенов не оценивается.

A–H — одна свежая сессия на набор, скрытая от rubric и чужих ответов. Такой пакет не доказывает, что ответы A–E сформированы без знания соседей, прочитанных для F–H. Поэтому portability подтверждается отдельной свежей пробой только нового пакета; её результат **PASS** для A–E: полезный findings/limited, корректные API-границы, одна точная правка D. Исполнитель прочитал только task.md, новый SKILL.md, App.tsx и package.json; [сырой ответ](standalone/output.md). Критерии не изменялись.

Живые пробы: **PASS** обеих реализаций по исходной rubric. Оба исполнителя сравнили page/dialog/inline и выбрали локальное вторичное действие, реально изменили только App.tsx, проверили reset всех трёх полей к initial и последнему applied, Cancel/Escape, input/validation, keyboard/focus и narrow layout. Candidate проверил 320×720; baseline — 360×800 и дополнительные применимые для frontend-design состояния. [Baseline raw/report](baseline-live/result.md), [candidate raw/report](candidate-live/summary.md), [side effects](live-side-effects.json). Последовательности действий различаются, поэтому сравнение ограничено одинаковым заданием и исходными критериями, без заявления о равном наборе каждого browser interaction.

Build и eslint изменённого App.tsx прошли у обоих. Общий lint имеет одну исходную ошибку в неизменённом ui/button.tsx. Dev-font 403 выявлен обоими; первоначальные данные сохранены. Узкая supplemental preview-проверка подтвердила packaged font HTTP 200 и текущие narrow form/modal без изменения кода. Она environment-guided; дизайн и первоначальная реализация остаются blind к rubric. Прогон не является полным E2E/WCAG-аудитом. Cleanup подтверждён собственными PID/port records.

Самооценка всех обязательных проб завершена; формальный независимый verdict ожидается. Эти учебные материалы не измеряют удобство аудитории, не проверяют backend и не доказывают улучшение конверсии. За пределами выбора владельца сравнительное превосходство кандидата не заявлено.

## Delta активного reference

После обнаружения старой широкой маршрутизации в React accessibility reference исправлено только введение. Свежий исполнитель `/root/reference_delta` получил прежние запросы 1/4 и только React root + обновлённый accessibility reference. Критерий владельцев взят из первоначальной rubric; итог **PASS**: 1 → web-ux-engineer, 4 → web-ui-reviewer, при сохранении технического вклада React. [Сырой результат](reference-delta/output.md). Это forced reference execution, не новая catalogue-selection проба.
