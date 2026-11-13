import { assertNoRemovedEnvVariables } from '@intake24/api/config/rate-limiter';

describe('rate limiter config', () => {
  it('should accept environment without removed variables', () => {
    expect(() => assertNoRemovedEnvVariables({ RATE_LIMITER_LOGIN_ACCOUNT_LIMIT: '5' })).not.toThrow();
  });

  it.each([
    ['RATE_LIMITER_GENERIC_LIMIT', 'RATE_LIMITER_GENERIC_ANONYMOUS_LIMIT'],
    ['RATE_LIMITER_LOGIN_WINDOW', 'RATE_LIMITER_LOGIN_ACCOUNT_IP_WINDOW'],
    ['RATE_LIMITER_PASSWORD_LIMIT', 'RATE_LIMITER_PASSWORD_RESET_ACCOUNT_LIMIT'],
    ['RATE_LIMITER_GEN_USER_WINDOW', 'RATE_LIMITER_GENERATE_USER_SURVEY_WINDOW'],
  ])('should reject removed variable %s and name its replacement', (removed, replacement) => {
    expect(() => assertNoRemovedEnvVariables({ [removed]: '1' })).toThrow(replacement);
  });

  it('should reject removed variable set to an empty value', () => {
    expect(() => assertNoRemovedEnvVariables({ RATE_LIMITER_LOGIN_LIMIT: '' })).toThrow('RATE_LIMITER_LOGIN_LIMIT');
  });
});
