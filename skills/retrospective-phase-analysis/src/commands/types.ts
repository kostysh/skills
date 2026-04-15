export interface HelpOption {
  flags: string;
  description: string;
}

export interface OptionSpec {
  name: string;
  type: 'string' | 'boolean';
  aliases?: string[];
  repeatable?: boolean;
  valueLabel?: string;
  description: string;
  required?: boolean;
}

export interface CommandDefinition<TInput> {
  name: string;
  summary: string;
  usage: string[];
  options: OptionSpec[];
  notes?: string[];
  parseArgs(argv: string[]): TInput;
  run(input: TInput): Promise<string | undefined> | string | undefined;
}

export type AnyCommandDefinition = CommandDefinition<unknown>;

export interface CommonCommandInput {
  session?: string;
  logsDir?: string;
  artifactsDir?: string;
  skillsDir?: string;
  outRoot?: string;
  runDir?: string;
  language?: ReportLanguage;
  draft?: boolean;
}

export interface ScanCommandInput extends CommonCommandInput {
  out?: string;
  pretty: boolean;
  untilLine?: number;
  untilTs?: string;
  stageLogs?: string[];
  reviewArtifacts?: string[];
  verificationArtifacts?: string[];
  artifactEvidence?: string;
}

export interface ReportCommandInput extends CommonCommandInput {
  out?: string;
  phase?: string;
  title?: string;
}

export interface SkillAuditCommandInput extends CommonCommandInput {
  out?: string;
}

export interface LoggingReviewCommandInput extends CommonCommandInput {
  out?: string;
}

export type ReportLanguage = string;
