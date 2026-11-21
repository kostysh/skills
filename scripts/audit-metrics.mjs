// From the repository root: node scripts/audit-metrics.mjs study.json [study2.json ...]
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const outcomes = ['лучше', 'хуже', 'обе прошли', 'обе ошиблись', 'недостаточно'];
const phases = ['primary', 'planned-repeat', 'diagnostic', 'holdout', 'confirmation', 'regrade'];
const gradeValues = ['PASS', 'FAIL', 'INCONCLUSIVE'];
const definite = (value) => value === 'PASS' || value === 'FAIL';
const key = (...fields) => JSON.stringify(fields);
const cell = (value) => String(value).replaceAll('|', '&#124;').replaceAll('\n', ' ');
export const table = (head, rows) =>
  [
    '| ' + head.join(' | ') + ' |',
    '| ' + head.map(() => '---').join(' | ') + ' |',
    ...rows.map((row) => '| ' + row.map(cell).join(' | ') + ' |'),
  ].join('\n');

function requireText(value, field) {
  assert(typeof value === 'string' && value.trim(), `Отсутствует ${field}`);
  return value;
}

export function link(doc, source, label, directory = process.cwd()) {
  requireText(source, 'source');
  const [file, anchor] = source.split('#');
  const absolute = path.resolve(root, doc.base ?? '.', file);
  assert(
    !path.isAbsolute(source) && !path.relative(root, absolute).startsWith('..'),
    `Путь за пределами репозитория: ${source}`,
  );
  const target = path
    .relative(directory, absolute)
    .split(path.sep)
    .map((part) => encodeURIComponent(part).replaceAll('(', '%28').replaceAll(')', '%29'))
    .join('/');
  const plainLabel = String(label).replace(/[\\[\]()<>]/g, '\\$&');
  return `[${plainLabel}](${target}${anchor ? '#' + encodeURIComponent(anchor) : ''})`;
}

function unique(map, id, context) {
  assert(!map.has(id), `Повтор ${context}: ${id}`);
  map.add(id);
}

function timing(value) {
  if (value == null) return null;
  assert(
    typeof value === 'string' && /(Z|\+00:00)$/.test(value) && Number.isFinite(Date.parse(value)),
    `Нужна дата UTC: ${value}`,
  );
  return Date.parse(value);
}

function seconds(start, end) {
  const a = timing(start);
  const b = timing(end);
  if (a === null || b === null) return null;
  assert(b >= a, `Обратный интервал: ${start} → ${end}`);
  return (b - a) / 1000;
}

function median(values) {
  if (!values.length) return '— (0)';
  const ordered = [...values].sort((a, b) => a - b);
  const mid = Math.floor(ordered.length / 2);
  const result = ordered.length % 2 ? ordered[mid] : (ordered[mid - 1] + ordered[mid]) / 2;
  return `${Number(result.toFixed(3))} (${ordered.length})`;
}

// Only preassigned independent opinions on the same submission and evidence qualify.
function agreement(doc, runIds) {
  const rows = [];
  const decisions = new Map();
  const counts = [0, 0, 0, 0, 0]; // assigned, eligible, agree, disagree, pending decision
  for (const sample of doc.agreement ?? []) {
    const { run, rubric, packet, ratings, resolution } = sample;
    requireText(run, 'agreement.run');
    requireText(rubric, 'agreement.rubric');
    requireText(packet, 'agreement.packet');
    assert(Array.isArray(ratings) && ratings.length === 2, 'Нужно два назначения оценщику');
    const id = key(run, rubric, packet);
    assert(!decisions.has(id), `Повтор работы в подвыборке: ${run}`);
    const grades = ratings.map((r) => (r == null ? null : doc.runs[run]?.ratings?.[r]));
    const sameEvidence = (g) => g && g.rubric === rubric && g.packet === packet;
    const eligible =
      grades.every((g) => sameEvidence(g) && definite(g.score)) &&
      grades[0].assessor !== grades[1].assessor;
    const dissent = eligible && grades[0].score !== grades[1].score;
    let final;
    if (dissent && resolution != null) {
      final = doc.runs[run]?.ratings?.[resolution];
      assert(
        sameEvidence(final) && grades.every((g) => g.assessor !== final.assessor),
        `Разногласие ${run}: нужна независимая оценка по тем же данным`,
      );
    }
    decisions.set(id, dissent ? { score: final?.score ?? 'INCONCLUSIVE', pending: !final } : null);
    counts[0]++;
    if (eligible) counts[1]++;
    if (eligible && !dissent) counts[2]++;
    if (dissent) counts[3]++;
    if (dissent && !final) counts[4]++;
    rows.push([
      runIds.has(run) ? link(doc, doc.runs[run].source, run) : run,
      rubric,
      packet,
      ...grades.map((g) => (g ? link(doc, g.source, `${g.assessor} · ${g.score}`) : '—')),
      dissent
        ? final
          ? link(doc, final.source, final.assessor + ' · ' + final.score)
          : 'ожидается решение'
        : eligible
          ? 'согласие'
          : 'нет двух пригодных оценок',
    ]);
  }
  return { counts, rows, decisions };
}

