import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type NutrientTableCsvMapping from './nutrient-table-csv-mapping';

import type NutrientTableCsvMappingField from './nutrient-table-csv-mapping-field';

import type NutrientTableCsvMappingNutrient from './nutrient-table-csv-mapping-nutrient';
import type { NutrientTableRecordCreationAttributes } from './nutrient-table-record';
import type NutrientTableRecord from './nutrient-table-record';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'NutrientTable',
  tableName: 'nutrient_tables',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientTable extends BaseModel<
  InferAttributes<NutrientTable>,
  InferCreationAttributes<NutrientTable> & {
    records?: NutrientTableRecordCreationAttributes[];
  }
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(32),
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare description: string;

  declare records?: NonAttribute<NutrientTableRecord[]>;

  declare csvMapping?: NonAttribute<NutrientTableCsvMapping>;

  declare csvMappingFields?: NonAttribute<NutrientTableCsvMappingField[]>;

  declare csvMappingNutrients?: NonAttribute<NutrientTableCsvMappingNutrient[]>;
}

export type NutrientTableAttributes = Attributes<NutrientTable>;
export type NutrientTableCreationAttributes = CreationAttributes<NutrientTable>;
