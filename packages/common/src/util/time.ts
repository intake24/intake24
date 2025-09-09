import type { StringValue } from 'ms';
import ms from 'ms';
import { z } from 'zod';

/*
*  Temp quick validation function
* - for process config load
* - should be provided in v3 or use zod validation in config in future
* */

export function parseToMs(value?: string): StringValue | undefined {
  if (!value)
    return undefined;

  const parsed = ms(value as StringValue);
  if (!parsed)
    return undefined;

  if (parsed.toString() === value)
    throw new Error(`Invalid time format: ${value}`);

  return value as StringValue | undefined;
}

export const time = z.object({
  hours: z.number(),
  minutes: z.number(),
});
export type Time = z.infer<typeof time>;

export function fromTime(time: Time, doubleDigit = true): string {
  const { hours, minutes } = time;

  if (!doubleDigit)
    return `${hours}:${minutes}`;

  return [hours, minutes]
    .map(item => (item.toString().length === 1 ? `0${item}` : item.toString()))
    .join(':');
}

export function toTime(time: string): Time {
  const [hours, minutes] = time.split(':').map(item => Number.parseInt(item, 10));

  return { hours, minutes };
}

export function toMinutes(time: Time | string) {
  const { hours, minutes } = typeof time === 'string' ? toTime(time) : time;

  return hours * 60 + minutes;
}

export const minutesWrapAround = (minutes: number) => (minutes < 0 ? 1440 + minutes : minutes);
