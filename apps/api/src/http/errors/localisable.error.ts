export type LocalisableMessage = { key: string; params?: Record<string, string | number> };

export class AggregateLocalisableError extends Error {
  public readonly details: LocalisableMessage[];

  constructor(errors: LocalisableMessage[], options?: ErrorOptions) {
    super('Multiple errors', options);
    this.details = errors;
  }
}

export class LocalisableError extends Error {
  public readonly details: LocalisableMessage;

  constructor(key: string, params?: Record<string, string | number>, options?: ErrorOptions) {
    super(key, options);
    this.details = { key, params };
  }
}
