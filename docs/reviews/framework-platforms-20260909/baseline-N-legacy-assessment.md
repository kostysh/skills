# Независимая оценка baseline N-legacy

**Вердикт: PASS ограниченного N3-контура.** Next.js 15.5.25, зависимости и production webpack loader сохранены; URL-backed состояние `q` работает в production Chromium; loading fallback присутствует в server HTML и видим в браузере без JavaScript. Поисковая выдача по данным не проверена и не реализована: исходный fixture содержит только заголовок и поле, без dataset. Видимость navigation-pending состояния при задержке не подтверждена. [Исходный source review `nextjs`](baseline-nextjs-review.md) остаётся **FAIL**; этот runtime результат его не заменяет.

Оценщик `/root/baseline_next_electron_docs` независим от executor `/root/baseline_next_legacy_executor`; участвовал в предложении кейса, но не в реализации. Дата: 2026-09-09. Основания: [замороженный протокол N-legacy](protocol/N-legacy.json), исходные task/REQUIREMENTS, [proposal N3](case-proposals-next-electron-docusaurus.md), финальный код, все семь записей commands и публичные tool inputs. Выполнена только read-only оценка и hash readback; новых npm/build/runtime/browser запусков нет. E-legacy не исследовался.

## Снимок и сохранение версии

Trial расположен в `/tmp/framework-platforms-20260909/trials/baseline/N-legacy`. Все 15 файлов `final-source-hashes.json` совпали при независимой проверке. Из 56 frozen inputs отличаются только разрешённые `app/filter.tsx`, `app/page.tsx` и framework-modified `tsconfig.json`; добавлены `loading.tsx` и generated `next-env.d.ts`. Build stdout прямо сообщает обязательную смену JSX на `preserve`. Package/lock, declared scripts, webpack config, loader, catalog text и неиспользуемые Timeline/widget совпадают с исходным протоколом. Подробные SHA-256 — в [readback](baseline-N-legacy-readback.json).

Установленные package metadata и recorded build/start подтверждают Next.js **15.5.25**, React/React DOM **19.2.8**, TypeScript **5.9.3**. Скрипт production build остался `next build`; существующий `next.config.mjs` подключает `.fixture` через `loaders/fixture.cjs`. Page продолжает импортировать заголовок из `.fixture` и остаётся Server Component. Framework upgrade, переключение на Turbopack или замена loader результата hardcoded строкой не выполнялись.

Публичные вызовы executor имеют явный cwd trial и читают его staged `skills/nextjs` root и references. Все 22 файла staged пакета совпали с frozen hashes; дополнительно canonical копии этих файлов тоже совпали. Canonical/staged path не смешан с другим содержимым. Это forced baseline execution, не тест естественного catalog selection.

## Доказательства поведения

| Проверяемое обязательство | Исходные assertions / наблюдение | Результат |
| --- | --- | --- |
| Production loader | `npm run build` №3 проходит на15.5.25. `smoke.mjs` запускает declared `npm run start`, получает HTTP HTML и видит `Production catalog`; этот же h1 видим в обоих browser contexts. Source сохраняет `.fixture` import и loader rule. | PASS |
| Исходное URL-состояние | Deep link `q=initial&keep=yes#section` гидратирует поле значением `initial`; повторяющийся `q` читает первое значение. | PASS |
| Редактирование `q` | Строка с диакритикой и URL-спецсимволами проходит через input → router.replace → URLSearchParams; `keep` и hash сохраняются. Reload восстанавливает поле из URL. Пустой ввод удаляет `q`. | PASS |
| Навигация | Быстрый последовательный ввод достигает ожидаемого URL и значения поля. Переход к другому q, back и forward восстанавливают соответствующее состояние. | PASS исследованных последовательностей; нагрузка/задержки сети не моделировались |
| Loading UI | HTML содержит Suspense fallback. Отдельный browser context с `javaScriptEnabled:false` подтверждает текст `Loading search…`, его видимость и сохранённый server h1. | PASS fallback; duration/видимость pending при реальной client navigation не проверены |
| Ошибки браузера | Для основного JS-enabled page подписки на `pageerror` и `console.error` активны до navigation; итоговый массив пуст. | PASS отсутствия этих ошибок в записанном сценарии |

