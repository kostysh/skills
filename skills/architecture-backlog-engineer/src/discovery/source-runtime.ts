import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  appendNdjson,
  asArray,
  asStringRecord,
  hashJsonValue,
  isNonEmptyString,
  loadCompactRunArtifacts,
  runPaths,
  utcNow,
  writeJson,
  type AsBuiltModel,
  type ArchitectureClaim,
  type BacklogFile,
  type ContractLedgerEntry,
  type DataDomain,
  type DeliveredLineageNote,
  type DiscoveryItem,
  type DiscoveryRelation,
  type LedgerIssueEntry,
  type NegativeScopeEntry,
  type PolicyDecisionEntry,
  type ProofBundle,
  type QualityAttributeEntry,
  type ReviewArtifact,
  type RoadmapMatrixEntry,
  type SourceAuthorityClass,
  type SourceAuthorityRef,
  type SourceExclusion,
  type SourceKind,
  type TargetSystemModel,
  type Track,
  type TrackGate,
  type TrackJourney,
  type TrackProof,
  type UncertaintyToSpikeEntry,
  type ValueStream,
  type Waiver,
} from './common.js';
import { repairCompactRunBundle } from './bundle-repair.js';

const PACKET_FENCE_MARKERS = ['architecture-backlog-packet', 'abe-packet', 'architecture-backlog'];

type PacketSectionKey =
  | 'id_strategy'
  | 'glossary'
  | 'aliases'
  | 'source_exclusions'
  | 'target_system'
  | 'value_streams'
  | 'tracks'
  | 'track_gates'
  | 'track_journeys'
  | 'as_built'
  | 'claims'
  | 'negative_scope'
  | 'quality_attributes'
  | 'policy_decisions'
  | 'contracts'
  | 'data_domains'
  | 'gaps'
  | 'contradictions'
  | 'unknowns'
  | 'uncertainty_to_spike'
  | 'delivered_lineage_notes'
  | 'items'
  | 'relations'
  | 'proofs'
  | 'track_proofs'
  | 'reviews'
  | 'waivers'
  | 'roadmap_matrix';

const PACKET_SECTION_KEYS: PacketSectionKey[] = [
  'id_strategy',
  'glossary',
  'aliases',
  'source_exclusions',
  'target_system',
  'value_streams',
  'tracks',
  'track_gates',
  'track_journeys',
  'as_built',
  'claims',
  'negative_scope',
  'quality_attributes',
  'policy_decisions',
  'contracts',
  'data_domains',
  'gaps',
  'contradictions',
  'unknowns',
  'uncertainty_to_spike',
  'delivered_lineage_notes',
  'items',
  'relations',
  'proofs',
  'track_proofs',
  'reviews',
  'waivers',
  'roadmap_matrix',
];

