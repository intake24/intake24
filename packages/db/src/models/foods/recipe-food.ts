import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import FoodsLocale from './locale';
import RecipeFoodStep from './recipe-food-step';
import SynonymSet from './synonym-set';

@Scopes(() => ({
  list: {
    attributes: ['id', 'code', 'name', 'localeId', 'recipeWord', 'synonyms'],
    order: [['name', 'ASC']],
  },
  steps: { include: [{ model: RecipeFoodStep }] },
  synonyms: { include: [{ model: SynonymSet }] },
}))
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

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;

  @BelongsTo(() => SynonymSet, 'synonymsId')
  declare synonymSet?: Attributes<SynonymSet>;

  @HasMany(() => RecipeFoodStep, 'recipeFoodsId')
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
