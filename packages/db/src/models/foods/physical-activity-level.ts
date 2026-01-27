import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';

@Scopes(() => ({
  list: { order: [['id', 'ASC']] },
}))
@Table({
  modelName: 'PhysicalActivityLevel',
  tableName: 'physical_activity_levels',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class PhysicalActivityLevel extends BaseModel<
  InferAttributes<PhysicalActivityLevel>,
  InferCreationAttributes<PhysicalActivityLevel>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.DOUBLE,
  })
  declare coefficient: number;
}

export type PhysicalActivityLevelAttributes = Attributes<PhysicalActivityLevel>;
export type PhysicalActivityLevelCreationAttributes = CreationAttributes<PhysicalActivityLevel>;
