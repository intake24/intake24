export function jsonDateReviver(key: string, value: unknown): unknown {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) ? new Date(value) : value;
}
