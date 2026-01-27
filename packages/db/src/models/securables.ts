import type { Model as BaseModel } from 'sequelize-typescript';

import type { RecordVisibility } from '@intake24/common/security';
import type { FindOptions, Includeable, UserSecurableAttributes, WhereOptions } from '@intake24/db';

import { Op } from 'sequelize';

export interface Securable extends BaseModel {
  ownerId: string | null;
  securables?: UserSecurableAttributes[];
}

export interface HasVisibility extends Securable {
  visibility: RecordVisibility;
}

export function securableScope(userId: string): FindOptions {
  return {
    include: [
      { association: 'securables', required: false, where: { userId } },
      { association: 'owner', required: false, attributes: ['id', 'name', 'email'] },
    ],
  };
}

export function securableIncludes(userId: string): Includeable[] {
  return [
    { association: 'securables', required: false, where: { userId } },
    { association: 'owner', required: false, attributes: ['id', 'name', 'email'] },
  ];
}

export function visibilityScope(userId: string, where: WhereOptions = {}): FindOptions {
  return {
    where: {
      ...where,
      [Op.or]: { visibility: 'public', ownerId: userId, '$securables.action$': ['use'] },
    },
    ...securableScope(userId),
  };
}
