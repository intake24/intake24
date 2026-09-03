import type { DB as FoodsDB } from './foods';
import type { DB as SystemDB } from './system';

export * from './camel-case-plugin';
// This needs to be a feature in kysely-codegen
export type {
  DrinkwareScales as DrinkwareScalesColumns,
  DrinkwareSets as DrinkwareSetsColumns,
} from './foods';

export type { FoodsDB, SystemDB };

export * from './kysely';
export * from './utils';