const SECTION_ID_SELECTORS: Partial<Record<PacketSectionKey, (entry: Record<string, unknown>) => string | null>> = {
  source_exclusions: (entry) => (isNonEmptyString(entry.source_id) ? entry.source_id : null),
  value_streams: (entry) => (isNonEmptyString(entry.value_stream_id) ? entry.value_stream_id : null),
  tracks: (entry) => (isNonEmptyString(entry.track_id) ? entry.track_id : null),
  track_gates: (entry) => (isNonEmptyString(entry.track_gate_id) ? entry.track_gate_id : null),
  track_journeys: (entry) => (isNonEmptyString(entry.journey_id) ? entry.journey_id : null),
  claims: (entry) => (isNonEmptyString(entry.claim_id) ? entry.claim_id : null),
  negative_scope: (entry) => (isNonEmptyString(entry.negative_scope_id) ? entry.negative_scope_id : null),
  quality_attributes: (entry) => (isNonEmptyString(entry.quality_attribute_id) ? entry.quality_attribute_id : null),
  policy_decisions: (entry) => (isNonEmptyString(entry.policy_decision_id) ? entry.policy_decision_id : null),
  contracts: (entry) => (isNonEmptyString(entry.contract_id) ? entry.contract_id : null),
  data_domains: (entry) => (isNonEmptyString(entry.domain_id) ? entry.domain_id : null),
  gaps: (entry) => (isNonEmptyString(entry.issue_id) ? entry.issue_id : null),
  contradictions: (entry) => (isNonEmptyString(entry.issue_id) ? entry.issue_id : null),
  unknowns: (entry) => (isNonEmptyString(entry.issue_id) ? entry.issue_id : null),
  uncertainty_to_spike: (entry) =>
    isNonEmptyString(entry.unknown_id) && isNonEmptyString(entry.spike_item_id)
      ? `${entry.unknown_id}::${entry.spike_item_id}`
      : null,
  delivered_lineage_notes: (entry) => (isNonEmptyString(entry.lineage_note_id) ? entry.lineage_note_id : null),
  items: (entry) => (isNonEmptyString(entry.item_id) ? entry.item_id : null),
  relations: (entry) => {
    if (isNonEmptyString(entry.relation_id)) {
      return entry.relation_id;
    }
    const from = asStringRecord(entry.from);
    const to = asStringRecord(entry.to);
    return isNonEmptyString(entry.relation_type) &&
      isNonEmptyString(from.kind) &&
      isNonEmptyString(from.id) &&
      isNonEmptyString(to.kind) &&
      isNonEmptyString(to.id)
      ? `${entry.relation_type}:${from.kind}:${from.id}:${to.kind}:${to.id}`
      : null;
  },
  proofs: (entry) => (isNonEmptyString(entry.proof_id) ? entry.proof_id : null),
  track_proofs: (entry) => (isNonEmptyString(entry.track_proof_id) ? entry.track_proof_id : null),
  reviews: (entry) => (isNonEmptyString(entry.review_id) ? entry.review_id : null),
  waivers: (entry) => (isNonEmptyString(entry.waiver_id) ? entry.waiver_id : null),
  roadmap_matrix: (entry) => {
    if (isNonEmptyString(entry.row_id)) {
      return entry.row_id;
    }
    const itemRef = asStringRecord(entry.item_ref);
    return isNonEmptyString(itemRef.id) ? itemRef.id : null;
  },
};

type MergeablePacketRecord =
  | ArchitectureClaim
  | NegativeScopeEntry
  | QualityAttributeEntry
  | PolicyDecisionEntry
  | ContractLedgerEntry
  | DataDomain
  | LedgerIssueEntry
  | UncertaintyToSpikeEntry
  | DeliveredLineageNote
  | DiscoveryItem
  | DiscoveryRelation
  | ProofBundle
  | TrackProof
  | ReviewArtifact
  | Waiver
  | RoadmapMatrixEntry
  | ValueStream
  | Track
  | TrackGate
  | TrackJourney
  | SourceExclusion;

export interface SourceInputSpec {
  authority: SourceAuthorityClass;
  kind: SourceKind;
  notes?: string;
  precedence?: number;
  ref: string;
  sourceId?: string;
}

export interface DiscoverySourcePacket {
  source?: Partial<SourceAuthorityRef>;
  replace_sections?: PacketSectionKey[];
  id_strategy?: BacklogFile['id_strategy'];
  glossary?: Record<string, string>;
  aliases?: Record<string, string[]>;
  source_exclusions?: SourceExclusion[];
  target_system?: Partial<TargetSystemModel>;
  value_streams?: ValueStream[];
  tracks?: Track[];
  track_gates?: TrackGate[];
  track_journeys?: TrackJourney[];
  as_built?: Partial<AsBuiltModel>;
  claims?: ArchitectureClaim[];
  negative_scope?: NegativeScopeEntry[];
  quality_attributes?: QualityAttributeEntry[];
  policy_decisions?: PolicyDecisionEntry[];
  contracts?: ContractLedgerEntry[];
  data_domains?: DataDomain[];
  gaps?: LedgerIssueEntry[];
  contradictions?: LedgerIssueEntry[];
  unknowns?: LedgerIssueEntry[];
  uncertainty_to_spike?: UncertaintyToSpikeEntry[];
  delivered_lineage_notes?: DeliveredLineageNote[];
  items?: DiscoveryItem[];
  relations?: DiscoveryRelation[];
  proofs?: ProofBundle[];
  track_proofs?: TrackProof[];
  reviews?: ReviewArtifact[];
  waivers?: Waiver[];
  roadmap_matrix?: RoadmapMatrixEntry[];
}

