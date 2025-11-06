import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type NutrientTableRecordNutrient from './nutrient-table-record-nutrient';

import type NutrientTypeInKcal from './nutrient-type-in-kcal';
import type FoodsNutrientUnit from './nutrient-unit';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'NutrientType',
  tableName: 'nutrient_types',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientType extends BaseModel<
  InferAttributes<NutrientType>,
  InferCreationAttributes<NutrientType>
> {
  @Column({
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare unitId: string;

  declare unit?: NonAttribute<FoodsNutrientUnit>;

  declare inKcal?: NonAttribute<NutrientTypeInKcal>;

  declare nutrientTableRecordNutrient?: NonAttribute<NutrientTableRecordNutrient>;
}

export type FoodsNutrientTypeAttributes = Attributes<NutrientType>;
export type FoodsNutrientTypeCreationAttributes = CreationAttributes<NutrientType>;
