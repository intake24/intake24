import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type FoodsLocale from './locale';

import type RecipeFoodStep from './recipe-food-step';
import type SynonymSet from './synonym-set';
import {
  Column,
  CreatedAt,
  DataType,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'RecipeFood',
  tableName: 'recipe_foods',
  freezeTableName: true,
  underscored: true,
})
export default class RecipeFood extends BaseModel<
  InferAttributes<RecipeFood>,
  InferCreationAttributes<RecipeFood>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: false,
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare recipeWord: string;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
    unique: false,
  })
  declare synonymsId: string | null;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  declare locale?: NonAttribute<FoodsLocale>;

  declare synonymSet?: Attributes<SynonymSet>;

  declare steps?: Attributes<RecipeFoodStep>[];

  static async findByCode(code: string): Promise<RecipeFood | null> {
    return RecipeFood.findOne({ where: { code }, include: [{ association: 'steps' }] });
  }

  static async findByLocaleId(localeId: string): Promise<RecipeFood[]> {
    return RecipeFood.findAll({ where: { localeId } });
  }

  static async findByLocaleIdAndCode(localeId: string, code: string): Promise<RecipeFood | null> {
    return RecipeFood.findOne({ where: { localeId, code } });
  }
}

export type RecipeFoodAttributes = Attributes<RecipeFood>;
export type RecipeFoodsCreationAttributes = CreationAttributes<RecipeFood>;
