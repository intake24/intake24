import { cron } from '@intake24/common/rules';

describe('cron rule', () => {
  it('should return true for valid cron', () => {
    expect(cron('* * * * *')).toBe(true);
  });

  it('should return false for invalid cron', () => {
    expect(cron('this is not a cron entry')).toBe(false);
  });
});
