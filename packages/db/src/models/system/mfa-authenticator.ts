import type { AuthenticatorTransportFuture, CredentialDeviceType } from '@simplewebauthn/server';
import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, CreatedAt, DataType, Table, UpdatedAt } from 'sequelize-typescript';

import { MFADevice } from '.';
import BaseModel from '../model';

@Table({
  modelName: 'MFAAuthenticator',
  tableName: 'mfa_authenticators',
  freezeTableName: true,
  underscored: true,
})
export default class MFAAuthenticator extends BaseModel<
  InferAttributes<MFAAuthenticator>,
  InferCreationAttributes<MFAAuthenticator>
> {
  @Column({
    primaryKey: true,
    type: DataType.STRING(512),
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
    unique: true,
  })
  declare deviceId: string;

  @Column({
    allowNull: false,
    type: DataType.BLOB({ length: 'long' }),
  })
  get publicKey(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(this.getDataValue('publicKey'));
  }

  set publicKey(value: Uint8Array<ArrayBuffer>) {
    this.setDataValue('publicKey', Buffer.from(value));
  }

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare counter: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare deviceType: CredentialDeviceType;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare backedUp: boolean;

  @Column({
    allowNull: false,
    type: DataType.TEXT,
  })
  get transports(): AuthenticatorTransportFuture[] {
    const val = this.getDataValue('transports') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set transports(value: AuthenticatorTransportFuture[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('transports', JSON.stringify(value ?? []));
  }

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => MFADevice, 'deviceId')
  declare device?: NonAttribute<MFADevice>;
}

export type MFAAuthenticatorAttributes = Attributes<MFAAuthenticator>;
export type MFAAuthenticatorCreationAttributes = CreationAttributes<MFAAuthenticator>;
