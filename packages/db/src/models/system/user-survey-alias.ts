import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import BaseModel from '../model';
import Survey from './survey';
import User from './user';

@Scopes(() => ({
  user: { include: [{ model: User }] },
}))
@Table({
  modelName: 'UserSurveyAlias',
  tableName: 'user_survey_aliases',
  freezeTableName: true,
  underscored: true,
})
export default class UserSurveyAlias extends BaseModel<
  InferAttributes<UserSurveyAlias>,
  InferCreationAttributes<UserSurveyAlias>
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
  @ForeignKey(() => User)
  declare userId: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
    unique: 'survey_id_username_unique',
  })
  @ForeignKey(() => Survey)
  declare surveyId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
    unique: 'survey_id_username_unique',
  })
  declare username: string;

  @Column({
    allowNull: false,
    unique: true,
    type: DataType.STRING(128),
  })
  declare urlAuthToken: string;

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;

  @BelongsTo(() => Survey, 'surveyId')
  declare survey?: NonAttribute<Survey>;
}

export type UserSurveyAliasAttributes = Attributes<UserSurveyAlias>;
export type UserSurveyAliasCreationAttributes = CreationAttributes<UserSurveyAlias>;
