import type { BaseModel, BaseModelCtor, BaseModelStatic, FindOptions } from '@intake24/db';

import { merge } from '@intake24/common/util';
import { Op } from '@intake24/db';

export type UniqueCondition = {
  field: string;
  value: any;
  ci?: boolean;
};

export type UniqueOptions<TAttributes = any> = {
  model: BaseModelStatic;
  condition: UniqueCondition;
  options?: FindOptions<TAttributes>;
};

export default async ({ model, condition, options = { attributes: ['id'] } }: UniqueOptions): Promise<boolean> => {
  const mergedCondition = { ci: true, ...condition };

  const cModel = model as BaseModelCtor<BaseModel>;

  const { field, value, ci } = mergedCondition;
  const op = ci ? cModel.op('ciEq') : Op.eq;

  const findOptions: FindOptions = merge(options, { where: { [field]: { [op]: value } } });

  return !(await cModel.findOne(findOptions));
};
