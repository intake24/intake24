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
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
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
import { defaultMeals, defaultTopFoods } from '@intake24/common/feedback';

import type { RecordVisibility } from '@intake24/common/security';
import { BaseModel } from '..';
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
    defaultValue: () => JSON.stringify([]),
    type: DataType.TEXT,
  })
  get sections(): CreationOptional<FeedbackSection[]> {
    const val = this.getDataValue('sections') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set sections(value: FeedbackSection[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('sections', JSON.stringify(value ?? []));
  }

  @Column({
    allowNull: false,
    defaultValue: () => JSON.stringify([]),
    type: DataType.TEXT,
  })
  get outputs(): CreationOptional<FeedbackOutput[]> {
    const val = this.getDataValue('outputs') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set outputs(value: FeedbackOutput[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('outputs', JSON.stringify(value ?? []));
  }

  @Column({
    allowNull: false,
    defaultValue: JSON.stringify([]),
    type: DataType.TEXT,
  })
  get physicalDataFields(): CreationOptional<FeedbackPhysicalDataField[]> {
    const val = this.getDataValue('physicalDataFields') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set physicalDataFields(value: FeedbackPhysicalDataField[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('physicalDataFields', JSON.stringify(value ?? []));
  }

  @Column({
    allowNull: false,
    defaultValue: () => JSON.stringify(defaultTopFoods),
    type: DataType.TEXT({ length: 'long' }),
  })
  get topFoods(): CreationOptional<TopFoods> {
    const val = this.getDataValue('topFoods') as unknown;
    return val ? JSON.parse(val as string) : defaultTopFoods;
  }

  set topFoods(value: TopFoods) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('topFoods', JSON.stringify(value ?? defaultTopFoods));
  }

  @Column({
    allowNull: false,
    defaultValue: () => JSON.stringify(defaultMeals),
    type: DataType.TEXT({ length: 'long' }),
  })
  get meals(): CreationOptional<FeedbackMeals> {
    const val = this.getDataValue('meals') as unknown;
    return val ? JSON.parse(val as string) : defaultMeals;
  }

  set meals(value: FeedbackMeals) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('meals', JSON.stringify(value ?? defaultMeals));
  }

  @Column({
    allowNull: false,
    defaultValue: JSON.stringify([]),
    type: DataType.TEXT({ length: 'long' }),
  })
  get cards(): CreationOptional<Card[]> {
    const val = this.getDataValue('cards') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set cards(value: Card[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('cards', JSON.stringify(value ?? []));
  }

  @Column({
    allowNull: false,
    defaultValue: JSON.stringify([]),
    type: DataType.TEXT({ length: 'long' }),
  })
  get demographicGroups(): CreationOptional<DemographicGroup[]> {
    const val = this.getDataValue('demographicGroups') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set demographicGroups(value: DemographicGroup[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('demographicGroups', JSON.stringify(value ?? []));
  }

  @Column({
    allowNull: false,
    defaultValue: JSON.stringify([]),
    type: DataType.TEXT({ length: 'long' }),
  })
  get henryCoefficients(): CreationOptional<HenryCoefficient[]> {
    const val = this.getDataValue('henryCoefficients') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set henryCoefficients(value: HenryCoefficient[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('henryCoefficients', JSON.stringify(value ?? []));
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
