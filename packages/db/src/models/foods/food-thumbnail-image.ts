import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  ForeignKey as ForeignKeyType,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type Food from './food';

import type ProcessedImage from './processed-image';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'FoodThumbnailImage',
  tableName: 'food_thumbnail_images',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class FoodThumbnailImage extends BaseModel<
  InferAttributes<FoodThumbnailImage>,
  InferCreationAttributes<FoodThumbnailImage>
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
  declare foodId: ForeignKeyType<Food['id']>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare imageId: ForeignKeyType<ProcessedImage['id']>;

  declare food?: NonAttribute<Food>;

  declare image?: NonAttribute<ProcessedImage>;
}

export type FoodThumbnailImageAttributes = Attributes<FoodThumbnailImage>;
export type FoodThumbnailImageCreationAttributes = CreationAttributes<FoodThumbnailImage>;
