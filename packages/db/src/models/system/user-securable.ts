import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Column, CreatedAt, DataType, ForeignKey, Table, UpdatedAt } from 'sequelize-typescript';

import type { SecurableType } from '@intake24/common/security';

import BaseModel from '../model';
import User from './user';

@Table({
  modelName: 'UserSecurable',
  tableName: 'user_securables',
  freezeTableName: true,
  underscored: true,
})
export default class UserSecurable extends BaseModel<
  InferAttributes<UserSecurable>,
  InferCreationAttributes<UserSecurable>
> {
  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare userId: string;

  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare securableId: string;

  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare securableType: SecurableType;

  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare action: string;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  get fields(): CreationOptional<string[] | null> {
    const val = this.getDataValue('fields') as unknown;
    return val ? JSON.parse(val as string) : null;
  }

  set fields(value: string[] | null) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('fields', value ? JSON.stringify(value) : null);
  }

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;
}

export type UserSecurableAttributes = Attributes<UserSecurable>;
export type UserSecurableCreationAttributes = CreationAttributes<UserSecurable>;
