Задача C выполнена; статус browser: completed, component runtime: verified в проверенных контекстах.

Исправлен только src/Tooltip.js: cleanup снимает ту же функцию resize, которую зарегистрировал Effect; useId создаёт отдельный идентификатор каждой подсказки. API {label, children, ref}, forwardRef и поведение Focus first сохранены. Server/API/SPA исходники не менялись.

React и React DOM: 19.2.0, Vite 7.1.12; agent-browser 0.27.3. npm run build завершился успешно, с предупреждениями bundled dependencies о use client. Реальный HTTP SSR сохранён в ssr.html, затем выполнена hydration реального приложения под StrictMode. 32 проверки в browser-check.json подтвердили caller ref, одновременное открытие двух подсказок с разными IDs и правильными aria-describedby, закрытие resize, пять циклов открытия/закрытия и unmount/remount, unmount открытой подсказки. Финальное состояние: resizeListeners=0, recoverable=[], tooltip DOM и wrappers отсутствуют.

Проверки используют реальный локальный браузер и сервер без перехвата сети. Это не формальный аудит accessibility, heap profiling или доказательство других документов/roots/RSC/Activity. React root сохраняет собственные делегированные события; проверена очистка ресурсов самих tooltip. Vite HMR websocket на общем 24678 был занят; HTTP, SSR и hydration работали, console фиксирует недоступность HMR. На результаты проверок компонентной границы это не влияет.

Собственная browser session закрыта; собственный server завершён. Первый сервер пришлось завершить отдельным SIGTERM после подтверждения cwd/PID; итоговая проверка повторена на свежем сервере. Команды воспроизводятся через check.sh и browser-check.js (в disposable copy), build: npm run build. Основные артефакты: changes.diff, build.txt, ssr.html, browser-check.json, initial-snapshot.txt, final-snapshot.txt, browser-console.txt, browser-errors.txt, cleanup.txt.

Model/settings: контекст сообщает GPT-6; точный runtime model ID, reasoning effort и sampling settings не предоставлены. Никакого изменения настроек модели не выполнялось.
