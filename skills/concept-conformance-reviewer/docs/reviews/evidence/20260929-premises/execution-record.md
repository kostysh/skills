# Контекст исполнения

Оператор 2026-09-29 ответил «Делай» на запрос запуска субагентов для слепых прогонов и независимого ревью готовой правки. Разрешение относится к этой проверке и исправлению её существенных findings, без публикации.

Case author и author candidate: координатор `/root`; он же подготовил rubric по заданию до candidate edits. Формальный assessor/reviewer назначается отдельно и не редактирует candidate. Исполнители получают свежие контексты `fork_turns: none`, без model/reasoning override: настройки унаследованы, runtime metadata отдельно не наблюдалась. Trial blindness не означает независимость author рубрики от candidate; итоговая оценка raw результатов выполняется независимым reviewer.

| Executor | Версия / случай | Разрешённые входы | Разрешённый результат |
| --- | --- | --- | --- |
| `/root/trial_01` | baseline 0.2.4 / 01 | `trials/b01/SKILL.md`, `input.md` | `trials/b01/output.md` |
| `/root/trial_02` | candidate 0.2.5 / 01 | `trials/c01/SKILL.md`, `input.md` | `trials/c01/output.md` |
| `/root/trial_03` | candidate 0.2.5 / 02 | `trials/c02/SKILL.md`, `input.md` | `trials/c02/output.md` |
| `/root/trial_04` | candidate 0.2.5 / 03 | `trials/c03/SKILL.md`, `input.md` | `trials/c03/output.md` |
| `/root/trial_05` | candidate 0.2.5 / 04 | `trials/c04/SKILL.md`, `input.md` | `trials/c04/output.md` |
| `/root/trial_06` | candidate 0.2.5 / 05 | `trials/c05/SKILL.md`, `input.md` | `trials/c05/output.md` |
| `/root/trial_07` | candidate 0.2.5 / 03b | `trials/c03b/SKILL.md`, `input.md` | `trials/c03b/output.md` |

В таблице зафиксировано назначение; наличие и завершённость запусков подтверждаются raw results, а не этой таблицей. Корень временных входов: `/tmp/concept-premises-20260929-3vJXdi/`. Durable копии raw inputs находятся в `cases/`, raw outputs сохраняются в `outputs/`; provenance и hashes записываются после исполнения.

03b добавлен по независимому заключению reviewer о дефекте достаточного положительного входа; основание, неизменность candidate и новые заранее закрытые критерии — в [erratum](erratum-03b.md). Исходный 03 не переписан и не скрыт.

Каждому executor дано одинаковое ограничение: прочесть предоставленный `SKILL.md` полностью и выполнить задачу из `input.md`; не читать другие скиллы, репозиторий, историю, память и соседние каталоги; не использовать сеть и делегирование; входы не менять, создать только `output.md`; не оценивать сам скилл, вернуть полное фактическое заключение и перечень прочитанных файлов. Предполагаемого ответа, диагноза, diff и rubric в сообщении нет.

Активная поверхность trial copy — полный неизменённый `SKILL.md`. Других active references/assets/runtime у скилла нет. Source, supporting history, logs, findings, rubric и соседние испытания исключены. Это инструкционное ограничение доступа в общей FS, а не техническая изоляция. Контроль hash входов/пакета и workspace diff выявляет изменения в проверенных границах; он не доказывает отсутствие любого действия вне них. Полный аудит source/generated package и оценка evidence выполняются отдельно.

Прогоны проверяют выполнение после явного выбора скилла. Natural activation, реальный runtime доменной системы и универсальная надёжность не заявляются. Предыдущий finding, присутствующий в case04 как легитимный вход re-audit, известен executor; новый ожидаемый результат ему не передаётся.
