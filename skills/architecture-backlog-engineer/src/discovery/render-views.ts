import {
  appendNdjson,
  asArray,
  asStringRecord,
  formatGraphRef,
  formatOriginRef,
  isGraphRef,
  isNonEmptyString,
  loadCompactRunArtifacts,
  runPaths,
  utcNow,
  writeJson,
  writeText,
  type AssessmentFile,
  type BacklogFile,
  type DiscoveryItem,
  type Manifest,
  type ProofDimensionKey,
} from './common.js';
import {
  buildNewStaleSnapshot,
  buildStaleSnapshot,
  readLatestMutatingNewStaleSnapshot,
  readPreviousMutatingStaleSnapshot,
  type NewStaleSnapshot,
  type RenderReason,
} from './command-lineage.js';
import { getSummaryMetricLines } from './status-run.js';

export interface RenderDiscoveryViewsResult {
  renderedAt: string;
  reportPath: string;
  runDir: string;
}

export interface RenderDiscoveryViewsOptions {
  commandRunId?: string;
  renderReason?: RenderReason;
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value).replace(/\|/g, '\\|');
  }

  return (JSON.stringify(value) ?? '').replace(/\|/g, '\\|');
}

function itemSort(left: DiscoveryItem, right: DiscoveryItem): number {
  return String(left.item_id ?? '').localeCompare(String(right.item_id ?? ''));
}

function sortUniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(isNonEmptyString))].sort();
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(', ') : 'None';
}

function itemSummaryAnchor(itemId: string): string {
  return `item-summary-${itemId}`;
}

function itemDetailAnchor(itemId: string): string {
  return `item-detail-${itemId}`;
}

