import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { LocaleTranslation } from '@intake24/common/types';

import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import GuideImage from './guide-image';

@Table({
  modelName: 'GuideImageObject',
  tableName: 'guide_image_objects',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class GuideImageObject extends BaseModel<
  InferAttributes<GuideImageObject>,
  InferCreationAttributes<GuideImageObject>
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
  declare guideImageId: string;

  @Column({
    allowNull: false,
    type: DataType.DOUBLE,
  })
  declare weight: number;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare imageMapObjectId: string;

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

  @BelongsTo(() => GuideImage, 'guideImageId')
  declare guideImage?: NonAttribute<GuideImage>;
}

export type GuideImageObjectAttributes = Attributes<GuideImageObject>;
export type GuideImageObjectCreationAttributes = CreationAttributes<GuideImageObject>;
