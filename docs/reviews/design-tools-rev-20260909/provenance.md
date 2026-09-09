# Основание и границы доказательств

План DESIGN-TOOLS-REV-v1 принят оператором 2026-09-09. Разрешены независимые reviews и слепые GPT-6 Astra trials этой сессии; commit/push/PR/merge не разрешены.

Baseline сохранён до исправлений: `/tmp/design-tools-rev-20260909/baseline-full`. Active trial copies исключают skill.yaml, AGENTS.md maintenance, docs и evals с ожидаемыми ответами; включают SKILL.md, все references, agents и assets. Полный пакет оценивается отдельно. Общая filesystem означает инструкционную, не техническую изоляцию. Исполнитель не получает diagnoses/rubric/историю; оценщик получает их отдельно.

Сравнение baseline/candidate использует одинаковые raw tasks, fixed criteria, tool/dependency versions и начальные fixtures. Назначенная модель — gpt-6-astra; назначенный reasoning и доступная фактическая runtime identity фиксируются по каждому запуску отдельно. Назначение не доказывает фактическую serving model. Синтетические tool results маркируются и не доказывают live capability.

Исходный Pencil get_app_state дважды вернул transport not connected to app: desktop. Live Pencil, save/export и joint остаются открытыми до реального выполнения. Compiler check двух baseline пакетов PASS. Agent-browser 0.27.3 doctor: 5 pass, Chrome 153 обнаружен, runtime UI ещё не проверен.
