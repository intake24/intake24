import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, ForeignKey, Table } from 'sequelize-typescript';

import type { Sex, WeightTarget } from '@intake24/common/feedback';

import BaseModel from '../model';
import User from './user';

@Table({
  modelName: 'UserPhysicalData',
  tableName: 'user_physical_data',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class UserPhysicalData extends BaseModel<
  InferAttributes<UserPhysicalData>,
  InferCreationAttributes<UserPhysicalData>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  @ForeignKey(() => User)
  declare userId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare sex: Sex | null;

  @Column({
    allowNull: true,
    type: DataType.DOUBLE,
  })
  declare weightKg: number | null;

  @Column({
    allowNull: true,
    type: DataType.DOUBLE,
  })
  declare heightCm: number | null;

  @Column({
    allowNull: true,
    type: DataType.BIGINT,
  })
  declare physicalActivityLevelId: string | null;

  @Column({
    allowNull: true,
    type: DataType.DATEONLY,
  })
  get birthdate(): number | null {
    const birthdate = this.getDataValue('birthdate') as unknown;
    if (typeof birthdate === 'string')
      return Number.parseInt(birthdate.slice(0, 4), 10);

    return null;
  }

  set birthdate(value: number | string | null) {
    if (value === null) {
      this.setDataValue('birthdate', value);
      return;
    }

    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('birthdate', typeof value === 'number' ? value.toString() : value);
  }

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare weightTarget: WeightTarget | null;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User[]>;
}

export type UserPhysicalDataAttributes = Attributes<UserPhysicalData>;
export type UserPhysicalDataCreationAttributes = CreationAttributes<UserPhysicalData>;
