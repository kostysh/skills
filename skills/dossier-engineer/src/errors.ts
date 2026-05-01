export class DossierError extends Error {
  public readonly exitCode: number;
  public readonly code: string;

  public constructor(message: string, exitCode: number, code: string) {
    super(message);
    this.name = 'DossierError';
    this.exitCode = exitCode;
    this.code = code;
  }
}

export class UsageError extends DossierError {
  public constructor(message: string) {
    super(message, 1, 'usage');
    this.name = 'UsageError';
  }
}

export class BlockedError extends DossierError {
  public constructor(message: string) {
    super(message, 2, 'blocked');
    this.name = 'BlockedError';
  }
}

export class RootNotFoundError extends DossierError {
  public constructor(message: string) {
    super(message, 5, 'root_not_found');
    this.name = 'RootNotFoundError';
  }
}
