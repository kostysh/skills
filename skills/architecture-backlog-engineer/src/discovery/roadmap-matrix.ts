import {
  asArray,
  graphRef,
  isNonEmptyString,
  type BacklogFile,
  type DiscoveryItem,
  type DiscoveryRelation,
  type GraphRef,
  type RoadmapMatrixEntry,
} from './common.js';

const SAFETY_TRACK_PRIORITY = new Map<string, number>([
  ['minimal-working-system', 0],
  ['externally-safe-operationally-supportable', 1],
  ['full-target-system', 2],
]);

const SAFETY_ITEM_CLASS_PRIORITY = new Map<string, number>([
  ['control_guardrail', 0],
  ['operational_enablement', 1],
  ['documentation_support_enablement', 1],
  ['capability_seam', 2],
  ['feature_slice', 2],
  ['migration', 2],
  ['retirement', 2],
  ['spike_discovery', 2],
]);

const ECONOMIC_TIE_BREAK_GROUPS: string[][] = [
  ['compliance_deadline'],
  ['risk_burn_down'],
  ['dependency_unlock'],
  ['cost_of_delay'],
  ['user_value', 'ops_pain_reduction'],
  ['learning_value'],
  ['reversibility'],
  ['lead_time_risk'],
  ['strategic_fit'],
];

function getEconomicFactorsForItem(item: DiscoveryItem): string[] {
  switch (item.value?.slice_value_kind) {
    case 'user_value':
      return ['strategic_fit', 'dependency_unlock', 'user_value', 'cost_of_delay'];
    case 'control_closure':
      return ['risk_burn_down', 'compliance_deadline', 'dependency_unlock'];
    case 'risk_retirement':
      return ['risk_burn_down', 'ops_pain_reduction', 'lead_time_risk'];
    default:
      return ['strategic_fit'];
  }
}

function getSafetyPriority(entry: RoadmapMatrixEntry): readonly [number, number] {
  const trackId = entry.track_ref?.id ?? '';
  const trackPriority = SAFETY_TRACK_PRIORITY.get(trackId) ?? Number.MAX_SAFE_INTEGER;
  const itemPriority =
    trackId === 'externally-safe-operationally-supportable'
      ? (SAFETY_ITEM_CLASS_PRIORITY.get(entry.item_class ?? '') ?? Number.MAX_SAFE_INTEGER)
      : 0;
  return [trackPriority, itemPriority] as const;
}

function compareEconomicPriority(left: RoadmapMatrixEntry, right: RoadmapMatrixEntry): number {
  const leftFactors = new Set(asArray(left.economic_factors).filter(isNonEmptyString));
  const rightFactors = new Set(asArray(right.economic_factors).filter(isNonEmptyString));

  for (const factorGroup of ECONOMIC_TIE_BREAK_GROUPS) {
    const leftHas = factorGroup.some((factor) => leftFactors.has(factor));
    const rightHas = factorGroup.some((factor) => rightFactors.has(factor));
    if (leftHas === rightHas) {
      continue;
    }
    return leftHas ? -1 : 1;
  }

  return 0;
}

function dependencyRefKey(ref: GraphRef | null | undefined): string {
  return `${ref?.kind ?? 'unknown'}:${ref?.id ?? 'unknown'}`;
}

function relationRef(
  ref: GraphRef | null | undefined,
): ref is GraphRef & { id: string; kind: 'item' } {
  return ref?.kind === 'item' && isNonEmptyString(ref.id);
}

function collectRelationsByItem(relations: DiscoveryRelation[]): {
  incoming: Map<string, DiscoveryRelation[]>;
  outgoing: Map<string, DiscoveryRelation[]>;
} {
  const incoming = new Map<string, DiscoveryRelation[]>();
  const outgoing = new Map<string, DiscoveryRelation[]>();

  for (const relation of relations) {
    if (relationRef(relation.from)) {
      const current = outgoing.get(relation.from.id) ?? [];
      current.push(relation);
      outgoing.set(relation.from.id, current);
    }
    if (relationRef(relation.to)) {
      const current = incoming.get(relation.to.id) ?? [];
      current.push(relation);
      incoming.set(relation.to.id, current);
    }
  }

  return { incoming, outgoing };
}

function collectTopologyPredecessors(item: DiscoveryItem, incoming: DiscoveryRelation[]): string[] {
  const predecessors = new Set<string>();

  for (const relation of incoming) {
    if (
      relationRef(relation.from) &&
      (relation.relation_type === 'decomposes_into' || relation.relation_type === 'depends_on')
    ) {
      predecessors.add(relation.from.id);
    }
  }

  for (const dependencyRef of asArray(item.dependency_refs)) {
    if (isNonEmptyString(dependencyRef)) {
      predecessors.add(dependencyRef);
    }
  }

  return [...predecessors];
}