function study(doc, allHashes, allTasks, resolvedTasks) {
  const runs = Object.entries(doc.runs);
  const runIds = new Set(Object.keys(doc.runs));
  let ratings = 0;
  for (const [id, run] of runs) {
    requireText(run.task, 'run.task');
    requireText(run.variant, 'run.variant');
    link(doc, run.source, id);
    assert(/^[\da-f]{64}$/i.test(run.sha256), `Нет SHA-256 исходного журнала: ${id}`);
    const hash = run.sha256.toLowerCase();
    assert(
      !allHashes.has(hash),
      `Один исходный журнал заявлен как два запуска: ${id} / ${allHashes.get(hash)}. Сохраните один run и ссылки на его оценки.`,
    );
    allHashes.set(hash, `${doc.study}/${id}`);
    for (const [rid, rating] of Object.entries(run.ratings ?? {})) {
      for (const field of ['assessor', 'rubric', 'packet', 'source'])
        requireText(rating[field], `${id}.${rid}.${field}`);
      assert(
        gradeValues.includes(rating.score),
        `Неизвестная оценка ${id}.${rid}: ${rating.score}`,
      );
      ratings++;
    }
  }
  const { counts, rows: opinions, decisions } = agreement(doc, runIds);
  const sums = outcomes.map(() => 0);
  const seriesResults = [];
  const localTasks = new Set();
  const groupRows = [],
    pairRows = [],
    bRows = [];
  const presented = new Set();
  const groups = new Set(),
    assignments = new Set();
  let regrades = 0;
  for (const s of doc.series) {
    for (const field of ['id', 'comparison', 'rubric', 'packet'])
      requireText(s[field], `series.${field}`);
    unique(groups, s.id, 'серии');
    assert(phases.includes(s.phase), `Неизвестная фаза: ${s.phase}`);
    const variants = s.comparison.split('/');
    assert(
      variants.length === 2 && variants.every((v) => v.trim()),
      `Нужны две редакции: ${s.comparison}`,
    );
    const results = outcomes.map(() => 0),
      bCounts = [0, 0, 0];
    const tasks = new Set(),
      pairs = new Set(),
      usedRuns = new Set();
    for (const pair of s.pairs) {
      unique(pairs, requireText(pair.id, 'pair.id'), 'пары в серии');
      requireText(pair.task, 'pair.task');
      tasks.add(pair.task);
      localTasks.add(pair.task);
      const task = key(doc.skill, s.taskSet ?? doc.taskSet ?? doc.study, pair.task);
      if (s.phase !== 'regrade') allTasks.add(task);
      const notes = [s.reason, pair.reason].filter(Boolean);
      const sides = [pair.left, pair.right].map((ref, i) => {
        if (ref === null) return { score: null, display: '—' };
        assert(
          Array.isArray(ref) && ref.length === 2,
          `Сторона пары ${pair.id} должна быть [run,rating] или null`,
        );
        const [runId, ratingId] = ref,
          run = doc.runs[runId];
        assert(
          run && run.variant === variants[i] && run.task === pair.task,
          `Сторона, вариант или задание расходятся: ${s.id}/${pair.id}/${runId}`,
        );
        unique(usedRuns, runId, 'исполнения в одной серии');
        presented.add(key(runId, ratingId));
        const rating = ratingId == null ? null : run.ratings?.[ratingId];
        assert(ratingId == null || rating, `Оценка не найдена: ${runId}/${ratingId}`);
        let score = rating?.score;
        if (rating && (rating.rubric !== s.rubric || rating.packet !== s.packet)) {
          score = null;
          notes.push('различаются рубрика или свидетельства');
        }
        const opinion = decisions.get(key(runId, s.rubric, s.packet));
        if (opinion && score != null) {
          score = opinion.score;
          if (opinion.pending) notes.push('разногласие без решения');
          else if (score === 'INCONCLUSIVE') notes.push('независимый разбор дал INCONCLUSIVE');
        }
        const display =
          link(doc, run.source, runId) +
          (rating ? ' ' + link(doc, rating.source, rating.score) : ' —');
        return { run, runId, display, score };
      });
      if (s.phase !== 'regrade' && sides.every((side) => side.runId)) {
        const executionPair = key(...sides.map((side) => side.runId).sort());
        unique(
          assignments,
          executionPair,
          'назначения двух тех же работ. Новую оценку укажите в regrade',
        );
      }
      const [a, b] = sides.map((side) => side.score);
      let outcome = 4;
      if (!notes.length && definite(a) && definite(b)) {
        outcome = a === b ? (a === 'PASS' ? 2 : 3) : a === 'PASS' ? 0 : 1;
      }
      results[outcome]++;
      if (outcome !== 4 && s.phase !== 'regrade') resolvedTasks.add(task);
      pairRows.push([
        s.id,
        pair.id,
        pair.task,
        ...sides.map((side) => side.display),
        outcomes[outcome],
        notes.join(', ') || (outcome === 4 ? 'нет двух определённых оценок' : '—'),
      ]);
      const bIndex = variants.indexOf('B');
      if (bIndex !== -1) {
        const { run, runId } = sides[bIndex];
        const observed = run?.behavior;
        const bi = ['done', 'missed', 'unknown'].indexOf(observed?.result ?? 'unknown');
        assert(bi !== -1, `Неизвестная оценка действия B в ${pair.id}`);
        const removal = pair.bRemoval ?? s.bRemoval ?? 'unknown';
        assert(
          ['complete', 'partial', 'unknown'].includes(removal),
          `Неизвестный статус удаления: ${removal}`,
        );
        const autonomous = removal === 'complete' && !notes.length ? bi : 2;
        bCounts[autonomous]++;
        if (observed) requireText(observed.note, `${runId}.behavior.note`);
        bRows.push([
          s.id,
          pair.task,
          runId ?? '—',
          ['выполнено', 'ошибка', 'нет данных'][bi],
          removal,
          ['выполнено', 'ошибка', 'нет данных'][autonomous],
          observed
            ? link(doc, observed.source, observed.note)
            : 'наблюдение о действии отсутствует',
        ]);
      }
    }
    if (s.phase === 'regrade') regrades += pairs.size;
    else
      results.forEach((n, i) => {
        sums[i] += n;
      });
    seriesResults.push({ series: s, results });
    groupRows.push([
      s.id,
      s.comparison,
      s.phase,
      s.rubric,
      s.packet,
      tasks.size,
      ...results,
      pairs.size,
      variants.includes('B') ? bCounts.join(' / ') : '—',
      (s.limit ?? doc.limit ?? 'см. протокол') +
        (s.source ? ' · ' + link(doc, s.source, 'основание') : ''),
    ]);
  }
  const starts = doc.technicalStarts ?? [];
  const startIds = new Set();
  for (const start of starts) {
    unique(startIds, requireText(start.id, 'technicalStarts.id'), 'технического старта');
    assert(!runIds.has(start.id), `Технический старт записан как исполнение: ${start.id}`);
  }
  const blocks = [
    `## ${doc.skill} · ${doc.study} · ${doc.model} / ${doc.effort}`,
    `${link(doc, doc.source, 'Протокол')}. Исполнений ${runs.length}, оценок ${ratings}, технических стартов ${starts.length}, заданий в парах ${localTasks.size}.`,
  ];
  if (groupRows.length)
    blocks.push(
      table(
        [
          'Серия',
          'Сравнение',
          'Фаза',
          'Рубрика',
          'Выдача',
          'Заданий',
          ...outcomes,
          'Пар',
          'B без подсказки, выполнено / ошибка / нет данных',
          'Граница',
        ],
        groupRows,
      ),
      table(['Серия', 'Пара', 'Задание', 'Проверяемый', 'Контроль', 'Исход', 'Причина'], pairRows),
    );
  if (bRows.length)
    blocks.push(
      table(
        ['Серия', 'Задание', 'Работа B', 'Действие B', 'Изъятие', 'Без подсказки', 'Свидетельство'],
        bRows,
      ),
    );
  const extra = [];
  for (const [id, run] of runs) {
    if (run.repeatOf)
      assert(
        runIds.has(run.repeatOf) && run.repeatOf !== id,
        `Неизвестный исходный запуск: ${run.repeatOf}`,
      );
    const scored = Object.entries(run.ratings ?? {});
    for (const [rid, g] of scored) {
      if (scored.length === 1 && presented.has(key(id, rid)) && !run.repeatOf) continue;
      extra.push([
        link(doc, run.source, id),
        run.variant,
        run.task,
        run.repeatOf ?? '—',
        g.rubric,
        g.packet,
        link(doc, g.source, `${g.assessor} · ${g.label ?? rid} · ${g.score}`) +
          (g.basis ? ' · ' + g.basis : ''),
      ]);
    }
    if (!scored.length)
      extra.push([
        link(doc, run.source, id),
        run.variant,
        run.task,
        run.repeatOf ?? '—',
        '—',
        '—',
        'нет сопоставленной оценки',
      ]);
  }
  if (extra.length)
    blocks.push(
      table(
        [
          'Отдельная работа / переоценка',
          'Редакция',
          'Задание',
          'Повтор работы',
          'Рубрика',
          'Выдача',
          'Исходное мнение',
        ],
        extra,
      ),
    );
  if (starts.length)
    blocks.push(
      table(
        ['Технический старт', 'Причина'],
        starts.map((t) => [link(doc, t.source, t.id), t.reason]),
      ),
    );
  if (opinions.length)
    blocks.push(
      `Согласие ${counts[2]}/${counts[1]}. Назначено ${counts[0]}, без двух пригодных оценок ${counts[0] - counts[1]}, разногласий ${counts[3]}, без решения ${counts[4]}.`,
      table(['Работа', 'Рубрика', 'Выдача', 'Оценщик 1', 'Оценщик 2', 'Разбор'], opinions),
    );
  return {
    doc,
    seriesResults,
    sums,
    runs: runs.length,
    ratings,
    starts: starts.length,
    regrades,
    agreement: counts,
    blocks,
  };
}

