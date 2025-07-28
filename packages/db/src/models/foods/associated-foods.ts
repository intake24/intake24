import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Scopes, Table } from 'sequelize-typescript';

import type { LocaleTranslation } from '@intake24/common/types';
import { Category, Food, FoodsLocale } from '@intake24/db';

import BaseModel from '../model';

@Scopes(() => ({
  locale: { include: [{ model: FoodsLocale }] },
  category: { include: [{ model: Category }] },
}))
@Table({
  modelName: 'AssociatedFood',
  tableName: 'associated_foods',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class AssociatedFood extends BaseModel<
  InferAttributes<AssociatedFood>,
  InferCreationAttributes<AssociatedFood>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Food)
  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare foodCode: string;

  @ForeignKey(() => FoodsLocale)
  @Column({
    allowNull: false,
    type: DataType.STRING(16),
  })
  declare localeId: string;

  @ForeignKey(() => Food)
  @Column({
    allowNull: true,
    type: DataType.STRING(32),
  })
  declare associatedFoodCode: string | null;

  @ForeignKey(() => Category)
  @Column({
    allowNull: true,
    type: DataType.STRING(32),
  })
  declare associatedCategoryCode: string | null;

  @Column({
    allowNull: false,
    type: DataType.TEXT({ length: 'long' }),
  })
  get text(): LocaleTranslation {
    const val = this.getDataValue('text') as unknown;
    return val ? JSON.parse(val as string) : {};
  }

  set text(value: LocaleTranslation) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('text', JSON.stringify(value ?? {}));
  }

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare linkAsMain: boolean;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare multiple: boolean;

  @Column({
    allowNull: false,
    type: DataType.TEXT({ length: 'long' }),
  })
  get genericName(): LocaleTranslation {
    const val = this.getDataValue('genericName') as unknown;
    return val ? JSON.parse(val as string) : {};
  }

  set genericName(value: LocaleTranslation) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('genericName', JSON.stringify(value ?? {}));
  }

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare orderBy: string;

  @BelongsTo(() => Food, 'foodCode')
  declare food?: Food;

  @BelongsTo(() => FoodsLocale, 'localeId')
  declare locale?: NonAttribute<FoodsLocale>;

  @BelongsTo(() => Category, 'associatedCategoryCode')
  declare associatedCategory?: NonAttribute<Category>;

  @BelongsTo(() => Food, 'associatedFoodCode')
  declare associatedFood?: NonAttribute<Food>;
}

export type AssociatedFoodAttributes = Attributes<AssociatedFood>;
export type AssociatedFoodCreationAttributes = CreationAttributes<AssociatedFood>;
