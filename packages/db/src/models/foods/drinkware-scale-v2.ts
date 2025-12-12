import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import type { LocaleTranslation } from '@intake24/common/types';
import type { DrinkwareScaleVolumeMethod } from '@intake24/common/types/http/admin';

import BaseModel from '../model';
import DrinkwareSet from './drinkware-set';
import ProcessedImage from './processed-image';

@Scopes(() => ({
  drinkwareSet: { include: [{ model: DrinkwareSet }] },
}))
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

  @BelongsTo(() => ProcessedImage, 'baseImageId')
  declare baseImage?: NonAttribute<ProcessedImage>;

  @Column({
    allowNull: true,
    type: DataType.JSONB,
  })
  get label(): CreationOptional<LocaleTranslation> {
    return this.getDataValue('label') ?? {};
  }

  set label(value: CreationOptional<LocaleTranslation>) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('label', value && Object.keys(value).length ? value : null);
  }

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare outlineCoordinates: number[];

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare volumeSamples: number[];

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare volumeSamplesNormalised: number[];

  @Column({
    allowNull: false,
    type: DataType.STRING(16),
    defaultValue: 'lookUpTable',
  })
  declare volumeMethod: DrinkwareScaleVolumeMethod;

  @BelongsTo(() => DrinkwareSet, 'drinkwareSetId')
  declare drinkwareSet?: NonAttribute<DrinkwareSet>;
}

export type DrinkwareScaleV2Attributes = Attributes<DrinkwareScaleV2>;
export type DrinkwareScaleV2CreationAttributes = CreationAttributes<DrinkwareScaleV2>;