function stringValues(values: unknown[]): string[] {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function getRecordStringArray(record: Record<string, unknown>, key: string): string[] {
  return Array.isArray(record[key]) ? stringValues(record[key]) : [];
}

function targetSystemIsPopulated(backlog: BacklogFile): boolean {
  return (
    backlog.target_system.actors.length > 0 &&
    backlog.target_system.operator_personas.length > 0 &&
    backlog.target_system.external_consumer_groups.length > 0 &&
    backlog.target_system.external_dependencies.length > 0 &&
    backlog.target_system.trust_boundaries.length > 0 &&
    backlog.target_system.durable_state_families.length > 0 &&
    backlog.target_system.control_surfaces.length > 0 &&
    backlog.target_system.failure_domains.length > 0 &&
    backlog.target_system.team_and_ownership_assumptions.length > 0 &&
    backlog.target_system.quality_goals.length > 0 &&
    backlog.target_system.policy_surfaces.length > 0
  );
}

function asBuiltIsPopulated(backlog: BacklogFile): boolean {
  return (
    backlog.as_built.deployable_surfaces.length > 0 &&
    backlog.as_built.services.length > 0 &&
    backlog.as_built.processes.length > 0 &&
    backlog.as_built.jobs.length > 0 &&
    backlog.as_built.apis.length > 0 &&
    backlog.as_built.event_surfaces.length > 0 &&
    backlog.as_built.queues.length > 0 &&
    backlog.as_built.state_stores.length > 0 &&
    backlog.as_built.deployable_units.length > 0 &&
    backlog.as_built.ownership_matrix.length > 0 &&
    backlog.as_built.environment_matrix.length > 0 &&
    backlog.as_built.ingress_interfaces.length > 0 &&
    backlog.as_built.egress_interfaces.length > 0 &&
    backlog.as_built.canonical_writers.length > 0 &&
    backlog.as_built.trust_boundary_crossings.length > 0 &&
    backlog.as_built.data_classes.length > 0 &&
    backlog.as_built.dependency_classifications.length > 0 &&
    backlog.as_built.vendor_external_owners.length > 0
  );
}

function renderRunSummary(manifest: Manifest, assessment: AssessmentFile): string[] {
  return [
    '## Run Summary',
    '',
    `- Run ID: ${manifest.run_id}`,
    `- Phase state: ${manifest.phase_state}`,
    `- Acceptance target: ${manifest.acceptance_target}`,
    `- Achieved acceptance: ${assessment.acceptance.achieved}`,
    `- Target satisfied: ${assessment.acceptance.target_satisfied ? 'Yes' : 'No'}`,
    `- Assessment status: ${assessment.status}`,
    `- Closure status: ${assessment.closure.status}`,
    `- Score: ${assessment.score.total}/${assessment.score.max}`,
    `- Last assessed at: ${assessment.assessed_at}`,
    '',
    '### Summary Metrics',
    '',
    ...getSummaryMetricLines(assessment).map((line) => `- ${line}`),
    '',
  ];
}

function renderSourceAuthority(backlog: BacklogFile): string[] {
  const lines = [
    '## Source Authority',
    '',
    '| Source ID | Kind | Authority | Precedence | Reference | Fingerprint | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const source of backlog.source_authority) {
    lines.push(
      `| ${escapeCell(source.source_id)} | ${escapeCell(source.kind)} | ${escapeCell(source.authority)} | ${escapeCell(source.precedence ?? '')} | ${escapeCell(source.ref)} | ${escapeCell(source.fingerprint ?? '')} | ${escapeCell(source.notes ?? '')} |`,
    );
  }

  if (backlog.source_authority.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderSourceExclusions(backlog: BacklogFile): string[] {
  const lines = [
    '## Source Exclusions',
    '',
    '| Source ID | Reason | Superseded By |',
    '| --- | --- | --- |',
  ];

  for (const exclusion of backlog.source_exclusions) {
    lines.push(
      `| ${escapeCell(exclusion.source_id)} | ${escapeCell(exclusion.reason)} | ${escapeCell(asArray(exclusion.superseded_by).join(', '))} |`,
    );
  }

  if (backlog.source_exclusions.length === 0) {
    lines.push('| _none_ |  |  |');
  }

  return [...lines, ''];
}

function renderKeyedListSection(title: string, entries: Array<[string, string[]]>): string[] {
  const lines = [title, '', '| Field | Values |', '| --- | --- |'];

  for (const [label, values] of entries) {
    lines.push(`| ${escapeCell(label)} | ${escapeCell(values.join('; '))} |`);
  }

  return [...lines, ''];
}

function renderTargetSystem(backlog: BacklogFile): string[] {
  return renderKeyedListSection('## Target System', [
    ['Actors', backlog.target_system.actors],
    ['Operator personas', backlog.target_system.operator_personas],
    ['External consumer groups', backlog.target_system.external_consumer_groups],
    ['External dependencies', backlog.target_system.external_dependencies],
    ['Trust boundaries', backlog.target_system.trust_boundaries],
    ['Durable state families', backlog.target_system.durable_state_families],
    ['Control surfaces', backlog.target_system.control_surfaces],
    ['Failure domains', backlog.target_system.failure_domains],
    ['Ownership assumptions', backlog.target_system.team_and_ownership_assumptions],
    ['Quality goals', backlog.target_system.quality_goals],
    ['Policy surfaces', backlog.target_system.policy_surfaces],
  ]);
}

function renderAsBuilt(backlog: BacklogFile): string[] {
  const lines = renderKeyedListSection('## As-Built', [
    ['Deployable surfaces', backlog.as_built.deployable_surfaces],
    ['Services', backlog.as_built.services],
    ['Processes', backlog.as_built.processes],
    ['Jobs', backlog.as_built.jobs],
    ['APIs', backlog.as_built.apis],
    ['Event surfaces', backlog.as_built.event_surfaces],
    ['Queues', backlog.as_built.queues],
    ['State stores', backlog.as_built.state_stores],
    ['Deployable units', backlog.as_built.deployable_units],
    ['Ownership matrix', backlog.as_built.ownership_matrix],
    ['Environment matrix', backlog.as_built.environment_matrix],
    ['Ingress interfaces', backlog.as_built.ingress_interfaces],
    ['Egress interfaces', backlog.as_built.egress_interfaces],
    ['Canonical writers', backlog.as_built.canonical_writers],
    ['Trust-boundary crossings', backlog.as_built.trust_boundary_crossings],
    ['Data classes', backlog.as_built.data_classes],
    ['Synthetic behaviors', backlog.as_built.synthetic_behaviors],
    ['Compatibility-only behaviors', backlog.as_built.compatibility_only_behaviors],
    ['Vendor / external owners', backlog.as_built.vendor_external_owners],
    ['Missing operational inputs', backlog.as_built.missing_operational_inputs],
  ]);

  lines.splice(
    lines.length - 1,
    0,
    '### Dependency Classifications',
    '',
    '| Dependency | Criticality | Owner |',
    '| --- | --- | --- |',
  );
  for (const dependency of backlog.as_built.dependency_classifications) {
    lines.splice(
      lines.length - 1,
      0,
      `| ${escapeCell(dependency.dependency_id ?? '')} | ${escapeCell(dependency.criticality ?? '')} | ${escapeCell(dependency.owner ?? '')} |`,
    );
  }
  if (backlog.as_built.dependency_classifications.length === 0) {
    lines.splice(lines.length - 1, 0, '| _none_ |  |  |');
  }

  return lines;
}

function renderValueStreams(backlog: BacklogFile): string[] {
  const lines = [
    '## Value Streams',
    '',
    '| Value Stream | Personas | Linked Tracks | Success Conditions |',
    '| --- | --- | --- | --- |',
  ];

  for (const valueStream of backlog.value_streams) {
    lines.push(
      `| ${escapeCell(valueStream.title ?? valueStream.value_stream_id ?? '')} | ${escapeCell(asArray(valueStream.primary_personas).join(', '))} | ${escapeCell(asArray(valueStream.linked_track_ids).join(', '))} | ${escapeCell(asArray(valueStream.success_conditions).join('; '))} |`,
    );
  }

  if (backlog.value_streams.length === 0) {
    lines.push('| _none_ |  |  |  |');
  }

  return [...lines, ''];
}

function renderFeatureCandidates(backlog: BacklogFile): string[] {
  const items = [...backlog.items].sort(itemSort);
  const lines = [
    '## Feature Candidates',
    '',
    '| Item ID | Class | Status | Track | Title | Owners | Proofs | Origins |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const item of items) {
    const owners = item.owners
      ? [item.owners.decision_owner, item.owners.delivery_owner].filter(Boolean).join(', ')
      : '';
    lines.push(
      `| ${escapeCell(item.item_id)} | ${escapeCell(item.item_class)} | ${escapeCell(item.summary_label)} | ${escapeCell(item.track_id)} | ${escapeCell(item.title ?? item.capability_added ?? '')} | ${escapeCell(owners)} | ${escapeCell(asArray(item.proof_refs).join(', '))} | ${escapeCell(asArray(item.origin_ref).map(formatOriginRef).join(', '))} |`,
    );
  }

  if (items.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderExtendedItemSchema(backlog: BacklogFile): string[] {
  const items = [...backlog.items].sort(itemSort);
  const lines = [
    '## Extended Item Schema',
    '',
    '| Item ID | ADRs | Policy Decisions | Actors / Roles | Value | Freshness SLA | Flags / Kill Switches |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const item of items) {
    const valueRecord = asStringRecord(item.value);
    const rolloutRecord = asStringRecord(item.rollout);
    const valueSummary = [
      valueRecord.persona_or_operator_served,
      valueRecord.product_or_operator_value,
      valueRecord.why_now,
    ]
      .filter(isNonEmptyString)
      .join(' / ');
    const flagSummary = [rolloutRecord.feature_flag, rolloutRecord.kill_switch]
      .filter(isNonEmptyString)
      .join(', ');
    lines.push(
      `| ${escapeCell(item.item_id)} | ${escapeCell(asArray(item.adr_refs).join(', '))} | ${escapeCell(asArray(item.policy_decision_refs).join(', '))} | ${escapeCell(asArray(item.actor_role_set).join(', '))} | ${escapeCell(valueSummary)} | ${escapeCell(item.evidence_freshness_sla ?? '')} | ${escapeCell(flagSummary)} |`,
    );
  }

  if (items.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function getItemMap(backlog: BacklogFile): Map<string, DiscoveryItem> {
  return new Map(
    backlog.items
      .filter(
        (item): item is DiscoveryItem & { item_id: string } => typeof item.item_id === 'string',
      )
      .map((item) => [item.item_id, item]),
  );
}

function buildReviewMap(backlog: BacklogFile): Map<string, BacklogFile['reviews'][number]> {
  return new Map(
    backlog.reviews
      .filter((review): review is BacklogFile['reviews'][number] & { review_id: string } =>
        isNonEmptyString(review.review_id),
      )
      .map((review) => [review.review_id, review]),
  );
}

function buildContractMap(backlog: BacklogFile): Map<string, BacklogFile['contracts'][number]> {
  return new Map(
    backlog.contracts
      .filter((contract): contract is BacklogFile['contracts'][number] & { contract_id: string } =>
        isNonEmptyString(contract.contract_id),
      )
      .map((contract) => [contract.contract_id, contract]),
  );
}

function buildDataDomainMap(
  backlog: BacklogFile,
): Map<string, BacklogFile['data_domains'][number]> {
  return new Map(
    backlog.data_domains
      .filter((domain): domain is BacklogFile['data_domains'][number] & { domain_id: string } =>
        isNonEmptyString(domain.domain_id),
      )
      .map((domain) => [domain.domain_id, domain]),
  );
}

function collectRelationTargets(
  backlog: BacklogFile,
  fromKind: string,
  fromId: string,
  relationType: string,
  toKind?: string,
): string[] {
  return sortUniqueStrings(
    backlog.relations
      .filter(
        (relation) =>
          relation.relation_type === relationType &&
          relation.from?.kind === fromKind &&
          relation.from?.id === fromId &&
          (!toKind || relation.to?.kind === toKind) &&
          isNonEmptyString(relation.to?.id),
      )
      .map((relation) => relation.to?.id ?? ''),
  );
}

function collectRelatedIssueIds(
  entries: Array<{ issue_id?: string; related_item_refs?: string[] }>,
  itemId: string,
): string[] {
  return sortUniqueStrings(
    entries
      .filter((entry) => asArray(entry.related_item_refs).includes(itemId))
      .map((entry) => entry.issue_id ?? ''),
  );
}

function collectRelatedSpikeIds(backlog: BacklogFile, unknownIds: string[]): string[] {
  const unknownIdSet = new Set(unknownIds);
  return sortUniqueStrings(
    backlog.uncertainty_to_spike
      .filter(
        (entry) =>
          unknownIdSet.has(entry.unknown_id ?? '') && isNonEmptyString(entry.spike_item_id),
      )
      .map((entry) => entry.spike_item_id ?? ''),
  );
}

function formatOwners(item: DiscoveryItem): string {
  const owners = asStringRecord(item.owners);
  const parts = [
    ['decision_owner', owners.decision_owner],
    ['delivery_owner', owners.delivery_owner],
    ['runtime_owner', owners.runtime_owner],
    ['escalation_owner', owners.escalation_owner],
  ]
    .filter(([, value]) => isNonEmptyString(value))
    .map(([key, value]) => `${String(key)}=${String(value)}`);

  const consultedTeams = Array.isArray(owners.consulted_teams)
    ? sortUniqueStrings(stringValues(owners.consulted_teams))
    : [];
  if (consultedTeams.length > 0) {
    parts.push(`consulted_teams=${consultedTeams.join(', ')}`);
  }

  return parts.length > 0 ? parts.join('; ') : 'None';
}

function collectItemProblems(
  backlog: BacklogFile,
  assessment: AssessmentFile,
  item: DiscoveryItem,
  reviewIds: string[],
): string[] {
  const itemId = item.item_id ?? '';
  const problems: string[] = [];
  const staleProofIds = sortUniqueStrings(
    asArray(item.proof_refs).filter((proofRef) => assessment.stale_proofs.includes(proofRef)),
  );
  const staleReviewIds = sortUniqueStrings(
    reviewIds.filter((reviewId) => assessment.stale_review_artifacts.includes(reviewId)),
  );
  const relatedGaps = collectRelatedIssueIds(backlog.gaps, itemId);
  const relatedUnknowns = collectRelatedIssueIds(backlog.unknowns, itemId);
  const relatedContradictions = collectRelatedIssueIds(backlog.contradictions, itemId);

  if (assessment.stale_items.includes(itemId)) {
    problems.push('stale item');
  }
  if (staleProofIds.length > 0) {
    problems.push(`stale proofs: ${staleProofIds.join(', ')}`);
  }
  if (staleReviewIds.length > 0) {
    problems.push(`stale reviews: ${staleReviewIds.join(', ')}`);
  }
  if (relatedGaps.length > 0) {
    problems.push(`gaps: ${relatedGaps.join(', ')}`);
  }
  if (relatedUnknowns.length > 0) {
    problems.push(`unknowns: ${relatedUnknowns.join(', ')}`);
  }
  if (relatedContradictions.length > 0) {
    problems.push(`contradictions: ${relatedContradictions.join(', ')}`);
  }

  return problems;
}

function renderItemSummaryIndex(backlog: BacklogFile, assessment: AssessmentFile): string[] {
  const lines = ['## Item Summary Index', ''];
  const items = [...backlog.items].sort(itemSort);

  if (items.length === 0) {
    return [...lines, '- None', ''];
  }

  for (const item of items) {
    const itemId = item.item_id ?? 'unknown-item';
    const reviewIds = collectRelationTargets(backlog, 'item', itemId, 'reviewed_by', 'review');
    const dependsOnIds = collectRelationTargets(backlog, 'item', itemId, 'depends_on', 'item');
    const problems = collectItemProblems(backlog, assessment, item, reviewIds);

    lines.push(`<a id="${itemSummaryAnchor(itemId)}"></a>`);
    lines.push(`### ${itemId}`);
    lines.push(`- Jump to detail: [${itemId}](#${itemDetailAnchor(itemId)})`);
    lines.push(`- item_id: ${itemId}`);
    lines.push(`- title: ${item.title ?? 'None'}`);
    lines.push(`- item_class: ${item.item_class ?? 'None'}`);
    lines.push(`- summary_label: ${item.summary_label ?? 'None'}`);
    lines.push(`- delivery_state: ${item.delivery_state ?? 'None'}`);
    lines.push(`- track_id: ${item.track_id ?? 'None'}`);
    lines.push(`- owners: ${formatOwners(item)}`);
    lines.push(`- depends_on: ${formatList(dependsOnIds)}`);
    lines.push(`- major_problems: ${formatList(problems)}`);
    lines.push('');
  }

  return lines;
}

function renderItemDetailSections(backlog: BacklogFile, assessment: AssessmentFile): string[] {
  const lines = ['## Item Detail Sections', ''];
  const items = [...backlog.items].sort(itemSort);
  const reviewById = buildReviewMap(backlog);
  const contractById = buildContractMap(backlog);
  const dataDomainById = buildDataDomainMap(backlog);

  if (items.length === 0) {
    return [...lines, '- None', ''];
  }

  for (const item of items) {
    const itemId = item.item_id ?? 'unknown-item';
    const reviewIds = collectRelationTargets(backlog, 'item', itemId, 'reviewed_by', 'review');
    const contractIds = collectRelationTargets(
      backlog,
      'item',
      itemId,
      'touches_contract',
      'contract',
    );
    const dataDomainIds = collectRelationTargets(
      backlog,
      'item',
      itemId,
      'touches_data_domain',
      'data_domain',
    );
    const dependsOnIds = collectRelationTargets(backlog, 'item', itemId, 'depends_on', 'item');
    const relatedGaps = collectRelatedIssueIds(backlog.gaps, itemId);
    const relatedUnknowns = collectRelatedIssueIds(backlog.unknowns, itemId);
    const relatedContradictions = collectRelatedIssueIds(backlog.contradictions, itemId);
    const relatedSpikes = collectRelatedSpikeIds(backlog, relatedUnknowns);
    const problems = collectItemProblems(backlog, assessment, item, reviewIds);
    const reviewSummaries = reviewIds.map((reviewId) => {
      const review = reviewById.get(reviewId);
      return review
        ? `${reviewId} (role=${review.role ?? 'unknown'}, verdict=${review.verdict ?? 'unknown'})`
        : reviewId;
    });
    const contractSummaries = contractIds.map((contractId) => {
      const contract = contractById.get(contractId);
      return contract
        ? `${contractId} (owner=${contract.owner ?? 'unknown'}, versioning=${contract.versioning_strategy ?? 'unknown'})`
        : contractId;
    });
    const dataDomainSummaries = dataDomainIds.map((domainId) => {
      const domain = dataDomainById.get(domainId);
      return domain
        ? `${domainId} (data_class=${domain.data_class ?? 'unknown'}, owners=${asArray(domain.owners).join(', ') || 'None'})`
        : domainId;
    });

    lines.push(`<a id="${itemDetailAnchor(itemId)}"></a>`);
    lines.push(`### ${itemId}`);
    lines.push(`- Jump to summary: [${itemId}](#${itemSummaryAnchor(itemId)})`);
    lines.push(`- item_id: ${itemId}`);
    lines.push(`- title: ${item.title ?? 'None'}`);
    lines.push(`- item_class: ${item.item_class ?? 'None'}`);
    lines.push(`- summary_label: ${item.summary_label ?? 'None'}`);
    lines.push(`- delivery_state: ${item.delivery_state ?? 'None'}`);
    lines.push(`- track_id: ${item.track_id ?? 'None'}`);
    lines.push(`- owners: ${formatOwners(item)}`);
    lines.push(`- depends_on: ${formatList(dependsOnIds)}`);
    lines.push(`- major_problems: ${formatList(problems)}`);
    lines.push(`- origin_ref: ${formatList(asArray(item.origin_ref).map(formatOriginRef))}`);
    lines.push(`- claim_refs: ${formatList(sortUniqueStrings(asArray(item.claim_refs)))}`);
    lines.push(`- proof_refs: ${formatList(sortUniqueStrings(asArray(item.proof_refs)))}`);
    lines.push(`- review_refs: ${formatList(reviewSummaries)}`);
    lines.push(`- touches_contracts: ${formatList(contractSummaries)}`);
    lines.push(`- touches_data_domains: ${formatList(dataDomainSummaries)}`);
    lines.push(`- related_gaps: ${formatList(relatedGaps)}`);
    lines.push(`- related_unknowns: ${formatList(relatedUnknowns)}`);
    lines.push(`- related_contradictions: ${formatList(relatedContradictions)}`);
    lines.push(`- related_spikes: ${formatList(relatedSpikes)}`);
    lines.push('');
    lines.push('#### Readiness Contract');
    lines.push(
      `- baseline_checks: ${formatBooleanLedger(asStringRecord(item.readiness_contract), [
        'behavior_described',
        'happy_path_defined',
        'error_paths_defined',
        'acceptance_examples_defined',
        'interface_data_impact_described',
        'nfr_impact_known',
        'security_privacy_impact_known',
        'rollout_defined',
        'recovery_defined',
        'observability_contract_defined',
        'required_proof_defined',
        'docs_support_impact_described',
        'estimate_band_defined',
        'confidence_defined',
        'unresolved_questions_below_threshold',
      ])}`,
    );
    lines.push(
      `- class_specific_checks: ${
        formatKeyValueLedger(
          asStringRecord(asStringRecord(item.readiness_contract).class_specific_checks),
        ) || 'None'
      }`,
    );
    lines.push('');
    lines.push('#### Done Contract');
    lines.push(
      `- baseline_checks: ${formatKeyValueLedger(asStringRecord(item.done_contract)) || 'None'}`,
    );
    lines.push(
      `- class_specific_checks: ${
        formatKeyValueLedger(
          asStringRecord(asStringRecord(item.done_contract).class_specific_checks),
        ) || 'None'
      }`,
    );
    lines.push('');
    lines.push('#### Rollout And Recovery');
    lines.push(`- rollout: ${formatKeyValueLedger(asStringRecord(item.rollout)) || 'None'}`);
    lines.push(`- recovery: ${formatKeyValueLedger(asStringRecord(item.recovery)) || 'None'}`);
    lines.push('');
  }

  return lines;
}

function orderRoadmapRows(backlog: BacklogFile): BacklogFile['roadmap_matrix'] {
  return [...backlog.roadmap_matrix].sort((left, right) => {
    const topologyDelta =
      (left.topology_rank ?? Number.MAX_SAFE_INTEGER) -
      (right.topology_rank ?? Number.MAX_SAFE_INTEGER);
    if (topologyDelta !== 0) {
      return topologyDelta;
    }
    const safetyDelta =
      (left.safety_rank ?? Number.MAX_SAFE_INTEGER) -
      (right.safety_rank ?? Number.MAX_SAFE_INTEGER);
    if (safetyDelta !== 0) {
      return safetyDelta;
    }
    const economicDelta =
      (left.economic_rank ?? Number.MAX_SAFE_INTEGER) -
      (right.economic_rank ?? Number.MAX_SAFE_INTEGER);
    if (economicDelta !== 0) {
      return economicDelta;
    }
    return formatGraphRef(left.item_ref).localeCompare(formatGraphRef(right.item_ref));
  });
}

function renderRoadmap(backlog: BacklogFile): string[] {
  const itemMap = getItemMap(backlog);
  const ordered = orderRoadmapRows(backlog);
  const lines = [
    '## Roadmap',
    '',
    '| Topology | Safety | Economic | Item | Class | Track | States | Parents | Dependencies | Proofs | Retirement | Economics |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const row of ordered) {
    const itemId = row.item_ref?.id ?? '';
    const item = itemMap.get(itemId);
    const itemLabel = item ? (item.title ?? item.item_id ?? '') : itemId;
    const states = [
      row.backlog_protocol_state,
      row.delivery_state,
      row.readiness_state,
      row.closure_state,
      row.summary_label,
    ]
      .filter(isNonEmptyString)
      .join(' / ');
    const dependencyEntries = asArray(row.dependency_entries)
      .map((entry) => {
        const dependency = asStringRecord(entry);
        const dependencyRef = isGraphRef(dependency.ref) ? dependency.ref : undefined;
        const dependencyType = isNonEmptyString(dependency.dependency_type)
          ? dependency.dependency_type
          : '';
        return `${formatGraphRef(dependencyRef)} (${dependencyType})`;
      })
      .join('; ');
    lines.push(
      `| ${escapeCell(row.topology_rank ?? '')} | ${escapeCell(row.safety_rank ?? '')} | ${escapeCell(row.economic_rank ?? '')} | ${escapeCell(itemLabel)} | ${escapeCell(row.item_class ?? '')} | ${escapeCell(row.track_ref?.id ?? '')} | ${escapeCell(states)} | ${escapeCell(asArray(row.parent_refs).map(formatGraphRef).join(', '))} | ${escapeCell(dependencyEntries)} | ${escapeCell(asArray(row.proof_refs).join(', '))} | ${escapeCell(row.retirement_ref ? formatGraphRef(row.retirement_ref) : '')} | ${escapeCell((row.economic_factors ?? []).join(', '))}: ${escapeCell(row.economic_priority_note ?? '')} |`,
    );
  }

  if (ordered.length === 0) {
    lines.push('|  |  |  | _No roadmap rows yet_ |  |  |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderRoadmapMatrix(backlog: BacklogFile): string[] {
  const ordered = orderRoadmapRows(backlog);
  const lines = [
    '## Roadmap Matrix',
    '',
    '| Row | Item Ref | Track Ref | Dependency Entries | States | Proofs | Retirement |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const row of ordered) {
    const states = [
      row.backlog_protocol_state,
      row.delivery_state,
      row.readiness_state,
      row.closure_state,
      row.summary_label,
    ]
      .filter(isNonEmptyString)
      .join(' / ');
    const dependencyEntries = asArray(row.dependency_entries)
      .map((entry) => {
        const record = asStringRecord(entry);
        const dependencyRef = isGraphRef(record.ref) ? record.ref : undefined;
        const dependencyTypeValue = record.dependency_type;
        const dependencyType = isNonEmptyString(dependencyTypeValue) ? dependencyTypeValue : '';
        return `${dependencyType}:${formatGraphRef(dependencyRef)}`;
      })
      .join('; ');
    lines.push(
      `| ${escapeCell(row.row_id ?? '')} | ${escapeCell(formatGraphRef(row.item_ref))} | ${escapeCell(formatGraphRef(row.track_ref))} | ${escapeCell(dependencyEntries)} | ${escapeCell(states)} | ${escapeCell(asArray(row.proof_refs).join(', '))} | ${escapeCell(row.retirement_ref ? formatGraphRef(row.retirement_ref) : '')} |`,
    );
  }

  if (ordered.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderProofBundles(backlog: BacklogFile, assessment: AssessmentFile): string[] {
  const staleProofIds = new Set(assessment.stale_proofs);
  const lines = [
    '## Proof Bundles',
    '',
    '| Proof | Covers | Environment | Build | Fresh Until | Invalidated By | Status |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const proof of backlog.proofs) {
    lines.push(
      `| ${escapeCell(proof.proof_id ?? '')} | ${escapeCell(formatGraphRef(proof.covered_ref))} | ${escapeCell(proof.environment ?? '')} | ${escapeCell(proof.covered_commit_or_build ?? '')} | ${escapeCell(proof.fresh_until ?? '')} | ${escapeCell(asArray(proof.invalidated_by).join(', '))} | ${escapeCell(staleProofIds.has(proof.proof_id ?? '') ? 'stale' : 'fresh_or_current')} |`,
    );
  }

  if (backlog.proofs.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function formatProofDimension(
  proof: BacklogFile['proofs'][number],
  dimensionKey: ProofDimensionKey,
): string {
  const dimension = asStringRecord(asStringRecord(proof.dimensions)[dimensionKey]);
  const status = isNonEmptyString(dimension.status) ? dimension.status : 'missing';
  const locator =
    [dimension.command, dimension.artifact, dimension.procedure].find(isNonEmptyString) ?? '';
  const justification = isNonEmptyString(dimension.justification) ? dimension.justification : '';
  const detail = locator || justification;
  return detail ? `${status}: ${detail}` : status;
}

function renderProofDimensions(backlog: BacklogFile, assessment: AssessmentFile): string[] {
  const staleProofIds = new Set(assessment.stale_proofs);
  const lines = [
    '## Proof Dimensions',
    '',
    '| Proof | Status | Architecture | Implementation | Verification | Security | Release | Rollback / Recovery | Operability |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const proof of backlog.proofs) {
    lines.push(
      `| ${escapeCell(proof.proof_id ?? '')} | ${escapeCell(staleProofIds.has(proof.proof_id ?? '') ? 'stale' : 'fresh_or_current')} | ${escapeCell(formatProofDimension(proof, 'architecture_trace'))} | ${escapeCell(formatProofDimension(proof, 'implementation_trace'))} | ${escapeCell(formatProofDimension(proof, 'verification_trace'))} | ${escapeCell(formatProofDimension(proof, 'security_trace'))} | ${escapeCell(formatProofDimension(proof, 'release_trace'))} | ${escapeCell(formatProofDimension(proof, 'rollback_or_recovery_trace'))} | ${escapeCell(formatProofDimension(proof, 'operability_trace'))} |`,
    );
  }

  if (backlog.proofs.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function formatBooleanLedger(record: Record<string, unknown>, keys: string[]): string {
  return keys.map((key) => `${key}=${record[key] === true ? 'yes' : 'no'}`).join('; ');
}

function formatKeyValueLedger(record: Record<string, unknown>): string {
  return Object.entries(record)
    .map(
      ([key, value]) => `${key}=${value === true ? 'yes' : value === false ? 'no' : String(value)}`,
    )
    .join('; ');
}

function renderClosureEvidence(backlog: BacklogFile, assessment: AssessmentFile): string[] {
  const closedItems = backlog.items.filter((item) => item.closure_state === 'closed');
  const staleProofIds = new Set(assessment.stale_proofs);
  const baselineDoneKeys = [
    'code_and_infra_complete',
    'tests_and_verification_complete',
    'dashboards_alerts_traces_logging_present',
    'runbooks_and_support_handoff_present',
    'migration_execution_or_safe_schedule_complete',
    'release_notes_and_docs_updated',
    'flags_and_kill_switches_governed',
    'temporary_mechanism_retirement_recorded',
  ];
  const lines = [
    '## Closure Evidence',
    '',
    '| Item | Class | Baseline Done Checks | Class-Specific Done Checks | Proof Evidence | Exemptions |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  for (const item of closedItems) {
    const done = asStringRecord(item.done_contract);
    const classSpecificChecks = formatKeyValueLedger(asStringRecord(done.class_specific_checks));
    const exemptions = formatKeyValueLedger(asStringRecord(done.exemptions));
    const proofEvidence = asArray(item.proof_refs)
      .map(
        (proofRef) => `${proofRef}:${staleProofIds.has(proofRef) ? 'stale' : 'fresh_or_current'}`,
      )
      .join('; ');
    lines.push(
      `| ${escapeCell(item.item_id ?? '')} | ${escapeCell(item.item_class ?? '')} | ${escapeCell(formatBooleanLedger(done, baselineDoneKeys))} | ${escapeCell(classSpecificChecks || 'none')} | ${escapeCell(proofEvidence || 'none')} | ${escapeCell(exemptions || 'none')} |`,
    );
  }

  if (closedItems.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderGapsAndValidation(assessment: AssessmentFile): string[] {
  const lines = ['## Gaps And Validation', '', '### Hard Fails', ''];

  if (assessment.hard_fails.length === 0) {
    lines.push('- None');
  } else {
    for (const issue of assessment.hard_fails) {
      lines.push(`- ${issue}`);
    }
  }

  lines.push('', '### Errors', '');
  if (assessment.errors.length === 0) {
    lines.push('- None');
  } else {
    for (const error of assessment.errors) {
      lines.push(`- ${error}`);
    }
  }

  lines.push('', '### Warnings', '');
  if (assessment.warnings.length === 0) {
    lines.push('- None');
  } else {
    for (const warning of assessment.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push('', '### Lint Findings', '');
  if (assessment.lint_findings.length === 0) {
    lines.push('- None');
  } else {
    for (const finding of assessment.lint_findings) {
      lines.push(`- ${finding}`);
    }
  }

  lines.push('', '### Next Actions', '');
  if (assessment.next_actions.length === 0) {
    lines.push('- None');
  } else {
    for (const action of assessment.next_actions) {
      lines.push(`- ${action}`);
    }
  }

  return [...lines, ''];
}

function renderScoreSummary(assessment: AssessmentFile): string[] {
  const lines = [
    '## Score Summary',
    '',
    '| Section | Score | Max | Reason |',
    '| --- | --- | --- | --- |',
  ];

  for (const section of assessment.score.sections) {
    lines.push(
      `| ${escapeCell(section.label)} | ${section.score} | ${section.max} | ${escapeCell(section.reason)} |`,
    );
  }

  if (assessment.score.sections.length === 0) {
    lines.push('| _none_ | 0 | 0 | Assessment has not been scored yet. |');
  }

  lines.push('', `Total score: **${assessment.score.total}/${assessment.score.max}**`, '');
  return lines;
}

function renderReviewAndClosure(assessment: AssessmentFile): string[] {
  return [
    '## Review And Closure',
    '',
    `- Required review roles: ${assessment.required_review_roles.join(', ') || 'None'}`,
    `- Present review roles: ${assessment.present_review_roles.join(', ') || 'None'}`,
    `- Achieved acceptance: ${assessment.acceptance.achieved}`,
    `- Closure reason: ${assessment.closure.reason}`,
    '',
    '### Blocking Reasons',
    '',
    ...(assessment.acceptance.blocking_reasons.length === 0
      ? ['- None']
      : assessment.acceptance.blocking_reasons.map((reason) => `- ${reason}`)),
    '',
  ];
}

function renderBackdrop(backlog: BacklogFile): string[] {
  const lines = ['## Context Coverage', ''];
  lines.push(`- Target-system model populated: ${targetSystemIsPopulated(backlog) ? 'Yes' : 'No'}`);
  lines.push(`- As-built model populated: ${asBuiltIsPopulated(backlog) ? 'Yes' : 'No'}`);
  lines.push(`- Value streams recorded: ${backlog.value_streams.length}`);
  lines.push(`- Track journeys recorded: ${backlog.track_journeys.length}`);
  lines.push(`- Track gates recorded: ${backlog.track_gates.length}`);
  lines.push(`- Claims recorded: ${backlog.claims.length}`);
  lines.push(`- Contracts recorded: ${backlog.contracts.length}`);
  lines.push(`- Data domains recorded: ${backlog.data_domains.length}`);
  lines.push(`- Proof bundles recorded: ${backlog.proofs.length}`);
  lines.push(`- Track proofs recorded: ${backlog.track_proofs.length}`);
  lines.push(`- Review artifacts recorded: ${backlog.reviews.length}`);
  lines.push(`- Waivers recorded: ${backlog.waivers.length}`);
  lines.push(`- Roadmap matrix entries: ${backlog.roadmap_matrix.length}`);
  lines.push('');
  return lines;
}

function renderTrackClosure(backlog: BacklogFile): string[] {
  const lines = [
    '## Track Closure',
    '',
    '| Track | First Shippable Journeys | Required Gates | Track Proofs |',
    '| --- | --- | --- | --- |',
  ];

  for (const track of backlog.tracks) {
    lines.push(
      `| ${escapeCell(track.title ?? track.track_id)} | ${escapeCell(asArray(track.first_shippable_journey_ids).join(', '))} | ${escapeCell(asArray(track.required_track_gate_ids).join(', '))} | ${escapeCell(asArray(track.track_proof_refs).join(', '))} |`,
    );
  }

  if (backlog.tracks.length === 0) {
    lines.push('| _none_ |  |  |  |');
  }

  return [...lines, ''];
}

function renderTrackJourneys(backlog: BacklogFile): string[] {
  const lines = [
    '## Track Journeys',
    '',
    '| Journey | Track | Value Stream | Persona | Trigger | Success Condition | Support Handoff |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const journey of backlog.track_journeys) {
    lines.push(
      `| ${escapeCell(journey.journey_id ?? '')} | ${escapeCell(journey.track_id ?? '')} | ${escapeCell(journey.value_stream_id ?? '')} | ${escapeCell(journey.persona ?? '')} | ${escapeCell(journey.trigger ?? '')} | ${escapeCell(journey.success_condition ?? '')} | ${escapeCell(journey.support_handoff ?? '')} |`,
    );
  }

  if (backlog.track_journeys.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderTrackGates(backlog: BacklogFile): string[] {
  const lines = [
    '## Track Gates',
    '',
    '| Gate | Track | Type | Fail Mode | Governing Controls | Owners | Proofs | Recalculation Triggers |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const gate of backlog.track_gates) {
    lines.push(
      `| ${escapeCell(gate.title ?? gate.track_gate_id ?? '')} | ${escapeCell(gate.track_id ?? '')} | ${escapeCell(gate.gate_type ?? '')} | ${escapeCell(gate.fail_mode ?? '')} | ${escapeCell(asArray(gate.governing_control_item_refs).join(', '))} | ${escapeCell(asArray(gate.owner_refs).join(', '))} | ${escapeCell(asArray(gate.required_proof_refs).join(', '))} | ${escapeCell(asArray(gate.recalculation_triggers).join(', '))} |`,
    );
  }

  if (backlog.track_gates.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderTrackProofs(backlog: BacklogFile): string[] {
  const lines = [
    '## Track Proofs',
    '',
    '| Track Proof | Track | Proof Refs | Closure Coverage |',
    '| --- | --- | --- | --- |',
  ];

  for (const trackProof of backlog.track_proofs) {
    const coverage = Object.entries(trackProof.coverage ?? {})
      .map(([key, value]) => `${key}=${value === true ? 'yes' : 'no'}`)
      .join(', ');
    lines.push(
      `| ${escapeCell(trackProof.track_proof_id ?? '')} | ${escapeCell(trackProof.track_id ?? '')} | ${escapeCell(asArray(trackProof.proof_refs).join(', '))} | ${escapeCell(coverage)} |`,
    );
  }

  if (backlog.track_proofs.length === 0) {
    lines.push('| _none_ |  |  |  |');
  }

  return [...lines, ''];
}

function renderContractsAndDataDomains(backlog: BacklogFile): string[] {
  const lines = [
    '## Contract And Data Governance',
    '',
    '### Contracts',
    '',
    '| Contract | Owner | Versioning | Reconciliation | Deprecation Window | Retirement Condition |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  for (const contract of backlog.contracts) {
    lines.push(
      `| ${escapeCell(contract.contract_id ?? '')} | ${escapeCell(contract.owner ?? '')} | ${escapeCell(contract.versioning_strategy ?? '')} | ${escapeCell(contract.reconciliation_strategy ?? '')} | ${escapeCell(contract.deprecation_window ?? '')} | ${escapeCell(contract.retirement_condition ?? '')} |`,
    );
  }

  if (backlog.contracts.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |');
  }

  lines.push('', '### Data Domains', '', '| Domain | Data Class | Owners |', '| --- | --- | --- |');
  for (const domain of backlog.data_domains) {
    lines.push(
      `| ${escapeCell(domain.domain_id ?? '')} | ${escapeCell(domain.data_class ?? '')} | ${escapeCell(asArray(domain.owners).join(', '))} |`,
    );
  }
  if (backlog.data_domains.length === 0) {
    lines.push('| _none_ |  |  |');
  }

  return [...lines, ''];
}

function renderNfrAndObservability(backlog: BacklogFile): string[] {
  const lines = [
    '## NFR And Observability',
    '',
    '| Item | NFR Highlights | Observability Highlights |',
    '| --- | --- | --- |',
  ];

  for (const item of backlog.items) {
    const nfr = asStringRecord(item.nfr_contract);
    const obs = asStringRecord(item.observability_contract);
    const nfrSummary = [
      nfr.latency,
      nfr.availability,
      nfr.durability,
      nfr.rpo,
      nfr.rto,
      nfr.privacy_compliance_class,
    ]
      .filter((value) => typeof value === 'string' && value.length > 0)
      .join('; ');
    const obsSummary = [
      ...getRecordStringArray(obs, 'sli_slo'),
      ...getRecordStringArray(obs, 'alert_thresholds'),
      ...getRecordStringArray(obs, 'security_controls'),
      ...getRecordStringArray(obs, 'privacy_controls'),
    ].join('; ');
    lines.push(
      `| ${escapeCell(item.item_id ?? '')} | ${escapeCell(nfrSummary)} | ${escapeCell(obsSummary)} |`,
    );
  }

  if (backlog.items.length === 0) {
    lines.push('| _none_ |  |  |');
  }

  return [...lines, ''];
}

function renderUncertaintyAndSpikes(backlog: BacklogFile): string[] {
  const lines = [
    '## Uncertainty And Spikes',
    '',
    '| Unknown | Severity | Related Items | Spike | Spike Artifact | Follow-on Items |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  const spikesById = new Map(
    backlog.items
      .filter((item) => typeof item.item_id === 'string' && item.item_class === 'spike_discovery')
      .map((item) => [item.item_id as string, item]),
  );

  for (const unknown of backlog.unknowns) {
    const mapping = backlog.uncertainty_to_spike.find(
      (entry) => entry.unknown_id === unknown.issue_id,
    );
    const spike = mapping?.spike_item_id ? spikesById.get(mapping.spike_item_id) : undefined;
    const spikePayload = asStringRecord(spike?.class_payload);
    const followOns = Array.isArray(spikePayload.follow_on_item_refs)
      ? spikePayload.follow_on_item_refs
      : asArray(spike?.follow_on_item_refs);
    lines.push(
      `| ${escapeCell(unknown.issue_id ?? '')} | ${escapeCell(unknown.severity ?? '')} | ${escapeCell(asArray(unknown.related_item_refs).join(', '))} | ${escapeCell(mapping?.spike_item_id ?? '')} | ${escapeCell((typeof spikePayload.expected_artifact === 'string' && spikePayload.expected_artifact) || spike?.expected_artifact || '')} | ${escapeCell(followOns.join(', '))} |`,
    );
  }

  if (backlog.unknowns.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderGraphRelations(backlog: BacklogFile): string[] {
  const lines = ['## Graph Relations', '', '| Relation | From | To |', '| --- | --- | --- |'];

  for (const relation of backlog.relations) {
    lines.push(
      `| ${escapeCell(relation.relation_type)} | ${escapeCell(formatGraphRef(relation.from))} | ${escapeCell(formatGraphRef(relation.to))} |`,
    );
  }

  if (backlog.relations.length === 0) {
    lines.push('| _none_ |  |  |');
  }

  return [...lines, ''];
}

function collectSourceAuthorityState(backlog: BacklogFile): {
  sourceIds: Set<string>;
  excludedSourceIds: Set<string>;
} {
  const sourceIds = new Set<string>();
  const excludedSourceIds = new Set<string>();

  for (const source of backlog.source_authority) {
    if (typeof source.source_id !== 'string' || source.source_id.length === 0) {
      continue;
    }
    sourceIds.add(source.source_id);
    if (source.authority === 'superseded_excluded') {
      excludedSourceIds.add(source.source_id);
    }
  }

  for (const exclusion of backlog.source_exclusions) {
    if (typeof exclusion.source_id === 'string' && exclusion.source_id.length > 0) {
      excludedSourceIds.add(exclusion.source_id);
    }
  }

  return { sourceIds, excludedSourceIds };
}

function collectReviewFindingIds(backlog: BacklogFile): Set<string> {
  const reviewFindingIds = new Set<string>();

  for (const review of backlog.reviews) {
    for (const collection of [review.findings, review.hard_fail_report]) {
      for (const finding of asArray(collection)) {
        if (
          typeof finding === 'object' &&
          finding !== null &&
          typeof finding.finding_id === 'string' &&
          finding.finding_id.length > 0
        ) {
          reviewFindingIds.add(finding.finding_id);
        }
      }
    }
  }

  return reviewFindingIds;
}

function renderClaims(backlog: BacklogFile): string[] {
  const lines = [
    '## Claims',
    '',
    '| Claim ID | Class | Commitment | Source Refs | ADR Refs | Revisit Trigger |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  for (const claim of backlog.claims) {
    lines.push(
      `| ${escapeCell(claim.claim_id ?? '')} | ${escapeCell(claim.claim_class ?? '')} | ${escapeCell(claim.commitment ?? '')} | ${escapeCell(asArray(claim.source_refs).join(', '))} | ${escapeCell(asArray(claim.adr_refs).join(', '))} | ${escapeCell(claim.revisit_trigger ?? '')} |`,
    );
  }

  if (backlog.claims.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderIssueLedgers(backlog: BacklogFile): string[] {
  const lines = [
    '## Issue Ledgers',
    '',
    '| Ledger | Issue ID | Severity | Resolution | Fail-Closed Category | Sources | Related Claims | Related Items |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const [ledgerName, entries] of [
    ['Gap', backlog.gaps],
    ['Contradiction', backlog.contradictions],
    ['Unknown', backlog.unknowns],
  ] as const) {
    for (const entry of entries) {
      lines.push(
        `| ${ledgerName} | ${escapeCell(entry.issue_id ?? '')} | ${escapeCell(entry.severity ?? '')} | ${escapeCell(entry.resolution_state ?? '')} | ${escapeCell(entry.fail_closed_category === true ? 'yes' : '')} | ${escapeCell(asArray(entry.source_refs).join(', '))} | ${escapeCell(asArray(entry.related_claim_refs).join(', '))} | ${escapeCell(asArray(entry.related_item_refs).join(', '))} |`,
      );
    }
  }

  if (
    backlog.gaps.length === 0 &&
    backlog.contradictions.length === 0 &&
    backlog.unknowns.length === 0
  ) {
    lines.push('| _none_ |  |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderTraceability(backlog: BacklogFile): string[] {
  const { sourceIds, excludedSourceIds } = collectSourceAuthorityState(backlog);
  const claimIds = new Set(
    backlog.claims
      .map((claim) => claim.claim_id)
      .filter((claimId): claimId is string => typeof claimId === 'string' && claimId.length > 0),
  );
  const policyDecisionIds = new Set(
    backlog.policy_decisions
      .map((decision) => decision.policy_decision_id)
      .filter(
        (decisionId): decisionId is string =>
          typeof decisionId === 'string' && decisionId.length > 0,
      ),
  );
  const gapIds = new Set(
    backlog.gaps
      .map((gap) => gap.issue_id)
      .filter((gapId): gapId is string => typeof gapId === 'string' && gapId.length > 0),
  );
  const unknownIds = new Set(
    backlog.unknowns
      .map((unknown) => unknown.issue_id)
      .filter(
        (unknownId): unknownId is string => typeof unknownId === 'string' && unknownId.length > 0,
      ),
  );
  const controlObligationClaimIds = new Set(
    backlog.claims
      .filter((claim) => claim.claim_class === 'control_obligation')
      .map((claim) => claim.claim_id)
      .filter((claimId): claimId is string => typeof claimId === 'string' && claimId.length > 0),
  );
  const decommissionNeedClaimIds = new Set(
    backlog.claims
      .filter((claim) => claim.claim_class === 'retirement')
      .map((claim) => claim.claim_id)
      .filter((claimId): claimId is string => typeof claimId === 'string' && claimId.length > 0),
  );
  const reviewFindingIds = collectReviewFindingIds(backlog);
  const committedClaims = backlog.claims.filter((claim) => claim.commitment === 'committed');
  const validClaimsWithSources = backlog.claims.filter((claim) => {
    const sourceRefs = asArray(claim.source_refs);
    return (
      sourceRefs.length > 0 &&
      sourceRefs.every((sourceRef) => sourceIds.has(sourceRef) && !excludedSourceIds.has(sourceRef))
    );
  });
  const itemsWithDeclaredOrigins = backlog.items.filter(
    (item) => asArray(item.origin_ref).length > 0,
  );
  const itemsWithClaimRefs = backlog.items.filter((item) => asArray(item.claim_refs).length > 0);
  const mappedClaimIds = new Set<string>();
  const itemsWithResolvedOrigins = new Set<string>();
  const claimsWithInvalidSources: string[] = [];
  const claimsWithExcludedSources: string[] = [];
  const itemsWithUnresolvedOrigins: string[] = [];

  for (const claim of backlog.claims) {
    if (typeof claim.claim_id !== 'string' || claim.claim_id.length === 0) {
      continue;
    }
    const sourceRefs = asArray(claim.source_refs);
    if (sourceRefs.some((sourceRef) => !sourceIds.has(sourceRef))) {
      claimsWithInvalidSources.push(claim.claim_id);
    } else if (sourceRefs.some((sourceRef) => excludedSourceIds.has(sourceRef))) {
      claimsWithExcludedSources.push(claim.claim_id);
    }
  }

  for (const item of backlog.items) {
    const itemId = typeof item.item_id === 'string' ? item.item_id : null;
    for (const claimRef of asArray(item.claim_refs)) {
      if (claimIds.has(claimRef)) {
        mappedClaimIds.add(claimRef);
      }
    }
    let allOriginsResolved = asArray(item.origin_ref).length > 0;
    for (const origin of asArray(item.origin_ref)) {
      if (typeof origin.ref !== 'string' || typeof origin.kind !== 'string') {
        allOriginsResolved = false;
        continue;
      }

      let originResolved = false;
      switch (origin.kind) {
        case 'claim_ref':
          originResolved = claimIds.has(origin.ref);
          break;
        case 'gap_ref':
          originResolved = gapIds.has(origin.ref);
          break;
        case 'control_obligation_ref':
          originResolved = controlObligationClaimIds.has(origin.ref);
          break;
        case 'policy_decision_ref':
          originResolved = policyDecisionIds.has(origin.ref);
          break;
        case 'decommission_need_ref':
          originResolved = decommissionNeedClaimIds.has(origin.ref);
          break;
        case 'review_finding_ref':
          originResolved = reviewFindingIds.has(origin.ref);
          break;
        case 'unknown_ref':
          originResolved = unknownIds.has(origin.ref);
          break;
      }

      if (!originResolved) {
        allOriginsResolved = false;
      }

      if (
        originResolved &&
        (origin.kind === 'claim_ref' ||
          origin.kind === 'control_obligation_ref' ||
          origin.kind === 'decommission_need_ref')
      ) {
        mappedClaimIds.add(origin.ref);
      }
    }
    if (itemId && allOriginsResolved) {
      itemsWithResolvedOrigins.add(itemId);
    } else if (itemId && asArray(item.origin_ref).length > 0) {
      itemsWithUnresolvedOrigins.push(itemId);
    }
  }

  const unmappedCommittedClaims = committedClaims
    .map((claim) => claim.claim_id)
    .filter((claimId): claimId is string => typeof claimId === 'string' && claimId.length > 0)
    .filter((claimId) => !mappedClaimIds.has(claimId));
  const claimsMissingSources = backlog.claims
    .filter((claim) => asArray(claim.source_refs).length === 0)
    .map((claim) => claim.claim_id)
    .filter((claimId): claimId is string => typeof claimId === 'string' && claimId.length > 0);
  const itemsMissingOrigins = backlog.items
    .filter((item) => asArray(item.origin_ref).length === 0)
    .map((item) => item.item_id)
    .filter((itemId): itemId is string => typeof itemId === 'string' && itemId.length > 0);

  const lines = [
    '## Traceability',
    '',
    `- Claims with valid canonical source refs: ${validClaimsWithSources.length}/${backlog.claims.length}`,
    `- Committed claims mapped to items: ${committedClaims.length - unmappedCommittedClaims.length}/${committedClaims.length}`,
    `- Items with declared origin refs: ${itemsWithDeclaredOrigins.length}/${backlog.items.length}`,
    `- Items with fully resolved origin refs: ${itemsWithResolvedOrigins.size}/${backlog.items.length}`,
    `- Items with explicit claim refs: ${itemsWithClaimRefs.length}/${backlog.items.length}`,
    '',
    '### Traceability Gaps',
    '',
  ];

  const gaps: string[] = [];
  if (claimsMissingSources.length > 0) {
    gaps.push(`Claims missing source refs: ${claimsMissingSources.join(', ')}`);
  }
  if (claimsWithInvalidSources.length > 0) {
    gaps.push(`Claims with invalid source refs: ${claimsWithInvalidSources.join(', ')}`);
  }
  if (claimsWithExcludedSources.length > 0) {
    gaps.push(`Claims with excluded source refs: ${claimsWithExcludedSources.join(', ')}`);
  }
  if (unmappedCommittedClaims.length > 0) {
    gaps.push(`Committed claims not mapped to items: ${unmappedCommittedClaims.join(', ')}`);
  }
  if (itemsMissingOrigins.length > 0) {
    gaps.push(`Items missing origin refs: ${itemsMissingOrigins.join(', ')}`);
  }
  if (itemsWithUnresolvedOrigins.length > 0) {
    gaps.push(`Items with unresolved origin refs: ${itemsWithUnresolvedOrigins.join(', ')}`);
  }

  if (gaps.length === 0) {
    lines.push('- None');
  } else {
    for (const gap of gaps) {
      lines.push(`- ${gap}`);
    }
  }

  lines.push('');
  return lines;
}

function renderApplicabilityAndExemptions(backlog: BacklogFile): string[] {
  const lines = [
    '## Applicability And Exemptions',
    '',
    '| Item | Rollout | Recovery | Readiness Exemptions | Done Exemptions |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const item of backlog.items) {
    const rollout = asStringRecord(item.rollout);
    const recovery = asStringRecord(item.recovery);
    const readiness = asStringRecord(item.readiness_contract);
    const done = asStringRecord(item.done_contract);
    const readinessExemptions = Object.entries(asStringRecord(readiness.exemptions))
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('; ');
    const doneExemptions = Object.entries(asStringRecord(done.exemptions))
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join('; ');
    const rolloutJustification = isNonEmptyString(rollout.justification)
      ? rollout.justification
      : '';
    const rolloutMode = isNonEmptyString(rollout.mode) ? rollout.mode : '';
    const rolloutLabel =
      rollout.applicability === 'not_applicable'
        ? `not_applicable: ${rolloutJustification}`
        : rolloutMode;
    const recoveryJustification = isNonEmptyString(recovery.justification)
      ? recovery.justification
      : '';
    const recoveryClass = isNonEmptyString(recovery.class) ? recovery.class : '';
    const recoveryLabel =
      recovery.applicability === 'not_applicable'
        ? `not_applicable: ${recoveryJustification}`
        : recoveryClass;
    lines.push(
      `| ${escapeCell(item.item_id ?? '')} | ${escapeCell(rolloutLabel)} | ${escapeCell(recoveryLabel)} | ${escapeCell(readinessExemptions)} | ${escapeCell(doneExemptions)} |`,
    );
  }

  if (backlog.items.length === 0) {
    lines.push('| _none_ |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderReviewGovernance(backlog: BacklogFile, assessment: AssessmentFile): string[] {
  const invalidWaiverIds = new Set(asArray(assessment.invalid_waiver_ids));
  const lines = [
    '## Review Governance',
    '',
    `- Required review roles: ${assessment.required_review_roles.join(', ') || 'None'}`,
    `- Present review roles: ${assessment.present_review_roles.join(', ') || 'None'}`,
    `- Missing review roles: ${assessment.missing_review_roles.join(', ') || 'None'}`,
    `- Pending track-proof reviews: ${assessment.pending_track_proof_reviews.join(', ') || 'None'}`,
    `- Waiver findings: ${assessment.waiver_findings.join('; ') || 'None'}`,
    '',
    '### Reviews',
    '',
    '| Review | Scope | Reviewed Ref | Role | Independent | Verdict | Evidence | Findings | Hard Fails | Score Contribution |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const review of backlog.reviews) {
    lines.push(
      `| ${escapeCell(review.review_id ?? '')} | ${escapeCell(review.review_scope ?? '')} | ${escapeCell(formatGraphRef(review.reviewed_ref))} | ${escapeCell(review.role ?? '')} | ${escapeCell(review.independent === true ? 'yes' : 'no')} | ${escapeCell(review.verdict ?? '')} | ${escapeCell(asArray(review.evidence_refs).join(', '))} | ${escapeCell(asArray(review.findings).length)} | ${escapeCell(asArray(review.hard_fail_report).length)} | ${escapeCell(review.score_contribution ?? '')} |`,
    );
  }
  if (backlog.reviews.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |  |  |  |');
  }

  lines.push(
    '',
    '### Waivers',
    '',
    '| Waiver | Role | Scope | Granting Authority | Valid | Trigger | Impacted Surfaces |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  );
  for (const waiver of backlog.waivers) {
    const computedValidity =
      isNonEmptyString(waiver.waiver_id) && invalidWaiverIds.has(waiver.waiver_id)
        ? 'no'
        : waiver.valid === true
          ? 'yes'
          : 'no';
    lines.push(
      `| ${escapeCell(waiver.waiver_id ?? '')} | ${escapeCell(waiver.waived_role ?? '')} | ${escapeCell(formatGraphRef(waiver.scope))} | ${escapeCell(waiver.granting_authority ?? '')} | ${escapeCell(computedValidity)} | ${escapeCell(waiver.expiry_or_revisit_trigger ?? '')} | ${escapeCell(asArray(waiver.impacted_surfaces).join(', '))} |`,
    );
  }
  if (backlog.waivers.length === 0) {
    lines.push('| _none_ |  |  |  |  |  |  |');
  }

  return [...lines, ''];
}

function renderLifecycleAndDrift(manifest: Manifest, assessment: AssessmentFile): string[] {
  return [
    '## Lifecycle And Drift',
    '',
    `- Last delta: ${manifest.last_delta_at ?? 'Never'}`,
    `- Last rebaseline: ${manifest.last_rebaseline_at ?? 'Never'}`,
    `- Last rebaseline causes: ${manifest.last_rebaseline_causes.join(', ') || 'None'}`,
    `- Dirty flags: ${manifest.dirty_flags.join(', ') || 'None'}`,
    `- Rebaseline required: ${assessment.rebaseline_required ? 'Yes' : 'No'}`,
    `- Changed sources: ${assessment.delta_summary.changed_source_ids.join(', ') || 'None'}`,
    `- Changed claims: ${assessment.delta_summary.changed_claim_ids.join(', ') || 'None'}`,
    `- Changed track gates: ${assessment.delta_summary.changed_track_gate_ids.join(', ') || 'None'}`,
    `- Stale claims: ${assessment.stale_claims.join(', ') || 'None'}`,
    `- Stale items: ${assessment.stale_items.join(', ') || 'None'}`,
    `- Stale proofs: ${assessment.stale_proofs.join(', ') || 'None'}`,
    `- Stale review artifacts: ${assessment.stale_review_artifacts.join(', ') || 'None'}`,
    `- Track gates to recalculate: ${assessment.delta_summary.track_gate_ids_to_recalculate.join(', ') || 'None'}`,
    `- Recalculation surfaces: dirty_flags=${manifest.dirty_flags.join(', ') || 'None'}; track_gates=${assessment.delta_summary.track_gate_ids_to_recalculate.join(', ') || 'None'}`,
    `- Track gate failures: ${assessment.track_gate_failures.join(', ') || 'None'}`,
    '',
  ];
}

function renderRebaselineReadiness(assessment: AssessmentFile): string[] {
  return [
    '## Rebaseline Readiness',
    '',
    `- Status: ${assessment.rebaseline_readiness.status}`,
    `- Reasons: ${assessment.rebaseline_readiness.reasons.join('; ') || 'None'}`,
    '',
  ];
}

function renderNewStaleSinceLastChange(snapshot: NewStaleSnapshot): string[] {
  return [
    '## New Stale Since Last Change',
    '',
    `- Status: ${snapshot.status}`,
    `- Reason: ${snapshot.reason ?? 'None'}`,
    `- Claims: ${snapshot.claims.join(', ') || 'None'}`,
    `- Items: ${snapshot.items.join(', ') || 'None'}`,
    `- Proofs: ${snapshot.proofs.join(', ') || 'None'}`,
    `- Reviews: ${snapshot.reviews.join(', ') || 'None'}`,
    '',
  ];
}

function buildProofMap(backlog: BacklogFile): Map<string, BacklogFile['proofs'][number]> {
  return new Map(
    backlog.proofs
      .filter((proof): proof is BacklogFile['proofs'][number] & { proof_id: string } =>
        isNonEmptyString(proof.proof_id),
      )
      .map((proof) => [proof.proof_id, proof]),
  );
}

function summarizeProofRefs(
  proofRefs: string[],
  proofById: Map<string, BacklogFile['proofs'][number]>,
  staleProofIds: Set<string>,
): string {
  if (proofRefs.length === 0) {
    return 'none';
  }

  return proofRefs
    .map((proofRef) => {
      const proof = proofById.get(proofRef);
      const freshness = staleProofIds.has(proofRef) ? 'stale' : 'fresh_or_current';
      const build = isNonEmptyString(proof?.covered_commit_or_build)
        ? proof.covered_commit_or_build
        : 'no-build';
      return `${proofRef} (${freshness}, ${build})`;
    })
    .join('; ');
}

function summarizeRoadmapAnswer(backlog: BacklogFile): string {
  const itemMap = getItemMap(backlog);
  const ordered = orderRoadmapRows(backlog);
  if (ordered.length === 0) {
    return 'No roadmap rows recorded.';
  }

  return ordered
    .map((row, index) => {
      const itemId = row.item_ref?.id ?? 'unknown';
      const item = itemMap.get(itemId);
      const title = item?.title ?? itemId;
      const factors = asArray(row.economic_factors).join(', ') || 'no-economic-factors';
      const note = isNonEmptyString(row.economic_priority_note)
        ? row.economic_priority_note
        : 'no-economic-note';
      return `${index + 1}) ${itemId} (${title}) [topology=${row.topology_rank ?? 'n/a'}, safety=${row.safety_rank ?? 'n/a'}, economic=${row.economic_rank ?? 'n/a'}; factors=${factors}; note=${note}]`;
    })
    .join(' ');
}

function summarizeItemProofAnswer(backlog: BacklogFile, assessment: AssessmentFile): string {
  const proofById = buildProofMap(backlog);
  const staleProofIds = new Set(assessment.stale_proofs);
  if (backlog.items.length === 0) {
    return 'No item proofs recorded.';
  }

  return backlog.items
    .map(
      (item) =>
        `${item.item_id ?? 'unknown'} -> ${summarizeProofRefs(asArray(item.proof_refs), proofById, staleProofIds)}`,
    )
    .join('; ');
}

function summarizeTrackProofAnswer(backlog: BacklogFile, assessment: AssessmentFile): string {
  const proofById = buildProofMap(backlog);
  const staleProofIds = new Set(assessment.stale_proofs);
  if (backlog.track_proofs.length === 0) {
    return 'No track proofs recorded.';
  }

  return backlog.track_proofs
    .map((trackProof) => {
      const coverage = Object.entries(trackProof.coverage ?? {})
        .map(([key, value]) => `${key}=${value === true ? 'yes' : 'no'}`)
        .join(', ');
      return `${trackProof.track_id ?? 'unknown'} -> ${trackProof.track_proof_id ?? 'unknown'} [${coverage || 'no-coverage'}] backed by ${summarizeProofRefs(asArray(trackProof.proof_refs), proofById, staleProofIds)}`;
    })
    .join('; ');
}

function renderFinalOperatingQuestions(
  _manifest: Manifest,
  backlog: BacklogFile,
  assessment: AssessmentFile,
): string[] {
  const committedClaims = backlog.claims.filter((claim) => claim.commitment === 'committed');
  const committedClaimIds = new Set(
    committedClaims
      .map((claim) => claim.claim_id)
      .filter((claimId): claimId is string => typeof claimId === 'string' && claimId.length > 0),
  );
  const coveredClaimIds = new Set<string>();
  for (const item of backlog.items) {
    for (const claimRef of asArray(item.claim_refs)) {
      if (committedClaimIds.has(claimRef)) {
        coveredClaimIds.add(claimRef);
      }
    }
    for (const origin of asArray(item.origin_ref)) {
      if (
        typeof origin.ref === 'string' &&
        (origin.kind === 'claim_ref' ||
          origin.kind === 'control_obligation_ref' ||
          origin.kind === 'decommission_need_ref') &&
        committedClaimIds.has(origin.ref)
      ) {
        coveredClaimIds.add(origin.ref);
      }
    }
  }
  const uncoveredClaims = [...committedClaimIds].filter((claimId) => !coveredClaimIds.has(claimId));
  const roadmapEndsRunnable =
    assessment.acceptance.achieved === 'implementation-grade' &&
    assessment.track_gate_failures.length === 0 &&
    assessment.stale_items.length === 0 &&
    assessment.stale_proofs.length === 0;
  const roadmapAnswer = summarizeRoadmapAnswer(backlog);
  const itemProofAnswer = summarizeItemProofAnswer(backlog, assessment);
  const trackProofAnswer = summarizeTrackProofAnswer(backlog, assessment);

  return [
    '## Final Operating Questions',
    '',
    `1. What is the system? ${backlog.target_system.external_consumer_groups.join(', ') || 'Unspecified'} served by ${backlog.as_built.services.join(', ') || 'no recorded services'} across ${backlog.tracks.length} closure tracks.`,
    `2. Which sources are authoritative? ${backlog.source_authority.map((source) => `${source.source_id} (${source.authority})`).join(', ') || 'None recorded'}.`,
    `3. What exists now? ${backlog.as_built.deployable_surfaces.length} deployable surfaces, ${backlog.as_built.services.length} services, ${backlog.as_built.state_stores.length} state stores, and ${backlog.as_built.vendor_external_owners.length} external owners are mapped.`,
    `4. What is synthetic, partial, optional, or manual-only? ${backlog.negative_scope.length > 0 ? backlog.negative_scope.map((entry) => `${entry.negative_scope_id}:${entry.negative_scope_class}`).join(', ') : 'No negative-scope entries recorded.'}`,
    `5. Which committed claims remain uncovered? ${uncoveredClaims.length > 0 ? uncoveredClaims.join(', ') : 'None.'}`,
    `6. Which seams own each mandatory capability? ${
      backlog.items
        .filter((item) => item.item_class === 'capability_seam')
        .map((item) => `${item.item_id}:${item.title ?? item.capability_added ?? ''}`)
        .join(', ') || 'No capability seams recorded.'
    }`,
    `7. Which items are seams, slices, controls, migrations, retirements, spikes, or enablement work? ${backlog.items.map((item) => `${item.item_id}:${item.item_class}`).join(', ') || 'No items recorded.'}`,
    `8. Which items are planning-ready now? ${
      backlog.items
        .filter((item) => item.readiness_state === 'ready')
        .map((item) => item.item_id)
        .join(', ') || 'None.'
    }`,
    `9. Which contracts, migrations, and retirements are required? Contracts=${backlog.contracts.map((contract) => contract.contract_id).join(', ') || 'None'}; migrations=${
      backlog.items
        .filter((item) => item.item_class === 'migration')
        .map((item) => item.item_id)
        .join(', ') || 'None'
    }; retirements=${
      backlog.items
        .filter((item) => item.item_class === 'retirement')
        .map((item) => item.item_id)
        .join(', ') || 'None'
    }.`,
    `10. Which quality budgets and control obligations are binding? Quality attributes=${backlog.quality_attributes.map((entry) => entry.quality_attribute_id).join(', ') || 'None'}; control obligations=${
      backlog.claims
        .filter((claim) => claim.claim_class === 'control_obligation')
        .map((claim) => claim.claim_id)
        .join(', ') || 'None'
    }.`,
    `11. In what order must items land, and why? ${roadmapAnswer}`,
    `12. What proof closes each item? ${itemProofAnswer}`,
    `13. What proof closes each track? ${trackProofAnswer}`,
    `14. Which items remain blocked, stale, or unclear? stale_items=${assessment.stale_items.join(', ') || 'None'}; stale_claims=${assessment.stale_claims.join(', ') || 'None'}; stale_proofs=${assessment.stale_proofs.join(', ') || 'None'}; unresolved_unknowns=${
      backlog.unknowns
        .filter(
          (entry) =>
            entry.resolution_state !== 'resolved' && entry.resolution_state !== 'downgraded',
        )
        .map((entry) => entry.issue_id)
        .join(', ') || 'None'
    }.`,
    `15. Does the roadmap end in a real, runnable, deployable, supportable system? ${roadmapEndsRunnable ? 'Yes.' : 'Not yet.'} Achieved acceptance=${assessment.acceptance.achieved}, track gate failures=${assessment.track_gate_failures.length}, stale proofs=${assessment.stale_proofs.length}, stale items=${assessment.stale_items.length}, rebaseline_required=${assessment.rebaseline_required ? 'yes' : 'no'}.`,
    '',
  ];
}

function renderInvalidBanner(assessment: AssessmentFile): string[] {
  if (assessment.status !== 'fail') {
    return [];
  }

  return [
    '> [!WARNING]',
    '> Canonical state is invalid. Treat this report as a repair aid, not as backlog truth.',
    '',
  ];
}

export function renderDiscoveryViews(
  runDirInput: string,
  options: RenderDiscoveryViewsOptions = {},
): RenderDiscoveryViewsResult {
  const {
    assessment,
    backlog,
    legacyLayoutMessage,
    manifest,
    missingArtifacts,
    runDir,
    unsupportedSchemaMessages,
  } = loadCompactRunArtifacts(runDirInput);

  if (legacyLayoutMessage) {
    throw new Error(legacyLayoutMessage);
  }
  if (missingArtifacts.length > 0) {
    throw new Error(
      missingArtifacts.map((filePath) => `Missing discovery artifact: ${filePath}`).join('\n'),
    );
  }
  if (unsupportedSchemaMessages.length > 0) {
    throw new Error(unsupportedSchemaMessages.join('\n'));
  }
  if (!manifest || !backlog || !assessment) {
    throw new Error('Render could not be completed.');
  }

  const paths = runPaths(runDir);
  const renderedAt = utcNow();
  const renderReason = options.renderReason ?? 'recovery_render';
  const previousStaleSnapshot =
    renderReason === 'mutating_command' ? readPreviousMutatingStaleSnapshot(paths.journal) : null;
  const staleSnapshot = renderReason === 'mutating_command' ? buildStaleSnapshot(assessment) : null;
  const newStaleSnapshot =
    renderReason === 'mutating_command' && staleSnapshot
      ? buildNewStaleSnapshot(previousStaleSnapshot, staleSnapshot)
      : null;
  const reportNewStaleSnapshot =
    newStaleSnapshot ?? readLatestMutatingNewStaleSnapshot(paths.journal);

  const reportLines = [
    '# Architecture Backlog Report',
    '',
    ...renderInvalidBanner(assessment),
    ...renderRunSummary(manifest, assessment),
    ...renderBackdrop(backlog),
    ...renderSourceAuthority(backlog),
    ...renderSourceExclusions(backlog),
    ...renderTargetSystem(backlog),
    ...renderAsBuilt(backlog),
    ...renderClaims(backlog),
    ...renderIssueLedgers(backlog),
    ...renderValueStreams(backlog),
    ...renderTrackClosure(backlog),
    ...renderTrackJourneys(backlog),
    ...renderTrackGates(backlog),
    ...renderTrackProofs(backlog),
    ...renderProofBundles(backlog, assessment),
    ...renderProofDimensions(backlog, assessment),
    ...renderContractsAndDataDomains(backlog),
    ...renderNfrAndObservability(backlog),
    ...renderExtendedItemSchema(backlog),
    ...renderUncertaintyAndSpikes(backlog),
    ...renderApplicabilityAndExemptions(backlog),
    ...renderClosureEvidence(backlog, assessment),
    ...renderFeatureCandidates(backlog),
    ...renderItemSummaryIndex(backlog, assessment),
    ...renderItemDetailSections(backlog, assessment),
    ...renderRoadmap(backlog),
    ...renderRoadmapMatrix(backlog),
    ...renderTraceability(backlog),
    ...renderReviewGovernance(backlog, assessment),
    ...renderLifecycleAndDrift(manifest, assessment),
    ...renderRebaselineReadiness(assessment),
    ...renderNewStaleSinceLastChange(reportNewStaleSnapshot),
    ...renderGraphRelations(backlog),
    ...renderGapsAndValidation(assessment),
    ...renderScoreSummary(assessment),
    ...renderReviewAndClosure(assessment),
    ...renderFinalOperatingQuestions(manifest, backlog, assessment),
  ];

  writeText(paths.report, `${reportLines.join('\n')}\n`);

  manifest.updated_at = renderedAt;
  manifest.last_render_at = renderedAt;
  if (manifest.phase_state !== 'closed') {
    manifest.phase_state = 'rendered';
  }
  backlog.metadata.updated_at = renderedAt;
  writeJson(paths.manifest, manifest);
  writeJson(paths.backlog, backlog);
  appendNdjson(paths.journal, {
    ts: renderedAt,
    event: 'report_rendered',
    run_id: manifest.run_id,
    ...(options.commandRunId ? { command_run_id: options.commandRunId } : {}),
    render_reason: renderReason,
    assessment_status: assessment.status,
    achieved_acceptance: assessment.acceptance.achieved,
    ...(renderReason === 'mutating_command' && staleSnapshot
      ? {
          stale_snapshot: staleSnapshot,
          new_stale_snapshot: newStaleSnapshot,
        }
      : {}),
  });

  return {
    renderedAt,
    reportPath: paths.report,
    runDir,
  };
}
