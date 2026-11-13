import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { BelongsTo, Column, CreatedAt, DataType, Table, UpdatedAt } from 'sequelize-typescript';

import BaseModel from '../model';
import User from './user';

@Table({
  modelName: 'UserIdentity',
  tableName: 'user_identities',
  freezeTableName: true,
  underscored: true,
  indexes: [
    {
      name: 'user_identities_issuer_subject_unique',
      unique: true,
      fields: ['issuer', 'subject'],
    },
    {
      name: 'user_identities_user_id_issuer_unique',
      unique: true,
      fields: ['user_id', 'issuer'],
    },
  ],
})
export default class UserIdentity extends BaseModel<
  InferAttributes<UserIdentity>,
  InferCreationAttributes<UserIdentity>
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
    type: DataType.STRING(512),
  })
  declare issuer: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(255),
  })
  declare subject: string;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;
}

export type UserIdentityAttributes = Attributes<UserIdentity>;
export type UserIdentityCreationAttributes = CreationAttributes<UserIdentity>;
