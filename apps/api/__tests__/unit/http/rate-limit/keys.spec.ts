import { aliasAccountKey, emailAccountKey, surveySlugKey } from '@intake24/api/http/rate-limit';

describe('rate limit keys', () => {
  it('email account key should ignore letter case', () => {
    expect(emailAccountKey('Test-User@Example.com')).toBe(emailAccountKey('test-user@example.com'));
  });

  it('email account key should differ for different emails', () => {
    expect(emailAccountKey('a@example.com')).not.toBe(emailAccountKey('b@example.com'));
  });

  it('email account key should not contain the email', () => {
    expect(emailAccountKey('test-user@example.com')).not.toContain('test-user');
  });

  it.each([
    undefined,
    null,
    {},
    ['test-user@example.com'],
    'not-an-email',
    `${'a'.repeat(510)}@example.com`,
  ])('email account key should be undefined for invalid input %#', (input) => {
    expect(emailAccountKey(input)).toBeUndefined();
  });

  it('alias account key should ignore survey slug letter case', () => {
    expect(aliasAccountKey('Test-Survey', 'respondent')).toBe(aliasAccountKey('test-survey', 'respondent'));
  });

  it('alias account key should respect username letter case', () => {
    expect(aliasAccountKey('test-survey', 'Respondent')).not.toBe(aliasAccountKey('test-survey', 'respondent'));
  });

  it('alias account key should not collide with email account key', () => {
    expect(aliasAccountKey('example.com', 'a')).not.toBe(emailAccountKey('a@example.com'));
  });

  it.each([
    [undefined, 'respondent'],
    ['test-survey', undefined],
    ['', 'respondent'],
    ['test-survey', ''],
    [
      's'.repeat(129),
      'respondent',
    ],
    [
      'test-survey',
      'u'.repeat(257),
    ],
    [{}, 'respondent'],
  ])('alias account key should be undefined for invalid input %#', (slug, username) => {
    expect(aliasAccountKey(slug, username)).toBeUndefined();
  });

  it('survey slug key should be lower case', () => {
    expect(surveySlugKey('Test-Survey')).toBe('test-survey');
  });

  it('survey slug key should be undefined for invalid input', () => {
    expect(surveySlugKey('s'.repeat(129))).toBeUndefined();
  });
});