function buildTopologyRanks(
  items: DiscoveryItem[],
  incomingByItemId: Map<string, DiscoveryRelation[]>,
): Map<string, number> {
  const itemIds = items.map((item) => item.item_id).filter(isNonEmptyString);
  const orderIndex = new Map<string, number>(itemIds.map((id, index) => [id, index]));
  const predecessorsByItemId = new Map<string, Set<string>>();
  const successorsByItemId = new Map<string, Set<string>>();
  const indegreeByItemId = new Map<string, number>();

  for (const item of items) {
    if (!isNonEmptyString(item.item_id)) {
      continue;
    }
    const predecessors = new Set(
      collectTopologyPredecessors(item, incomingByItemId.get(item.item_id) ?? []),
    );
    predecessorsByItemId.set(item.item_id, predecessors);
    indegreeByItemId.set(item.item_id, predecessors.size);
    if (!successorsByItemId.has(item.item_id)) {
      successorsByItemId.set(item.item_id, new Set<string>());
    }
    for (const predecessor of predecessors) {
      const successors = successorsByItemId.get(predecessor) ?? new Set<string>();
      successors.add(item.item_id);
      successorsByItemId.set(predecessor, successors);
    }
  }

  const ready = itemIds
    .filter((itemId) => (indegreeByItemId.get(itemId) ?? 0) === 0)
    .sort((left, right) => (orderIndex.get(left) ?? 0) - (orderIndex.get(right) ?? 0));
  const ordered: string[] = [];

  while (ready.length > 0) {
    const current = ready.shift();
    if (!current) {
      continue;
    }
    ordered.push(current);

    for (const successor of successorsByItemId.get(current) ?? []) {
      const nextIndegree = (indegreeByItemId.get(successor) ?? 0) - 1;
      indegreeByItemId.set(successor, nextIndegree);
      if (nextIndegree === 0) {
        ready.push(successor);
        ready.sort((left, right) => (orderIndex.get(left) ?? 0) - (orderIndex.get(right) ?? 0));
      }
    }
  }

  for (const itemId of itemIds) {
    if (!ordered.includes(itemId)) {
      ordered.push(itemId);
    }
  }

  return new Map(ordered.map((itemId, index) => [itemId, index + 1]));
}

function stableGraphRefList(refs: GraphRef[]): GraphRef[] {
  const seen = new Set<string>();
  const ordered: GraphRef[] = [];

  for (const ref of refs) {
    const key = dependencyRefKey(ref);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    ordered.push(ref);
  }

  return ordered;
}

function buildDependencyEntries(
  item: DiscoveryItem,
  outgoing: DiscoveryRelation[],
): NonNullable<RoadmapMatrixEntry['dependency_entries']> {
  const dependencyEntries: NonNullable<RoadmapMatrixEntry['dependency_entries']> = [];

  for (const dependencyRef of asArray(item.dependency_refs)) {
    if (!isNonEmptyString(dependencyRef)) {
      continue;
    }
    dependencyEntries.push({
      ref: graphRef('item', dependencyRef),
      dependency_type: 'depends_on',
    });
  }

  for (const relation of outgoing) {
    if (relation.relation_type === 'depends_on' && relationRef(relation.to)) {
      dependencyEntries.push({
        ref: relation.to,
        dependency_type: 'depends_on',
      });
    }
  }

  return stableGraphRefList(
    dependencyEntries
      .map((entry) => entry.ref)
      .filter((entry): entry is GraphRef => entry !== undefined),
  ).map((ref) => ({
    ref,
    dependency_type: 'depends_on',
  }));
}

