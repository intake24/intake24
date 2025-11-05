import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import type { LocaleTranslation } from '@intake24/common/types';

import BaseModel from '../model';
import DrinkwareSet from './drinkware-set';
import GuideImage from './guide-image';
import ImageMapObject from './image-map-object';
import ProcessedImage from './processed-image';

@Scopes(() => ({
  guideImages: { include: [{ model: GuideImage }] },
  baseImage: { include: [{ model: ProcessedImage }] },
  objects: { include: [{ model: ImageMapObject }] },
}))
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

  @BelongsTo(() => ProcessedImage, 'baseImageId')
  declare baseImage?: NonAttribute<ProcessedImage>;

  @HasMany(() => DrinkwareSet, 'imageMapId')
  declare drinkwareSets?: NonAttribute<DrinkwareSet[]>;

  @HasMany(() => GuideImage, 'imageMapId')
  declare guideImages?: NonAttribute<GuideImage[]>;

  @HasMany(() => ImageMapObject, 'imageMapId')
  declare objects?: NonAttribute<ImageMapObject[]>;
}

export type ImageMapAttributes = Attributes<ImageMap>;
export type ImageMapCreationAttributes = CreationAttributes<ImageMap>;
