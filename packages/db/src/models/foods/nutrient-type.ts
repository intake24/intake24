import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { BelongsTo, Column, DataType, HasOne, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import NutrientTableRecordNutrient from './nutrient-table-record-nutrient';
import NutrientTypeInKcal from './nutrient-type-in-kcal';
import FoodsNutrientUnit from './nutrient-unit';

@Scopes(() => ({
  unit: { include: [{ model: FoodsNutrientUnit }] },
  inKcal: { include: [{ model: NutrientTypeInKcal }] },
  list: { order: [['id', 'ASC']] },
}))
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

  @BelongsTo(() => FoodsNutrientUnit, 'unitId')
  declare unit?: NonAttribute<FoodsNutrientUnit>;

  @HasOne(() => NutrientTypeInKcal, 'nutrientTypeId')
  declare inKcal?: NonAttribute<NutrientTypeInKcal>;

  @HasOne(() => NutrientTableRecordNutrient, 'nutrientTypeId')
  declare nutrientTableRecordNutrient?: NonAttribute<NutrientTableRecordNutrient>;
}

export type FoodsNutrientTypeAttributes = Attributes<NutrientType>;
export type FoodsNutrientTypeCreationAttributes = CreationAttributes<NutrientType>;
