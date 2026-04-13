export type LooseRecord = Record<string, unknown>;

export type IncidentSeverity = 'high' | 'medium' | 'low';
export type ScopeConfidence = 'high' | 'medium' | 'low';

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

export interface SkillsSummary {
  exists: boolean;
  skills: SkillSummary[];
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
}

export interface ScanSummary {
  generatedAt: string;
  inputs: {
    session: string | null;
    logsDir: string | null;
    artifactsDir: string | null;
    skillsDir: string | null;
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
    scope_confidence: ScopeConfidence;
    scope_ambiguities: string[];
  };
  skills: SkillSummary[];
  artifacts: {
    scannedCount: number;
    sample: string[];
  };
  candidateIncidents: CandidateIncident[];
}
