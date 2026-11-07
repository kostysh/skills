Статус реализации: completed.

В src/App.tsx добавлено действие **Discard changes** рядом с **Review changes**. Оно возвращает email, включение уведомлений и frequency к последнему подтверждённому набору; до первого Confirm — к начальным значениям: пустой email, уведомления включены, Daily. Исторический пример не изменялся. Изменён только исходник src/App.tsx в выданной временной копии.

Выбор взаимодействия:

| Вариант | Оценка для этой задачи |
| --- | --- |
| Действие на месте | Выбрано. Три связанных поля остаются видны; возврат происходит сразу и рядом с применением. |
| Второй диалог | Возможен для отдельного рискованного решения, но здесь добавляет прерывание к небольшому локальному действию. Существующий диалог применения сохранён. |
| Отдельная страница | Не нужна для возврата трёх значений; переход усложняет сохранение контекста формы. |

Реализация использует существующие React state и UI-компоненты. Значения baseline вычисляются как applied ?? initialSettings. Никаких API, новых зависимостей или хранения не добавлено. На чистой форме Discard недоступен; при ошибке он также позволяет очистить ошибку. После отмены показано сообщение в role=status, а фокус перенесён в email. Подсказка рядом с кнопками объясняет, к какому набору произойдёт возврат. Сообщение очищается при следующей правке. На узкой ширине кнопки стоят друг под другом.

Проверенный результат:

| Сценарий | Наблюдение |
| --- | --- |
| До первого применения | Через Tab, ввод с клавиатуры, ArrowRight и Space созданы draft@example.test / Off / Weekly. Enter на Discard вернул пустой email / On / Daily. |
| Фокус после отмены | activeElement — INPUT#email; Discard стал disabled; сообщение об отмене появилось. |
| Ввод и проверка email | Неверный email сохранился в поле, появился текст ошибки, aria-invalid=true, фокус в email. |
| Отмена после ошибки | Вернулись applied@example.test / Off / Weekly; ошибка исчезла, aria-invalid=false. |
| Диалог | Начальный фокус Cancel; Tab перемещает на Confirm и возвращает на Cancel; Shift+Tab возвращает на Confirm. |
| Escape и Cancel | Черновик остаётся целиком; применённый набор не меняется; фокус возвращается на Review changes. |
| Confirm | Применённый набор и сообщение Settings applied обновляются только после Confirm. |
| Последний, а не первый applied | После второго Confirm сохранены second@example.test / On / Daily. Следующий черновик unsaved@example.test / Off / Weekly отменён обратно ко второму набору. |
| 320×720 | Кнопки и поля доступны, форма и диалог без горизонтального overflow. Для формы scrollWidth=320. Диалог: x=16, width=288, y=149.5, height=421, bottom=570.5. |
| Reload | Сброшены applied и draft; возвращены начальные значения и disabled Discard. |
| Browser errors | Список ошибок страницы пуст; dev console содержала обычные Vite/React сообщения. |

Все взаимодействия выполнялись через agent-browser: клавиатура, реальные ввод/click и rendered DOM. Прямые React callbacks не вызывались. DOM evaluation использовалась только для чтения состояния, фокуса, размеров, шрифтов и resource entries. Сеть не перехватывалась. Это локальная демонстрация без backend и отправки email.

Проверки исходника:

- pnpm build — exit 0; TypeScript и production bundle собраны.
- pnpm lint — exit 1: существующий, не изменённый src/components/ui/button.tsx:67, react-refresh/only-export-components.
- pnpm exec eslint src/App.tsx — exit 0.
- Новых тестовых файлов нет: изменённый путь проверен в браузере с наблюдаемыми значениями, фокусом и восстановлением.

Во всех pnpm-командах использованы только параметры процесса: pnpm_config_pm_on_fail=ignore, pnpm_config_manage_package_manager_versions=false, pnpm_config_verify_deps_before_run=false.

Исходный dev-прогон и дополнительная проверка окружения:

