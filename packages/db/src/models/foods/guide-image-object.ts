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

  @BelongsTo(() => GuideImage, 'guideImageId')
  declare guideImage?: NonAttribute<GuideImage>;
}

export type GuideImageObjectAttributes = Attributes<GuideImageObject>;
export type GuideImageObjectCreationAttributes = CreationAttributes<GuideImageObject>;