`Filter` держит локальный input state, читает `q` через `useSearchParams`, синхронизирует его при URL changes, сохраняет остальные параметры и hash при `router.replace`. Client boundary локальна: Server Component page оборачивает Filter в Suspense с `Loading`. Дополнительный `useTransition` даёт pending markup, но наличие этой ветви кода само по себе не объявляется доказательством видимого pending состояния.

Слово «фильтр» здесь ограничено данным исходным приложением: исходная Page содержит h1 из `catalog.fixture` и локальное поле Filter; `catalog.fixture` — одна строка заголовка. Dataset, rows, matching policy и result UI отсутствуют. Поэтому PASS подтверждает **URL-backed q state/navigation**, а не поиск, изменение выдачи или результат фильтрации. Эта граница присутствует в executor result и сохранена независимым оценщиком; q navigation не подменяет dataset capability.

## Запуски и история

В `commands.jsonl` семь записей, все с exit 0 и пустым stderr. Нумерация начинается с 1:

- №1: исходные hashes immutable package/lock/config/loader/catalog и tsconfig;
- №2: `npm ci --no-audit --no-fund`, 4.276 с;
- №3: declared production build, 11.512 с; `/` статически подготовлен;
- №4: declared typecheck, 1.937 с;
- №5: первый полный production smoke, 1.384 с;
- №6: повторный полный production smoke после усиления проверки loading fallback, 1.406 с, `2026-09-09T13:14:16.233269+00:00`;
- №7: финальный manifest исходников после runtime.

Неуспешных записанных build/typecheck/runtime попыток нет. Между №5 и №6 изменён только smoke: вместо одного наличия fallback в HTML добавлена реальная browser visibility проверка с отключённым JavaScript. Повтор имеет конкретное основание и не ослабляет критерии; app source после build не менялся. Trace сохраняет исходные read-only действия, выполненные до recorder, а также обе версии smoke. Промежуточный result до предоставления runtime slot честно называл проверки ожидающими; это не использовано как runtime evidence.

`finally` закрывает браузер и посылает SIGTERM process group тестового server. Команды завершились; отдельная независимая инвентаризация оставшихся процессов не выполнялась. Успешный запуск мог быть воспроизведён по сохранённым scripts, но оценщик его повторно не запускал.

## Provenance и ограничения

Экспорт содержит 68 public tool events; session `01a08642-f221-7063-abe1-d74f30d44428`. В metadata указаны `gpt-6-astra`, effort `high`, spawn с `fork_turns=none`. Trace показывает чтение staged baseline skill, исходных task/REQUIREMENTS, приложения и официальной документации Next15 `useSearchParams`. В доступных вызовах не наблюдается чтение rubric/candidate/assessment. Хеши trace, metadata, протокола и всех публичных evidence files подтверждены в readback.

Полный plaintext spawn и трёх follow-up сообщений отсутствует; сохранены только dispatch metadata. Поэтому **полнота blind delivery provenance не подтверждена**. Сообщения координатора не принимаются за независимое доказательство содержимого доставленных инструкций. Shared filesystem даёт инструкционную, а не жёсткую изоляцию; recorded model/effort — настройки, не backend-аттестация. Успех forced execution не подтверждает естественный выбор навыка или причинный эффект его инструкций.

Проверен один production Next15 server и Chromium. No-JS context намеренно остаётся на fallback; progressive-enhancement/no-JS search не заявляется. Не проверены delayed navigation pending, dataset filtering, другие browsers/hosting modes, Turbopack, distributed caching или иные версии Next. Baseline source findings сохраняют силу; эта оценка не относится к отдельному N-runtime auth-кейсу и не закрывает общую source-review FAIL.

Изменения оценщика ограничены данным отчётом и readback. Следующий допустимый вывод — сравнение с candidate при тех же frozen inputs и тех же границах q/fallback evidence; publication не выполнялась.
