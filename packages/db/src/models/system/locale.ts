import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type { HasVisibility } from '..';

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
import type { RecordVisibility } from '@intake24/common/security';

import type { TextDirection } from '@intake24/common/types';
import BaseModel from '../model';
import Language from './language';
import Survey from './survey';
import User from './user';
import UserSecurable from './user-securable';

@Scopes(() => ({
  list: {
    attributes: ['id', 'code', 'englishName', 'localName', 'countryFlagCode'],
    order: [['englishName', 'ASC']],
  },
  adminLanguage: { include: [{ association: 'adminLanguage' }] },
  respondentLanguage: { include: [{ association: 'respondentLanguage' }] },
  surveys: { include: [{ model: Survey }] },
}))
@Table({
  modelName: 'Locale',
  tableName: 'locales',
  freezeTableName: true,
  underscored: true,
})
export default class SystemLocale
  extends BaseModel<InferAttributes<SystemLocale>, InferCreationAttributes<SystemLocale>>
  implements HasVisibility {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: true,
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare englishName: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare localName: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(16),
  })
  declare respondentLanguageId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(16),
  })
  declare adminLanguageId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(16),
  })
  declare countryFlagCode: string;

  @Column({
    allowNull: false,
    defaultValue: 'ltr',
    type: DataType.STRING(8),
  })
  declare textDirection: CreationOptional<TextDirection>;

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  declare foodIndexEnabled: CreationOptional<boolean>;

  @Column({
    allowNull: false,
    defaultValue: 'en',
    type: DataType.STRING(16),
  })
  declare foodIndexLanguageBackendId: CreationOptional<string>;

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

  @BelongsTo(() => Language, {
    foreignKey: 'adminLanguageId',
    targetKey: 'code',
  })
  declare adminLanguage?: NonAttribute<Language>;

  @BelongsTo(() => Language, {
    foreignKey: 'respondentLanguageId',
    targetKey: 'code',
  })
  declare respondentLanguage?: NonAttribute<Language>;

  @HasMany(() => Survey, 'localeId')
  declare surveys?: Survey[];

  @BelongsTo(() => User, 'ownerId')
  declare owner?: NonAttribute<User | null>;

  @BelongsToMany(() => User, {
    through: {
      model: () => UserSecurable,
      unique: false,
      scope: {
        securable_type: 'Locale',
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
    scope: { securable_type: 'Locale' },
  })
  declare securables?: NonAttribute<UserSecurable[]>;
}

export type SystemLocaleAttributes = Attributes<SystemLocale>;
export type SystemLocaleCreationAttributes = CreationAttributes<SystemLocale>;
