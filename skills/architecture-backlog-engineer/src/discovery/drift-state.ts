import {
  asArray,
  hashJsonValue,
  isNonEmptyString,
  parseTimestamp,
  type BacklogFile,
  type DeltaSummary,
  type DriftCause,
  type DiscoveryItem,
  type Manifest,
} from './common.js';

const SOURCE_CHANGE: DriftCause = 'source_change';
const CONTRACT_CHANGE: DriftCause = 'contract_change';
const TOPOLOGY_CHANGE: DriftCause = 'topology_change';
const TRACK_GATE_CHANGE: DriftCause = 'track_gate_change';
const INCIDENT_FALSE_CLOSURE: DriftCause = 'incident_false_closure';
const SECURITY_FINDING: DriftCause = 'security_finding';
const NFR_BREACH: DriftCause = 'nfr_breach';
const EXTERNAL_DEPENDENCY_CHANGE: DriftCause = 'external_dependency_change';
const OWNER_BOUNDARY_CHANGE: DriftCause = 'owner_boundary_change';
const RELEASE_PATH_CHANGE: DriftCause = 'release_path_change';

const RUNTIME_SURFACES = new Set([
  'runtime',
  'deployment',
  'observability',
  'support',
  'enablement',
  'rollback',
  'recovery',
]);

export interface DriftState {
  baselineCanonicalHashes: Record<string, string>;
  baselineEstablished: boolean;
  baselineSourceHashes: Record<string, string>;
  currentCanonicalHashes: Record<string, string>;
  currentSourceHashes: Record<string, string>;
  deltaSummary: DeltaSummary;
  rebaselineRequired: boolean;
  staleClaims: string[];
  staleItems: string[];
  staleProofs: string[];
}

function claimHashKey(claimId: string): string {
  return `claim:${claimId}`;
}

function trackGateHashKey(trackGateId: string): string {
  return `track_gate:${trackGateId}`;
}

function issueHashKey(): string {
  return 'issues';
}

function securityHashKey(): string {
  return 'security_posture';
}

function nfrHashKey(): string {
  return 'nfr_posture';
}

function externalDependencyHashKey(): string {
  return 'external_dependencies';
}

function ownershipHashKey(): string {
  return 'ownership';
}

function releasePathHashKey(): string {
  return 'release_paths';
}

function getCurrentSourceHashes(backlog: BacklogFile): Record<string, string> {
  return Object.fromEntries(
    backlog.source_authority
      .filter((source) => isNonEmptyString(source.source_id) && isNonEmptyString(source.fingerprint))
      .map((source) => [source.source_id as string, source.fingerprint as string]),
  );
}

function getSecurityPosture(backlog: BacklogFile): unknown {
  return {
    controls: backlog.items
      .filter((item) => item.item_class === 'control_guardrail')
      .map((item) => ({
        item_id: item.item_id ?? '',
        change_surfaces: asArray(item.change_surfaces),
        trust_boundaries_crossed: asArray(item.trust_boundaries_crossed),
        data_class: item.data_class ?? null,
        observability_contract: item.observability_contract ?? null,
      })),
    security_reviews: backlog.reviews
      .filter((review) => review.role === 'security')
      .map((review) => ({
        review_id: review.review_id ?? '',
        verdict: review.verdict ?? '',
        findings: asArray(review.findings),
        hard_fail_report: asArray(review.hard_fail_report),
      })),
    track_gates: backlog.track_gates
      .filter((gate) => gate.fail_mode === 'fail_closed')
      .map((gate) => ({
        track_gate_id: gate.track_gate_id ?? '',
        gate_type: gate.gate_type ?? '',
        governing_control_item_refs: asArray(gate.governing_control_item_refs),
      })),
  };
}

function getNfrPosture(backlog: BacklogFile): unknown {
  return {
    quality_attributes: backlog.quality_attributes,
    item_contracts: backlog.items.map((item) => ({
      item_id: item.item_id ?? '',
      nfr_contract: item.nfr_contract ?? null,
      observability_contract: item.observability_contract ?? null,
    })),
  };
}

