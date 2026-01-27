import type { StringValue } from 'ms';

import { addMilliseconds, startOfDay } from 'date-fns';
import ms from 'ms';

export function isSessionAgeValid(age: StringValue | null, from: Date, to = new Date()): boolean {
  if (!age)
    return true;

  return to.getTime() - from.getTime() < ms(age);
}

export function isSessionFixedPeriodValid(period: `${StringValue}+${StringValue}` | null, from: Date): boolean {
  if (!period)
    return true;

  const [startOffset, endOffset] = period.split('+');

  const cutoff = addMilliseconds(startOfDay(addMilliseconds(from, ms(startOffset as StringValue))), ms(endOffset as StringValue));

  return new Date().getTime() < cutoff.getTime();
}
