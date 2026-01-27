import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import {
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import Permission from './permission';
import PermissionRole from './permission-role';
import RoleUser from './role-user';
import User from './user';

@Scopes(() => ({
  list: { attributes: ['id', 'name', 'displayName'], order: [['name', 'ASC']] },
  permissions: { include: [{ model: Permission, through: { attributes: [] } }] },
  users: { include: [{ model: User, through: { attributes: [] } }] },
}))
@Table({
  modelName: 'Role',
  tableName: 'roles',
  freezeTableName: true,
  underscored: true,
})
export default class Role extends BaseModel<InferAttributes<Role>, InferCreationAttributes<Role>> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING(128),
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare displayName: string;

  @Column({
    allowNull: true,
    type: DataType.TEXT,
  })
  declare description: CreationOptional<string | null>;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsToMany(() => User, () => RoleUser)
  declare users?: NonAttribute<User[]>;

  @HasMany(() => RoleUser, 'roleId')
  declare userLinks?: NonAttribute<RoleUser[]>;

  @BelongsToMany(() => Permission, () => PermissionRole)
  declare permissions?: NonAttribute<Permission[]>;

  @HasMany(() => PermissionRole, 'roleId')
  declare permissionLinks?: NonAttribute<PermissionRole[]>;
}

export type RoleAttributes = Attributes<Role>;
export type RoleCreationAttributes = CreationAttributes<Role>;
