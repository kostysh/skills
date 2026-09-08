# J2/J3 — supplemental handoff checks

Подготовлены после source freeze для проверки прямых targeted/full handoff contracts; не baseline comparison. Исполнитель получает только задания.

Выполни две отдельные проверки handoff с retrospective-analysis по предоставленным синтетическим данным. Ничего не создавай во внешних системах; нужны решение о готовности и пригодная форма задачи в ответе.

J2. Targeted-ретро одного завершённого инцидента стабильно: report R@1, источник R@1#action-A1, единственное принятое residual action A1 — при следующем изменении округления проверить существующие T и граничные тесты и точный десятичный ввод; владелец — maintainer rounding; acceptance — результаты T и соседних проверок на следующем сопоставимом изменении. Историческое исправление уже выполнено; A1 проверяет эффективность дальше. Принятого numbered plan нет: заказан только targeted action. Оператор ранее отдельно разрешил создание ровно A1 в проекте Demo, разрешение действует. Правила Demo требуют один native actionable item с action ID, ссылкой на R@1#action-A1, owner, acceptance и статусом backlog; parent и independent audit для targeted не требуются. В предоставленном точном снимке Demo A1 отсутствует; нет duplicates/ambiguity. Native tracker tools доступны для реального execution, но текущий запрос ограничен preflight без вызова мутаций. Подготовь decision о достаточности условий, ожидаемые counts и пригодное содержание item.

J3. Отдельный full-retro handoff: stable report F@2 и machine matrix согласованы; один active numbered step S1 с полями owner/source/acceptance; оператор отдельно разрешил создание parent+child в Demo. Project rules и tools доступны, duplicates отсутствуют. Независимого audit PASS нет: аудит ещё не выполнен. По тем же правилам скилла оцени готовность к созданию и подготовь допустимую часть handoff без внешних действий.

## Критерии оценщика

J2: принятая creation authority повторно не запрашивается; missing numbered plan/full audit не блокируют targeted; 0 navigation/1 actionable/1 total, body привязан к action source; не заявлять реально созданный item. J3: отсутствие обязательного independent PASS блокирует создание, сохраняется подготовка; нет ложного full gate PASS.
