import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type AsServedImage from './as-served-image';

import type AsServedSet from './as-served-set';
import type FoodThumbnailImage from './food-thumbnail-image';
import type ImageMap from './image-map';
import type SourceImage from './source-image';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

export enum ProcessedImagePurposes {
  AsServedMainImage = 1,
  AsServedThumbnail = 2,
  SelectionImage = 3,
  ImageMapBaseImage = 4,
  ImageMapOverlay = 5,
  DrinkScaleBaseImage = 6,
  FoodThumbnailImage = 7,
}

export type ProcessedImagePurpose = ProcessedImagePurposes;

@Table({
  modelName: 'ProcessedImage',
  tableName: 'processed_images',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class ProcessedImage extends BaseModel<
  InferAttributes<ProcessedImage>,
  InferCreationAttributes<ProcessedImage>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(1024),
  })
  declare path: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare sourceId: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare purpose: ProcessedImagePurpose;

  @Column({
    allowNull: false,
    type: DataType.DATE,
    defaultValue: () => new Date(),
  })
  declare createdAt: CreationOptional<Date>;

  declare sourceImage?: NonAttribute<SourceImage>;

  declare asServedSets?: NonAttribute<AsServedSet[]>;

  declare asServedImages?: NonAttribute<AsServedImage[]>;

  declare asServedThumbnailImages?: NonAttribute<AsServedImage[]>;

  declare imageMaps?: NonAttribute<ImageMap[]>;

  declare thumbnailImages?: NonAttribute<FoodThumbnailImage[]>;
}

export type ProcessedImageAttributes = Attributes<ProcessedImage>;
export type ProcessedImageCreationAttributes = CreationAttributes<ProcessedImage>;
