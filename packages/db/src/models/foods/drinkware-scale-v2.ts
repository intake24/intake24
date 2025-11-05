import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type DrinkwareSet from './drinkware-set';

import type ProcessedImage from './processed-image';
import { Column, DataType, Table } from 'sequelize-typescript';

import type { LocaleTranslation } from '@intake24/common/types';
import type { DrinkwareScaleVolumeMethod } from '@intake24/common/types/http/admin';
import BaseModel from '../model';

@Table({
  modelName: 'DrinkwareScaleV2',
  tableName: 'drinkware_scales_v2',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class DrinkwareScaleV2 extends BaseModel<
  InferAttributes<DrinkwareScaleV2>,
  InferCreationAttributes<DrinkwareScaleV2>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare drinkwareSetId: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare choiceId: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare baseImageId: string;

  declare baseImage?: NonAttribute<ProcessedImage>;

  @Column({
    allowNull: true,
    type: DataType.TEXT({ length: 'long' }),
  })
  get label(): CreationOptional<LocaleTranslation> {
    const val = this.getDataValue('label') as unknown as string | null;
    return val ? JSON.parse(val) : {};
  }

  set label(value: LocaleTranslation) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('label', value && Object.keys(value).length ? JSON.stringify(value) : null);
  }

  @Column({
    allowNull: false,
    type: DataType.TEXT,
  })
  get outlineCoordinates(): number[] {
    const val = this.getDataValue('outlineCoordinates') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set outlineCoordinates(value: number[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('outlineCoordinates', JSON.stringify(value));
  }

  @Column({
    allowNull: false,
    type: DataType.TEXT,
  })
  get volumeSamples(): number[] {
    const val = this.getDataValue('volumeSamples') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set volumeSamples(value: number[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('volumeSamples', JSON.stringify(value));
  }

  @Column({
    allowNull: false,
    type: DataType.TEXT,
  })
  get volumeSamplesNormalised(): number[] {
    const val = this.getDataValue('volumeSamplesNormalised') as unknown;
    return val ? JSON.parse(val as string) : [];
  }

  set volumeSamplesNormalised(value: number[]) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('volumeSamplesNormalised', JSON.stringify(value));
  }

  @Column({
    allowNull: false,
    type: DataType.TEXT,
    defaultValue: 'lookUpTable',
  })
  declare volumeMethod: DrinkwareScaleVolumeMethod;

  declare drinkwareSet?: NonAttribute<DrinkwareSet>;
}

export type DrinkwareScaleV2Attributes = Attributes<DrinkwareScaleV2>;
export type DrinkwareScaleV2CreationAttributes = CreationAttributes<DrinkwareScaleV2>;