export interface ResolvedSourceInput {
  content: string;
  fingerprint: string;
  normalizedRef: string;
  packetBlocks: DiscoverySourcePacket[];
  source: SourceAuthorityRef;
}

export interface SourceRefreshResult {
  accessStateChangedSourceIds: string[];
  changedSourceIds: string[];
  inaccessibleSources: string[];
}

export interface RefreshRunSourcesResult extends SourceRefreshResult {
  legacyLayoutMessage?: string;
  missingArtifacts: string[];
  runDir: string;
  unsupportedSchemaMessages: string[];
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fingerprintContent(content: string): string {
  return `sha256:${crypto.createHash('sha256').update(content).digest('hex')}`;
}

function isHttpRef(ref: string): boolean {
  return ref.startsWith('http://') || ref.startsWith('https://');
}

function isFileUrl(ref: string): boolean {
  return ref.startsWith('file://');
}

function sanitizeIdPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function deriveSourceId(kind: SourceKind, normalizedRef: string, usedIds: Set<string>): string {
  const refName = isHttpRef(normalizedRef)
    ? new URL(normalizedRef).pathname.split('/').filter(Boolean).at(-1) ?? 'source'
    : path.parse(isFileUrl(normalizedRef) ? fileURLToPath(normalizedRef) : normalizedRef).name || 'source';
  const baseId = `src-${sanitizeIdPart(kind)}-${sanitizeIdPart(refName) || 'source'}`;
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  const suffix = crypto.createHash('sha256').update(normalizedRef).digest('hex').slice(0, 8);
  const candidate = `${baseId}-${suffix}`;
  usedIds.add(candidate);
  return candidate;
}

function normalizeSourceRef(ref: string, baseDir: string): string {
  if (isHttpRef(ref) || isFileUrl(ref)) {
    return ref;
  }

  return path.resolve(baseDir, ref);
}

async function readSourceContent(ref: string, baseDir: string): Promise<{ content: string; normalizedRef: string }> {
  const normalizedRef = normalizeSourceRef(ref, baseDir);
  if (isHttpRef(normalizedRef)) {
    const response = await fetch(normalizedRef);
    if (!response.ok) {
      throw new Error(`Failed to read source ${normalizedRef}: ${response.status} ${response.statusText}`);
    }
    return {
      content: await response.text(),
      normalizedRef,
    };
  }

  const filePath = isFileUrl(normalizedRef) ? fileURLToPath(normalizedRef) : normalizedRef;
  return {
    content: fs.readFileSync(filePath, 'utf8'),
    normalizedRef,
  };
}

function looksLikePacket(payload: unknown): payload is DiscoverySourcePacket {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return false;
  }

  const record = payload as Record<string, unknown>;
  return (
    PACKET_SECTION_KEYS.some((key) => key in record) ||
    ('source' in record && typeof record.source === 'object' && record.source !== null)
  );
}

function parsePacketPayload(payload: unknown, packetRef: string): DiscoverySourcePacket[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((entry) => parsePacketPayload(entry, packetRef));
  }

  if (looksLikePacket(payload)) {
    return [cloneJson(payload)];
  }

  const record = asStringRecord(payload);
  if (Array.isArray(record.packets)) {
    return record.packets.flatMap((entry: unknown) => parsePacketPayload(entry, packetRef));
  }

  throw new Error(`Source packet ${packetRef} does not contain a valid architecture-backlog packet`);
}

