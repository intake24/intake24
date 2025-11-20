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
  modelName: 'PersonalAccessToken',
  tableName: 'personal_access_tokens',
  freezeTableName: true,
  underscored: true,
})
export default class PersonalAccessToken extends BaseModel<
  InferAttributes<PersonalAccessToken>,
  InferCreationAttributes<PersonalAccessToken>
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
    type: DataType.STRING(128),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: true,
  })
  declare token: string;

  @Column({
    allowNull: true,
    type: DataType.TEXT({ length: 'long' }),
  })
  get scopes(): CreationOptional<string[] | null> {
    const val = this.getDataValue('scopes') as unknown;
    return val ? JSON.parse(val as string) : null;
  }

  set scopes(value: string[] | null) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('scopes', value ? JSON.stringify([]) : null);
  }

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  declare revoked: CreationOptional<boolean>;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  declare usedAt: CreationOptional<Date | null>;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  declare expiresAt: CreationOptional<Date | null>;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;
}

export type PersonalAccessTokenAttributes = Attributes<PersonalAccessToken>;
export type PersonalAccessTokenCreationAttributes = CreationAttributes<PersonalAccessToken>;
