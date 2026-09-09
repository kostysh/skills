# Подготовка нейтрального Payload fixture

Готовы исходные данные и инфраструктурные controls; полноценная проверка Payload typecheck/build/API остаётся root после выделения тяжёлого runtime-слота. Candidate, скиллы и целевая БД не изменялись. Baseline proposals прочитаны для задания формы входов; подготовка не является слепым trial или оценкой скилла.

Fixture: `/tmp/framework-platforms-20260909/fixtures/payload`. Существующие package.json, Payload config, API route и статическая frontend-заготовка сохранены. Добавлен package-lock.json, полученный `npm install --package-lock-only --ignore-scripts --no-audit --no-fund --cache ./npm-cache` (exit 0). Первоначальный вызов без cache override упёрся в read-only системный npm cache; повтор использовал локальный cache. Dependencies не устанавливались. `.env` не выводился.

В `source/`: детерминированный генератор и Contentful JSON (3 posts, 2 authors, 2 assets; en/it; bold/italic; entry hyperlink; embedded asset; циклические related; null hero), две синтетические PNG 2×2, mapping/операторские команды в README, HTTP server и supervisor прерывания своего дочернего процесса. POST `/control` управляет одноразовым/повторяемым 503 и событием прерывания; reset касается только source controls, не БД. Прерывание после частичной записи требует сначала наблюдать нужную границу через API, затем послать interrupt; supervisor сам не утверждает, что запись уже произошла.

Лёгкая проверка: `node --check` обоих mjs — exit 0; GET export → 5 entries/2 assets; re-arm image-1 → последовательность HTTP 503,200; supervisor с фиктивным долгоживущим дочерним Node → SIGKILL/exit 137. Controls сброшены после smoke. Source server остановлен после smoke через Ctrl-C (exec session 83559, exit 130); executor запускает его в собственном lifecycle.

SHA256:
- package-lock.json: `8771bf067167bd31afb42ee393b75c5e47242dec33789dc43af76413275049b1`
- source/contentful-export.json: `4e5f6abc0769b97d5e62aba13dc9a32a56132bc9ce1082d0c305b90b6596cf38`
- source/assets/image-1.png: `7f4d8a67ba93954ea29d84ec37e69d033c5318484375a13be8efd059d25ecc7a`
- source/assets/image-2.png: `72fe3495e293d2166fe4d54f1835ebf084313f84e1456a8efc6db1ae44590826`

Root heavy smoke (cwd fixture; команды по очереди):

```sh
npm ci --no-audit --no-fund --cache ./npm-cache
npm run typecheck
npm run build
npm start
```

Проверять `.env` только приватно; использовать отдельную разрешённую локальную БД. При необходимости сгенерировать типы штатным `npm run payload -- generate:types`, затем повторить typecheck. Существующий frontend пока не отображает статьи: импорт и рендеринг не реализовывались инфраструктурной подготовкой. Успех source server/lock resolver не доказывает type validity, API, browser или миграцию. Для paired trials замораживать inputs и создавать отдельные DB/uploads; не переносить npm-cache/node_modules в snapshot входов.