function extractPacketBlocksFromMarkdown(content: string, packetRef: string): DiscoverySourcePacket[] {
  const packets: DiscoverySourcePacket[] = [];
  const fencePattern = /```([^\n]*)\n([\s\S]*?)```/g;
  let match = fencePattern.exec(content);

  while (match !== null) {
    const infoString = match[1]?.trim() ?? '';
    if (!PACKET_FENCE_MARKERS.some((marker) => infoString.includes(marker))) {
      match = fencePattern.exec(content);
      continue;
    }

    const block = match[2]?.trim() ?? '';
    if (!block) {
      match = fencePattern.exec(content);
      continue;
    }

    const parsed: unknown = JSON.parse(block);
    packets.push(...parsePacketPayload(parsed, packetRef));
    match = fencePattern.exec(content);
  }

  return packets;
}

export function parseDiscoverySourcePackets(content: string, packetRef: string): DiscoverySourcePacket[] {
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return parsePacketPayload(parsed, packetRef);
  } catch {
    return extractPacketBlocksFromMarkdown(content, packetRef);
  }
}

function mergeValues(baseValue: unknown, incomingValue: unknown): unknown {
  if (incomingValue === undefined) {
    return cloneJson(baseValue);
  }
  if (baseValue === undefined) {
    return cloneJson(incomingValue);
  }
  if (Array.isArray(baseValue) && Array.isArray(incomingValue)) {
    const merged = [...(baseValue as unknown[]), ...(incomingValue as unknown[])].map((entry) =>
      cloneJson(entry),
    );
    const seen = new Set<string>();
    const deduped: unknown[] = [];
    for (const entry of merged) {
      const key = hashJsonValue(entry);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      deduped.push(entry);
    }
    return deduped;
  }
  if (
    typeof baseValue === 'object' &&
    baseValue !== null &&
    !Array.isArray(baseValue) &&
    typeof incomingValue === 'object' &&
    incomingValue !== null &&
    !Array.isArray(incomingValue)
  ) {
    const merged: Record<string, unknown> = {};
    const keys = new Set([
      ...Object.keys(baseValue as Record<string, unknown>),
      ...Object.keys(incomingValue as Record<string, unknown>),
    ]);
    for (const key of keys) {
      merged[key] = mergeValues(
        (baseValue as Record<string, unknown>)[key],
        (incomingValue as Record<string, unknown>)[key],
      );
    }
    return merged;
  }

  return cloneJson(incomingValue);
}

function upsertArraySection<T extends MergeablePacketRecord>(
  current: T[],
  incoming: T[],
  sectionKey: PacketSectionKey,
): T[] {
  const idSelector = SECTION_ID_SELECTORS[sectionKey];
  if (!idSelector) {
    return mergeValues(current, incoming) as T[];
  }

  const merged = current.map((entry) => cloneJson(entry));
  const indexById = new Map<string, number>();
  for (const [index, entry] of merged.entries()) {
    const entryId = idSelector(entry as Record<string, unknown>);
    if (entryId) {
      indexById.set(entryId, index);
    }
  }

  for (const incomingEntry of incoming) {
    const entryId = idSelector(incomingEntry as Record<string, unknown>);
    if (!entryId) {
      merged.push(cloneJson(incomingEntry));
      continue;
    }
    const existingIndex = indexById.get(entryId);
    if (existingIndex === undefined) {
      indexById.set(entryId, merged.length);
      merged.push(cloneJson(incomingEntry));
      continue;
    }
    merged[existingIndex] = mergeValues(merged[existingIndex], incomingEntry) as T;
  }

  return merged;
}

const SOURCE_REF_SECTIONS = new Set<PacketSectionKey>([
  'claims',
  'negative_scope',
  'quality_attributes',
  'policy_decisions',
  'gaps',
  'contradictions',
  'unknowns',
]);

function defaultSourceRefs<T extends Record<string, unknown>>(
  entries: T[],
  sourceId: string | null,
  sectionKey: PacketSectionKey,
): T[] {
  if (!sourceId) {
    return entries.map((entry) => cloneJson(entry));
  }

  return entries.map((entry) => {
    const cloned = cloneJson(entry) as Record<string, unknown>;
    if (
      'source_refs' in cloned &&
      Array.isArray(cloned.source_refs) &&
      cloned.source_refs.length > 0
    ) {
      return cloned as T;
    }
    if (SOURCE_REF_SECTIONS.has(sectionKey)) {
      cloned.source_refs = [sourceId];
    }
    return cloned as T;
  });
}

