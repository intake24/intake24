import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SourceImage from './source-image';

@Scopes(() => ({
  sourceImage: { include: [{ model: SourceImage }] },
}))
@Table({
  modelName: 'SourceImageKeyword',
  tableName: 'source_image_keywords',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SourceImageKeyword extends BaseModel<
  InferAttributes<SourceImageKeyword>,
  InferCreationAttributes<SourceImageKeyword>
> {
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare sourceImageId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare keyword: string;

  @BelongsTo(() => SourceImage, 'sourceImageId')
  declare sourceImage?: NonAttribute<SourceImage>;
}

export type SourceImageKeywordAttributes = Attributes<SourceImageKeyword>;
export type SourceImageKeywordCreationAttributes = CreationAttributes<SourceImageKeyword>;
