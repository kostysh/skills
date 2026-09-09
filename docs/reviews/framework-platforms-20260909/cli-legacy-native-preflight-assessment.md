# Legacy CLI2.39.2 — readiness delta

Инфраструктура готова к одному последовательному изолированному **S-cli-legacy trial**. Native db start и no-change db diff прошли через прежние bounded proxy/runner; отдельный migra действительно запускался. **No findings.** Это готовность к trial, не PASS subtitle, preservation или всего скилла.

## Основание и scope

Live proxy и runner побайтово совпадают с frozen файлами предыдущего current review. Новый source delta отсутствует; ранее проверенные ownership/reservations/denial/HTTP/mount boundaries не переаудировались. Полные hashes записаны в snapshot.

Все9 hashes native manifest и40 inputs protocol/S-cli-legacy.json совпали. Raw task соответствует frozen task.txt. Trial config сохраняет project_id fp-cli-legacy-20260909, PostgreSQL17, ports18532/18530 и schema_paths; лишние сервисы выключены, current experimental setting отсутствует. RUNTIME задаёт legacy executable, отдельный public socket и reset исключительно case-local DB. Версия2.39.2 установлена предыдущим реальным --version и повторно указана native stderr данной подготовки; upgrade не выполнялся.

## Реальное подтверждение

Три command records имеют exit0: db start применяет исходную20260101000000_posts.sql; db diff --file coordinator_baseline_nochange строит shadow и declarative target, заканчивается No schema changes found; coordinator seed возвращает INSERT0 2 и обе принятые пары id/title.

Engine events подтверждают exact shadow `fc933a2f…` и migra `ea5d3097…`: create → start → die → destroy. Retained DB `31eb418f…` остаётся.4 сохранённых изменившихся snapshots90s sampler дают **observed peak3** в14:53:29.920 UTC. Независимо пересчитаны положительные CPU/memory/memory+swap и cpuset bounds: не выше0.75CPU/3GiB/28–31 для каждого наблюдённого ребёнка. Последний snapshot содержит только DB. Три exact-name cleanup records совпадают с тремя runner names и подтверждают отсутствие всех runners.

State содержит DB, scoped network, два named volumes (db/config), один tracked exec и ни одной pending записи. Это подготовленное сохранённое состояние для trial, не полная очистка. Supervisor readback:0.25CPU/256MiB, cpuset28–31, GroupAdd981, NetworkMode=none, no-new-privileges, code RO; настоящий daemon socket/private state доступны только supervisor. Native runner argv сохраняет1.25CPU/6GiB и public-only socket plumbing.

## Host network и images

Принятый envelope разрешает host network только pinned legacy differ. Pinned remaining-hs-official/cli-legacy-migra.go:76–96 явно передаёт SOURCE/TARGET и network.NetworkHost. Additive config-projection.json показывает exact PG/migra allowlist и **только** public.ecr.aws/supabase/migra:3.0.1663481299 в hostNetworkImages. Неизменённый proxy продолжает отвергать host mode других images. Projection захеширована отдельно от исходного native manifest.

Успешный native migra согласуется с этим source/config путём, но сохранённые events/sampler не содержат HostConfig.NetworkMode или resolved image ID краткоживущего контейнера. Поэтому фактический host mode — source/config/runtime-path inference, не отдельная native inspect attestation. Host-network exception не обещает ограничения произвольных сетевых destinations.

Image-bindings фиксирует официальный ECR PostgreSQL17.4.1.074 (image ID284d32b2…, ECR digest dc436b5b…) и официальный DockerHub supabase/migra:3.0.1663481299 (image ID2bee9943…, DockerHub digest56fad6ea…). После ECR rate exceeded координатор локально связал native ECR migra alias с этим DockerHub image. Events используют соответствующие native references. **Эквивалентность digests двух registry не утверждается.** Alias mapping — recorded coordinator binding, а не независимое подтверждение ECR происхождения. CLI version/resource policy не менялись; pull/build через proxy не разрешены.

## Пределы и handoff

Seed загружен **после** no-change diff. Preservation до reset, exact ALTER, nullable/no-default semantics, clean apply и final fresh SQL остаются результатами предстоящего trial. Sampler показывает observed inventory/caps, а не фактическое потребление или каждое мгновение. Whole-host hard cap/shared daemon overhead, forced-failure cleanup, все cache branches и hostile OS isolation не подтверждены. Полный security/native API PASS не выдаётся.

Оценщик выполнял только чтение/hash/offline assertions; Docker/CLI/DB/build/install не запускались, target/инфраструктура не менялись. Inputs/evidence повторно сверены перед отчётом. Snapshot `b79d0945073dab8b97b00cf29b7b411aefea8a713ae2257862898d039aeea7e6` в cli-legacy-native-preflight-assessment.snapshot.json содержит SHA256 и E/L roots.

Review basis: bounded legacy readiness delta, прежний принятый envelope/current assessment. Scope:9 native artifacts плюс additive config projection, protocol40inputs и legacy source host-network path. Evidence: сохранённые команды/events/sampling/state и независимые hashes. Limits: указаны выше. Следующий владелец — координатор: отдельный legacy trial с теми же frozen inputs, proxy/runner, bindings и envelope.

Recommendation: **approve** — только isolated legacy trial readiness.
