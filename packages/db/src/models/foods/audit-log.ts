import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import type { AuditJsonValue, AuditOperation, ContextType } from '@intake24/common/types/http/admin';

import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'AuditLog',
  tableName: 'audit_log',
  freezeTableName: true,
  underscored: true,
  timestamps: false,
})
export default class AuditLog extends BaseModel<
  InferAttributes<AuditLog>,
  InferCreationAttributes<AuditLog>
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUID,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.TEXT,
  })
  declare tableName: string;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  declare recordId: string;

  @Column({
    allowNull: false,
    type: DataType.TEXT,
  })
  declare operation: AuditOperation;

  @Column({
    allowNull: false,
    type: DataType.DATE,
    defaultValue: () => new Date(),
  })
  declare changedAt: CreationOptional<Date>;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  declare ctxType: ContextType;

  @Column({
    allowNull: true,
    type: DataType.UUID,
  })
  declare ctxId: string;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare ctxUserId: string;

  @Column({
    allowNull: true,
    type: DataType.JSONB,
  })
  declare oldValue: AuditJsonValue;

  @Column({
    allowNull: true,
    type: DataType.JSONB,
  })
  declare newValue: AuditJsonValue;
}

export type FoodsAuditLogAttributes = Attributes<AuditLog>;
export type FoodsAuditLogCreationAttributes = CreationAttributes<AuditLog>;
