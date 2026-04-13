export interface HelpOption {
  flags: string;
  description: string;
}

export interface OptionSpec {
  name: string;
  type: 'string' | 'boolean';
  aliases?: string[];
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
  run(input: TInput): Promise<void> | void;
}

export type AnyCommandDefinition = CommandDefinition<unknown>;

export interface CommonCommandInput {
  session?: string;
  sessionId?: string;
  logsDir?: string;
  artifactsDir?: string;
  skillsDir?: string;
}

export interface ScanCommandInput extends CommonCommandInput {
  out: string;
  pretty: boolean;
}

export interface ReportCommandInput extends CommonCommandInput {
  out: string;
  phase?: string;
  title?: string;
}

export interface SkillAuditCommandInput extends CommonCommandInput {
  out: string;
}

export interface LoggingReviewCommandInput extends CommonCommandInput {
  out: string;
}