function processReport(docs) {
  const chains = new Map(),
    defects = new Map(),
    observations = [],
    audits = new Set(),
    repeated = new Set(),
    required = new Set();
  const rows = [],
    overall = [],
    byMetric = Array.from({ length: 6 }, () => []);
  for (const doc of docs) {
    for (const a of doc.attempts ?? []) {
      for (const f of ['id', 'snapshot', 'source']) requireText(a[f], f);
      const chain = key(doc.skill, a.audit ?? doc.study);
      if (!chains.has(chain)) chains.set(chain, []);
      const list = chains.get(chain);
      assert(!list.some((prev) => prev.a.id === a.id), `Повтор попытки: ${a.id}`);
      list.push({ a, doc });
    }
    const o = doc.observation;
    if (!o) continue;
    const accepted = timing(o.accepted),
      released = timing(o.released),
      through = timing(o.through);
    assert(
      accepted !== null && through !== null && through >= accepted,
      'Нужны границы периода после приёмки',
    );
    const version = requireText(o.version ?? doc.study, 'observation.version');
    const status = (d) =>
      released === null
        ? o.released === null
          ? 'до выпуска'
          : 'выпуск неизвестен'
        : timing(d.at) < released
          ? 'до выпуска'
          : 'после выпуска';
    const subset = new Map();
    for (const d of o.defects ?? []) {
      const at = timing(d.at);
      assert(at !== null && at >= accepted && at <= through, `Дефект вне периода: ${d.id}`);
      requireText(d.rule, 'defect.rule');
      const id = key(doc.skill, version, requireText(d.id, 'defect.id'));
      const entry = { defect: d, stage: status(d) };
      if (defects.has(id))
        assert(isDeepStrictEqual(defects.get(id), entry), `Конфликт подтверждений: ${id}`);
      defects.set(id, entry);
      subset.set(id, d);
    }
    const list = [...subset.values()].map(
      (d) =>
        `${link(doc, d.source, d.id)} · ${status(d)} · ${d.rule} · покрытие ${d.covered === true ? 'да' : d.covered === false ? 'нет' : 'неизвестно'}`,
    );
    observations.push([
      doc.skill,
      version,
      o.accepted,
      o.released === null ? 'не выпущена к концу периода' : (o.released ?? 'неизвестно'),
      o.through,
      link(doc, o.source, o.systematic === true ? 'систематическое' : 'неполное'),
      list.join(', ') || (o.systematic === true ? '0' : 'неизвестно'),
    ]);
  }
  let open = 0;
  for (const list of chains.values()) {
    // A manifest preserves assignment order. Across files a measured handoff or explicit
    // sequence is required; lexicographic filenames and timestamps of Git commits are not audit events.
    const separate = new Set(list.map((entry) => entry.doc)).size > 1;
    if (list.every(({ a }) => Number.isInteger(a.order))) {
      assert(
        new Set(list.map(({ a }) => a.order)).size === list.length,
        'Номера попыток аудита должны различаться',
      );
      list.sort((x, y) => x.a.order - y.a.order);
    } else if (list.every(({ a }) => a.handed != null)) {
      if (separate)
        assert(
          new Set(list.map(({ a }) => timing(a.handed))).size === list.length,
          'При одновременной передаче укажите order',
        );
      list.sort((x, y) => timing(x.a.handed) - timing(y.a.handed));
    } else assert(!separate, 'Попытки одного аудита в нескольких файлах требуют handed или order');
    const { doc } = list[0];
    if (list[0].a.verdict && doc.kind !== 'policy') audits.add(doc.skill);
    if (list[0].a.verdict && list.length > 1 && doc.kind !== 'policy') repeated.add(doc.skill);
    if (
      list[0].a.verdict &&
      doc.kind !== 'policy' &&
      (list.length > 1 || list.some(({ a }) => a.returned))
    )
      required.add(doc.skill);
    if (list.some(({ a }) => a.returned) && (!list.at(-1).a.verdict || list.at(-1).a.returned))
      open++;
    let prior;
    for (const { a, doc } of list) {
      if (a.verdict)
        assert(
          ['PASS', 'FAIL', 'BLOCKED', 'PROVISIONAL'].includes(a.verdict),
          `Неизвестный вердикт: ${a.verdict}`,
        );
      if (a.returned) {
        assert(a.verdict && a.verdict !== 'PASS', 'Возврат требует вердикта с замечанием');
        requireText(a.returned.primary, 'returned.primary');
        requireText(a.returned.finding, 'returned.finding');
      }
      const active = { review: [], repair: [] };
      for (const interval of a.active ?? []) {
        assert(Object.hasOwn(active, interval.kind), 'Неизвестный вид активного времени');
        const duration = seconds(interval.start, interval.end);
        assert(duration !== null, 'Активный интервал неполон');
        active[interval.kind].push([timing(interval.start), timing(interval.end)]);
      }
      const activeSeconds = (list) => {
        if (!list.length) return null;
        list.sort((a, b) => a[0] - b[0]);
        return list.reduce((sum, [a, b], i) => {
          assert(!i || list[i - 1][1] <= a, 'Пересечение активных интервалов');
          return sum + (b - a) / 1000;
        }, 0);
      };
      const metrics = [
        seconds(a.handed, a.started),
        seconds(a.started, a.decided),
        prior?.returned ? seconds(prior.decided, a.handed) : null,
        activeSeconds(active.review),
        activeSeconds(active.repair),
      ];
      metrics.forEach((n, i) => {
        if (n !== null) byMetric[i].push(n);
      });
      rows.push([
        doc.skill,
        a.audit ?? doc.study,
        link(doc, a.source, a.id),
        a.snapshot,
        a.verdict ?? 'ожидается',
        ...metrics.map((n) => n ?? '—'),
        a.returned
          ? link(doc, a.returned.source, `${a.returned.primary} · ${a.returned.finding}`)
          : '—',
      ]);
      prior = a;
    }
    const total = list.at(-1).a.verdict ? seconds(list[0].a.handed, list.at(-1).a.decided) : null;
    if (total !== null) byMetric[5].push(total);
    overall.push([doc.skill, list[0].a.audit ?? doc.study, total ?? '—']);
  }
  const labels = [
    'Очередь',
    'Проверка',
    'После возврата',
    'Активная проверка',
    'Активное исправление',
  ];
  const stages = ['до выпуска', 'после выпуска', 'выпуск неизвестен'].map(
    (stage) => [...defects.values()].filter((d) => d.stage === stage).length,
  );
  return [
    '## Процесс приёмки',
    `Повторная проверка потребовалась ${required.size}/${audits.size} скилам. Повторно передано на аудит ${repeated.size}/${audits.size} скилов с первым вердиктом. Открытых возвратов ${open}. Интервалы в секундах, прочерк означает отсутствие измерения.`,
    ...(rows.length
      ? [
          table(['Скил', 'Аудит', 'Попытка', 'Снимок', 'Вердикт', ...labels, 'Возврат'], rows),
          table(['Скил', 'Аудит', 'От первой передачи до последнего решения'], overall),
          table([...labels, 'Весь аудит'], [byMetric.map(median)]),
          'Медианы по полным наблюдениям. В скобках указано их число.',
        ]
      : []),
    ...(observations.length
      ? [
          `Подтверждённых уникальных дефектов по скилу и версии ${defects.size}. До выпуска ${stages[0]}, после выпуска ${stages[1]}, дата выпуска неизвестна для ${stages[2]}. Числа учитывают зарегистрированные находки за указанные периоды. Исследований без периода наблюдения ${docs.length - observations.length}, для них дефекты неизвестны.`,
          table(
            [
              'Скил',
              'Версия',
              'Приёмка UTC',
              'Выпуск UTC',
              'По UTC',
              'Наблюдение',
              'Подтверждённые дефекты',
            ],
            observations,
          ),
        ]
      : ['Дефекты после приёмки неизвестны. Периоды наблюдения отсутствуют.']),
  ];
}

