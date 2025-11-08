import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type { Securable } from '..';
import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import type { RecordVisibility } from '@intake24/common/security';
import type { FAQSection } from '@intake24/common/types/http/admin';

import BaseModel from '../model';

import Survey from './survey';
import User from './user';
import UserSecurable from './user-securable';

@Table({
  modelName: 'FAQ',
  tableName: 'faqs',
  freezeTableName: true,
  underscored: true,
})
export default class FAQ
  extends BaseModel<InferAttributes<FAQ>, InferCreationAttributes<FAQ>>
  implements Securable {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING(256),
  })
  declare name: string;

  @Column({
    allowNull: false,
    defaultValue: () => JSON.stringify([]),
    type: DataType.TEXT,
  })
  get content(): CreationOptional<FAQSection[]> {
    const val = this.getDataValue('content') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set content(value: FAQSection[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('content', JSON.stringify(value ?? []));
  }

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare ownerId: string | null;

  @Column({
    allowNull: false,
    defaultValue: 'public',
    type: DataType.STRING(32),
  })
  declare visibility: CreationOptional<RecordVisibility>;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'ownerId')
  declare owner?: NonAttribute<User | null>;

  @HasMany(() => Survey, 'faqId')
  declare surveys?: NonAttribute<Survey[]>;

  @BelongsToMany(() => User, {
    through: {
      model: () => UserSecurable,
      unique: false,
      scope: {
        securable_type: 'FAQ',
      },
    },
    foreignKey: 'securableId',
    otherKey: 'userId',
    constraints: false,
  })
  declare securableUsers?: NonAttribute<User[]>;

  @HasMany(() => UserSecurable, {
    foreignKey: 'securableId',
    constraints: false,
    scope: { securable_type: 'FAQ' },
  })
  declare securables?: NonAttribute<UserSecurable[]>;
}

export type FAQAttributes = Attributes<FAQ>;

export type FAQCreationAttributes = CreationAttributes<FAQ>;
