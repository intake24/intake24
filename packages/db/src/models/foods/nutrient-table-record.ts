import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, BelongsToMany, Column, DataType, HasMany, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import Food from './food';
import FoodNutrient from './food-nutrient';
import NutrientTable from './nutrient-table';
import NutrientTableRecordField from './nutrient-table-record-field';
import NutrientTableRecordNutrient, { NutrientTableRecordNutrientCreationAttributes } from './nutrient-table-record-nutrient';

@Table({
  modelName: 'NutrientTableRecord',
  tableName: 'nutrient_table_records',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientTableRecord extends BaseModel<
  InferAttributes<NutrientTableRecord>,
  InferCreationAttributes<NutrientTableRecord> & {
    nutrients?: NutrientTableRecordNutrientCreationAttributes[];
  }
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
    unique: 'nutrient_table_records_unique',
  })
  declare nutrientTableId: ForeignKey<NutrientTable['id']>;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
    unique: 'nutrient_table_records_unique',
  })
  declare nutrientTableRecordId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare name: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare localName: CreationOptional<string | null>;

  @BelongsToMany(() => Food, () => FoodNutrient, 'nutrientTableRecordId', 'foodId')
  declare foods?: Food[];

  @HasMany(() => FoodNutrient, 'nutrientTableRecordId')
  declare foodMappings?: NonAttribute<FoodNutrient[]>;

  @BelongsTo(() => NutrientTable, 'nutrientTableId')
  declare nutrientTable?: NonAttribute<NutrientTable>;

  @HasMany(() => NutrientTableRecordNutrient, 'nutrientTableRecordId')
  declare nutrients?: NonAttribute<NutrientTableRecordNutrient[]>;

  @HasMany(() => NutrientTableRecordField, 'nutrientTableRecordId')
  declare fields?: NonAttribute<NutrientTableRecordField[]>;

  getNutrientByType(nutrientTypeId: string): NutrientTableRecordNutrient | undefined {
    return this.nutrients?.find(nutrient => nutrient.nutrientTypeId === nutrientTypeId);
  }
}

export type NutrientTableRecordAttributes = Attributes<NutrientTableRecord>;
export type NutrientTableRecordCreationAttributes = CreationAttributes<NutrientTableRecord>;
