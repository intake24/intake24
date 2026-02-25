import type { CamelCasePluginOptions, UnknownRow } from 'kysely';

import { CamelCasePlugin } from 'kysely';
import { isPlainObject } from 'lodash-es';

export type ExtendedCamelCasePluginOptions = CamelCasePluginOptions & {
  transformNestedObjects?: string[];
};

export class ExtendedCamelCasePlugin extends CamelCasePlugin {
  constructor(options?: ExtendedCamelCasePluginOptions) {
    super(options);
  }

  protected mapRow(row: UnknownRow): UnknownRow {
    return Object.keys(row).reduce<UnknownRow>((obj, key) => {
      let value = row[key];

      if (Array.isArray(value)) {
        value = value.map(it => (canMap(key, it, this.opt) ? this.mapRow(it) : it));
      }
      else if (canMap(key, value, this.opt)) {
        value = this.mapRow(value);
      }

      obj[this.camelCase(key)] = value;
      return obj;
    }, {});
  }
}

function canMap(key: string, value: unknown, opt: ExtendedCamelCasePluginOptions): value is Record<string, unknown> {
  return isPlainObject(value) && (!opt?.maintainNestedObjectKeys || !!opt.transformNestedObjects?.includes(key));
}
