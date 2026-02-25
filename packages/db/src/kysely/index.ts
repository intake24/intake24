import type { DB as FoodsDB } from './foods';
import type { DB as SystemDB } from './system';

export * from './camel-case-plugin';

export type { FoodsDB, SystemDB };

// This needs to be a feature in kysely-codegen
export type {
  DrinkwareScales as DrinkwareScalesColumns,
  DrinkwareSets as DrinkwareSetsColumns,
} from './foods';
export * from './utils';
