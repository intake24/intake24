import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { Column, CreatedAt, DataType, Table, UpdatedAt } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'AuditTable',
  tableName: 'audit_tables',
  freezeTableName: true,
  underscored: true,
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

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;
}

export type SystemAuditTableAttributes = Attributes<AuditTable>;
export type SystemAuditTableCreationAttributes = CreationAttributes<AuditTable>;
