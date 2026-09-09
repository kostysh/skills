Tooltip исправлен; результат verified для заявленных контекстов.

В src/Tooltip.js общий id="tip" заменён на useId(), а resize cleanup удаляет ту же функцию, которая была зарегистрирована. API {label, children, ref}, forwarding ref и существующие события открытия сохранены.

Проверены actual SSR / hydration с React 19.2.0, StrictMode, два одновременно открытых экземпляра с правильными aria-describedby, Focus first через caller ref, resize close, focus/blur, hover/leave и пять циклов mount/unmount. После каждого unmount: 0 resize listeners, 0 tooltip DOM-узлов, 0 обёрток; после remount ровно 2 listeners. Hydration recoverable errors и browser page errors отсутствуют. npm run build завершился успешно (предупреждения dependency use-client).

Изменения: changes.diff и Tooltip.after.js. Полные команды/вывод: browser-commands.json; HTTP SSR: ssr.html; повторяемый check: check-components.py; границы доказательств: C-evidence.md. Browser и собственный server закрыты. Это локальная проверка жизненного цикла; heap/GC, accessibility и другие React-контексты не проверялись.
