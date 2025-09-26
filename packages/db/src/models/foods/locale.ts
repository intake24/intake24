import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { Column, DataType, HasMany, Table } from 'sequelize-typescript';
import type { TextDirection } from '@intake24/common/types';
import { Category, Food, SplitList, SplitWord, SynonymSet } from '.';
import BaseModel from '../model';

@Table({
  modelName: 'Locale',
  tableName: 'locales',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class Locale extends BaseModel<
  InferAttributes<Locale>,
  InferCreationAttributes<Locale>
> {
  @Column({
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare id: string;

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

  @HasMany(() => Category, 'localeId')
  declare categories?: NonAttribute<Category[]>;

  @HasMany(() => Food, 'localeId')
  declare foods?: NonAttribute<Food[]>;

  @HasMany(() => SplitList, 'localeId')
  declare splitLists?: NonAttribute<SplitList[]>;

  @HasMany(() => SplitWord, 'localeId')
  declare splitWords?: NonAttribute<SplitWord[]>;

  @HasMany(() => SynonymSet, 'localeId')
  declare synonymSets?: NonAttribute<SynonymSet[]>;
}

export type FoodsLocaleAttributes = Attributes<Locale>;
export type FoodsLocaleCreationAttributes = CreationAttributes<Locale>;
