import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  destroyRecallHistory,
  handlePopState,
  initRecallHistory,
  pushFullHistoryEntry,
} from './recall-history';

const survey = {
  data: {
    flags: [],
    meals: [],
    selection: { element: null },
  },
  loadState: vi.fn(),
} as unknown as Parameters<typeof initRecallHistory>[0];

describe('handlePopState', () => {
  beforeEach(() => {
    initRecallHistory(survey);
    pushFullHistoryEntry('previous prompt');
  });

  afterEach(() => {
    destroyRecallHistory();
  });

  it('reports backward history traversal', () => {
    const result = handlePopState(new PopStateEvent('popstate', {
      state: { recallHistory: true, stateId: 0 },
    }));

    expect(result).toEqual({ entryType: 'full', direction: 'back' });
  });

  it('reports forward history traversal', () => {
    handlePopState(new PopStateEvent('popstate', {
      state: { recallHistory: true, stateId: 0 },
    }));

    const result = handlePopState(new PopStateEvent('popstate', {
      state: { recallHistory: true, stateId: 1 },
    }));

    expect(result).toEqual({ entryType: 'full', direction: 'forward' });
  });
});
