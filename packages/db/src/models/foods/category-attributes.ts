import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Scopes, Table } from 'sequelize-typescript';

import type { UseInRecipeType } from '@intake24/common/types';
import { Category } from '@intake24/db';

import BaseModel from '../model';

@Scopes(() => ({
  category: { include: [{ model: Category }] },
}))
@Table({
  modelName: 'CategoryAttribute',
  tableName: 'category_attributes',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class CategoryAttribute extends BaseModel<
  InferAttributes<CategoryAttribute>,
  InferCreationAttributes<CategoryAttribute>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Category)
  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare categoryCode: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
  })
  declare sameAsBeforeOption: CreationOptional<boolean | null>;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
  })
  declare readyMealOption: CreationOptional<boolean | null>;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare reasonableAmount: CreationOptional<number | null>;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare useInRecipes: CreationOptional<UseInRecipeType | null>;

  @BelongsTo(() => Category, 'categoryCode')
  declare category?: NonAttribute<Category>;
}

export type CategoryAttributeAttributes = Attributes<CategoryAttribute>;
export type CategoryAttributeCreationAttributes = CreationAttributes<CategoryAttribute>;
