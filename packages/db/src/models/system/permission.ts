import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
  Transaction,
} from 'sequelize';

import {
  AfterBulkCreate,
  AfterCreate,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { aclConfig } from '@intake24/common-backend';

import BaseModel from '../model';
import PermissionRole from './permission-role';
import PermissionUser from './permission-user';
import Role from './role';
import User from './user';

export async function addPermissionsToAdmin(permissions: Permission[], options: { transaction?: Transaction } = {}): Promise<void> {
  const { transaction } = options;
  const admin = await Role.findOne({ where: { name: aclConfig.roles.superuser }, transaction });
  if (admin) {
    const ids = [...new Set(permissions.map(({ id }) => id))];
    await admin.$add('permissions', ids, { transaction });
  }
}

@Scopes(() => ({
  list: { attributes: ['id', 'name', 'displayName'], order: [['name', 'ASC']] },
  roles: { include: [{ model: Role, through: { attributes: [] } }] },
  rolesUsers: { include: [{ model: Role, include: [{ model: User }] }] },
  users: { include: [{ model: User, through: { attributes: [] } }] },
}))
@Table({
  modelName: 'Permission',
  tableName: 'permissions',
  freezeTableName: true,
  underscored: true,
})
export default class Permission extends BaseModel<
  InferAttributes<Permission>,
  InferCreationAttributes<Permission>
> {
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
  declare createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare updatedAt: CreationOptional<Date>;

  @BelongsToMany(() => Role, () => PermissionRole)
  declare roles?: NonAttribute<Role[]>;

  @HasMany(() => PermissionRole, 'permissionId')
  declare roleLinks?: NonAttribute<PermissionRole[]>;

  @BelongsToMany(() => User, () => PermissionUser)
  declare users?: NonAttribute<User[]>;

  @HasMany(() => PermissionUser, 'permissionId')
  declare userLinks?: NonAttribute<PermissionUser[]>;

  // Always attach new permission(s) to main admin/superuser role
  @AfterCreate
  static async handleAdminPermission(permission: Permission, options?: { transaction?: Transaction }): Promise<void> {
    await addPermissionsToAdmin([permission], options);
  }

  @AfterBulkCreate
  static async handleAdminPermissions(permissions: Permission[], options?: { transaction?: Transaction }): Promise<void> {
    await addPermissionsToAdmin(permissions, options);
  }
}

export type PermissionAttributes = Attributes<Permission>;
export type PermissionCreationAttributes = CreationAttributes<Permission>;
