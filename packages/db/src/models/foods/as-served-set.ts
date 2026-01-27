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

import { BelongsTo, Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import AsServedImage from './as-served-image';
import ProcessedImage from './processed-image';

@Scopes(() => ({
  selectionImage: { include: [{ model: ProcessedImage }] },
  asServedImages: { include: [{ model: AsServedImage }] },
}))
@Table({
  modelName: 'AsServedSet',
  tableName: 'as_served_sets',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class AsServedSet extends BaseModel<
  InferAttributes<AsServedSet>,
  InferCreationAttributes<AsServedSet>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(32),
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare selectionImageId: ForeignKey<ProcessedImage['id']>;

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

  @BelongsTo(() => ProcessedImage, 'selectionImageId')
  declare selectionImage?: NonAttribute<ProcessedImage>;

  @HasMany(() => AsServedImage, 'asServedSetId')
  declare asServedImages?: NonAttribute<AsServedImage[]>;
}

export type AsServedSetAttributes = Attributes<AsServedSet>;
export type AsServedSetCreationAttributes = CreationAttributes<AsServedSet>;