function getIssueLedger(backlog: BacklogFile): unknown {
  return {
    gaps: backlog.gaps,
    contradictions: backlog.contradictions,
    unknowns: backlog.unknowns,
    delivered_lineage_notes: backlog.delivered_lineage_notes,
  };
}

function getExternalDependencyLedger(backlog: BacklogFile): unknown {
  return {
    target_dependencies: asArray(backlog.target_system.external_dependencies),
    dependency_classifications: asArray(backlog.as_built.dependency_classifications),
    vendor_external_owners: asArray(backlog.as_built.vendor_external_owners),
  };
}

function getOwnershipLedger(backlog: BacklogFile): unknown {
  return {
    target_ownership: asArray(backlog.target_system.team_and_ownership_assumptions),
    as_built_ownership: asArray(backlog.as_built.ownership_matrix),
    item_owners: backlog.items.map((item) => ({
      item_id: item.item_id ?? '',
      owners: item.owners ?? null,
    })),
  };
}

function getReleasePathLedger(backlog: BacklogFile): unknown {
  return {
    item_release_paths: backlog.items.map((item) => ({
      item_id: item.item_id ?? '',
      rollout: item.rollout ?? null,
      recovery: item.recovery ?? null,
    })),
    proofs: backlog.proofs.map((proof) => ({
      proof_id: proof.proof_id ?? '',
      covered_ref: proof.covered_ref ?? null,
      release_trace: proof.dimensions?.release_trace ?? null,
      rollback_or_recovery_trace: proof.dimensions?.rollback_or_recovery_trace ?? null,
    })),
  };
}

function getCurrentCanonicalHashes(backlog: BacklogFile): Record<string, string> {
  const hashes: Record<string, string> = {
    contracts: hashJsonValue({
      contracts: backlog.contracts,
      data_domains: backlog.data_domains,
    }),
    topology: hashJsonValue(backlog.as_built),
    [issueHashKey()]: hashJsonValue(getIssueLedger(backlog)),
    [securityHashKey()]: hashJsonValue(getSecurityPosture(backlog)),
    [nfrHashKey()]: hashJsonValue(getNfrPosture(backlog)),
    [externalDependencyHashKey()]: hashJsonValue(getExternalDependencyLedger(backlog)),
    [ownershipHashKey()]: hashJsonValue(getOwnershipLedger(backlog)),
    [releasePathHashKey()]: hashJsonValue(getReleasePathLedger(backlog)),
  };

  for (const claim of backlog.claims) {
    if (isNonEmptyString(claim.claim_id)) {
      hashes[claimHashKey(claim.claim_id)] = hashJsonValue(claim);
    }
  }

  for (const trackGate of backlog.track_gates) {
    if (isNonEmptyString(trackGate.track_gate_id)) {
      hashes[trackGateHashKey(trackGate.track_gate_id)] = hashJsonValue(trackGate);
    }
  }

  return hashes;
}

function collectChangedKeys(
  baseline: Record<string, string>,
  current: Record<string, string>,
): string[] {
  const keys = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  const changed: string[] = [];

  for (const key of keys) {
    if ((baseline[key] ?? null) !== (current[key] ?? null)) {
      changed.push(key);
    }
  }

  return changed.sort();
}

function collectItemClaimRefs(item: DiscoveryItem): string[] {
  const refs = new Set<string>();
  for (const claimRef of asArray(item.claim_refs)) {
    if (isNonEmptyString(claimRef)) {
      refs.add(claimRef);
    }
  }
  for (const origin of asArray(item.origin_ref)) {
    if (!isNonEmptyString(origin.kind) || !isNonEmptyString(origin.ref)) {
      continue;
    }
    if (
      origin.kind === 'claim_ref' ||
      origin.kind === 'control_obligation_ref' ||
      origin.kind === 'decommission_need_ref'
    ) {
      refs.add(origin.ref);
    }
  }

  return [...refs];
}

function itemTouchesContractOrData(item: DiscoveryItem): boolean {
  return (
    asArray(item.interfaces_touched).length > 0 ||
    asArray(item.data_domains_touched).length > 0 ||
    item.item_class === 'migration' ||
    item.item_class === 'retirement'
  );
}

