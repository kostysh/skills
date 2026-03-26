import fs from 'node:fs';
import path from 'node:path';

export const SCHEMA_VERSION = '1';

export const PHASE_STATES = [
  'initialized',
  'sources_resolved',
  'target_reconstructed',
  'as_built_reconstructed',
  'claims_extracted',
  'graph_built',
  'sliced',
  'contracts_bound',
  'proof_bound',
  'validated',
  'reviewed',
  'rendered',
  'closed',
] as const;

export const ACCEPTANCE_CLASSES = ['draft-only', 'planning-grade', 'implementation-grade'] as const;

export const ITEM_CLASSES = [
  'capability_seam',
  'feature_slice',
  'control_guardrail',
  'migration',
  'retirement',
  'spike_discovery',
  'operational_enablement',
  'documentation_support_enablement',
] as const;

export const RELATION_TYPES = [
  'realizes',
  'decomposes_into',
  'depends_on',
  'blocked_by',
  'governed_by',
  'migrates_from',
  'retires',
  'replaces',
  'proves',
  'reviewed_by',
  'belongs_to_track',
  'touches_contract',
  'touches_data_domain',
  'enabled_by',
] as const;

export const SUMMARY_LABELS = [
  'Implemented',
  'Partially implemented',
  'Planned',
  'Missing',
  'Blocked',
  'Needs clarification',
] as const;

export type PhaseState = (typeof PHASE_STATES)[number];
export type AcceptanceClass = (typeof ACCEPTANCE_CLASSES)[number];
export type ItemClass = (typeof ITEM_CLASSES)[number];
export type RelationType = (typeof RELATION_TYPES)[number];
export type SummaryLabel = (typeof SUMMARY_LABELS)[number];

export interface Manifest {
  schema_version: string;
  run_id: string;
  created_at: string;
  updated_at: string;
  phase_state: PhaseState;
  acceptance_target: AcceptanceClass;
  source_refs: string[];
  source_hashes: Record<string, string>;
  dirty_flags: string[];
  last_validation_status: 'pass' | 'fail' | null;
  last_render_at: string | null;
}

export interface DiscoveryState {
  metadata: {
    schema_version: string;
    run_id: string;
    created_at: string;
  };
  glossary: Record<string, unknown>;
  source_authority: unknown[];
  target_system: Record<string, unknown>;
  as_built: Record<string, unknown>;
  claims: unknown[];
  negative_scope: unknown[];
  quality_attributes: unknown[];
  policy_decisions: unknown[];
  contracts: unknown[];
  items: DiscoveryItem[];
  relations: DiscoveryRelation[];
  proofs: Array<{ proof_id?: string } & Record<string, unknown>>;
  reviews: Array<{ review_id?: string } & Record<string, unknown>>;
  tracks: Track[];
}

export interface DiscoveryItem extends Record<string, unknown> {
  item_id?: string;
  item_class?: ItemClass;
  summary_label?: SummaryLabel;
  title?: string;
  capability_added?: string;
  origin_ref?: string[];
  architectural_scope?: string;
  dependencies?: string[];
  why_now?: string;
  blocked_without?: string;
  risks_gaps?: string;
}

export interface DiscoveryRelation extends Record<string, unknown> {
  relation_type?: RelationType;
  from?: string;
  to?: string;
}

export interface Track {
  track_id: string;
  title: string;
}

export interface ValidationFile {
  schema_version: string;
  run_id: string;
  validated_at: string;
  status: 'not-run' | 'pass' | 'fail';
  errors: string[];
  warnings: string[];
  stats: Record<string, number>;
}

export interface ClosureFile {
  schema_version: string;
  run_id: string;
  status: string;
  acceptance_class: AcceptanceClass | 'draft-only';
  closed_at: string | null;
  reason: string;
}

export function isAcceptanceClass(value: string): value is AcceptanceClass {
  return ACCEPTANCE_CLASSES.includes(value as AcceptanceClass);
}

export function utcNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

export function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function appendNdjson(filePath: string, event: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${JSON.stringify(event)}\n`, 'utf8');
}

export function runPaths(runDir: string) {
  return {
    manifest: path.join(runDir, 'manifest.json'),
    journal: path.join(runDir, 'journal.ndjson'),
    state: path.join(runDir, 'state.snapshot.json'),
    validation: path.join(runDir, 'validation.json'),
    closure: path.join(runDir, 'closure.json'),
    views: path.join(runDir, 'views'),
  };
}
