import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { analyzeStudies, summarize } from './audit-metrics.mjs';
import { renderDashboard } from './blind-trial-dashboard.mjs';
import { assessSkill } from './blind-trial-health.mjs';

const source = 'scripts/audit-metrics.test.mjs';

function study(study = 'pilot', skill = 'example') {
  return { skill, study, model: 'model', effort: 'medium', source, runs: {}, series: [] };
}

function pair(doc, name, left, right) {
  const id = String(doc.series.length + 1);
  const refs = [left, right].map((score, i) => {
    if (!score) return null;
    const uid = id + ['a', 'b'][i];
    doc.runs[uid] = {
      task: name,
      variant: ['A', 'B'][i],
      source,
      sha256: createHash('sha256')
        .update(doc.study + uid)
        .digest('hex'),
      behavior: { result: 'done', note: 'проверил материал', source },
      ratings: { first: { assessor: 'j1', rubric: 'v1', packet: 'same', score, source } },
    };
    return [uid, 'first'];
  });
  doc.series.push({
    id,
    comparison: 'A/B',
    phase: 'primary',
    rubric: 'v1',
    packet: 'same',
    bRemoval: 'complete',
    pairs: [{ id: 'p1', task: name, left: refs[0], right: refs[1] }],
  });
}

test('Пять исходов, незапущенное плечо, повторная подача и граница B', () => {
  const doc = study();
  for (const [left, right] of [
    ['PASS', 'FAIL'],
    ['FAIL', 'PASS'],
    ['PASS', 'PASS'],
    ['FAIL', 'FAIL'],
    ['PASS', null],
  ]) {
    pair(doc, 'case-' + doc.series.length, left, right);
  }
  doc.series[0].bRemoval = 'partial';
  doc.series[1].bRemoval = undefined;
  doc.series[3].pairs[0].reason = 'раскрыт ключ';
  doc.runs['3b'].behavior.note = 'Проверил [запись](/tmp/example.json) и путь A\\B';
  pair(doc, 'negative', 'FAIL', 'FAIL');
  doc.technicalStarts = [{ id: 'boot', reason: 'нет сессии', source }];
  const report = summarize([doc]);
  assert.match(report, /\| 1 \| 1 \| 1 \| 1 \| 2 \| 6 \|/);
  assert.match(report, /Исполнений 11, оценок 11, технических стартов 1/);
  assert.match(report, /выполнено \| partial \| нет данных/);
  assert.match(report, /выполнено \| unknown \| нет данных/);
  assert.match(report, /выполнено \| complete \| нет данных/);
  assert.match(report, /выполнено \| complete \| выполнено/);
  assert.ok(report.includes(String.raw`[Проверил \[запись\]\(/tmp/example.json\) и путь A\\B](`));
  assert.ok(!report.includes('[запись](/tmp/example.json)'));
  assert.equal(summarize([doc, structuredClone(doc)]), report);
  const changed = structuredClone(doc);
  changed.runs['1a'].task = 'other';
  assert.throws(() => summarize([doc, changed]), /Конфликт записей/);
});

test('Повторная оценка, неприменимая выдача, разногласие и независимый разбор', () => {
  const doc = study();
  pair(doc, 'a', 'PASS', 'PASS');
  const r = doc.runs['1a'].ratings;
  r.second = { ...r.first, assessor: 'j2', score: 'FAIL' };
  doc.agreement = [{ run: '1a', ratings: ['first', 'second'], rubric: 'v1', packet: 'same' }];
  let report = summarize([doc]);
  assert.match(report, /Исполнений 2, оценок 3/);
  assert.match(report, /Согласие 0\/1.*разногласий 1, без решения 1/);
  assert.match(report, /недостаточно \| разногласие без решения/);
  r.third = { ...r.second, assessor: 'j3' };
  doc.agreement[0].resolution = 'third';
  assert.match(summarize([doc]), /\| 0 \| 1 \| 0 \| 0 \| 0 \| 1 \|/);
  r.third.score = 'INCONCLUSIVE';
  report = summarize([doc]);
  assert.match(report, /недостаточно \| независимый разбор дал INCONCLUSIVE/);
  assert.match(report, /разногласий 1, без решения 0/);
  assert.match(report, /j3 · INCONCLUSIVE/);
  r.second.packet = 'expanded';
  doc.agreement[0].resolution = undefined;
  assert.match(summarize([doc]), /Согласие 0\/0.*без двух пригодных оценок 1/);
  r.first.rubric = 'v2';
  assert.match(summarize([doc]), /недостаточно \| различаются рубрика или свидетельства/);
});

