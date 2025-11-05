import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type Category from './category';
import { Column, DataType, Table } from 'sequelize-typescript';
import type { UseInRecipeType } from '@intake24/common/types';
import BaseModel from '../model';

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
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare categoryId: string;

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

  declare category?: NonAttribute<Category>;
}

export type CategoryAttributeAttributes = Attributes<CategoryAttribute>;
export type CategoryAttributeCreationAttributes = CreationAttributes<CategoryAttribute>;
