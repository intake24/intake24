import { isValidJob, jobTypes } from '@intake24/common/types';
import { pickJobParams } from '@intake24/common/types/jobs';

describe('jobExists rule', () => {
  it('should return true for valid job', () => {
    expect(isValidJob(jobTypes[0])).toBe(true);
  });

  it('should return false for invalid job', () => {
    expect(isValidJob('InvalidJob')).toBe(false);
  });

  it('should pick correct job parameters', () => {
    const params = pickJobParams(
      { a: 1, b: 2, c: 3, sourceLocaleId: 'locale1', localeId: 'locale2' },
      'LocaleCopy',
    );
    expect(params).toStrictEqual({ sourceLocaleId: 'locale1', localeId: 'locale2' });
  });
});
