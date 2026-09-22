export default class ServiceTimeoutError extends Error {
  constructor(message?: string) {
    super(message ?? 'Service timeout');
  }
}
