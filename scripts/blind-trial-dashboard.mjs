// Run from the repository root with Node.js 22.22 or later.
import assert from 'node:assert/strict';
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeStudies, link, table, totalOutcomes } from './audit-metrics.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'docs/reviews');
const columns = ['Assigned', 'Better', 'Worse', 'Both passed', 'Both failed', 'Insufficient'];
const planned = 'Planned for the next review';

function readCatalog() {
  const catalog = new Map();
  const skills = globSync('skills/*/SKILL.md', { cwd: root })
    .map((file) => path.basename(path.dirname(file)))
    .sort();
  for (const skill of skills) {
    const file = path.join('skills', skill, 'SKILL.md');
    const frontmatter = readFileSync(path.join(root, file), 'utf8').split(/^---\s*$/m)[1];
    const version = /^\s*source-version:\s*['"]?([\w.+-]+)['"]?\s*$/m.exec(frontmatter)?.[1];
    assert(version, `Missing source-version in ${file}`);
    catalog.set(skill, version);
  }
  return catalog;
}

function readRecords() {
  const patterns = [
    'docs/reviews/audit-metrics-*/history/*.json',
    '{docs/reviews,skills/*/docs/reviews}/**/{metrics,metrics-*,study}.json',
  ];
  const records = new Map();
  for (const file of globSync(patterns, { cwd: root }).sort()) {
    const input = JSON.parse(readFileSync(path.join(root, file), 'utf8'));
    for (const doc of [input].flat()) {
      // Some study.json files hold raw assignments alongside normalized metrics.json.
      if (path.basename(file) === 'study.json' && !('study' in doc || 'series' in doc)) continue;
      records.set(doc, file);
    }
  }
  return records;
}

function counts(outcomes) {
  return [outcomes.reduce((total, n) => total + n, 0), ...outcomes];
}

function studyDetails({ doc, seriesResults }, file) {
  const record = link({}, file, 'Study record', directory);
  const evidence = link(doc, doc.source, 'Trial evidence', directory);
  const version = doc.observation?.version ? ` · Accepted version ${doc.observation.version}` : '';
  const blocks = [`${record} · ${evidence} · Executor ${doc.model} / ${doc.effort}${version}`];
  if (seriesResults.length) {
    const rows = seriesResults.map(({ series, results }) => [
      link(doc, series.source ?? doc.source, series.id, directory),
      series.comparison,
      series.phase,
      ...counts(results),
    ]);
    blocks.push(table(['Series', 'Left / right', 'Phase', ...columns], rows));
  } else {
    blocks.push('This study records no assigned pairs.');
  }
  return blocks.join('\n\n');
}

export function renderDashboard(catalog, records) {
  const { studies } = analyzeStudies([...records.keys()]);
  const active = [];
  const outside = [];
  for (const study of studies) {
    const { skill, kind } = study.doc;
    if (catalog.has(skill) && kind !== 'policy' && kind !== 'retired') active.push(study);
    else outside.push(study);
  }
  const rows = [];
  const details = [];
  let covered = 0;
  let withAssignments = 0;
  for (const [skill, version] of catalog) {
    const trials = active.filter(({ doc }) => doc.skill === skill);
    const outcomes = totalOutcomes(trials);
    const result = counts(outcomes);
    if (result[0]) withAssignments++;
    if (outcomes.slice(0, 4).some(Boolean)) covered++;
    const evidence = trials.map(({ doc }, i) =>
      link(doc, doc.source, trials.length > 1 ? `Study ${i + 1}` : 'Study', directory),
    );
    if (!result[0] && !trials.some((trial) => trial.regrades)) evidence.push(planned);
    const name = trials.length ? `[${skill}](#${skill})` : skill;
    rows.push([name, version, ...result, evidence.join(' · ')]);
    if (trials.length) {
      details.push(`### ${skill}`);
      for (const trial of trials) details.push(studyDetails(trial, records.get(trial.doc)));
    }
  }
  const regrades = active.reduce((n, trial) => n + trial.regrades, 0);
  const blocks = [
    '# Blind trial dashboard',
    `**${covered} of ${catalog.size} active skills** have at least one conclusive pair. ` +
      `Assigned pairs appear for ${withAssignments} of ${catalog.size} skills. The catalog totals cover ${active.length} individual skill studies.`,
    table(columns, [counts(totalOutcomes(active))]),
    '## How to read the results',
    'A **pair** compares two variants on the same task. When **Left / right** shows `A/B`, A is the variant being tested and B is the comparison. A run passes when it meets the criteria for that task.',
    '**Assigned** counts all pairs scheduled for comparison. The five outcome columns add up to that total.',
    table(['Outcome', 'How to read one pair'], [
      ['Better', 'Only the left variant passed.'],
      ['Worse', 'Only the right variant passed.'],
      ['Both passed', 'Both variants met the task criteria.'],
      ['Both failed', 'Neither variant met the task criteria.'],
      ['Insufficient', 'A run or score is missing, the evidence is incomparable, or the outcome is uncertain. The pair still counts as assigned.'],
    ]),
    '**Example.** In a `package/none` row, **2 assigned, 2 both passed** means both tasks passed with the skill and without it. Neither variant had a pass/fail advantage on those tasks.',
    `**Coverage** counts a skill once it has any conclusive pair, including **Both failed**. Reassessments of existing pairs appear separately (${regrades}) in rows marked **regrade**.`,
    '## Results by skill',
    'Catalog versions come from this checkout. Results include earlier trials. Select a skill to see the variants and evidence for each series.',
    table(['Skill', 'Catalog version', ...columns, 'Trial evidence'], rows),
    '## Comparison series',
    'Read each series in the context of its tasks and variants. In instruction-removal trials, A/B compares the original with the removal variant. Numeric labels identify the tested versions. Open the linked study for its criteria and evidence.',
    ...details,
  ];
  if (outside.length) {
    blocks.push(
      '## Studies outside individual skill totals',
      'These studies cover subjects outside the individual skill totals, including repository policy and joint trials.',
    );
    for (const trial of outside) {
      blocks.push(`### ${trial.doc.skill}`, studyDetails(trial, records.get(trial.doc)));
    }
  }
  return blocks.join('\n\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = renderDashboard(readCatalog(), readRecords());
  writeFileSync(path.join(directory, 'blind-trial-dashboard.md'), report);
}
