import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import type { RequiredLocaleTranslation } from '@intake24/common/types';

import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'StandardUnit',
  tableName: 'standard_units',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class StandardUnit extends BaseModel<
  InferAttributes<StandardUnit>,
  InferCreationAttributes<StandardUnit>
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
    unique: 'standard_units_unique',
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: 'standard_units_unique',
  })
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare icon: string | null;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare estimateIn: RequiredLocaleTranslation;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare howMany: RequiredLocaleTranslation;
}

export type StandardUnitAttributes = Attributes<StandardUnit>;
export type StandardUnitCreationAttributes = CreationAttributes<StandardUnit>;
