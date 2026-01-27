import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import type { UseInRecipeType } from '@intake24/common/types';

import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'AttributeDefaults',
  tableName: 'attribute_defaults',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class AttributeDefaults extends BaseModel<
  InferAttributes<AttributeDefaults>,
  InferCreationAttributes<AttributeDefaults>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare sameAsBeforeOption: boolean;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare readyMealOption: boolean;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare reasonableAmount: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare useInRecipes: UseInRecipeType;
}

export type AttributeDefaultsAttributes = Attributes<AttributeDefaults>;
export type AttributeDefaultsCreationAttributes = CreationAttributes<AttributeDefaults>;
