import { copy, randomString } from '@intake24/common/util';

export function toIndexedList<T extends object>(items: T[]): (T & { id: number })[] {
  return items.map((item, idx) => ({ ...item, id: idx }));
}

export function withIdList<T extends object>(items: T[]): (T & { id: string })[] {
  return items.map(item => copy({
    ...item,
    id: randomString(6),
  }));
}

export function withId<T>(item: T): T & { _id: string } {
  return {
    ...item,
    _id: randomString(6),
  };
}

export const withoutId = <T extends { _id: string }>({ _id, ...rest }: T): Omit<T, '_id'> => rest;

export function withIdAndOrder<T>(item: T, index: number): T & { _id: string; orderBy: string } {
  return {
    ...item,
    _id: randomString(6),
    orderBy: index.toString(),
  };
}

export function withoutIdAndOrder<T extends { _id: string; orderBy: string }>({ _id, ...rest }: T, index: number): Omit<T, '_id'> {
  return {
    ...rest,
    orderBy: index.toString(),
  };
}
