import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type Food from './food';

import type FoodNutrient from './food-nutrient';
import type NutrientTable from './nutrient-table';
import type NutrientTableRecordField from './nutrient-table-record-field';
import type NutrientTableRecordNutrient from './nutrient-table-record-nutrient';
import type { NutrientTableRecordNutrientCreationAttributes } from './nutrient-table-record-nutrient';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

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

  declare foods?: Food[];

  declare foodMappings?: NonAttribute<FoodNutrient[]>;

  declare nutrientTable?: NonAttribute<NutrientTable>;

  declare nutrients?: NonAttribute<NutrientTableRecordNutrient[]>;

  declare fields?: NonAttribute<NutrientTableRecordField[]>;

  getNutrientByType(nutrientTypeId: string): NutrientTableRecordNutrient | undefined {
    return this.nutrients?.find(nutrient => nutrient.nutrientTypeId === nutrientTypeId);
  }
}

export type NutrientTableRecordAttributes = Attributes<NutrientTableRecord>;
export type NutrientTableRecordCreationAttributes = CreationAttributes<NutrientTableRecord>;
