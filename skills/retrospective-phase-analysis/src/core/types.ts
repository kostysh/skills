export type LooseRecord = Record<string, unknown>;

export type IncidentSeverity = 'high' | 'medium' | 'low';
export type ScopeConfidence = 'high' | 'medium' | 'low';
export type PhaseBoundaryMode = 'artifact_derived' | 'full_trace' | 'until_line' | 'until_ts';
export type ArtifactEvidenceKind =
  | 'stage_artifact_link'
  | 'trace_write'
  | 'trace_patch_target'
  | 'trace_shell_write'
  | 'tool_output_path'
  | 'referenced_only'
  | 'manual_override';
export type ArtifactInclusion = 'auto_included' | 'manual_included' | 'not_included';
export type ReportStatus = 'draft_requires_agent_validation' | 'ready_for_agent_finalization';
export type MetricEvidenceQuality =
  | 'none'
  | 'structured'
  | 'unvalidated_fallback'
  | 'validated_fallback';

export interface MetricSourceQuality {
  quality: MetricEvidenceQuality;
  reason: string;
}

export interface PhaseBoundary {
  mode: PhaseBoundaryMode;
  until_line: number | null;
  until_ts: string | null;
  reason: string;
  excluded_events_count: number;
}

export interface ArtifactCandidate {
  path: string;
  evidence_kind: ArtifactEvidenceKind;
  event_ref: string | null;
  included: boolean;
  inclusion_source: ArtifactInclusion;
  reason: string;
}

export interface ReviewEvent {
  raw: string;
  details: string[];
  timestamp: string | null;
  verdict: string | null;
}

export interface ParsedStageLog {
  filePath: string;
  raw: string;
  metadata: LooseRecord;
  sections: Record<string, string>;
  reviewEvents: ReviewEvent[];
  processMissLines: string[];
  closeOutLines: string[];
}

export interface SessionSummary {
  filePath: string | undefined;
  sessionId: string | null;
  projectRoot: string | null;
  exists: boolean;
  phaseBoundary: PhaseBoundary;
  eventCount: number;
  parseErrors: Array<{ line: number; message: string }>;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  durationMinutes: number | null;
  abortedTurns: number;
  longGaps: number;
  tools: Record<string, number>;
  sampleEventTypes: string[];
  events: unknown[];
  eventLines: number[];
}

export interface LogMetrics {
  logsTotal: number;
  reviewRoundsTotal: number;
  reviewFindingsTotal: number;
  processMissesTotal: number;
  backlogActualizedCount: number;
  stages: Record<string, number>;
  skillsReferenced: Record<string, number>;
  lateLogStartCount: number;
  sources: {
    candidate_incidents: MetricSourceQuality;
    process_misses: MetricSourceQuality;
    skills_referenced: MetricSourceQuality;
  };
}

export interface LogsSummary {
  exists: boolean;
  logs: ParsedStageLog[];
  metrics: LogMetrics;
}

export interface SkillSummary {
  skillFile: string;
  name: string;
  description: string;
}

export interface SkillCatalogEntry {
  name: string;
  display_name: string;
  path_name: string | null;
  aliases: string[];
  skillFile: string | null;
  description: string;
}

export interface SkillEvidence {
  line: number;
  event_type: string;
  field: string;
  excerpt: string;
  matched_alias: string;
}

export interface ReferencedSkill extends SkillCatalogEntry {
  evidence: SkillEvidence[];
}

export interface SkillTraceSummary {
  available: SkillCatalogEntry[];
  referenced: ReferencedSkill[];
  unreferenced_count: number;
}

export interface CandidateIncident {
  title: string;
  severity: IncidentSeverity;
  stage: string;
  evidence: string;
  reason: string;
}

export interface ScanSourceOptions {
  session?: string;
  logsDir?: string;
  artifactsDir?: string;
  skillsDir?: string;
  outRoot?: string;
  runDir?: string;
  language?: string;
  draft?: boolean;
  untilLine?: number;
  untilTs?: string;
  stageLogs?: string[];
  reviewArtifacts?: string[];
  verificationArtifacts?: string[];
  artifactEvidence?: string;
}

