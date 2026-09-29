# Исполнение проверки сокращённой версии

Задача продолжает ранее разрешённые слепые прогоны и независимое ревью; оператор потребовал устранить warning и сохранить функциональность. Baseline 0.2.5, candidate 0.2.6. Критерии и equivalence map зафиксированы до edits в `pre-edit-criteria.json`.

Case author/candidate author — `/root`. Reviewer отдельный, не редактирует candidate. Все новые executor контексты `fork_turns:none`; model/reasoning overrides отсутствуют, настройки унаследованы. Runtime metadata отдельно не наблюдается. Исполнителям доступны по инструкции только два файла в своём trial folder: полный `SKILL.md` и `input.md`; создавать разрешено только `output.md`. Запрещены память, история, соседние каталоги, другие скиллы, сеть и делегирование. Это ограничения на общей FS, не hard sandbox.

Корень временных входов: `/tmp/concept-size-20260929-XRSsTM/trials/`. Таблица фиксирует назначения; завершение подтверждается raw output и итоговым trial manifest.

| Executor | Trial | Поверхность |
| --- | --- | --- |
| `/root/size_trial_01` | c01 | candidate, прежний case01 |
| `/root/size_trial_02` | c02 | candidate, прежний case02 |
| `/root/size_trial_03` | c03b | candidate, исправленный положительный case03b |
| `/root/size_trial_04` | c04 | candidate, прежний case04 |
| `/root/size_trial_05` | c05 | candidate, прежний case05 |
| `/root/size_trial_06` | b06 | baseline, missing concept |
| `/root/size_trial_07` | c06 | candidate, тот же missing concept |
| `/root/size_trial_08` | b07 | baseline, honest substrate |
| `/root/size_trial_09` | c07 | candidate, тот же honest substrate |

Для первых пяти случаев сохранённые baseline raw outputs 0.2.5 повторно используются из `../20260929-premises/outputs/`; их snapshot соответствует этому baseline, inputs побайтово те же. Условия назначенного исполнения сопоставимы; resource/performance сравнение не заявляется. Все выводы о поведении основаны на синтетических заданиях после forced invocation, не на natural activation или внешнем runtime.
