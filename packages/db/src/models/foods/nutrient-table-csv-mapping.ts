import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import NutrientTable from './nutrient-table';

@Table({
  modelName: 'NutrientTableCsvMapping',
  tableName: 'nutrient_table_csv_mapping',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class NutrientTableCsvMapping extends BaseModel<
  InferAttributes<NutrientTableCsvMapping>,
  InferCreationAttributes<NutrientTableCsvMapping>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(32),
  })
  declare nutrientTableId: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare rowOffset: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare idColumnOffset: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare descriptionColumnOffset: number;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare localDescriptionColumnOffset: CreationOptional<number | null>;

  @BelongsTo(() => NutrientTable, {
    foreignKey: 'nutrientTableId',
    onUpdate: 'cascade',
    onDelete: 'cascade',
  })
  declare nutrientTable?: NonAttribute<NutrientTable>;
}

export type NutrientTableCsvMappingAttributes = Attributes<NutrientTableCsvMapping>;
export type NutrientTableCsvMappingCreationAttributes = CreationAttributes<NutrientTableCsvMapping>;
