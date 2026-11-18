# Как получить сумму для электронного журнала в Tally 1.0.0

На рабочем месте нужны Linux, Bash, Node.js 24.15 и npm 12.0.1. Откройте Bash в каталоге с файлом `engineering-tally-fixture-1.0.0.tar.gz`. Выполните все шаги в одном сеансе.

## Установите Tally локально

Команды проверяют SHA-256 архива, устанавливают пакет в новый каталог рядом с архивом и проверяют версию установленной команды. Установка работает без сети и прав администратора.

```bash
sha256sum --check <<'EOF' &&
7c9f8bff28fee4cb4acd9dfec592b15e688cf040990a001d66a8d1ba73bce0cc  engineering-tally-fixture-1.0.0.tar.gz
EOF
tally_dir=$(mktemp -d "$PWD/.tally.XXXXXX") &&
npm install --prefix "$tally_dir" --cache "$tally_dir/.npm-cache" \
  --offline --ignore-scripts --no-audit --no-fund --no-save --no-package-lock \
  "$PWD/engineering-tally-fixture-1.0.0.tar.gz" &&
tally="$tally_dir/node_modules/.bin/tally" &&
"$tally" --version
```

Последняя строка должна быть `1.0.0`. Если проверка архива или установка завершилась ошибкой, остановитесь на этом шаге.

## Получите JSON и проверьте код завершения

Вставьте в тот же сеанс функцию и вызов. Функция отклоняет пустые значения, строки из одних пробельных символов и аргументы, которые Tally может принять за параметры команды.

```bash
tally_sum() {
  local left="$1" right="$2"
  if [[ ! $left =~ [^[:space:]] || ! $right =~ [^[:space:]] ||
        $left == --* || $right == --* ]]; then
    printf '%s\n' 'Invalid number' >&2
    return 2
  fi
  "$tally" sum "$left" "$right" --json
}

if result=$(tally_sum 2 3); then
  printf '%s\n' "$result"
else
  printf 'Запись пропущена. Код завершения: %s\n' "$?" >&2
fi
```

При коде `0` вызов с числами `2` и `3` выводит в stdout одну строку `{"total":5}`. Передавайте в журнал JSON из ветки `then`. Диагностика остаётся в stderr.

## Проверьте ошибку ввода

Повторите блок `if`, заменив `tally_sum 2 3` на `tally_sum 2 bad`. В stderr появятся `Invalid number` и сообщение `Запись пропущена. Код завершения: 2`. Stdout останется пустым. Для `tally_sum bad 3` результат такой же. Исправьте значение и повторите вызов.

Условия рабочего места и контрольная сумма указаны в [описании полученного выпуска](desk-intake.md).
