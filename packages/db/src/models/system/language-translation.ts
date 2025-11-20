import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, CreatedAt, DataType, Table, UpdatedAt } from 'sequelize-typescript';

import type { Application } from '@intake24/common/types';
import type { LocaleMessageDictionary } from '@intake24/i18n';

import BaseModel from '../model';
import Language from './language';

@Table({
  modelName: 'LanguageTranslations',
  tableName: 'language_translations',
  freezeTableName: true,
  underscored: true,
})
export default class LanguageTranslation extends BaseModel<
  InferAttributes<LanguageTranslation>,
  InferCreationAttributes<LanguageTranslation>
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
    unique: 'language_translations_unique',
  })
  declare languageId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: 'language_translations_unique',
  })
  declare application: Application;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: 'language_translations_unique',
  })
  declare section: string;

  @Column({
    allowNull: false,
    type: DataType.TEXT({ length: 'long' }),
  })
  get messages(): LocaleMessageDictionary<any> {
    const val = this.getDataValue('messages') as unknown;
    return JSON.parse(val as string);
  }

  set messages(value: LocaleMessageDictionary<any>) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('messages', JSON.stringify(value));
  }

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => Language, 'languageId')
  declare language?: NonAttribute<Language>;
}

export type LanguageTranslationAttributes = Attributes<LanguageTranslation>;
export type LanguageTranslationCreationAttributes = CreationAttributes<LanguageTranslation>;
