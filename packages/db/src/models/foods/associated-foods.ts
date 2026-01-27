import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { LocaleTranslation } from '@intake24/common/types';

import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import Category from './category';
import Food from './food';

@Table({
  modelName: 'AssociatedFood',
  tableName: 'associated_foods',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class AssociatedFood extends BaseModel<
  InferAttributes<AssociatedFood>,
  InferCreationAttributes<AssociatedFood>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare foodId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare associatedFoodCode: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare associatedCategoryCode: string | null;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare text: LocaleTranslation;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare linkAsMain: boolean;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare multiple: boolean;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare genericName: LocaleTranslation;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare orderBy: string;

  @BelongsTo(() => Food, 'foodId')
  declare food?: Food;

  @BelongsTo(() => Category, { foreignKey: 'associatedCategoryCode', targetKey: 'code', constraints: false })
  declare associatedCategory?: NonAttribute<Category>;

  @BelongsTo(() => Food, { foreignKey: 'associatedFoodCode', targetKey: 'code', constraints: false })
  declare associatedFood?: NonAttribute<Food>;
}

export type AssociatedFoodAttributes = Attributes<AssociatedFood>;
export type AssociatedFoodCreationAttributes = CreationAttributes<AssociatedFood>;
