import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type AsServedSet from './as-served-set';
import { Column, DataType, Table } from 'sequelize-typescript';

import type { LocaleTranslation } from '@intake24/common/types';
import BaseModel from '../model';
import ProcessedImage from './processed-image';

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

  declare asServedSet?: NonAttribute<AsServedSet>;

  declare image?: NonAttribute<ProcessedImage>;

  declare thumbnailImage?: NonAttribute<ProcessedImage>;
}

export type AsServedImageAttributes = Attributes<AsServedImage>;
export type AsServedImageCreationAttributes = CreationAttributes<AsServedImage>;
