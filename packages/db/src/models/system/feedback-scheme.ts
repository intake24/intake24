import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { Securable } from '..';
import type {
  Card,
  DemographicGroup,
  FeedbackMeals,
  FeedbackOutput,
  FeedbackPhysicalDataField,
  FeedbackSection,
  FeedbackType,
  HenryCoefficient,
  TopFoods,
} from '@intake24/common/feedback';
import type { RecordVisibility } from '@intake24/common/security';

import {
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import Survey from './survey';
import User from './user';
import UserSecurable from './user-securable';

@Scopes(() => ({
  surveys: { include: [{ model: Survey }] },
}))
@Table({
  modelName: 'FeedbackScheme',
  tableName: 'feedback_schemes',
  freezeTableName: true,
  underscored: true,
})
export default class FeedbackScheme
  extends BaseModel<InferAttributes<FeedbackScheme>, InferCreationAttributes<FeedbackScheme>>
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
    defaultValue: 'default',
    type: DataType.STRING(64),
  })
  declare type: CreationOptional<FeedbackType>;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare sections: CreationOptional<FeedbackSection[]>;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare outputs: CreationOptional<FeedbackOutput[]>;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare physicalDataFields: CreationOptional<FeedbackPhysicalDataField[]>;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare topFoods: TopFoods;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare meals: FeedbackMeals;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare cards: CreationOptional<Card[]>;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare demographicGroups: CreationOptional<DemographicGroup[]>;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare henryCoefficients: CreationOptional<HenryCoefficient[]>;

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

  @HasMany(() => Survey, 'feedbackSchemeId')
  declare surveys?: NonAttribute<Survey[]>;

  @BelongsToMany(() => User, {
    through: {
      model: () => UserSecurable,
      unique: false,
      scope: {
        securable_type: 'FeedbackScheme',
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
    scope: { securable_type: 'FeedbackScheme' },
  })
  declare securables?: NonAttribute<UserSecurable[]>;
}

export type FeedbackSchemeAttributes = Attributes<FeedbackScheme>;

export type FeedbackSchemeCreationAttributes = CreationAttributes<FeedbackScheme>;

export const updateFeedbackSchemeFields = [
  'name',
  'type',
  'outputs',
  'physicalDataFields',
  'sections',
  'visibility',
] as const;

export type UpdateFeedbackSchemeField = (typeof updateFeedbackSchemeFields)[number];

export const perCardFeedbackSchemeFields = [
  'topFoods',
  'meals',
  'cards',
  'demographicGroups',
  'henryCoefficients',
] as const;

export type PerCardFeedbackSchemeField = (typeof perCardFeedbackSchemeFields)[number];

export const createFeedbackSchemeFields = [
  ...updateFeedbackSchemeFields,
  ...perCardFeedbackSchemeFields,
] as const;

export type CreateFeedbackSchemeField = (typeof createFeedbackSchemeFields)[number];
