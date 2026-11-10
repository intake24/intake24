export const DEFAULT_MAX_DEPTH = 64;

export class MaxDepthExceededError extends Error {
  constructor(maxDepth: number) {
    super(`Input exceeds maximum nesting depth of ${maxDepth}`);
    this.name = 'MaxDepthExceededError';
  }
}
