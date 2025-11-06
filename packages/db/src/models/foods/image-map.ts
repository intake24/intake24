import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type DrinkwareSet from './drinkware-set';

import type GuideImage from './guide-image';

import type ImageMapObject from './image-map-object';
import type ProcessedImage from './processed-image';
import { Column, DataType, Table } from 'sequelize-typescript';
import type { LocaleTranslation } from '@intake24/common/types';
import BaseModel from '../model';

@Table({
  modelName: 'ImageMap',
  tableName: 'image_maps',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class ImageMap extends BaseModel<
  InferAttributes<ImageMap>,
  InferCreationAttributes<ImageMap>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(32),
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare baseImageId: string;

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

  declare baseImage?: NonAttribute<ProcessedImage>;

  declare drinkwareSets?: NonAttribute<DrinkwareSet[]>;

  declare guideImages?: NonAttribute<GuideImage[]>;

  declare objects?: NonAttribute<ImageMapObject[]>;
}

export type ImageMapAttributes = Attributes<ImageMap>;
export type ImageMapCreationAttributes = CreationAttributes<ImageMap>;
