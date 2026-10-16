# Изоляция и роли

Кандидат v1: aggregate 51ecdd604be04b3865d35ed9b65332cf79943c80a86606f85382673c1bbce01a, 8 файлов. Case author/assessor — skill_auditor; не автор и не ремедиатор target. До этого был прочитан исходный архив, но отдельный исходный аудит остановлен и не завершён. Аудит проводится только после адаптации.

Fresh executors получают отдельный run directory, обычную task, копию project и для execution — trial-skill/SKILL.md плюс UI metadata. Полный shipped/source package отдельно прочитан assessor. Source, maintenance AGENTS, docs/history/log исключены из trial copy; активные references отсутствуют, поэтому governing execution guidance не потеряна. У S01 только task/catalog, без тела error-fixer.

Доступ ограничивается инструкцией на общей файловой системе, это не hard sandbox. Разрешены только изолированные локальные действия в назначенном project; task T02 read-only. Нельзя читать родительские каталоги, closed, соседние runs, repo, memory или сессии; нельзя обращаться к сети/Git/внешним сервисам или делегировать. Executor не знает рубрику, предварительные замечания или ожидаемые результаты. Его final и доступные raw события сохраняет assessor, затем проверяет persisted state.

Нет permanent runtime/harness. Все fixtures синтетические и локальные; история T03 и log T02 явно supplied evidence, а не истинные записи этого прогона. Глубина проверки ограничена тремя execution cases и четырьмя selection prompts. Нет baseline/candidate improvement, token/latency либо universal reliability claim.
