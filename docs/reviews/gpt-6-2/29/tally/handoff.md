# Локальная выдача Tally 1.0.0

Получателю нужны Linux x64, Node.js и npm. Установка проверена на Node.js 24.15.0 и npm 12.0.1. Скопируйте архив в пустой каталог npm-проекта. SHA-256 файла `engineering-tally-fixture-1.0.0.tar.gz` — `7c9f8bff28fee4cb4acd9dfec592b15e688cf040990a001d66a8d1ba73bce0cc`. Содержимое совпадает с созданным npm файлом `engineering-tally-fixture-1.0.0.tgz`.

Из этого каталога выполните команды по очереди.

```sh
npm install --offline --no-audit --no-fund ./engineering-tally-fixture-1.0.0.tar.gz
./node_modules/.bin/tally --help
./node_modules/.bin/tally --version
./node_modules/.bin/tally sum 2 3 --json
./node_modules/.bin/tally sum bad --json
```

Справка показывает `tally sum <numbers...> [--json]`, версия — `1.0.0`. Корректная сумма возвращает `{"total":5}` и перевод строки в stdout, пустой stderr и код 0. При неверном числе stdout пуст, в stderr выводится `Invalid number` с переводом строки, код равен 2. У справки и версии пустой stderr и код 0.

Архив содержит README, манифест и два файла сборки. Установленный `tally` указывает на `dist/cli.js`. [Проверенные байты npm](engineering-tally-fixture-1.0.0.tar.gz) · [Исправленные исходники и оба теста](tally-source.tar.gz) · [Команды, байты потоков и коды возврата](installed-observations.json)
