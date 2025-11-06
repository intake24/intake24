import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type ProcessedImage from './processed-image';

import type SourceImageKeyword from './source-image-keyword';
import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

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

  declare keywords?: NonAttribute<SourceImageKeyword[]>;

  declare processedImages?: NonAttribute<ProcessedImage[]>;
}

export type SourceImageAttributes = Attributes<SourceImage>;
export type SourceImageCreationAttributes = CreationAttributes<SourceImage>;