export function analyzeStudies(documents) {
  const datasets = new Map();
  for (const doc of documents) {
    for (const field of ['skill', 'study', 'model', 'effort', 'source'])
      requireText(doc[field], field);
    const id = key(doc.skill, doc.study, doc.model, doc.effort);
    if (datasets.has(id))
      assert(isDeepStrictEqual(doc, datasets.get(id)), `Конфликт записей исследования: ${id}`);
    else datasets.set(id, doc);
  }
  const docs = [...datasets.keys()].sort().map((k) => datasets.get(k));
  const hashes = new Map(),
    tasks = new Set(),
    resolvedTasks = new Set();
  const studies = docs.map((doc) => study(doc, hashes, tasks, resolvedTasks));
  return { studies, tasks, resolvedTasks };
}

export function totalOutcomes(studies) {
  return outcomes.map((_, i) => studies.reduce((n, s) => n + s.sums[i], 0));
}

export function summarize(documents) {
  const { studies, tasks, resolvedTasks } = analyzeStudies(documents);
  const docs = studies.map((s) => s.doc);
  const sum = (key) => studies.reduce((n, s) => n + s[key], 0);
  const totals = totalOutcomes(studies);
  const [assigned, eligible, agree, disagree, pending] = Array.from({ length: 5 }, (_, i) =>
    studies.reduce((n, s) => n + s.agreement[i], 0),
  );
  const skills = new Set(
    docs.filter((d) => d.kind !== 'policy' && d.kind !== 'retired').map((d) => d.skill),
  );
  const covered = new Set(
    docs
      .filter((d, i) => skills.has(d.skill) && studies[i].sums.slice(0, 4).some(Boolean))
      .map((d) => d.skill),
  );
  return (
    [
      '# Сводка аудитов',
      `Скилов ${skills.size}, исследований ${docs.length}, разных заданий в парах ${tasks.size}. Исполнений ${sum('runs')}, оценок ${sum('ratings')}, технических стартов ${sum('starts')}.`,
      `Хотя бы один определённый парный исход у ${covered.size}/${skills.size} скилов и в ${resolvedTasks.size}/${tasks.size} заданиях. Для ${skills.size - covered.size} скилов и ${tasks.size - resolvedTasks.size} заданий такого исхода нет.`,
      table([...outcomes, 'Назначено пар'], [[...totals, totals.reduce((a, b) => a + b, 0)]]),
      'Слева указан проверяемый вариант, справа контроль. PASS/FAIL означает «лучше», FAIL/PASS означает «хуже». PASS/PASS и FAIL/FAIL означают одинаковый исход. Для каждой доли знаменателем служит число всех назначенных пар этой серии.',
      `Отдельно повторно оценено пар ${sum('regrades')}. Сумма служит для сверки записей. Выводы относятся к отдельным сериям.`,
      `Для проверки согласия оценщиков назначено ${assigned} работ, две пригодные оценки у ${eligible}, пропущено ${assigned - eligible}. Согласие ${eligible ? agree + '/' + eligible : 'неизвестно (0/0)'}, разногласий ${disagree}, без решения ${pending}.`,
      ...studies.flatMap((s) => s.blocks),
      ...processReport(docs),
    ].join('\n\n') + '\n'
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assert(
      process.argv.length > 2,
      'Вызов: node scripts/audit-metrics.mjs study.json [study2.json ...]',
    );
    const inputs = process.argv.slice(2).flatMap((file) => {
      const content = readFileSync(file, 'utf8');
      try {
        return JSON.parse(content);
      } catch {
        throw new Error(`Некорректный JSON в ${path.basename(file)}`);
      }
    });
    process.stdout.write(summarize(inputs));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
