export default class InsufficientStorageError extends Error {
  constructor(message?: string) {
    super(message ?? 'InsufficientStorageError');
  }
}