function assignAuthoritativePrecedence(backlog: BacklogFile): void {
  const authoritativeSources = backlog.source_authority.filter(
    (source) =>
      source.authority === 'authoritative_target_truth' ||
      source.authority === 'authoritative_current_truth',
  );

  authoritativeSources.sort((left, right) => {
    const leftPrecedence = Number.isInteger(left.precedence) ? Number(left.precedence) : Number.MAX_SAFE_INTEGER;
    const rightPrecedence = Number.isInteger(right.precedence) ? Number(right.precedence) : Number.MAX_SAFE_INTEGER;
    if (leftPrecedence !== rightPrecedence) {
      return leftPrecedence - rightPrecedence;
    }
    return String(left.source_id ?? '').localeCompare(String(right.source_id ?? ''));
  });

  authoritativeSources.forEach((source, index) => {
    source.precedence = index + 1;
  });
}

export async function resolveSourceInputs(
  specs: SourceInputSpec[],
  baseDir: string,
): Promise<ResolvedSourceInput[]> {
  const usedIds = new Set<string>();
  const resolved: ResolvedSourceInput[] = [];

  for (const spec of specs) {
    const { content, normalizedRef } = await readSourceContent(spec.ref, baseDir);
    const packetBlocks = parseDiscoverySourcePackets(content, normalizedRef);
    const sourceId = isNonEmptyString(spec.sourceId)
      ? spec.sourceId
      : deriveSourceId(spec.kind, normalizedRef, usedIds);
    usedIds.add(sourceId);
    resolved.push({
      content,
      fingerprint: fingerprintContent(content),
      normalizedRef,
      packetBlocks,
      source: {
        source_id: sourceId,
        ref: normalizedRef,
        kind: spec.kind,
        authority: spec.authority,
        ...(spec.precedence !== undefined ? { precedence: spec.precedence } : {}),
        ...(spec.notes !== undefined ? { notes: spec.notes } : {}),
      },
    });
  }

  return resolved;
}

export async function loadSourcePacketRefs(
  packetRefs: string[],
  baseDir: string,
): Promise<DiscoverySourcePacket[]> {
  const packets: DiscoverySourcePacket[] = [];
  for (const packetRef of packetRefs) {
    const { content, normalizedRef } = await readSourceContent(packetRef, baseDir);
    packets.push(...parseDiscoverySourcePackets(content, normalizedRef));
  }
  return packets;
}

function mergeSourceAuthorityEntry(
  backlog: BacklogFile,
  source: SourceAuthorityRef,
): string | null {
  if (!isNonEmptyString(source.source_id)) {
    return null;
  }

  const current = backlog.source_authority.find((entry) => entry.source_id === source.source_id);
  if (!current) {
    backlog.source_authority.push(cloneJson(source));
    return source.source_id;
  }

  const merged = mergeValues(current, source) as SourceAuthorityRef;
  Object.assign(current, merged);
  return source.source_id;
}

