import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import User from './user';

@Scopes(() => ({
  user: { include: [{ model: User }] },
}))
@Table({
  modelName: 'UserCustomField',
  tableName: 'user_custom_fields',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class UserCustomField extends BaseModel<
  InferAttributes<UserCustomField>,
  InferCreationAttributes<UserCustomField>
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
    unique: 'user_custom_fields_unique',
  })
  declare userId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
    unique: 'user_custom_fields_unique',
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare value: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare public: CreationOptional<boolean>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;
}

export type UserCustomFieldAttributes = Attributes<UserCustomField>;
export type UserCustomFieldCreationAttributes = CreationAttributes<UserCustomField>;
