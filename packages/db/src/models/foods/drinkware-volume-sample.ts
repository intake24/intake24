import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type DrinkwareScale from './drinkware-scale';

import { Column, DataType, Table } from 'sequelize-typescript';
import BaseModel from '../model';

@Table({
  modelName: 'DrinkwareVolumeSample',
  tableName: 'drinkware_volume_samples',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class DrinkwareVolumeSample extends BaseModel<
  InferAttributes<DrinkwareVolumeSample>,
  InferCreationAttributes<DrinkwareVolumeSample>
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
  declare drinkwareScaleId: string;

  @Column({
    allowNull: false,
    type: DataType.DOUBLE,
  })
  declare fill: number;

  @Column({
    allowNull: false,
    type: DataType.DOUBLE,
  })
  declare volume: number;

  declare scale?: NonAttribute<DrinkwareScale>;
}

export type DrinkwareVolumeSampleAttributes = Attributes<DrinkwareVolumeSample>;
export type DrinkwareVolumeSampleCreationAttributes = CreationAttributes<DrinkwareVolumeSample>;
