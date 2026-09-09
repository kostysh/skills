# Границы структурных проверок

Compiler lint/check и isolated compile обеих целей проходят. Один первый lint не стартовал: параллельный обязательный test:ci в owning compiler package пересобирал и временно удалил его CLI entrypoint. После завершения сборки штатный lint прошёл; исходная ошибка и повтор сохранены. Это ошибка оркестрации проверки, не дефект candidate.

Системный skill-creator quick_validate: finance PASS, GDPR exit 1 из-за существующего frontmatter `compatibility`. Это поле присутствует на baseline и явно поддерживается owning compiler schema/renderer; стандарт репозитория допускает дополнительные совместимые метаданные. Узкий системный валидатор не поддерживает поле. Его результат не объявлен PASS и не исправлен обходной копией; applicable source/emitted schemas проверены owning compiler. Изменять соседний validator или удалять существующий поддерживаемый контракт ради него не требуется. Независимый reviewer должен учесть эту границу.

Первый install не смог открыть глобальную database pnpm в sandbox; тот же frozen-lockfile install прошёл после автоматического разрешения escalation. Lockfile не изменился. test:ci выполнен объявленной командой с двумя CPU и workspace concurrency 1: 108 passed, 0 failed/skipped.

После candidate v1 freeze убраны только лишние пустые строки EOF в GDPR fragment и audit-methodology. Поведение и текст правил не изменены; regenerate изменил служебный source hash. Эта дельта проверяется как formatting-only при итоговом стабильном снимке; повтор behavioral trial не нужен. Финансовая активная поверхность после freeze не менялась.
