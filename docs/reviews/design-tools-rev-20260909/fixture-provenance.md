# Fixture

Общий fixture создан реальным shadcn4.21.0 init --template vite --base radix --preset nova. Первый preset radix-nova отклонён текущим CLI, затем использовано документированное допустимое значение nova; это setup автора, не skill trial.

От исходной генерации: закреплены CLI4.21.0 и packageManager pnpm10.28.2; alias ~ui; добавлен локальный brand variant и unrelated sentinel. Из Button удалён focus-visible:ring-3, чтобы реальная registry update имела проверяемый upstream delta. Это документированная синтетическая локальная расходимость с текущим upstream, не выдаётся за исторический официальный release. Официальный исходный Button сохранён отдельно. Оба live trials стартуют с одинаковой копии и frozen lock.

Проект — локальные synthetic notification settings, без backend/email delivery claims. Initial source hash manifest excludes node_modules/.git/dist. Dependency lock фиксирует версии; standalone trials сохраняют фактический lock после add. Browser route использует localhost, own session/port и cleanup readback.
