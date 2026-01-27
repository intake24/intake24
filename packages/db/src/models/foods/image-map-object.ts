import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { LocaleTranslation } from '@intake24/common/types';

import { BelongsTo, Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import ImageMap from './image-map';
import ProcessedImage from './processed-image';

@Table({
  modelName: 'ImageMapObject',
  tableName: 'image_map_objects',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class ImageMapObject extends BaseModel<
  InferAttributes<ImageMapObject>,
  InferCreationAttributes<ImageMapObject>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: string;

  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(32),
  })
  declare imageMapId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare navigationIndex: number;

  @Column({
    allowNull: false,
    type: DataType.JSONB,
  })
  declare outlineCoordinates: number[];

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare overlayImageId: CreationOptional<string | null>;

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

  @BelongsTo(() => ImageMap, 'imageMapId')
  declare imageMap?: NonAttribute<ImageMap>;

  @BelongsTo(() => ProcessedImage, 'overlayImageId')
  declare overlayImage?: NonAttribute<ProcessedImage | null>;
}

export type ImageMapObjectAttributes = Attributes<ImageMapObject>;
export type ImageMapObjectCreationAttributes = CreationAttributes<ImageMapObject>;
