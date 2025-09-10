import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { Column, DataType, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Table({
  modelName: 'PopularityCounter',
  tableName: 'popularity_counters',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class PopularityCounter extends BaseModel<
  InferAttributes<PopularityCounter>,
  InferCreationAttributes<PopularityCounter>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(64),
  })
  declare foodCode: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare counter: number;
}

export type PopularityCounterAttributes = Attributes<PopularityCounter>;
export type PopularityCounterCreationAttributes = CreationAttributes<PopularityCounter>;