export function buildRoadmapMatrix(
  items: DiscoveryItem[],
  relations: DiscoveryRelation[],
): RoadmapMatrixEntry[] {
  const { incoming, outgoing } = collectRelationsByItem(relations);
  const topologyRanks = buildTopologyRanks(items, incoming);

  const rows = items
    .filter(
      (
        item,
      ): item is DiscoveryItem & {
        item_id: string;
        track_id: string;
        item_class: NonNullable<DiscoveryItem['item_class']>;
      } =>
        isNonEmptyString(item.item_id) &&
        isNonEmptyString(item.track_id) &&
        isNonEmptyString(item.item_class),
    )
    .map((item) => {
      const incomingRelations = incoming.get(item.item_id) ?? [];
      const outgoingRelations = outgoing.get(item.item_id) ?? [];
      const parentRefs = stableGraphRefList(
        incomingRelations
          .filter(
            (relation) =>
              relation.relation_type === 'decomposes_into' && relationRef(relation.from),
          )
          .map((relation) => relation.from)
          .filter((ref): ref is GraphRef => ref !== undefined),
      );
      const childRefs = stableGraphRefList(
        outgoingRelations
          .filter(
            (relation) => relation.relation_type === 'decomposes_into' && relationRef(relation.to),
          )
          .map((relation) => relation.to)
          .filter((ref): ref is GraphRef => ref !== undefined),
      );
      const dependencyEntries = buildDependencyEntries(item, outgoingRelations);
      const dependencyRefs = dependencyEntries
        .map((entry) => entry.ref)
        .filter((entry): entry is GraphRef => entry !== undefined);
      const retirementRelation = outgoingRelations.find(
        (relation) =>
          relation.relation_type === 'retires' && relation.to && isNonEmptyString(relation.to.id),
      );

      const row: RoadmapMatrixEntry = {
        row_id: `roadmap-${item.item_id}`,
        item_ref: graphRef('item', item.item_id),
        item_class: item.item_class,
        parent_refs: parentRefs,
        child_refs: childRefs,
        track_ref: graphRef('track', item.track_id),
        dependency_refs: dependencyRefs,
        dependency_type: dependencyEntries.length > 0 ? 'depends_on' : 'entry',
        dependency_entries: dependencyEntries,
        ...(item.milestone !== undefined ? { milestone: item.milestone } : {}),
        ...(item.backlog_protocol_state !== undefined
          ? { backlog_protocol_state: item.backlog_protocol_state }
          : {}),
        ...(item.delivery_state !== undefined ? { delivery_state: item.delivery_state } : {}),
        ...(item.readiness_state !== undefined ? { readiness_state: item.readiness_state } : {}),
        ...(item.closure_state !== undefined ? { closure_state: item.closure_state } : {}),
        ...(item.summary_label !== undefined ? { summary_label: item.summary_label } : {}),
        ...(item.economic_priority_note !== undefined
          ? { economic_priority_note: item.economic_priority_note }
          : {}),
        economic_factors: getEconomicFactorsForItem(item),
        ...(item.proof_refs !== undefined ? { proof_refs: item.proof_refs } : {}),
        retirement_ref: retirementRelation?.to ?? null,
        topology_rank: topologyRanks.get(item.item_id) ?? Number.MAX_SAFE_INTEGER,
        safety_rank: Number.MAX_SAFE_INTEGER,
        economic_rank: Number.MAX_SAFE_INTEGER,
      };
      return row;
    });

  const safetyOrdered = [...rows].sort((left, right) => {
    const [leftTrackPriority, leftItemPriority] = getSafetyPriority(left);
    const [rightTrackPriority, rightItemPriority] = getSafetyPriority(right);
    if (leftTrackPriority !== rightTrackPriority) {
      return leftTrackPriority - rightTrackPriority;
    }
    if (leftItemPriority !== rightItemPriority) {
      return leftItemPriority - rightItemPriority;
    }
    if ((left.topology_rank ?? 0) !== (right.topology_rank ?? 0)) {
      return (left.topology_rank ?? 0) - (right.topology_rank ?? 0);
    }
    return String(left.item_ref?.id ?? '').localeCompare(String(right.item_ref?.id ?? ''));
  });
  const safetyRankByItemId = new Map(
    safetyOrdered
      .map((entry, index) => [entry.item_ref?.id, index + 1] as const)
      .filter((entry): entry is readonly [string, number] => isNonEmptyString(entry[0])),
  );

  const economicOrdered = [...rows].sort((left, right) => {
    const precedence = compareEconomicPriority(left, right);
    if (precedence !== 0) {
      return precedence;
    }
    const leftSafetyRank =
      safetyRankByItemId.get(left.item_ref?.id ?? '') ?? Number.MAX_SAFE_INTEGER;
    const rightSafetyRank =
      safetyRankByItemId.get(right.item_ref?.id ?? '') ?? Number.MAX_SAFE_INTEGER;
    if (leftSafetyRank !== rightSafetyRank) {
      return leftSafetyRank - rightSafetyRank;
    }
    if (
      (left.topology_rank ?? Number.MAX_SAFE_INTEGER) !==
      (right.topology_rank ?? Number.MAX_SAFE_INTEGER)
    ) {
      return (
        (left.topology_rank ?? Number.MAX_SAFE_INTEGER) -
        (right.topology_rank ?? Number.MAX_SAFE_INTEGER)
      );
    }
    return String(left.item_ref?.id ?? '').localeCompare(String(right.item_ref?.id ?? ''));
  });

  const economicRankByItemId = new Map(
    economicOrdered
      .map((entry, index) => [entry.item_ref?.id, index + 1] as const)
      .filter((entry): entry is readonly [string, number] => isNonEmptyString(entry[0])),
  );

  return rows.map((entry) => ({
    ...entry,
    safety_rank: safetyRankByItemId.get(entry.item_ref?.id ?? '') ?? Number.MAX_SAFE_INTEGER,
    economic_rank: economicRankByItemId.get(entry.item_ref?.id ?? '') ?? Number.MAX_SAFE_INTEGER,
  }));
}

export function roadmapMethodologyPrecedence(backlog: BacklogFile): BacklogFile['roadmap_matrix'] {
  return buildRoadmapMatrix(backlog.items, backlog.relations);
}
