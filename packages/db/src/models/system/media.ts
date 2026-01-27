import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'Media',
  tableName: 'media',
  freezeTableName: true,
  underscored: true,
})
export default class Media extends BaseModel<
  InferAttributes<Media>,
  InferCreationAttributes<Media>
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare modelType: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(36),
  })
  declare modelId: string | null;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare disk: 'public' | 'private';

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare collection: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare filename: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare mimetype: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare size: number;

  @Column({
    allowNull: false,
    type: DataType.DATE,
  })
  declare readonly createdAt: CreationOptional<Date>;

  @Column({
    allowNull: false,
    type: DataType.DATE,
  })
  declare readonly updatedAt: CreationOptional<Date>;
}

export type MediaAttributes = Attributes<Media>;
export type MediaCreationAttributes = CreationAttributes<Media>;