export function mergeDiscoveryPacketsIntoBacklog(
  backlog: BacklogFile,
  rawSources: ResolvedSourceInput[],
  packets: DiscoverySourcePacket[],
): { appliedPackets: number; appliedSourceIds: string[] } {
  const appliedSourceIds = new Set<string>();

  for (const source of rawSources) {
    const sourceId = mergeSourceAuthorityEntry(backlog, {
      ...source.source,
      fingerprint: source.fingerprint,
    });
    if (sourceId) {
      appliedSourceIds.add(sourceId);
    }
  }

  const allPackets = [
    ...rawSources.flatMap((source) =>
      source.packetBlocks.map((packet) => ({ packet, fallbackSource: source.source })),
    ),
    ...packets.map((packet) => ({ packet, fallbackSource: null as SourceAuthorityRef | null })),
  ];

  for (const { fallbackSource, packet } of allPackets) {
    const mergedSource = mergeValues(fallbackSource ?? {}, packet.source ?? {}) as SourceAuthorityRef;
    if (
      fallbackSource &&
      isNonEmptyString(fallbackSource.source_id) &&
      isNonEmptyString(packet.source?.source_id) &&
      fallbackSource.source_id !== packet.source.source_id
    ) {
      backlog.source_authority = backlog.source_authority.filter(
        (entry) => entry.source_id !== fallbackSource.source_id,
      );
      appliedSourceIds.delete(fallbackSource.source_id);
    }
    const sourceId = mergeSourceAuthorityEntry(backlog, mergedSource);
    if (sourceId) {
      appliedSourceIds.add(sourceId);
    }

    const replaceSections = new Set(asArray(packet.replace_sections).filter(isNonEmptyString));

    if (packet.id_strategy) {
      backlog.id_strategy = mergeValues(
        replaceSections.has('id_strategy') ? {} : backlog.id_strategy,
        packet.id_strategy,
      ) as BacklogFile['id_strategy'];
    }

    if (packet.glossary) {
      backlog.glossary = mergeValues(
        replaceSections.has('glossary') ? {} : backlog.glossary,
        packet.glossary,
      ) as BacklogFile['glossary'];
    }

    if (packet.aliases) {
      backlog.aliases = mergeValues(
        replaceSections.has('aliases') ? {} : backlog.aliases,
        packet.aliases,
      ) as BacklogFile['aliases'];
    }

    if (packet.target_system) {
      backlog.target_system = mergeValues(
        replaceSections.has('target_system') ? {} : backlog.target_system,
        packet.target_system,
      ) as TargetSystemModel;
    }

    if (packet.as_built) {
      backlog.as_built = mergeValues(
        replaceSections.has('as_built') ? {} : backlog.as_built,
        packet.as_built,
      ) as AsBuiltModel;
    }

    for (const sectionKey of PACKET_SECTION_KEYS) {
      if (
        sectionKey === 'id_strategy' ||
        sectionKey === 'glossary' ||
        sectionKey === 'aliases' ||
        sectionKey === 'target_system' ||
        sectionKey === 'as_built'
      ) {
        continue;
      }

      const sectionValue = packet[sectionKey];
      if (!sectionValue) {
        continue;
      }

      if (!Array.isArray(sectionValue)) {
        continue;
      }

      const entries = defaultSourceRefs(
        sectionValue as Record<string, unknown>[],
        sourceId,
        sectionKey,
      ) as MergeablePacketRecord[];
      if (replaceSections.has(sectionKey)) {
        backlog[sectionKey] = cloneJson(entries) as never;
        continue;
      }

      backlog[sectionKey] = upsertArraySection(
        backlog[sectionKey] as MergeablePacketRecord[],
        entries,
        sectionKey,
      ) as never;
    }
  }

  assignAuthoritativePrecedence(backlog);
  backlog.metadata.updated_at = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  return {
    appliedPackets: allPackets.length,
    appliedSourceIds: [...appliedSourceIds].sort(),
  };
}

