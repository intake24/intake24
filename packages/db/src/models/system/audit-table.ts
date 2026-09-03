import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { Sequelize } from 'sequelize';
import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'AuditTable',
  tableName: 'audit_tables',
  freezeTableName: true,
  underscored: true,
  timestamps: true,
})
export default class AuditTable extends BaseModel<
  InferAttributes<AuditTable>,
  InferCreationAttributes<AuditTable>
> {
  @Column({
    primaryKey: true,
    type: DataType.TEXT,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.ARRAY(DataType.TEXT),
    defaultValue: [],
  })
  declare exclude: CreationOptional<string[]>;

  @Column({
    allowNull: false,
    type: DataType.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  })
  declare readonly createdAt: CreationOptional<Date>;

  @Column({
    allowNull: false,
    type: DataType.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  })
  declare readonly updatedAt: CreationOptional<Date>;
}

export type SystemAuditTableAttributes = Attributes<AuditTable>;
export type SystemAuditTableCreationAttributes = CreationAttributes<AuditTable>;