Dev-сервер сообщил 403 для файла Geist из установленной через symlink зависимости: путь находился вне Vite allowlist. Поэтому исходные dev screenshots отражают fallback font. После завершения исходного прогона выполнена отдельная **supplemental environment-guided verification** на уже успешном production build через pnpm preview. Config и dependencies не менялись, весь функциональный прогон не повторялся.

В preview браузер загрузил /assets/geist-latin-wght-normal-BgDaEnEv.woff2 с HTTP 200, transferSize=29700. FontFaceSet сообщил Geist Variable: loaded, weight 100 900; computed font-family — "Geist Variable", sans-serif. Network entries для document, JS, CSS и font — 200; ошибок и console messages нет. Форма с narrow@example.test и диалог повторно проверены на 320×720. Приведённые выше размеры диалога подтверждены также на packaged font.

Основные материалы:

- final.diff — итоговый diff исходника относительно сохранённого исходного App.tsx.
- baseline/App.tsx — исходный файл; implementation.patch — реально применённая правка.
- commands.json и commands.md — исходные команды и реальные outputs/exit statuses, включая неуспешные попытки.
- supplemental-commands.json и supplemental-commands.md — отдельная проверка preview и её cleanup.
- agent-browser-core.txt — полное руководство установленного agent-browser 0.27.3.
- screenshots/02-initial-restored-keyboard.png — возврат начальных значений и фокус.
- screenshots/07-latest-applied-restored-narrow.png — возврат второго applied; исходный dev/fallback font.
- screenshots/09-preview-packaged-font-narrow-dialog.png — итоговый диалог с packaged font.
- screenshots/10-preview-packaged-font-narrow-form-settled.png — итоговая форма с packaged font после завершения CSS-переходов.
- screenshots/05-confirmation-narrow.png и 08-preview-packaged-font-narrow-form.png — промежуточные кадры переходов; сохранены как сырые материалы, итоговыми визуальными доказательствами служат 06/09/10.
- artifact-manifest.json — размеры и SHA-256 исходника, diff и screenshots.
- supplemental-final-cleanup.json — финальная проверка отсутствия собственных процессов.

В исходном журнале сохранены также ограничения запуска: socket directory требовал XDG_RUNTIME_DIR в /tmp; Chrome потребовал --no-sandbox в этом окружении; обычная sandbox-команда не сохраняла browser daemon между вызовами. Успешные браузерные команды выполнялись с разрешённым require_escalated, только в сессии webux-live-b, с профилем /tmp/webux-live-b-profile и runtime/config под /tmp. Пользовательский браузер не подключался. Первый read-only inspection повторён в конце для полного сохранения stdout; это отмечено в журнале.

Один слишком быстрый batch встретил закрывающийся dialog overlay. Следующий batch дождался отсутствия диалога и подтвердил ожидаемый результат. Это сохранённая ошибка управления временем проверки, а не скрытая успешная попытка. Финальные снимки сделаны после соответствующих ожиданий.

Стабильный исходник src/App.tsx:
SHA-256 5e7ed6e3604d9aa0f80f0e0eb68f41a64f5ffd1712c2efc427ef296c609ed1a6.

Cleanup завершён. Browser session закрыта. Dev и preview процессы завершены по проверенному ownership; Ctrl-C dev launcher сам по себе не остановил дочерний Vite, поэтому тот был отдельно завершён по PID. Финальная проверка: task-owned profile/server matches=[], известные preview PID отсутствуют, browser pidfile отсутствует, connect_ex(127.0.0.1:4318)=111. Exit 130/143 запускателей относятся к намеренной остановке.

Материальные пределы: общий lint проекта остаётся красным на неизменённом button.tsx; это не исправлялось за рамками задачи. Проверка выполнена в Chromium, без пользовательского исследования, screen reader и формальной сертификации доступности. Backend/persistence за пределами текущего жизненного цикла страницы отсутствуют по заданию. Независимая оценка этой реализации не выполнялась; этот отчёт фиксирует работу автора и наблюдаемые результаты.

