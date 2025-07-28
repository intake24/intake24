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
  modelName: 'FixedFoodRanking',
  tableName: 'fixed_food_ranking',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class FixedFoodRanking extends BaseModel<
  InferAttributes<FixedFoodRanking>,
  InferCreationAttributes<FixedFoodRanking>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.INTEGER,
  })
  declare id: CreationOptional<number>;

  @Column({
    allowNull: false,
    type: DataType.STRING(16),
  })
  declare localeId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare foodCode: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare rank: number;
}

export type FixedFoodRankingAttributes = Attributes<FixedFoodRanking>;
export type FixedFoodRankingCreationAttributes = CreationAttributes<FixedFoodRanking>;
