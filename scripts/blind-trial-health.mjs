import path from 'node:path';
import { auditChains, link, table } from './audit-metrics.mjs';

const statusLabels = {
  'Needs attention': '🔴 Needs attention',
  Recheck: '🟠 Recheck',
  'Evidence needed': '⚪ Evidence needed',
  'In good shape': '🟢 In good shape',
};

function matchesVersion({ a, doc }, version, note) {
  const observation = doc.observation;
  const snapshot = a.snapshot.split(/\s+/)[0];
  if (/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(snapshot)) return snapshot === version;
  if (observation && Date.parse(a.decided) === Date.parse(observation.accepted)) {
    return observation.version === version;
  }
  return note?.snapshot === a.snapshot && path.posix.join(doc.base ?? '.', a.source) === note.source;
}

function assessment(status, reason, evidence) {
  return { status, reason, doc: evidence?.doc, source: evidence?.source };
}

export function assessSkill(version, studies, indexedReview) {
  const note = indexedReview?.version === version ? indexedReview : undefined;
  const reviews = [];
  if (note?.verdict) reviews.push({ verdict: note.verdict, source: note.source, scope: note.scope });
  for (const chain of auditChains(studies.map(({ doc }) => doc))) {
    const latest = chain.findLast((entry) => matchesVersion(entry, version, note));
    if (latest) reviews.push({ verdict: latest.a.verdict, doc: latest.doc, source: latest.a.source });
  }

  const failed = reviews.find((r) => r.verdict === 'FAIL');
  if (failed) {
    return assessment('Needs attention', 'Resolve the finding in the current-version audit.', failed);
  }
  for (const { doc } of studies) {
    const defect = doc.observation?.version === version && doc.observation.defects?.[0];
    if (defect) {
      return assessment('Needs attention', 'Check the recorded defect and verify its repair.', {
        doc, source: defect.source,
      });
    }
  }
  const pending = reviews.find((r) => r.verdict !== 'PASS');
  if (pending) {
    return assessment('Recheck', 'Confirm the outstanding audit decision for this version.', pending);
  }

  let incomplete;
  let tested;
  for (const { doc, seriesResults } of studies) {
    const mappedStudy =
      note?.study === doc.study && doc.attempts?.some((a) => a.snapshot === note.snapshot);
    const variants = new Set([version, ...(mappedStudy ? note.variants : [])]);
    for (const { series, results } of seriesResults) {
      if (series.phase === 'regrade') continue;
      const [left, right] = series.comparison.split('/');
      const onLeft = variants.has(left);
      const onRight = variants.has(right);
      if (!onLeft && !onRight) continue;
      const evidence = { doc, source: series.source ?? doc.source };
      const [better, worse, bothPassed, bothFailed, insufficient] = results;
      if ((onLeft && worse) || (onRight && better) || bothFailed) {
        if (mappedStudy && note.check) return assessment('Recheck', note.check, note);
        return assessment('Recheck', 'Repeat the task that this version failed.', evidence);
      }
      if (insufficient) incomplete = evidence;
      if (better || worse || bothPassed) tested = evidence;
    }
  }

  if (incomplete && !tested) {
    return assessment('Evidence needed', 'Complete a conclusive comparison for this version.', incomplete);
  }
  const pass = reviews.find((r) => r.scope !== 'joint');
  if (pass) {
    return assessment('In good shape', 'These versions passed individual review in the tested scope.', pass);
  }
  if (incomplete) {
    return assessment('Evidence needed', 'Complete the inconclusive comparison for this version.', incomplete);
  }
  if (reviews.length) {
    return assessment('Evidence needed', 'These versions passed a joint review. Test each skill separately to measure its own contribution.', reviews[0]);
  }
  if (tested) {
    return assessment('Evidence needed', 'The current variant passed its recorded tasks. Confirm its individual audit decision.', tested);
  }
  const doc = studies[0]?.doc;
  if (!doc) return assessment('Evidence needed', 'Planned for the next review');
  return assessment('Evidence needed', 'Link a review or trial to the current catalog version.', { doc, source: doc.source });
}

export function healthSection(entries, directory) {
  const groups = Object.entries(statusLabels).map(([status, label]) => ({
    label, skills: entries.filter((entry) => entry.status === status),
  }));
  const blocks = [
    '## Current skill health',
    table(groups.map((group) => group.label), [groups.map((group) => group.skills.length)]),
    '**Needs attention** flags a failed audit or a defect recorded after acceptance for the current version. **Recheck** flags a specific trial result or review decision to investigate.',
  ];
  for (const { label, skills } of groups) {
    if (!skills.length) continue;
    blocks.push(`### ${label}`);
    const byReason = new Map();
    for (const { skill, version, doc, source, reason } of skills) {
      const label = `${skill} ${version}`;
      const name = source ? link(doc ?? {}, source, label, directory) : label;
      if (!byReason.has(reason)) byReason.set(reason, []);
      byReason.get(reason).push(name);
    }
    for (const [reason, names] of byReason) {
      blocks.push(names.length === 1 ? `${names[0]} — ${reason}` : `${reason}\n\n${names.join(', ')}.`);
    }
  }
  return blocks.join('\n\n');
}
