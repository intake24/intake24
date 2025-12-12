import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Column, CreatedAt, DataType, Table, UpdatedAt } from 'sequelize-typescript';

import type { RequiredLocaleTranslation } from '@intake24/common/types';

import BaseModel from '../model';

@Table({
  modelName: 'StandardUnit',
  tableName: 'standard_units',
  freezeTableName: true,
  timestamps: true,
  underscored: true,
})
export default class StandardUnit extends BaseModel<
  InferAttributes<StandardUnit>,
  InferCreationAttributes<StandardUnit>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

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

  @CreatedAt
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare updatedAt: CreationOptional<Date>;
}

export type StandardUnitAttributes = Attributes<StandardUnit>;
export type StandardUnitCreationAttributes = CreationAttributes<StandardUnit>;
