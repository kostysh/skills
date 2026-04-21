export type CliJsonResult = 'blocked' | 'fail' | 'ok' | 'partial_success';

export interface CliEnvelope<T> {
  command: string;
  data: T;
  next_commands: string[];
  result: CliJsonResult;
  scope: Record<string, unknown>;
  warnings: string[];
}

export function createCliEnvelope<T>(payload: {
  command: string;
  data: T;
  nextCommands?: string[];
  result?: CliJsonResult;
  scope?: Record<string, unknown>;
  warnings?: string[];
}): CliEnvelope<T> {
  return {
    command: payload.command,
    scope: payload.scope ?? {},
    result: payload.result ?? 'ok',
    warnings: payload.warnings ?? [],
    next_commands: payload.nextCommands ?? [],
    data: payload.data,
  };
}

export function writeCliEnvelope<T>(
  stream: Pick<NodeJS.WriteStream, 'write'>,
  payload: Parameters<typeof createCliEnvelope<T>>[0],
): void {
  stream.write(`${JSON.stringify(createCliEnvelope(payload))}\n`);
}