test('Фазы, модели, первичный провал и повторы учитываются раздельно', () => {
  const doc = study();
  pair(doc, 'form', 'FAIL', 'PASS');
  pair(doc, 'form', 'PASS', 'PASS');
  doc.runs['2a'].repeatOf = '1a';
  doc.series[1].phase = 'diagnostic';
  const second = study('second');
  second.model = 'другая модель';
  second.effort = 'low';
  second.taskSet = doc.taskSet = 'one assignment set';
  pair(second, 'form', 'FAIL', 'PASS');
  const result = summarize([doc, second]);
  assert.equal(result, summarize([second, doc]));
  assert.match(result, /разных заданий в парах 1/);
  assert.match(result, /\| 0 \| 2 \| 1 \| 0 \| 0 \| 3 \|/);
  assert.match(result, /primary/);
  assert.match(result, /diagnostic/);
  assert.match(result, /другая модель \/ low/);
  second.runs['1a'].sha256 = doc.runs['1a'].sha256;
  assert.throws(() => summarize([doc, second]), /два запуска/);
});

test('Переоценка пары сохраняет первоначальный результат и не добавляет назначение', () => {
  const doc = study();
  pair(doc, 'scenario', 'FAIL', 'PASS');
  for (const run of Object.values(doc.runs)) {
    run.ratings.more = { ...run.ratings.first, assessor: 'second', packet: 'extra', score: 'PASS' };
  }
  doc.series.push({
    ...doc.series[0],
    id: 'new-view',
    phase: 'regrade',
    packet: 'extra',
    pairs: [{ id: 'same-pair', task: 'scenario', left: ['1a', 'more'], right: ['1b', 'more'] }],
  });
  const report = summarize([doc]);
  assert.match(report, /Отдельно повторно оценено пар 1/);
  assert.match(report, /\| 0 \| 1 \| 0 \| 0 \| 0 \| 1 \|/);
  assert.match(report, /PASS\/FAIL означает «лучше», FAIL\/PASS означает «хуже»/);
  doc.series[1].phase = 'diagnostic';
  assert.throws(() => summarize([doc]), /двух тех же работ/);
});

test('Наблюдаемые интервалы, медианы, повтор до вердикта и поздние дефекты', () => {
  const early = study('z-initial'),
    later = study('a-return');
  const other = study('other', 'other-skill');
  const time = (n) => new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString();
  const attempt = {
    audit: 'one',
    id: 'review',
    snapshot: 's1',
    handed: time(1),
    started: time(4),
    decided: time(9),
    verdict: 'FAIL',
    source,
    returned: { primary: 'fixture', finding: 'предзаполнено', source },
    active: [{ kind: 'review', start: time(4), end: time(6) }],
  };
  early.attempts = [attempt];
  later.attempts = [{ audit: 'one', id: 'retry', snapshot: 's2', handed: time(15), source }];
  other.attempts = [
    {
      id: 'ok',
      snapshot: 's3',
      handed: time(5),
      started: time(10),
      decided: time(18),
      verdict: 'PASS',
      source,
    },
  ];
  const o = {
    version: '1',
    accepted: time(1),
    released: time(3),
    through: time(20),
    source,
    systematic: false,
    defects: [{ id: 'ticket', at: time(5), covered: false, rule: 'readback', source }],
  };
  early.observation = o;
  let report = summarize([later, other, early]);
  assert.equal(report, summarize([early, other, later]));
  assert.match(report, /Повторно передано на аудит 1\/2.*Открытых возвратов 1/);
  assert.match(report, /4 \(2\).*6.5 \(2\).*6 \(1\).*2 \(1\).*— \(0\).*13 \(1\)/);
  assert.match(report, /после выпуска · readback · покрытие нет/);
  later.attempts[0].started = time(17);
  later.attempts[0].decided = time(21);
  later.attempts[0].verdict = 'PASS';
  report = summarize([later, early]);
  assert.match(report, /Открытых возвратов 0/);
  assert.match(report, /\| example \| one \| 20 \|/);
});

test('Исторические контрольные случаи через CLI из корня и каталога отчёта', () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const dir = 'docs/reviews/audit-metrics-20261119/history';
  const script = 'scripts/audit-metrics.mjs';
  const files = ['02.json', '05.json', '19-retirement.json'];
  const fromRoot = execFileSync(process.execPath, [script, ...files.map((s) => dir + '/' + s)], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.match(fromRoot, /\(docs\/reviews\/gpt-6-2\/02\/results\/f88243\.json\)/);
  const fromHistory = execFileSync(process.execPath, ['../../../../' + script, ...files], {
    cwd: root + '/' + dir,
    encoding: 'utf8',
  });
  assert.match(fromHistory, /\(\.\.\/\.\.\/gpt-6-2\/02\/results\/f88243\.json\)/);
  assert.match(
    fromHistory,
    /\| ab-primary \| A\/B \| primary \|[^\n]*\| 2 \| 0 \| 1 \| 1 \| 0 \| 0 \| 2 \|/,
  );
  assert.match(fromHistory, /Исполнений 7, оценок 9, технических стартов 4/);
  assert.match(fromHistory, /Исполнений 11, оценок 15, технических стартов 1/);
  assert.match(fromHistory, /b7c2c8[^\n]+FAIL/);
  assert.match(fromHistory, /3a6239[^\n]+b7c2c8[^\n]+PASS/);
});

