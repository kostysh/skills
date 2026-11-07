# Закрытые критерии до изменения кандидата

Основание: принятый WEB-UX-PLAN-20261107-v2. Координатор — автор случаев и оценщик; исполнитель не видит этот файл. Идентичные inputs для baseline/candidate; одна модель/настройки наследуются, точные runtime tokens/time не заявляются. Доступ ограничивается инструкцией, не OS sandbox. Результат каждого случая PASS/FAIL/INCONCLUSIVE; общий verdict принадлежит независимому skill-reviewer.

Selection: candidate 1/2/6 → web-ux-engineer; 3 → frontend-design; 4 → web-ui-reviewer; 5 → react-spa-engineer. Mixed 6 один лидер, конкретные помощники, без обязательной загрузки всей группы. Baseline может выбирать из трёх существующих владельцев: это измеряет распределение ответственности, не дефект само по себе.

A: обнаружить сброс query/page при возврате; потерю draft при ошибке; timeout неизвестен, повтор может быть опасен; ограничить свежесть reread и серверные гарантии; полезные finding evidence/consequence/fix/check; без runtime claims и без правок. Не требовать durable/offline/autosave.
B: не превращать 12 колонок в дефект по вкусу, не выдумать проверку отсутствующего экрана, ограничить вывод текстом принятого макета.
C: сообщить поддержанное отсутствие доступных имён; не blocked всего аудита, не сертификация доступности или проверка браузера.
D: точная локальная замена и proportionate проверка; без полного UX процесса и других изменений до live-задания.
E: явно ограничить зависимое решение о ролях; выполнить полезную независимую часть (ясная подпись); не придумать права, новое API или хранение.
F: сохранены ownership/lifetime, attempt/entity/access identities, fencing, неизвестный итог и authoritative reread failure; матрица времени жизни и применимые совмещённые проверки без fake backend claims.
G/H: принятую полноту search/detail/history нельзя подменить visual polish; UI review read-only, frontend стратегия не strategy-ready с пропущенными обязательствами. Новый скил отсутствует в отдельной portability-пробе, соседи не должны прекращать поддержанную работу из-за этого.
Live: реальный diff, осмысленное сравнение вариантов; reset всех 3 значений к applied/initial; cancel modal сохраняет draft; confirm устанавливает новый baseline; keyboard/focus и narrow viewport проверены наблюдением. Не заявлять server persistence, email delivery или доказанное удобство аудитории. Без новых dependencies/backend/persistence. Исторический fixture неизменён, чужих процессов нет. Raw evidence и screenshots доступны.

Portability: candidate A–E дополнительно исполняются с единственным web-ux-engineer без соседних файлов, браузера или сервиса для материалов A–C/E; локальный метод и границы достаточны. Для F–H предоставить только соответствующие соседние пакеты. Критерии одинаковы для comparative случаев; forced execution не доказывает selection.
