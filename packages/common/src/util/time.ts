import { z } from 'zod';

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
