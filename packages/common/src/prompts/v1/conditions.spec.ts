import { conditionOps } from './conditions';

describe('conditionOps', () => {
  it('equal', () => {
    expect(conditionOps.eq({ value: 1, answer: 1 })).toBe(true);
    expect(conditionOps.eq({ value: 'one', answer: 'one' })).toBe(true);
    expect(conditionOps.eq({
      value: [1],
      answer: 1,
    })).toBe(true);
    expect(conditionOps.eq({
      value: 1,
      answer: [1],
    })).toBe(true);
    expect(conditionOps.eq({
      value: '1',
      answer: [1],
    })).toBe(true);
    expect(conditionOps.eq({
      value: ['1'],
      answer: [1],
    })).toBe(true);
    expect(conditionOps.eq({
      value: [1, 2],
      answer: [1, '2'],
    })).toBe(true);
    expect(conditionOps.eq({
      value: [' one', 'two'],
      answer: ['One', 'two '],
    })).toBe(true);
  });

  it('not equal', () => {
    expect(conditionOps.ne({ value: 'one', answer: 'two' })).toBe(true);
    expect(conditionOps.ne({
      value: [' one', 'two'],
      answer: ['One', 'two '],
    })).toBe(false);
  });

  it('is in', () => {
    expect(conditionOps.in({ value: 'one', answer: 'one' })).toBe(true);
    expect(conditionOps.in({ value: 'one', answer: 'two' })).toBe(false);
    expect(conditionOps.in({
      value: ['One ', '  Two'],
      answer: 'one',
    })).toBe(true);
    expect(conditionOps.in({
      value: ['One ', '  Two'],
      answer: ['one'],
    })).toBe(true);
    expect(conditionOps.in({
      value: ['One ', '  Two'],
      answer: ['one', 'two'],
    })).toBe(true);
    expect(conditionOps.in({
      value: ['One ', '  Two'],
      answer: [],
    })).toBe(false);
  });

  it('is not in', () => {
    expect(conditionOps.notIn({ value: 'one', answer: 'two' })).toBe(true);
    expect(conditionOps.notIn({ value: 'one', answer: 'one' })).toBe(false);
    expect(conditionOps.notIn({
      value: ['One '],
      answer: 'two',
    })).toBe(true);
    expect(conditionOps.notIn({
      value: ['One '],
      answer: 'one',
    })).toBe(false);
    expect(conditionOps.notIn({
      value: ['One '],
      answer: ['two'],
    })).toBe(true);
    expect(conditionOps.notIn({
      value: ['One '],
      answer: ['one'],
    })).toBe(false);
    expect(conditionOps.notIn({
      value: ['One ', 'Two '],
      answer: ['two', 'three'],
    })).toBe(false);
    expect(conditionOps.notIn({
      value: ['One ', 'Two '],
      answer: ['three', 'four'],
    })).toBe(true);
    expect(conditionOps.notIn({
      value: [],
      answer: ['three', 'four'],
    })).toBe(true);
    expect(conditionOps.notIn({
      value: ['One ', 'Two '],
      answer: [],
    })).toBe(true);
  });

  it('greater than equal ', () => {
    expect(conditionOps.gte({ value: 1, answer: 1 })).toBe(true);
    expect(conditionOps.gte({ value: 1, answer: 2 })).toBe(true);
    expect(conditionOps.gte({ value: 1, answer: 0 })).toBe(false);
    expect(conditionOps.gte({ value: '1', answer: '2' })).toBe(true);
    expect(conditionOps.gte({
      value: ['1'],
      answer: ['2'],
    })).toBe(true);
    expect(conditionOps.gte({ value: '1', answer: 'one' })).toBe(false);
    expect(conditionOps.gte({ value: 'two', answer: '3' })).toBe(false);
  });

  it('greater than', () => {
    expect(conditionOps.gt({ value: 1, answer: 1 })).toBe(false);
    expect(conditionOps.gt({ value: 1, answer: 2 })).toBe(true);
    expect(conditionOps.gt({ value: 1, answer: 0 })).toBe(false);
    expect(conditionOps.gt({ value: '1', answer: '2' })).toBe(true);
    expect(conditionOps.gt({
      value: ['1'],
      answer: ['2'],
    })).toBe(true);
    expect(conditionOps.gt({ value: '1', answer: 'one' })).toBe(false);
  });

  it('lower than equal ', () => {
    expect(conditionOps.lte({ value: 1, answer: 1 })).toBe(true);
    expect(conditionOps.lte({ value: 2, answer: 1 })).toBe(true);
    expect(conditionOps.lte({ value: 0, answer: 1 })).toBe(false);
    expect(conditionOps.lte({ value: '2', answer: '1' })).toBe(true);
    expect(conditionOps.lte({
      value: ['2'],
      answer: ['1'],
    })).toBe(true);
    expect(conditionOps.lte({ value: 'one', answer: '1' })).toBe(false);
    expect(conditionOps.lte({ value: '3', answer: 'two' })).toBe(false);
  });

  it('lower than', () => {
    expect(conditionOps.lt({ value: 1, answer: 1 })).toBe(false);
    expect(conditionOps.lt({ value: 2, answer: 1 })).toBe(true);
    expect(conditionOps.lt({ value: 0, answer: 1 })).toBe(false);
    expect(conditionOps.lt({ value: '2', answer: '1' })).toBe(true);
    expect(conditionOps.lt({
      value: ['2'],
      answer: ['1'],
    })).toBe(true);
    expect(conditionOps.lt({ value: '1', answer: 'one' })).toBe(false);
  });
});
