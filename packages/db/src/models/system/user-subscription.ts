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
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import type { Subscription, SubscriptionType } from '@intake24/common/types';

import BaseModel from '../model';
import User from './user';

@Scopes(() => ({
  user: { include: [{ model: User }] },
}))
@Table({
  modelName: 'UserSubscription',
  tableName: 'user_subscriptions',
  freezeTableName: true,
  underscored: true,
})
export default class UserSubscription extends BaseModel<
  InferAttributes<UserSubscription>,
  InferCreationAttributes<UserSubscription>
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
  declare type: SubscriptionType;

  @Column({
    allowNull: false,
    type: DataType.TEXT({ length: 'long' }),
  })
  get subscription(): Subscription {
    const val = this.getDataValue('subscription') as unknown;
    return JSON.parse(val as string);
  }

  set subscription(value: Subscription) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('subscription', JSON.stringify(value));
  }

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;
}

export type UserSubscriptionAttributes = Attributes<UserSubscription>;
export type UserSubscriptionCreationAttributes = CreationAttributes<UserSubscription>;
