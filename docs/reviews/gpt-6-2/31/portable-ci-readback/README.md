# Повтор запуска установщика pnpm

Нужны Python 3 с PyYAML, Node.js и доступ к публичному реестру npm. Убедитесь, что исполняемый файл Node соответствует используемой среде. Распакуйте соседний `ci-confirmation/grader-inputs.tar.gz` в `observations/` во временном каталоге. Для каждого кода там сохранены исходный и итоговый проекты и точное наблюдение.

Получите исходники `pnpm/action-setup` на коммите `b906affcce14559ad1aafd4ab0e942779e9f58b1` в рабочий каталог `pnpm-action/`. Модуль `dist/index.js` и идущие в его поставке файлы должны находиться рядом. Скрипт проверяет SHA-256 точки входа. [Официальная поставка action](https://github.com/pnpm/action-setup/tree/b906affcce14559ad1aafd4ab0e942779e9f58b1)

Следующие команды используют полный результат одного задания. Вторая проверка меняет поле `packageManager` в расходной копии.

```sh
python3 replay.py observations/faa788/after/site pnpm-action
python3 replay.py observations/faa788/after/site pnpm-action --manifest-version 10.28.1
```

На зафиксированной поставке установщик завершился успешно и вернул соответственно 10.28.2 и 10.28.1. С `observations/faa788/before/site` исходная комбинация `version: 10` и точного `packageManager` вернула код 1. Вызов выполняет официальный модуль в локальном процессе Linux и читает `pnpm --version` по пути из `GITHUB_PATH`. Полный GitHub workflow здесь не запускался.
