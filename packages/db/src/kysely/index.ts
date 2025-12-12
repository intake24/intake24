import type { DB as FoodsDB } from './foods';
import type { DB as SystemDB } from './system';

export type { FoodsDB, SystemDB };
export type { JsonValue } from './foods';

// This needs to be a feature in kysely-codegen
export type {
  DrinkwareScales as DrinkwareScalesColumns,
  DrinkwareSets as DrinkwareSetsColumns,
} from './foods';
export { executeWithPagination } from './utils';
