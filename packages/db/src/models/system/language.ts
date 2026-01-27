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
import type { TextDirection } from '@intake24/common/types';

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
import LanguageTranslation from './language-translation';
import SystemLocale from './locale';
import User from './user';
import UserSecurable from './user-securable';

@Scopes(() => ({
  public: {
    attributes: ['code', 'englishName', 'localName', 'countryFlagCode', 'textDirection'],
    order: [['englishName', 'ASC']],
  },
  list: {
    attributes: ['id', 'code', 'englishName', 'localName', 'countryFlagCode'],
    order: [['englishName', 'ASC']],
  },
  adminLocales: { include: [{ association: 'adminLocales' }] },
  surveyLocales: { include: [{ association: 'surveyLocales' }] },
}))
@Table({
  modelName: 'Language',
  tableName: 'languages',
  freezeTableName: true,
  underscored: true,
})
export default class Language
  extends BaseModel<InferAttributes<Language>, InferCreationAttributes<Language>>
  implements HasVisibility {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(16),
    unique: true,
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare englishName: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare localName: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(16),
  })
  declare countryFlagCode: string;

  @Column({
    allowNull: false,
    defaultValue: 'ltr',
    type: DataType.STRING(16),
  })
  declare textDirection: TextDirection;

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

  @HasMany(() => LanguageTranslation, 'languageId')
  declare translations?: NonAttribute<LanguageTranslation[]>;

  @HasMany(() => SystemLocale, {
    foreignKey: 'adminLanguageId',
    sourceKey: 'code',
  })
  declare adminLocales?: NonAttribute<SystemLocale[]>;

  @HasMany(() => SystemLocale, {
    foreignKey: 'respondentLanguageId',
    sourceKey: 'code',
  })
  declare surveyLocales?: NonAttribute<SystemLocale[]>;

  @BelongsTo(() => User, 'ownerId')
  declare owner?: User | null;

  @BelongsToMany(() => User, {
    through: {
      model: () => UserSecurable,
      unique: false,
      scope: {
        securable_type: 'Language',
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
    scope: { securable_type: 'Language' },
  })
  declare securables?: NonAttribute<UserSecurable[]>;
}

export type LanguageAttributes = Attributes<Language>;
export type LanguageCreationAttributes = CreationAttributes<Language>;