export interface ScopeArtifactIdentity {
  phase_scope: string | null;
  primary_backlog_item_key: string | null;
  primary_feature_id: string | null;
  source: string | null;
}

export interface TraceScopeSummary {
  project_root: string | null;
  mentioned_backlog_items: string[];
  mentioned_features: string[];
  touched_paths: string[];
  referenced_artifacts: string[];
  candidate_stage_logs: string[];
  candidate_review_artifacts: string[];
  candidate_verification_artifacts: string[];
  candidate_step_artifacts: string[];
  artifact_identity: ScopeArtifactIdentity;
  stage_log_candidates: ArtifactCandidate[];
  review_artifact_candidates: ArtifactCandidate[];
  verification_artifact_candidates: ArtifactCandidate[];
  step_artifact_candidates: ArtifactCandidate[];
  scope_confidence: ScopeConfidence;
  scope_ambiguities: string[];
}

export type RetroOutputMode =
  | 'dossier-default'
  | 'fallback-default'
  | 'root-override'
  | 'run-dir'
  | 'draft';

export interface RetroOutputLayout {
  mode: RetroOutputMode;
  root: string;
  scopeSlug: string;
  runSlug: string;
  runDir: string;
  filePath: string;
  files: {
    scanSummary: string;
    retrospectiveReport: string;
    skillAudit: string;
    loggingReview: string;
  };
}

export interface ScanSummary {
  generatedAt: string;
  run_dir: string;
  operator_language: string;
  report_language: string;
  inputs: {
    session: string | null;
    logsDir: string | null;
    artifactsDir: string | null;
    skillsDir: string | null;
    outRoot: string | null;
    runDir: string | null;
    language: string | null;
    draft: boolean;
    untilLine: number | null;
    untilTs: string | null;
    stageLogs: string[];
    reviewArtifacts: string[];
    verificationArtifacts: string[];
    artifactEvidence: string | null;
  };
  resolved: {
    session: string | null;
    logsDir: string | null;
    artifactsDir: string | null;
    skillsDir: string | null;
  };
  dataQuality: {
    sessionPresent: boolean;
    logsPresent: boolean;
    skillCatalogPresent: boolean;
    sessionParseErrors: number;
  };
  phase_boundary: PhaseBoundary;
  session: {
    filePath: string | undefined;
    sessionId: string | null;
    projectRoot: string | null;
    eventCount: number;
    firstTimestamp: string | null;
    lastTimestamp: string | null;
    durationMinutes: number | null;
    abortedTurns: number;
    longGaps: number;
    tools: Record<string, number>;
    sampleEventTypes: string[];
  };
  stageLogs: {
    count: number;
    metrics: LogMetrics;
    files: Array<{
      filePath: string;
      metadata: LooseRecord;
      reviewEvents: number;
      processMissLines: string[];
    }>;
  };
  scope: {
    project_root: string | null;
    mentioned_backlog_items: string[];
    mentioned_features: string[];
    touched_paths: string[];
    referenced_artifacts: string[];
    candidate_stage_logs: string[];
    candidate_review_artifacts: string[];
    candidate_verification_artifacts: string[];
    candidate_step_artifacts: string[];
    artifact_identity: ScopeArtifactIdentity;
    stage_log_candidates: ArtifactCandidate[];
    review_artifact_candidates: ArtifactCandidate[];
    verification_artifact_candidates: ArtifactCandidate[];
    step_artifact_candidates: ArtifactCandidate[];
    scope_confidence: ScopeConfidence;
    scope_ambiguities: string[];
  };
  reportStatus: {
    status: ReportStatus;
    reasons: string[];
  };
  skills: SkillTraceSummary;
  recommendedOutput: RetroOutputLayout;
  candidateIncidents: CandidateIncident[];
}
