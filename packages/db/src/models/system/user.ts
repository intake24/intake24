import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { uniqBy } from 'lodash';
import {
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

import BaseModel from '../model';
import ClientErrorReport from './client-error-report';
import FeedbackScheme from './feedback-scheme';
import Job from './job';
import MFADevice from './mfa-device';
import Permission from './permission';
import PermissionUser from './permission-user';
import PersonalAccessToken from './personal-access-token';
import RefreshToken from './refresh-token';
import Role from './role';
import RoleUser from './role-user';
import SignInLog from './sign-in-log';
import Survey from './survey';
import SurveyScheme from './survey-scheme';
import SurveySubmission from './survey-submission';
import UserCustomField from './user-custom-field';
import UserPassword from './user-password';
import UserPasswordReset from './user-password-reset';
import UserPhysicalData from './user-physical-data';
import UserSecurable from './user-securable';
import UserSubscription from './user-subscription';
import UserSurveyAlias from './user-survey-alias';
import UserSurveySession from './user-survey-session';

@Scopes(() => ({
  aliases: { include: [{ model: UserSurveyAlias, separate: true }] },
  clientErrors: { include: [{ model: ClientErrorReport, separate: true }] },
  customFields: { include: [{ model: UserCustomField, separate: true }] },
  jobs: { include: [{ model: Job }] },
  password: { include: [{ model: UserPassword }] },
  passwordResets: { include: [{ model: UserPasswordReset }] },
  permissions: { include: [{ model: Permission, through: { attributes: [] } }] },
  roles: { include: [{ model: Role, through: { attributes: [] } }] },
  rolesPerms: {
    include: [
      {
        model: Role,
        through: { attributes: [] },
        include: [{ model: Permission, through: { attributes: [] } }],
      },
    ],
  },
  signInLog: { include: [{ model: SignInLog }] },
  submissions: { include: [{ model: SurveySubmission }] },
  tokens: { include: [{ model: RefreshToken }] },
}))
@Table({
  modelName: 'User',
  tableName: 'users',
  freezeTableName: true,
  underscored: true,
})
export default class User extends BaseModel<InferAttributes<User>, InferCreationAttributes<User>> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare name: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
    unique: true,
  })
  declare email: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.STRING(32),
  })
  declare phone: CreationOptional<string | null>;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare simpleName: CreationOptional<string | null>;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare multiFactorAuthentication: CreationOptional<boolean>;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare emailNotifications: CreationOptional<boolean>;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare smsNotifications: CreationOptional<boolean>;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  declare verifiedAt: CreationOptional<Date | null>;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  declare disabledAt: CreationOptional<Date | null>;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @HasMany(() => UserSurveyAlias, 'userId')
  declare aliases?: NonAttribute<UserSurveyAlias[]>;

  @HasMany(() => ClientErrorReport, 'userId')
  declare clientErrors?: NonAttribute<ClientErrorReport[]>;

  @HasMany(() => UserCustomField, 'userId')
  declare customFields?: NonAttribute<UserCustomField[]>;

  @HasMany(() => Job, 'userId')
  declare jobs?: NonAttribute<Job[]>;

  @HasMany(() => MFADevice, 'userId')
  declare mfaDevices?: NonAttribute<MFADevice[]>;

  @HasOne(() => UserPassword, 'userId')
  declare password?: NonAttribute<UserPassword>;

  @HasMany(() => UserPasswordReset, 'userId')
  declare passwordResets?: NonAttribute<UserPasswordReset[]>;

  @BelongsToMany(() => Permission, () => PermissionUser)
  declare permissions?: NonAttribute<Permission[]>;

  @HasMany(() => PermissionUser, 'userId')
  declare permissionLinks?: NonAttribute<PermissionUser[]>;

  @HasMany(() => PersonalAccessToken, 'userId')
  declare personalAccessTokens?: NonAttribute<PersonalAccessToken[]>;

  @HasOne(() => UserPhysicalData)
  declare physicalData?: NonAttribute<UserPhysicalData>;

  @HasMany(() => RefreshToken, 'userId')
  declare refreshTokens?: NonAttribute<RefreshToken[]>;

  @BelongsToMany(() => Role, () => RoleUser)
  declare roles?: NonAttribute<Role[]>;

  @HasMany(() => RoleUser, 'userId')
  declare roleLinks?: NonAttribute<RoleUser[]>;

  @HasMany(() => UserSurveySession, 'userId')
  declare sessions?: NonAttribute<UserSurveySession[]>;

  @HasMany(() => SignInLog, 'userId')
  declare signInLog?: NonAttribute<SignInLog[]>;

  @HasMany(() => SurveySubmission, 'userId')
  declare submissions?: NonAttribute<SurveySubmission[]>;

  @HasMany(() => UserSubscription, 'userId')
  declare subscription?: NonAttribute<UserSubscription[]>;

  @BelongsToMany(() => FeedbackScheme, {
    through: {
      model: () => UserSecurable,
      unique: false,
    },
    foreignKey: 'userId',
    otherKey: 'securableId',
    constraints: false,
  })
  declare feedbackSchemes?: NonAttribute<FeedbackScheme[]>;

  @HasMany(() => UserSecurable, {
    foreignKey: 'userId',
    constraints: false,
  })
  declare securables?: NonAttribute<UserSecurable[]>;

  @BelongsToMany(() => SurveyScheme, {
    through: {
      model: () => UserSecurable,
      unique: false,
    },
    foreignKey: 'userId',
    otherKey: 'securableId',
    constraints: false,
  })
  declare surveySchemes?: NonAttribute<SurveyScheme[]>;

  @BelongsToMany(() => Survey, {
    through: {
      model: () => UserSecurable,
      unique: false,
    },
    foreignKey: 'userId',
    otherKey: 'securableId',
    constraints: false,
  })
  declare surveys?: NonAttribute<Survey[]>;

  allRoles(): Role[] {
    return uniqBy(this.roles, 'name');
  }

  hasRole(role: string | string[], key: 'id' | 'name' = 'name'): boolean {
    if (!this.roles || !this.roles.length)
      return false;

    if (Array.isArray(role)) {
      const currentRoleKeys = this.roles.map(item => item[key]);
      return role.every(item => currentRoleKeys.includes(item));
    }

    return !!this.roles.find(item => item[key] === role);
  }

  hasAnyRole(roles: string[], key: 'id' | 'name' = 'name'): boolean {
    if (!this.roles || !this.roles.length)
      return false;

    return this.roles.some(item => roles.includes(item[key]));
  }

  allPermissions(): Permission[] {
    const { permissions = [], roles = [] } = this;

    roles.forEach((item) => {
      if (item.permissions)
        permissions.push(...item.permissions);
    });

    return uniqBy(permissions, 'name');
  }

  hasPermission(permission: string | string[], key: 'id' | 'name' = 'name'): boolean {
    const permissions = this.allPermissions();
    if (!permissions.length)
      return false;

    if (Array.isArray(permission)) {
      const currentPermissionKeys = permissions.map(item => item[key]);
      return permission.every(item => currentPermissionKeys.includes(item));
    }

    return !!permissions.find(item => item[key] === permission);
  }

  can(permission: string | string[], key: 'id' | 'name' = 'name'): boolean {
    return this.hasPermission(permission, key);
  }

  hasAnyPermission(permission: string[], key: 'id' | 'name' = 'name'): boolean {
    const permissions = this.allPermissions();
    if (!permissions.length)
      return false;

    return permissions.some(item => permission.includes(item[key]));
  }

  isVerified(): boolean {
    return !!this.verifiedAt;
  }

  isDisabled(): boolean {
    return !!this.disabledAt;
  }
}

export type UserAttributes = Attributes<User>;
export type UserCreationAttributes = CreationAttributes<User>;
