export type CliIo = {
  stdout: Pick<NodeJS.WriteStream, 'write'>;
  stderr: Pick<NodeJS.WriteStream, 'write'>;
};

export type CommandDefinition = {
  name: string;
  summary: string;
  helpText: () => string;
  execute: (args: string[], io: CliIo) => number | Promise<number>;
};
