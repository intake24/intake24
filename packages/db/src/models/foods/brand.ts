import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type Food from './food';

import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'Brand',
  tableName: 'brands',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class Brand extends BaseModel<
  InferAttributes<Brand>,
  InferCreationAttributes<Brand>
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
  declare foodId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare name: string;

  declare food?: NonAttribute<Food>;
}

export type BrandAttributes = Attributes<Brand>;
export type BrandCreationAttributes = CreationAttributes<Brand>;