function itemTouchesTopology(item: DiscoveryItem): boolean {
  return (
    asArray(item.change_surfaces).some((surface) => RUNTIME_SURFACES.has(surface)) ||
    asArray(item.trust_boundaries_crossed).length > 0 ||
    item.item_class === 'operational_enablement' ||
    item.item_class === 'documentation_support_enablement' ||
    item.item_class === 'migration'
  );
}

function itemTouchesSecurity(item: DiscoveryItem): boolean {
  return (
    item.item_class === 'control_guardrail' ||
    asArray(item.trust_boundaries_crossed).length > 0 ||
    asArray(item.change_surfaces).some((surface) =>
      ['auth', 'authz', 'secrets', 'policy', 'data_class', 'external_api'].includes(String(surface)),
    )
  );
}

function itemTouchesNfr(item: DiscoveryItem): boolean {
  return item.nfr_contract !== null || item.observability_contract !== null;
}

function itemTouchesExternalDependencies(item: DiscoveryItem): boolean {
  return (
    asArray(item.interfaces_touched).length > 0 ||
    item.item_class === 'migration' ||
    item.item_class === 'retirement' ||
    item.item_class === 'capability_seam'
  );
}

function itemTouchesOwnership(item: DiscoveryItem): boolean {
  return item.owners !== null && item.owners !== undefined;
}

function itemTouchesReleasePaths(item: DiscoveryItem): boolean {
  return item.rollout !== null || item.recovery !== null;
}

function proofInvalidatedByRebaseline(
  manifest: Manifest,
  proofExecutedAt: string | undefined,
  invalidatedBy: DriftCause[],
): boolean {
  if (manifest.last_rebaseline_causes.length === 0) {
    return false;
  }
  const rebaselineAt = parseTimestamp(manifest.last_rebaseline_at);
  const executedAt = parseTimestamp(proofExecutedAt);
  if (rebaselineAt === null || executedAt === null) {
    return false;
  }
  if (executedAt >= rebaselineAt) {
    return false;
  }

  return invalidatedBy.some((cause) => manifest.last_rebaseline_causes.includes(cause));
}

function parseInvalidationCauses(value: unknown): DriftCause[] {
  const validCauses = new Set<DriftCause>([
    SOURCE_CHANGE,
    CONTRACT_CHANGE,
    TOPOLOGY_CHANGE,
    TRACK_GATE_CHANGE,
    INCIDENT_FALSE_CLOSURE,
    SECURITY_FINDING,
    NFR_BREACH,
    EXTERNAL_DEPENDENCY_CHANGE,
    OWNER_BOUNDARY_CHANGE,
    RELEASE_PATH_CHANGE,
  ]);

  return asArray(Array.isArray(value) ? value : [])
    .filter((entry): entry is DriftCause => typeof entry === 'string' && validCauses.has(entry as DriftCause));
}

function itemTouchesIssueLedgers(item: DiscoveryItem): boolean {
  return asArray(item.origin_ref).some(
    (origin) =>
      origin.kind === 'gap_ref' ||
      origin.kind === 'unknown_ref' ||
      origin.kind === 'review_finding_ref',
  );
}

