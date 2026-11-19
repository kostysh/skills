# Форма уведомлений в Electron

В оболочке Notification Desk диспетчер на Linux x64 прошёл обычный маршрут формы 26 с компонентом 18. После подтверждения Weekly main выполнил один PUT, и два последующих GET прочитали ту же запись. В контрольном архиве Maple вызовы из renderer работали, а в окне был только заголовок. Свежий получатель применил точный выпуск electron-engineer 0.1.12 к обоим архивам. [Наблюдения окна, main, сервиса и файлов](notification-observed.json) · [Исходные ответы и действия читателей](reader-records.tar.gz)

| Передано | SHA-256 |
| --- | --- |
| [Принятая форма 26](../26/notification-spa.tar.gz) | `1de3fc4e816441efa641bf9d81a1b453347b8a4a118eff8279f5ebf9ab8d127c` |
| [Tooltip из строки 18](../18/component/Tooltip.js) | `2dbb9773d492a717df9ddbcd804187d258d8d4b8c6bc26b8010c2b1047a60313` |
| [Декларация Tooltip](../18/component/Tooltip.d.ts) | `71db6bd3785b5f25539ebb628e4d84c571c4bc07f94fedf918b6cac304c4426f` |
| [Оболочка для повторного запуска](notification-electron.tar.gz) | `c184dd944d93d52e9bb0ffbadcc8cd94b02b4c9ea40536cd92e60ed807d626f0` |
| Файл notification-desk.asar внутри оболочки | `b31197084d9dc4a9d9f276d9bf0628bec4e24000dcdbb5f58ebbc95496b1578d` |
| Контрольный shift.asar в fixture/ordinary/distribution/ [исходных случаев](research-inputs.tar.gz) | `703fb21f484b58c639cd139ccaa41bce6fd2b0c820f483d7023d0d344bca78bc` |
| [Скил получателя](electron-engineer-0.1.12.tgz) | `170e382eba8a4716428fe92055db6729d7c4fb9227d37edde70d22c045570aea` |

06 передал правило различать хост Node и среду фактического потребителя. Версия скила 06 — 0.1.5. Из передачи 18 взяты реальные файлы компонента, закреплённого на 92c9100. Форма 26 использует обе эти версии файлов. Её код выбирает `window.notificationSettings.save({email, enabled, frequency}): Promise<void>`, когда preload предоставляет метод. Читатель проверил исходный архив формы, файлы Tooltip, все восемь файлов dist и обслуживающий их server.mjs. Получатель может сверить имена и контрольные суммы с собственными входами. [Контракт Node](../06/source-review.md) · [Контракт компонента](../18/component/handoff.md) · [Контракт формы 26](../26/notification-handoff.md) · [Опись входов, 48 файлов переданного архива](notification-observed.json)

В реальном Electron 45.0.0 открылся маршрут /settings/notifications. После фокуса кнопки About these settings её aria-describedby указал на элемент с ролью tooltip и текстом Review your changes before you confirm. Наблюдатель ввёл dispatcher@example.test, выбрал Weekly, проверил диалог и нажал Confirm. Форма получила подтверждение. После отдельного прямого вызова из renderer с monthly Promise был отклонён, main не выполнил второй PUT. Вновь открытое окно, GET и файл сервиса вернули dispatcher@example.test, true, weekly. Настройки окна подтвердили sandbox и contextIsolation при nodeIntegration=false. В объекте bridge имелся только save, typeof window.require вернул undefined. Проверено изменение записи для weekly. Daily проходил через bridge Maple. Отдельное сохранение daily из экрана Notification Desk не выполняли. [Данные сеансов](notification-observed.json)

Каждый вызов лабораторного интерфейса запускал отдельное окно на приватном Xvfb с новыми профилем и сервисом. Новое окно для повторного чтения пользовалось сервисом, в который записала первая форма. Подтверждены штатный Electron и загрузка ASAR, app.isPackaged=false. Подпись, установщик, обновление, сохранность после перезапуска процесса сервиса и другие ОС находятся за пределами результата. Первая техническая проба до приёмки ожидала подсказку в неактивном окне. Наблюдатель активировал окно перед фокусировкой кнопки. Эту последовательность содержит переданный код app/observe.cjs. [Переносимая оболочка](notification-electron.tar.gz)

## Повтор на Linux

Распакуйте исходный архив 26 в каталог form и архив оболочки в соседний desktop. Потребуются Node для локального сервиса, Python 3, штатный Linux x64 Electron 45.0.0, рабочая песочница Chromium, Xvfb и xauth. Для версии Electron использован архив с SHA-256 `22f6a10bd3f7fef987ddbb379d3375ce664ad0c98a9a50f80c89f1718a0c3e3a`. В команде укажите путь к этому исполняемому файлу. Если xvfb-run установлен отдельно, передайте его путь через --xvfb-run. [Контрольные суммы Electron](https://github.com/electron/electron/releases/download/v45.0.0/SHASUMS256.txt)

```sh
python3 desktop/run.py --form ./form --electron ./electron-45/electron
```

Скрипт выводит JSON с действиями и состоянием. Он запускает сервер на loopback, отключает TCP у Xvfb и освобождает временные профили и файл данных при выходе. Переносимый запуск из двух распакованных архивов дал те же значения, что свежий получатель через лабораторный диспетчер. Публичное задание, состав выдачи, итог и исходные события предварительного и окончательного читателей сохранены вместе. Оба получили gpt-6.2-sol medium с выключенной памятью. Предварительный читатель не получил байты исходного архива формы. Для окончательной проверки открыли новую сессию, добавили оригинал 26 и поставили обновлённый пакет со справкой Forge. [Происхождение наблюдений](reader-provenance.json) · [Исходные действия и ответы](reader-records.tar.gz)
