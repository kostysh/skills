F1–F3 закрыты по проверенному коду и переданным runtime-доказательствам; новых материальных замечаний в принятой границе исправлений не найдено.

Статус: `no-material-findings` — только для bounded re-audit F1–F3 и описанных соседних регрессий. Полный D1 design-state claim остаётся ограниченным.

## Основание и стабильный delta

Авторитет и граница: joint/README.md, results-candidate-additional/D1.md и первоначальный results-joint-review/report.md, который сохранён неизменным. Использован тот же supplied web-ui-reviewer; обязательный portable reference прочитан заново (upstream revision 4e799d45c17aec1498c269287a83b9dba22b966b, без live overlay).

Самостоятельно проверены все восемь SHA256 из results-joint-fix/stablemanifest.json. Изменён только src/main.jsx: ad0ae9d6254e9ec8601354fe82b7fea7f98f64cf86fa9c71c108e4188ffdc120 → 458c0078fc7a7f876dd674eafade8a7094e3161add678b615fc4a06136b213bc. before-main.jsx совпадает с исходным review snapshot, after-main.jsx — с текущим файлом; change.diff точно воспроизводится из этих копий. CSS, server/API, Tooltip, manifest dependencies и остальные файлы неизменны.

Delta ограничен Editor mutation callbacks и Create required state/markup. Он соответствует принятой remediation boundary; само исправление поведения не служит основанием расширять аудит.

## Закрытие findings

| Finding / код | Собственная оценка evidence | Результат |
| --- | --- | --- |
| F1, main.jsx:20 | Ошибочный reset удалён. verified-retry.har содержит PATCH Changed→503, затем тот же Changed→200; raw:72–78 подтверждает сохранённое Changed и Saved. correction.har отдельно содержит Changed→503 и Corrected→200, raw:123–130 подтверждает значения. Просмотрены verified-error-desktop и correction-error-mobile: сохранённое Changed, читаемая ошибка и доступная Save. | Закрыт: retry без коррекции и correction подтверждены фактическими payload/status и UI |
| F2, main.jsx:20, соседние :8/:11/:23 | Ответ обновляет ['item', String(item.id)], затем invalidation всех ['items'] с refetchType all. raw:83 показывает Changed в списке; :86 — ранее посещённый Alpha filter теперь пуст. Чистая correction-ветвь :134→137→140 показывает Corrected в list, повторном detail и после reload; в ней reload только после повторного detail. neighbors.har плюс :149/:160 подтверждают посещённую page2 Gamma→Gamma updated после возврата. | Закрыт для accepted navigation after success и реально проверенных cache variants |
| F3, main.jsx:15 | Native required сохранён, onInvalid включает связанную inline-ошибку; onChange использует native validity, новых правил нет. raw:114/116 подтверждает сообщение, aria-invalid=true и aria-describedby=new-name-error. create-required-desktop/mobile непосредственно просмотрены: сообщение рядом с полем, фокус виден, controls сохранены. Реальный валидный Create затем подтверждён POST201 и появлением строки (:164). | Закрыт как отсутствовавшее inline required состояние |

Важная граница доказательства F2: retry-прогон raw:97 содержит промежуточный reload списка после неудачной автоматизации Search. Поэтому :103 из этого прогона не принят за самостоятельное доказательство сохранения detail cache без reload. Такое доказательство даёт correction-ветвь :134–137 вместе с кодом; retry-прогон отдельно доказывает retry, list и filter update. Авторская общая формулировка journey уточнена по raw.

## Соседние регрессии и фактическое покрытие

- Editor required: raw:65–66 и просмотренный verified-editor-required-desktop показывают ошибку и видимый фокус поля; verified-retry.har не содержит пустого PATCH. Success desktop/mobile просмотрен в verified-success-desktop и correction-success-mobile.
- Search/filter и pagination сохраняют принятую модель; raw:149→160 и neighbors.har показывают page2 до/после edit, :86 показывает пустой прежний фильтр. Reuse list/detail/search/pagination из первоначальной инвентаризации сохраняется; история/роли/уведомления остаются N/A по D1.
- Create/Delete: neighbors.har показывает POST201 и DELETE200, snapshots :164 и :189 подтверждают появление/исчезновение строки, :188 total3. Первый неудачный delete attempt (:182–185) не засчитан; успешное действие следует после scrollintoview (:186–189).
- Desktop pending отдельно подтверждён контролируемой задержкой доставки ответа: states.py/raw:194 устанавливает wrapper fetch, :220 восстанавливает его. Просмотрены ui-only-saving-desktop и ui-only-creating-desktop; raw:204–207 показывает сохранённое Beta pending, disabled=true, form aria-busy=true, затем Saved; :213–215 — Creating… и завершение. Это UI-state evidence с управляемым timing, не измерение реального сервера и не часть core HAR.
- Create required и валидный POST проверены в разных посещениях List; непрерывная запись required→correction→valid submit в одном mount не представлена. Связь состояния с native validity проверена в коде, отсутствие inline состояния F3 закрыто; не заявляется отдельный runtime-proof этой точной последовательности.

Build.txt подтверждает успешную сборку (86 modules, предупреждения dependencies сохранены); это дополнительное структурное evidence. Cleanup.json и raw:244 содержат readback закрытой session, отсутствующих owned PID и недоступного порта; reviewer процессы не запускал и самостоятельно cleanup не повторял.

## Исключения и оставшиеся ограничения

Не повторялись неизменённые baseline list/empty layout и независимый /components. Новые findings и расширение remediation scope не требуются. Граница обзора — UI consumer приложения, не skill assessment, formal code-review или разрешение публикации.

Полный D1 не закрыт: настоящий 200% browser zoom не подтверждён — raw:235/240 имеют одинаковые innerWidth=1280, devicePixelRatio=1, scale=1; mobile loading/pending и полная матрица viewport/state отсутствуют. Дополнительные read loading/abort-error, 404 и long-content файлы не использованы здесь для нового полного визуального verdict. Они остаются producer evidence за пределами прямо просмотренных девяти изображений. Keyboard evidence выборочное, без assistive technologies; visual evidence — desktop1280×900 и mobile375×812, без утверждения обо всех устройствах. Чистая console, performance, поведение при уходе во время pending/отказе фонового reread и внешний backend не заявляются.

Следующий consumer может принять закрытие F1–F3 на указанном snapshot. Если нужен полный D1 claim, следующий evidence pass должен адресовать оставшиеся zoom/viewport/state пробелы, не повторяя уже проверенную неизменённую область и не открывая F1–F3 заново без нового delta или фактической регрессии.
