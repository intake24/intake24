export default class ServiceUnavailableError extends Error {
  constructor(message?: string) {
    super(message ?? 'Service unavailable');
  }
}
