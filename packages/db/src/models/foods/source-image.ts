import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import ProcessedImage from './processed-image';
import SourceImageKeyword from './source-image-keyword';

@Scopes(() => ({
  keywords: { include: [{ model: SourceImageKeyword }] },
  processedImages: { include: [{ model: ProcessedImage }] },
}))
@Table({
  modelName: 'SourceImage',
  tableName: 'source_images',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SourceImage extends BaseModel<
  InferAttributes<SourceImage>,
  InferCreationAttributes<SourceImage>
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
    type: DataType.STRING(1024),
  })
  declare thumbnailPath: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare uploader: string;

  @Column({
    allowNull: false,
    type: DataType.DATE,
    defaultValue: () => new Date(),
  })
  declare uploadedAt: CreationOptional<Date>;

  @HasMany(() => SourceImageKeyword, 'sourceImageId')
  declare keywords?: NonAttribute<SourceImageKeyword[]>;

  @HasMany(() => ProcessedImage, 'sourceId')
  declare processedImages?: NonAttribute<ProcessedImage[]>;
}

export type SourceImageAttributes = Attributes<SourceImage>;
export type SourceImageCreationAttributes = CreationAttributes<SourceImage>;
