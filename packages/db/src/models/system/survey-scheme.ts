import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { HasVisibility } from '..';
import type { RecordVisibility } from '@intake24/common/security';
import type { ExportSection, Meal, RecallPrompts, SchemeSettings } from '@intake24/common/surveys';

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
  list: { attributes: ['id', 'name'], order: [['name', 'ASC']] },
  surveys: { include: [{ model: Survey }] },
}))
@Table({
  modelName: 'SurveyScheme',
  tableName: 'survey_schemes',
  freezeTableName: true,
  underscored: true,
})
export default class SurveyScheme
  extends BaseModel<InferAttributes<SurveyScheme>, InferCreationAttributes<SurveyScheme>>
  implements HasVisibility {
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
    type: DataType.JSONB,
  })
  declare settings: SchemeSettings;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare prompts: RecallPrompts;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare meals: CreationOptional<Meal[]>;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare dataExport: CreationOptional<ExportSection[]>;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare ownerId: CreationOptional<string | null>;

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

  @HasMany(() => Survey, 'surveySchemeId')
  declare surveys?: NonAttribute<Survey[]>;

  @BelongsToMany(() => User, {
    through: {
      model: () => UserSecurable,
      unique: false,
      scope: {
        securable_type: 'SurveyScheme',
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
    scope: { securable_type: 'SurveyScheme' },
  })
  declare securables?: NonAttribute<UserSecurable[]>;
}

export type SurveySchemeAttributes = Attributes<SurveyScheme>;
export type SurveySchemeCreationAttributes = CreationAttributes<SurveyScheme>;

export const updateSurveySchemeFields = ['name', 'settings', 'meals', 'visibility'] as const;

export type UpdateSurveySchemeField = (typeof updateSurveySchemeFields)[number];

export const perCardSurveySchemeFields = ['prompts', 'dataExport'] as const;

export type PerCardSurveySchemeField = (typeof perCardSurveySchemeFields)[number];

export const createSurveySchemeFields = [
  ...updateSurveySchemeFields,
  ...perCardSurveySchemeFields,
] as const;

export type CreateSurveySchemeField = (typeof createSurveySchemeFields)[number];
