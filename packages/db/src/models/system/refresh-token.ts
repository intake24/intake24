import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import User from './user';

@Scopes(() => ({
  user: { include: [{ model: User }] },
}))
@Table({
  modelName: 'RefreshToken',
  tableName: 'refresh_tokens',
  freezeTableName: true,
  underscored: true,
})
export default class RefreshToken extends BaseModel<
  InferAttributes<RefreshToken>,
  InferCreationAttributes<RefreshToken>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(128),
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare userId: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare revoked: boolean;

  @Column({
    allowNull: false,
    type: DataType.DATE,
  })
  declare expiresAt: Date;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User)
  declare user?: NonAttribute<User>;
}

export type RefreshTokenAttributes = Attributes<RefreshToken>;
export type RefreshTokenCreationAttributes = CreationAttributes<RefreshToken>;