test('Catalog coverage distinguishes missing studies, insufficient pairs and reassessments', () => {
  const partial = study('lost', 'incomplete');
  pair(partial, 'unscored control', 'PASS', null);
  const complete = study('paired', 'tested');
  pair(complete, 'normal', 'FAIL', 'PASS');
  complete.series.push({ ...complete.series[0], id: 'again', phase: 'regrade' });
  const joint = study('shared', 'joint subjects');
  pair(joint, 'joint task', 'PASS', 'FAIL');
  const catalog = new Map([['new-skill', '1.0'], ['incomplete', '2.0'], ['tested', '3.0']]);
  const records = new Map([partial, complete, joint].map((doc) => [doc, source]));
  const report = renderDashboard(catalog, records);
  assert.match(report, /1 of 3 active skills.*Assigned pairs appear for 2 of 3 skills/);
  assert.match(report, /\| 2 \| 0 \| 1 \| 0 \| 0 \| 1 \|/);
  assert.match(report, /\| new-skill \| 1.0 \| Evidence needed \| 0 \| 0 \| 0 \| 0 \| 0 \| 0 \| Planned for the next review \|/);
  assert.match(report, /\[incomplete\]\(#incomplete\) \| 2.0 \| Evidence needed \| 1 \| 0 \| 0 \| 0 \| 0 \| 1 \| \[Study\]/);
  assert.match(report, /Reassessments of existing pairs appear separately \(1\)/);
  assert.match(report, /\| A\/B \| regrade \| 1 \| 0 \| 1 \|/);
  assert.match(report, /## Studies outside individual skill totals[\s\S]*### joint subjects/);
});

test('Current health follows the version and the final decision in each audit chain', () => {
  const doc = study();
  const version = '1.2.0';
  const decision = { id: 'initial', order: 1, snapshot: version, source, verdict: 'FAIL' };
  doc.attempts = [decision];
  const status = (index) => assessSkill(version, analyzeStudies([doc]).studies, index).status;
  assert.equal(status(), 'Needs attention');
  doc.attempts.push({ ...decision, id: 'repair', order: 2, verdict: 'PASS' });
  doc.attempts.reverse();
  assert.equal(status(), 'In good shape');
  doc.attempts.push({ ...decision, id: 'experiment', order: 3, snapshot: '1.3.0' });
  assert.equal(status(), 'In good shape');
  doc.attempts.push({ ...decision, id: 'other', audit: 'different task', verdict: 'BLOCKED' });
  assert.equal(status(), 'Recheck');
  doc.attempts = [];
  assert.equal(status({ version: '1.1.0', verdict: 'PASS', source }), 'Evidence needed');
  assert.equal(status({ version, verdict: 'PASS', source, scope: 'joint' }), 'Evidence needed');
  doc.observation = { version, defects: [{ source }] };
  assert.equal(status({ version, verdict: 'PASS', source }), 'Needs attention');
});

test('Current trial outcomes follow the tested side and exclude regrades and unknown variants', () => {
  const doc = study();
  const version = '1.2.0';
  pair(doc, 'case', 'FAIL', 'PASS');
  const note = { version, verdict: 'PASS', source };
  const status = () => assessSkill(version, analyzeStudies([doc]).studies, note).status;
  assert.equal(status(), 'In good shape');
  doc.series[0].comparison = version + '/1.1.0';
  doc.runs['1a'].variant = version;
  doc.runs['1b'].variant = '1.1.0';
  assert.equal(status(), 'Recheck');
  doc.series[0].phase = 'regrade';
  assert.equal(status(), 'In good shape');
  doc.series[0].phase = 'primary';
  doc.series[0].comparison = '1.1.0/' + version;
  doc.runs['1a'].variant = '1.1.0';
  doc.runs['1b'].variant = version;
  assert.equal(status(), 'In good shape');
  doc.runs['1b'].ratings.first.score = 'FAIL';
  assert.equal(status(), 'Recheck');
  doc.series[0].pairs[0].left = null;
  assert.equal(status(), 'Evidence needed');
});
