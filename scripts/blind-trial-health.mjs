import path from 'node:path';
import { auditChains } from './audit-metrics.mjs';

function matchesIndexedAudit(a, doc, note) {
  return note?.snapshot === a.snapshot && path.posix.join(doc.base ?? '.', a.source) === note.source;
}

export function matchesIndexedStudy(doc, note) {
  return note?.study === doc.study && doc.attempts?.some((a) => a.snapshot === note.snapshot);
}

function matchesVersion({ a, doc }, version, note) {
  const observation = doc.observation;
  const snapshot = a.snapshot.split(/\s+/)[0];
  if (/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(snapshot)) return snapshot === version;
  if (observation && Date.parse(a.decided) === Date.parse(observation.accepted)) {
    return observation.version === version;
  }
  return matchesIndexedAudit(a, doc, note);
}

function assessment(status, reason, evidence) {
  return { status, reason, doc: evidence?.doc, source: evidence?.source };
}

export function assessSkill(version, studies, indexedReview) {
  const note = indexedReview?.version === version ? indexedReview : undefined;
  const reviews = [];
  const acceptedStudies = new Set();
  let openCheck = note?.study ? undefined : note?.check;
  if (note?.verdict) reviews.push({ verdict: note.verdict, source: note.source, scope: note.scope });
  for (const chain of auditChains(studies.map(({ doc }) => doc))) {
    const current = chain.filter((entry) => matchesVersion(entry, version, note));
    if (!current.length) continue;
    const { a, doc } = current.at(-1);
    const indexedSource = path.posix.join(doc.base ?? '.', a.source) === note?.source;
    const scope = a.scope ?? (indexedSource ? note.scope : undefined);
    reviews.push({ verdict: a.verdict, doc, source: a.source, scope });
    if (doc.study === note?.study && matchesIndexedAudit(a, doc, note)) openCheck = note.check;
    if (a.verdict === 'PASS' && scope !== 'joint') {
      for (const entry of current) acceptedStudies.add(entry.doc);
    }
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
  if (openCheck) return assessment('Recheck', openCheck, note);

  let incomplete;
  let tested;
  for (const { doc, seriesResults } of studies) {
    const aliases = matchesIndexedStudy(doc, note) ? note.variants : undefined;
    const variants = new Set([version, ...(aliases ?? [])]);
    for (const { series, results } of seriesResults) {
      if (series.phase === 'regrade') continue;
      const [left, right] = series.comparison.split('/');
      const onLeft = variants.has(left);
      const onRight = variants.has(right);
      if (!onLeft && !onRight) continue;
      const evidence = { doc, source: series.source ?? doc.source };
      const [better, worse, bothPassed, bothFailed, insufficient] = results;
      const failedTrial = (onLeft && worse) || (onRight && better) || bothFailed;
      if (failedTrial && !acceptedStudies.has(doc)) {
        return assessment('Recheck', 'Review the failed trial that has no final individual decision.', evidence);
      }
      if (insufficient) incomplete = evidence;
      if (better || worse || bothPassed || bothFailed) tested = evidence;
    }
  }

  if (incomplete && !tested) {
    return assessment('Evidence needed', 'Complete a conclusive comparison for this version.', incomplete);
  }
  const pass = reviews.find((r) => r.scope !== 'joint');
  if (pass) {
    return assessment('In good shape', 'This version passed individual review in the tested scope.', pass);
  }
  if (incomplete) {
    return assessment('Evidence needed', 'Complete the inconclusive comparison for this version.', incomplete);
  }
  if (reviews.length) {
    return assessment('Evidence needed', 'This version passed a joint review. An individual trial is needed to measure its contribution.', reviews[0]);
  }
  if (tested) {
    return assessment('Evidence needed', 'The current variant passed its recorded tasks. Confirm its individual audit decision.', tested);
  }
  const doc = studies[0]?.doc;
  if (!doc) return assessment('Evidence needed', 'Planned for the next review');
  return assessment('Evidence needed', 'Link a review or trial to the current catalog version.', { doc, source: doc.source });
}
