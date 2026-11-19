# Tally 1.0.0. Установка и проверка суммы

На Linux с установленными Node.js и npm поместите архив `engineering-tally-fixture-1.0.0.tgz` в пустой рабочий каталог. Выполняйте команды из этого каталога.

## Установить пакет

```sh
npm_config_cache="$PWD/.npm-cache" npm install --offline --ignore-scripts --no-audit --no-fund ./engineering-tally-fixture-1.0.0.tgz
```

## Получить сумму в JSON

```sh
./node_modules/.bin/tally sum 2 3 --json
```

В стандартном выводе (`stdout`) появится `{"total":5}`. Код завершения — `0`.

## Распознать некорректное число

```sh
status=0
./node_modules/.bin/tally sum 2 abc --json || status=$?
printf 'Код завершения: %s\n' "$status" >&2
```

Для `abc` программа выводит `Invalid number` в `stderr` и завершает работу с кодом `2`. Поток `stdout` остаётся пустым.
