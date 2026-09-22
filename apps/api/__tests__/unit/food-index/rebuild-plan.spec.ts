import { planRebuild } from '@intake24/api/food-index/workers/rebuild-plan';

describe('food index rebuild planning', () => {
  it('ignores requests for locales that are not enabled', () => {
    const plan = planRebuild(['en_GB', 'disabled'], ['en_GB'], ['en_GB']);

    expect([...plan.build]).toEqual(['en_GB']);
    expect(plan.ignored).toEqual(['disabled']);
  });

  it('builds enabled locales that have no index yet even when they were not requested', () => {
    const plan = planRebuild(['en_GB'], ['en_GB', 'newly_enabled'], ['en_GB']);

    expect([...plan.build].sort()).toEqual(['en_GB', 'newly_enabled']);
    expect(plan.ignored).toEqual([]);
  });

  it('drops indexes for locales that are no longer enabled', () => {
    const plan = planRebuild(['en_GB'], ['en_GB'], ['en_GB', 'was_enabled']);

    expect(plan.drop).toEqual(['was_enabled']);
    expect([...plan.build]).toEqual(['en_GB']);
  });

  it('drops a disabled locale even when a rebuild was explicitly requested for it', () => {
    const plan = planRebuild(['disabled'], ['en_GB'], ['en_GB', 'disabled']);

    expect(plan.drop).toEqual(['disabled']);
    expect(plan.ignored).toEqual(['disabled']);
    expect([...plan.build]).toEqual([]);
  });

  it('builds every enabled locale when no specific locales are requested', () => {
    const plan = planRebuild(undefined, ['en_GB', 'en_AU'], ['en_GB']);

    expect([...plan.build].sort()).toEqual(['en_AU', 'en_GB']);
    expect(plan.drop).toEqual([]);
  });

  it('builds only the missing indexes when an empty locale list is requested', () => {
    // Guards against treating "no locales requested" as "rebuild everything".
    const plan = planRebuild([], ['en_GB', 'newly_enabled'], ['en_GB']);

    expect([...plan.build]).toEqual(['newly_enabled']);
  });

  it('collapses duplicate requested locales', () => {
    const plan = planRebuild(['en_GB', 'en_GB', 'nope', 'nope'], ['en_GB'], ['en_GB']);

    expect([...plan.build]).toEqual(['en_GB']);
    expect(plan.ignored).toEqual(['nope']);
  });

  it('never builds and drops the same locale', () => {
    const plan = planRebuild(
      ['en_GB', 'disabled'],
      ['en_GB', 'newly_enabled'],
      ['en_GB', 'disabled', 'also_disabled'],
    );

    for (const localeId of plan.drop)
      expect(plan.build.has(localeId)).toBe(false);

    expect(plan.drop.sort()).toEqual(['also_disabled', 'disabled']);
    expect([...plan.build].sort()).toEqual(['en_GB', 'newly_enabled']);
  });
});
