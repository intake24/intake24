import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { LocaleTranslation } from '@intake24/common/types';

import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import AsServedSet from './as-served-set';
import ProcessedImage from './processed-image';

@Scopes(() => ({
  asServedSet: { include: [{ model: AsServedSet }] },
  image: { include: [{ model: ProcessedImage, as: 'image' }] },
  thumbnailImage: { include: [{ model: ProcessedImage, as: 'thumbnailImage' }] },
}))
@Table({
  modelName: 'AsServedImage',
  tableName: 'as_served_images',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class AsServedImage extends BaseModel<
  InferAttributes<AsServedImage>,
  InferCreationAttributes<AsServedImage>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.FLOAT,
  })
  declare weight: number;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare asServedSetId: ForeignKey<AsServedSet['id']>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare imageId: ForeignKey<ProcessedImage['id']>;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare thumbnailImageId: ForeignKey<ProcessedImage['id']>;

  @Column({
    allowNull: true,
    type: DataType.JSONB,
  })
  get label(): CreationOptional<LocaleTranslation> {
    return this.getDataValue('label') ?? {};
  }

  set label(value: CreationOptional<LocaleTranslation>) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('label', value && Object.keys(value).length ? value : null);
  }

  @BelongsTo(() => AsServedSet, 'asServedSetId')
  declare asServedSet?: NonAttribute<AsServedSet>;

  @BelongsTo(() => ProcessedImage, 'imageId')
  declare image?: NonAttribute<ProcessedImage>;

  @BelongsTo(() => ProcessedImage, 'thumbnailImageId')
  declare thumbnailImage?: NonAttribute<ProcessedImage>;
}

export type AsServedImageAttributes = Attributes<AsServedImage>;
export type AsServedImageCreationAttributes = CreationAttributes<AsServedImage>;
