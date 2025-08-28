import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import type { LocaleTranslation } from '@intake24/common/types';
import { Category, Food } from '@intake24/db';

import BaseModel from '../model';

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

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare foodId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare associatedFoodCode: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
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

  @BelongsTo(() => Food, 'foodId')
  declare food?: Food;

  @BelongsTo(() => Category, { foreignKey: 'associatedCategoryCode', targetKey: 'code', constraints: false })
  declare associatedCategory?: NonAttribute<Category>;

  @BelongsTo(() => Food, { foreignKey: 'associatedFoodCode', targetKey: 'code', constraints: false })
  declare associatedFood?: NonAttribute<Food>;
}

export type AssociatedFoodAttributes = Attributes<AssociatedFood>;
export type AssociatedFoodCreationAttributes = CreationAttributes<AssociatedFood>;
