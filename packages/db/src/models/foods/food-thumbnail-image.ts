import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  ForeignKey as ForeignKeyType,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import Food from './food';
import ProcessedImage from './processed-image';

@Scopes(() => ({
  image: { include: [{ model: ProcessedImage, as: 'image' }] },
}))
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

  @BelongsTo(() => Food, 'foodId')
  declare food?: NonAttribute<Food>;

  @BelongsTo(() => ProcessedImage, 'imageId')
  declare image?: NonAttribute<ProcessedImage>;
}

export type FoodThumbnailImageAttributes = Attributes<FoodThumbnailImage>;
export type FoodThumbnailImageCreationAttributes = CreationAttributes<FoodThumbnailImage>;
