# Подготовка публикации

Оператор принял G4 сообщением «Продолжай» 2026-09-08. Полный `pnpm test:ci` на `3361e343795a180567910a748ee5535dcf009dce` завершился exit0: 108/108 тестов пяти пакетов, без skips/cancelled. Rebuild compiler не изменил tracked files.

Первый запуск завершился exit1: зависимости worktree отсутствовали, `vite: not found`. После `pnpm install --frozen-lockfile` (exit0, lockfile неизменён, 110 пакетов взяты из cache) тот же набор прошёл. В sandbox pnpm --version падает на служебной DB; за sandbox подтверждён10.28.2. Глобальные настройки не менялись. Ignored esbuild install script — warning, compiler build/test прошли.

Команда: `env npm_config_workspace_concurrency=1 taskset -c 30,31 nice -n 10 pnpm test:ci`. Последовательные пакеты, максимум два CPU, низкий приоритет. Исходные stdout/stderr сохранены рядом. Это local CI evidence; удалённый CI точного опубликованного SHA и merge подтверждаются отдельно результатами GitHub и итоговым сообщением задачи.
