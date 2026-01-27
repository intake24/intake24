import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { MFAProvider } from '@intake24/common/security';

import {
  BeforeCreate,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  HasOne,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import MFAAuthenticator from './mfa-authenticator';
import User from './user';

@DefaultScope(() => ({
  attributes: { exclude: ['secret'] },
}))
@Table({
  modelName: 'MFADevice',
  tableName: 'mfa_devices',
  freezeTableName: true,
  underscored: true,
})
export default class MFADevice extends BaseModel<
  InferAttributes<MFADevice>,
  InferCreationAttributes<MFADevice>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare userId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare provider: MFAProvider;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare secret: string;

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  declare preferred: CreationOptional<boolean>;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;

  @HasOne(() => MFAAuthenticator, 'deviceId')
  declare authenticator?: NonAttribute<MFAAuthenticator>;

  @BeforeCreate
  static async handleAdminPermission(device: MFADevice): Promise<void> {
    const count = await MFADevice.count({ where: { userId: device.userId } });
    if (count === 0)
      device.preferred = true;
  }
}

export type MFADeviceAttributes = Attributes<MFADevice>;
export type MFADeviceCreationAttributes = CreationAttributes<MFADevice>;