export async function refreshSourceFingerprintsInBacklog(
  backlog: BacklogFile,
  baseDir: string,
): Promise<SourceRefreshResult> {
  const accessStateChangedSourceIds: string[] = [];
  const changedSourceIds: string[] = [];
  const inaccessibleSources: string[] = [];
  const refreshedAt = utcNow();

  for (const source of backlog.source_authority) {
    if (!isNonEmptyString(source.source_id) || !isNonEmptyString(source.ref)) {
      continue;
    }

    try {
      const { content, normalizedRef } = await readSourceContent(source.ref, baseDir);
      const fingerprint = fingerprintContent(content);
      const accessStateChanged =
        source.last_access_status !== 'ok' ||
        source.last_access_error !== null ||
        source.last_accessed_at !== refreshedAt;
      if (source.ref !== normalizedRef) {
        source.ref = normalizedRef;
      }
      if (source.fingerprint !== fingerprint) {
        source.fingerprint = fingerprint;
        changedSourceIds.push(source.source_id);
      }
      source.last_access_status = 'ok';
      source.last_access_error = null;
      source.last_accessed_at = refreshedAt;
      if (accessStateChanged) {
        accessStateChangedSourceIds.push(source.source_id);
      }
    } catch {
      const accessStateChanged =
        source.last_access_status !== 'inaccessible' ||
        source.last_access_error !== 'Unable to read source ref' ||
        source.last_accessed_at !== refreshedAt;
      source.last_access_status = 'inaccessible';
      source.last_access_error = 'Unable to read source ref';
      source.last_accessed_at = refreshedAt;
      inaccessibleSources.push(source.source_id);
      if (accessStateChanged) {
        accessStateChangedSourceIds.push(source.source_id);
      }
    }
  }

  if (changedSourceIds.length > 0 || accessStateChangedSourceIds.length > 0) {
    backlog.metadata.updated_at = refreshedAt;
  }

  return {
    accessStateChangedSourceIds: [...new Set(accessStateChangedSourceIds)].sort(),
    changedSourceIds: [...new Set(changedSourceIds)].sort(),
    inaccessibleSources: [...new Set(inaccessibleSources)].sort(),
  };
}

export async function refreshRunSourceFingerprints(
  runDirInput: string,
): Promise<RefreshRunSourcesResult> {
  const bundleRepair = repairCompactRunBundle(runDirInput);
  if (
    bundleRepair.legacyLayoutMessage ||
    bundleRepair.irreparableMissingArtifacts.length > 0 ||
    bundleRepair.unsupportedSchemaMessages.length > 0
  ) {
    return {
      accessStateChangedSourceIds: [],
      changedSourceIds: [],
      inaccessibleSources: [],
      ...(bundleRepair.legacyLayoutMessage ? { legacyLayoutMessage: bundleRepair.legacyLayoutMessage } : {}),
      missingArtifacts: bundleRepair.irreparableMissingArtifacts,
      runDir: bundleRepair.runDir,
      unsupportedSchemaMessages: bundleRepair.unsupportedSchemaMessages,
    };
  }

  const {
    backlog,
    legacyLayoutMessage,
    manifest,
    missingArtifacts,
    runDir,
    unsupportedSchemaMessages,
  } = loadCompactRunArtifacts(runDirInput);

  if (legacyLayoutMessage || missingArtifacts.length > 0 || unsupportedSchemaMessages.length > 0) {
    return {
      accessStateChangedSourceIds: [],
      changedSourceIds: [],
      inaccessibleSources: [],
      ...(legacyLayoutMessage ? { legacyLayoutMessage } : {}),
      missingArtifacts,
      runDir,
      unsupportedSchemaMessages,
    };
  }

  if (!backlog || !manifest) {
    return {
      accessStateChangedSourceIds: [],
      changedSourceIds: [],
      inaccessibleSources: [],
      missingArtifacts: [],
      runDir,
      unsupportedSchemaMessages: [],
    };
  }

  const refreshResult = await refreshSourceFingerprintsInBacklog(backlog, process.cwd());
  if (refreshResult.changedSourceIds.length > 0 || refreshResult.accessStateChangedSourceIds.length > 0) {
    const refreshedAt = utcNow();
    backlog.metadata.updated_at = refreshedAt;
    manifest.updated_at = refreshedAt;
    const paths = runPaths(runDir);
    writeJson(paths.backlog, backlog);
    writeJson(paths.manifest, manifest);
    appendNdjson(paths.journal, {
      ts: refreshedAt,
      event: 'source_fingerprints_refreshed',
      run_id: manifest.run_id,
      changed_source_ids: refreshResult.changedSourceIds,
      access_state_changed_source_ids: refreshResult.accessStateChangedSourceIds,
      inaccessible_source_ids: refreshResult.inaccessibleSources,
    });
  }

  return {
    ...refreshResult,
    missingArtifacts: [],
    runDir,
    unsupportedSchemaMessages: [],
  };
}
