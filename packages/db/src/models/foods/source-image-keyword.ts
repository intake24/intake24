import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type SourceImage from './source-image';

import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

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

  declare sourceImage?: NonAttribute<SourceImage>;
}

export type SourceImageKeywordAttributes = Attributes<SourceImageKeyword>;
export type SourceImageKeywordCreationAttributes = CreationAttributes<SourceImageKeyword>;