export function computeDriftState(
  manifest: Manifest,
  backlog: BacklogFile,
  nowMs = Date.now(),
): DriftState {
  const currentSourceHashes = getCurrentSourceHashes(backlog);
  const currentCanonicalHashes = getCurrentCanonicalHashes(backlog);
  const baselineEstablished =
    Object.keys(manifest.baseline_source_hashes).length > 0 ||
    Object.keys(manifest.baseline_canonical_hashes).length > 0;
  const baselineSourceHashes = baselineEstablished
    ? manifest.baseline_source_hashes
    : currentSourceHashes;
  const baselineCanonicalHashes = baselineEstablished
    ? manifest.baseline_canonical_hashes
    : currentCanonicalHashes;

  const changedSourceIds = collectChangedKeys(baselineSourceHashes, currentSourceHashes);
  const changedCanonicalKeys = collectChangedKeys(baselineCanonicalHashes, currentCanonicalHashes);
  const changedClaimIds = changedCanonicalKeys
    .filter((key) => key.startsWith('claim:'))
    .map((key) => key.slice('claim:'.length));
  const changedTrackGateIds = changedCanonicalKeys
    .filter((key) => key.startsWith('track_gate:'))
    .map((key) => key.slice('track_gate:'.length));
  const topologyChanged =
    baselineCanonicalHashes.topology !== undefined &&
    currentCanonicalHashes.topology !== undefined &&
    baselineCanonicalHashes.topology !== currentCanonicalHashes.topology;
  const contractChanged =
    baselineCanonicalHashes.contracts !== undefined &&
    currentCanonicalHashes.contracts !== undefined &&
    baselineCanonicalHashes.contracts !== currentCanonicalHashes.contracts;
  const incidentChanged =
    baselineCanonicalHashes[issueHashKey()] !== undefined &&
    currentCanonicalHashes[issueHashKey()] !== undefined &&
    baselineCanonicalHashes[issueHashKey()] !== currentCanonicalHashes[issueHashKey()];
  const securityChanged =
    baselineCanonicalHashes[securityHashKey()] !== undefined &&
    currentCanonicalHashes[securityHashKey()] !== undefined &&
    baselineCanonicalHashes[securityHashKey()] !== currentCanonicalHashes[securityHashKey()];
  const nfrChanged =
    baselineCanonicalHashes[nfrHashKey()] !== undefined &&
    currentCanonicalHashes[nfrHashKey()] !== undefined &&
    baselineCanonicalHashes[nfrHashKey()] !== currentCanonicalHashes[nfrHashKey()];
  const externalDependencyChanged =
    baselineCanonicalHashes[externalDependencyHashKey()] !== undefined &&
    currentCanonicalHashes[externalDependencyHashKey()] !== undefined &&
    baselineCanonicalHashes[externalDependencyHashKey()] !== currentCanonicalHashes[externalDependencyHashKey()];
  const ownershipChanged =
    baselineCanonicalHashes[ownershipHashKey()] !== undefined &&
    currentCanonicalHashes[ownershipHashKey()] !== undefined &&
    baselineCanonicalHashes[ownershipHashKey()] !== currentCanonicalHashes[ownershipHashKey()];
  const releasePathChanged =
    baselineCanonicalHashes[releasePathHashKey()] !== undefined &&
    currentCanonicalHashes[releasePathHashKey()] !== undefined &&
    baselineCanonicalHashes[releasePathHashKey()] !== currentCanonicalHashes[releasePathHashKey()];

  const dirtyFlags: DriftCause[] = [];
  if (changedSourceIds.length > 0 || changedClaimIds.length > 0) {
    dirtyFlags.push(SOURCE_CHANGE);
  }
  if (contractChanged) {
    dirtyFlags.push(CONTRACT_CHANGE);
  }
  if (topologyChanged) {
    dirtyFlags.push(TOPOLOGY_CHANGE);
  }
  if (changedTrackGateIds.length > 0) {
    dirtyFlags.push(TRACK_GATE_CHANGE);
  }
  if (incidentChanged) {
    dirtyFlags.push(INCIDENT_FALSE_CLOSURE);
  }
  if (securityChanged) {
    dirtyFlags.push(SECURITY_FINDING);
  }
  if (nfrChanged) {
    dirtyFlags.push(NFR_BREACH);
  }
  if (externalDependencyChanged) {
    dirtyFlags.push(EXTERNAL_DEPENDENCY_CHANGE);
  }
  if (ownershipChanged) {
    dirtyFlags.push(OWNER_BOUNDARY_CHANGE);
  }
  if (releasePathChanged) {
    dirtyFlags.push(RELEASE_PATH_CHANGE);
  }

  const claimsById = new Map(
    backlog.claims
      .filter((claim): claim is typeof claim & { claim_id: string } => isNonEmptyString(claim.claim_id))
      .map((claim) => [claim.claim_id, claim]),
  );
  const itemsById = new Map(
    backlog.items
      .filter((item): item is DiscoveryItem & { item_id: string } => isNonEmptyString(item.item_id))
      .map((item) => [item.item_id, item]),
  );
  const trackProofsById = new Map(
    backlog.track_proofs
      .filter((trackProof): trackProof is typeof trackProof & { track_proof_id: string; track_id: string } =>
        isNonEmptyString(trackProof.track_proof_id) && isNonEmptyString(trackProof.track_id),
      )
      .map((trackProof) => [trackProof.track_proof_id, trackProof]),
  );
  const trackGateIdsByTrack = new Map<string, string[]>();
  for (const gate of backlog.track_gates) {
    if (!isNonEmptyString(gate.track_gate_id) || !isNonEmptyString(gate.track_id)) {
      continue;
    }
    const existing = trackGateIdsByTrack.get(gate.track_id) ?? [];
    existing.push(gate.track_gate_id);
    trackGateIdsByTrack.set(gate.track_id, existing);
  }

  const staleClaims = new Set<string>();
  for (const claimId of changedClaimIds) {
    staleClaims.add(claimId);
  }
  for (const [claimId, claim] of claimsById) {
    if (asArray(claim.source_refs).some((sourceRef) => changedSourceIds.includes(sourceRef))) {
      staleClaims.add(claimId);
    }
  }

  const staleProofs = new Set<string>();
  for (const proof of backlog.proofs) {
    if (!isNonEmptyString(proof.proof_id)) {
      continue;
    }
    const invalidatedBy = parseInvalidationCauses(proof.invalidated_by);
    const freshUntil = parseTimestamp(proof.fresh_until ?? null);
    const expired = freshUntil !== null && freshUntil < nowMs;
    let stale = expired;

    if (!stale && proof.covered_ref?.kind === 'item' && isNonEmptyString(proof.covered_ref.id)) {
      const coveredItem = itemsById.get(proof.covered_ref.id);
      if (coveredItem) {
        const itemClaimRefs = collectItemClaimRefs(coveredItem);
        if (invalidatedBy.includes(SOURCE_CHANGE) && itemClaimRefs.some((claimRef) => staleClaims.has(claimRef))) {
          stale = true;
        }
        if (invalidatedBy.includes(CONTRACT_CHANGE) && contractChanged && itemTouchesContractOrData(coveredItem)) {
          stale = true;
        }
        if (invalidatedBy.includes(TOPOLOGY_CHANGE) && topologyChanged && itemTouchesTopology(coveredItem)) {
          stale = true;
        }
        if (
          invalidatedBy.includes(INCIDENT_FALSE_CLOSURE) &&
          incidentChanged &&
          itemTouchesIssueLedgers(coveredItem)
        ) {
          stale = true;
        }
        if (invalidatedBy.includes(SECURITY_FINDING) && securityChanged && itemTouchesSecurity(coveredItem)) {
          stale = true;
        }
        if (invalidatedBy.includes(NFR_BREACH) && nfrChanged && itemTouchesNfr(coveredItem)) {
          stale = true;
        }
        if (
          invalidatedBy.includes(EXTERNAL_DEPENDENCY_CHANGE) &&
          externalDependencyChanged &&
          itemTouchesExternalDependencies(coveredItem)
        ) {
          stale = true;
        }
        if (invalidatedBy.includes(OWNER_BOUNDARY_CHANGE) && ownershipChanged && itemTouchesOwnership(coveredItem)) {
          stale = true;
        }
        if (invalidatedBy.includes(RELEASE_PATH_CHANGE) && releasePathChanged && itemTouchesReleasePaths(coveredItem)) {
          stale = true;
        }
        if (
          invalidatedBy.includes(TRACK_GATE_CHANGE) &&
          isNonEmptyString(coveredItem.track_id) &&
          (trackGateIdsByTrack.get(coveredItem.track_id) ?? []).some((trackGateId) =>
            changedTrackGateIds.includes(trackGateId),
          )
        ) {
          stale = true;
        }
      }
    } else if (!stale && proof.covered_ref?.kind === 'track_proof' && isNonEmptyString(proof.covered_ref.id)) {
      const trackProof = trackProofsById.get(proof.covered_ref.id);
      if (trackProof) {
        if (invalidatedBy.includes(SOURCE_CHANGE) && staleClaims.size > 0) {
          stale = true;
        }
        if (invalidatedBy.includes(CONTRACT_CHANGE) && contractChanged) {
          stale = true;
        }
        if (invalidatedBy.includes(TOPOLOGY_CHANGE) && topologyChanged) {
          stale = true;
        }
        if (invalidatedBy.includes(INCIDENT_FALSE_CLOSURE) && incidentChanged) {
          stale = true;
        }
        if (invalidatedBy.includes(SECURITY_FINDING) && securityChanged) {
          stale = true;
        }
        if (invalidatedBy.includes(NFR_BREACH) && nfrChanged) {
          stale = true;
        }
        if (invalidatedBy.includes(EXTERNAL_DEPENDENCY_CHANGE) && externalDependencyChanged) {
          stale = true;
        }
        if (invalidatedBy.includes(OWNER_BOUNDARY_CHANGE) && ownershipChanged) {
          stale = true;
        }
        if (invalidatedBy.includes(RELEASE_PATH_CHANGE) && releasePathChanged) {
          stale = true;
        }
        if (
          invalidatedBy.includes(TRACK_GATE_CHANGE) &&
          (trackGateIdsByTrack.get(trackProof.track_id) ?? []).some((trackGateId) =>
            changedTrackGateIds.includes(trackGateId),
          )
        ) {
          stale = true;
        }
      }
    } else if (!stale && proof.covered_ref?.kind === 'run') {
      stale = invalidatedBy.some((cause) => dirtyFlags.includes(cause));
    }

    if (!stale && proofInvalidatedByRebaseline(manifest, proof.executed_at, invalidatedBy)) {
      stale = true;
    }

    if (stale) {
      staleProofs.add(proof.proof_id);
    }
  }

  const staleItems = new Set<string>();
  for (const item of backlog.items) {
    if (!isNonEmptyString(item.item_id)) {
      continue;
    }
    const hasStaleClaims = collectItemClaimRefs(item).some((claimRef) => staleClaims.has(claimRef));
    const hasStaleProofs = asArray(item.proof_refs).some((proofRef) => staleProofs.has(proofRef));
    const invalidatedByNewDrift =
      (incidentChanged && true) ||
      (securityChanged && itemTouchesSecurity(item)) ||
      (nfrChanged && itemTouchesNfr(item)) ||
      (externalDependencyChanged && itemTouchesExternalDependencies(item)) ||
      (ownershipChanged && itemTouchesOwnership(item)) ||
      (releasePathChanged && itemTouchesReleasePaths(item));
    if (hasStaleClaims || hasStaleProofs || invalidatedByNewDrift) {
      staleItems.add(item.item_id);
    }
  }

  const trackGateIdsToRecalculate = new Set<string>(changedTrackGateIds);
  for (const trackGate of backlog.track_gates) {
    if (
      isNonEmptyString(trackGate.track_gate_id) &&
      asArray(trackGate.required_proof_refs).some((proofRef) => staleProofs.has(proofRef))
    ) {
      trackGateIdsToRecalculate.add(trackGate.track_gate_id);
    }
  }

  return {
    baselineCanonicalHashes,
    baselineEstablished,
    baselineSourceHashes,
    currentCanonicalHashes,
    currentSourceHashes,
    deltaSummary: {
      baseline_established: baselineEstablished,
      changed_source_ids: changedSourceIds,
      changed_claim_ids: changedClaimIds,
      stale_claim_ids: [...staleClaims].sort(),
      stale_item_ids: [...staleItems].sort(),
      stale_proof_ids: [...staleProofs].sort(),
      track_gate_ids_to_recalculate: [...trackGateIdsToRecalculate].sort(),
      dirty_flags: dirtyFlags,
      topology_changed: topologyChanged,
      contract_changed: contractChanged,
      changed_track_gate_ids: changedTrackGateIds,
    },
    rebaselineRequired: dirtyFlags.length > 0,
    staleClaims: [...staleClaims].sort(),
    staleItems: [...staleItems].sort(),
    staleProofs: [...staleProofs].sort(),
  };
}
