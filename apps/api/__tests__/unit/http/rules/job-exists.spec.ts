import { isValidJob, jobTypes } from '@intake24/common/types';

describe('jobExists rule', () => {
  it('should return true for valid job', () => {
    expect(isValidJob(jobTypes[0])).toBe(true);
  });

  it('should return false for invalid job', () => {
    expect(isValidJob('InvalidJob')).toBe(false);
  });
});
