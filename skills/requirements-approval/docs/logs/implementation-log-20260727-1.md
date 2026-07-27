# Implementation log: RETRO-0003/STEP-02

Дата: 2026-07-27

Issue: Aequitas-ADR/app#225

Версия: `requirements-approval` 0.2.1

## Capability

До customer escalation skill теперь отдельно проверяет четыре falsifier boundary: текущее runtime behavior, environment perimeter, существующий TODO/approval record и более узкое technical resolution или domain-owner route.

Найденный authoritative answer приводит к internal resolution, существующий owning record переиспользуется без дублирования, а technical choice маршрутизируется owner-у, пока не остаётся реального customer-owned decision.

## Substrate

- четыре явных workflow checks и соответствующие validation rules;
- один portable fixture с четырьмя независимыми question codes;
- четыре отдельные eval cases; существующие evals 1–7 и их fixtures сохраняются;
- regenerated `SKILL.md` и compile report.

Active wording сокращено до четырёх отдельных one-line falsifiers. Recommended maximum повышен с 14 000 до 15 000 bytes: baseline занимал 13 969 bytes, а перенос этих checks в optional surface сделал бы pre-customer gate ненадёжным.

## Anti-claims

- Изменение не отменяет customer escalation для реально неразрешённого customer-owned preference.
- Изменение не создаёт generic decision registry и не принимает architecture/product decisions вместо owner-а.
- Eval manifest и compiler не являются доказательством stage/prod поведения; отдельное blind forward evidence проверяет маршрутизацию.

## Авторский self-check

Каждый falsifier имеет отдельный evidence boundary и отдельный ожидаемый no-escalation outcome. Existing TODO переиспользуется, но не считается автоматически resolved. Инструкция сохраняет mutation authorization и authority rules версии 0.2.0. Self-check является authoring evidence, а не independent PASS.

## Verification

- `skill-source-compiler lint/regenerate/check`: PASS, warnings none.
- Isolated compile и `check` в `/tmp`: PASS; все прежние и новые eval fixtures присутствуют в emitted package.
- Root `pnpm format:check`, `pnpm lint`, `pnpm test:ci`: PASS.
- Первый `format:check` не запустился из-за отсутствующего `node_modules` в новом worktree; выполнен `pnpm install --offline --frozen-lockfile`, manifest и lockfile не изменились, после чего gate прошёл.
- Пять blind no-fork cases: PASS; четыре falsifier routes не создали лишнюю customer escalation, regression сохранил `Q-CSV` internal, `Q-DAY` customer-owned с Italian draft и `Q-STORE` architecture-owned.
