import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  FindOptions,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import {
  AfterCreate,
  AfterDestroy,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  HasOne,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { surveyPermissions } from '@intake24/common/security';
import type {
  SchemeOverrides,
  SessionSettings,
  SurveyAuthMode,
  SurveySearchSettings,
  SurveyStatus,
} from '@intake24/common/surveys';
import type { Notification } from '@intake24/common/types';
import BaseModel from '../model';
import ClientErrorReport from './client-error-report';
import FAQ from './faq';
import FeedbackScheme from './feedback-scheme';
import GenUserCounter from './gen-user-counter';
import SystemLocale from './locale';
import Permission from './permission';
import SurveyScheme from './survey-scheme';
import SurveySubmission from './survey-submission';
import User from './user';
import UserSecurable from './user-securable';
import UserSurveyAlias from './user-survey-alias';
import UserSurveySession from './user-survey-session';

@Scopes(() => ({
  counter: { include: [{ model: GenUserCounter }] },
  locale: { include: [{ model: SystemLocale }] },
  feedbackScheme: { include: [{ model: FeedbackScheme }] },
  surveyScheme: { include: [{ model: SurveyScheme }] },
  respondents: { include: [{ model: UserSurveyAlias }] },
  submissions: { include: [{ model: SurveySubmission }] },
  clientErrors: { include: [{ model: ClientErrorReport }] },
}))
@Table({
  modelName: 'Survey',
  tableName: 'surveys',
  freezeTableName: true,
  underscored: true,
})
export default class Survey extends BaseModel<
  InferAttributes<Survey>,
  InferCreationAttributes<Survey>
> {
  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare slug: string;

  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING(512),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare state: SurveyStatus;

  @Column({
    allowNull: false,
    type: DataType.DATE,
  })
  declare startDate: Date;

  @Column({
    allowNull: false,
    type: DataType.DATE,
  })
  declare endDate: Date;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare surveySchemeId: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare allowGenUsers: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING(256),
  })
  declare genUserKey: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare authUrlDomainOverride: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.STRING(128),
  })
  declare authUrlTokenCharset: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare authUrlTokenLength: CreationOptional<number | null>;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare authCaptcha: CreationOptional<boolean>;

  @Column({
    allowNull: false,
    defaultValue: ['token'],
    type: DataType.JSONB,
  })
  declare authModes: CreationOptional<SurveyAuthMode[]>;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare suspensionReason: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare surveyMonkeyUrl: CreationOptional<string | null>;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare supportEmail: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare originatingUrl: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare faqId: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare feedbackSchemeId: CreationOptional<string | null>;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare numberOfSubmissionsForFeedback: CreationOptional<number>;

  @Column({
    allowNull: false,
    defaultValue: [],
    type: DataType.JSONB,
  })
  declare notifications: CreationOptional<Notification[]>;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare session: SessionSettings;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 3,
  })
  declare maximumDailySubmissions: CreationOptional<number>;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare maximumTotalSubmissions: CreationOptional<number | null>;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
    defaultValue: 600,
  })
  declare minimumSubmissionInterval: CreationOptional<number>;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare surveySchemeOverrides: SchemeOverrides;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare searchSettings: SurveySearchSettings;

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  declare userPersonalIdentifiers: CreationOptional<boolean>;

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  declare userCustomFields: CreationOptional<boolean>;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare ownerId: CreationOptional<string | null>;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'ownerId')
  declare owner?: NonAttribute<User | null>;

  @HasMany(() => ClientErrorReport, 'surveyId')
  declare clientErrors?: NonAttribute<ClientErrorReport[]>;

  @HasOne(() => GenUserCounter, 'surveyId')
  declare counter?: NonAttribute<GenUserCounter>;

  @BelongsTo(() => FAQ, 'faqId')
  declare faq?: NonAttribute<FAQ>;

  @BelongsTo(() => FeedbackScheme, 'feedbackSchemeId')
  declare feedbackScheme?: NonAttribute<FeedbackScheme>;

  @BelongsTo(() => SystemLocale, 'localeId')
  declare locale?: NonAttribute<SystemLocale>;

  @BelongsTo(() => SurveyScheme, 'surveySchemeId')
  declare surveyScheme?: NonAttribute<SurveyScheme>;

  @HasMany(() => UserSurveyAlias, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    hooks: true,
    foreignKey: 'surveyId',
  })
  declare respondents?: NonAttribute<UserSurveyAlias[]>;

  @HasMany(() => UserSurveySession, 'surveyId')
  declare sessions?: NonAttribute<UserSurveySession[]>;

  @HasMany(() => SurveySubmission, 'surveyId')
  declare submissions?: NonAttribute<SurveySubmission[]>;

  @BelongsToMany(() => User, {
    through: {
      model: () => UserSecurable,
      unique: false,
      scope: {
        securable_type: 'Survey',
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
    scope: { securable_type: 'Survey' },
  })
  declare securables?: NonAttribute<UserSecurable[]>;

  @AfterCreate
  static async createSurveyPermissions(instance: Survey): Promise<void> {
    const permissions = surveyPermissions(instance.slug).map(item => ({
      name: item,
      displayName: item,
      description: `Survey-specific permission (${item})`,
    }));

    await Permission.bulkCreate(permissions);
  }

  @AfterDestroy
  static async destroySurveyPermissions(instance: Survey): Promise<void> {
    await Permission.destroy({ where: { name: surveyPermissions(instance.slug) } });
  }

  public static async findBySlug(
    slug: string,
    options: FindOptions<SurveyAttributes> = {},
  ): Promise<Survey | null> {
    const { where, ...rest } = options;

    return Survey.findOne({ where: { ...where, slug: { [this.op('ciEq')]: slug } }, ...rest });
  }

  // TODO: add BulkAfterCreate & BulkAfterDestroy if/when implemented in system
}

export type SurveyAttributes = Attributes<Survey>;
export type SurveyCreationAttributes = CreationAttributes<Survey>;

export const guardedSurveyFields = ['userPersonalIdentifiers', 'userCustomFields'] as const;

export const updateSurveyFields = [
  'name',
  'state',
  'startDate',
  'endDate',
  'localeId',
  'surveySchemeId',
  'faqId',
  'feedbackSchemeId',
  'allowGenUsers',
  'genUserKey',
  'suspensionReason',
  'supportEmail',
  'notifications',
  'session',
  'numberOfSubmissionsForFeedback',
  'authCaptcha',
  'authModes',
  'authUrlDomainOverride',
  'authUrlTokenCharset',
  'authUrlTokenLength',
  'maximumDailySubmissions',
  'maximumTotalSubmissions',
  'minimumSubmissionInterval',
  'searchSettings',
  'surveySchemeOverrides',
] as const;

export type UpdateSurveyField = (typeof updateSurveyFields)[number];

export const createSurveyFields = ['slug', ...updateSurveyFields] as const;

export type CreateSurveyField = (typeof createSurveyFields)[number];

export const overridesFields = ['surveySchemeOverrides'] as const;

export type OverridesField = (typeof overridesFields)[number];
