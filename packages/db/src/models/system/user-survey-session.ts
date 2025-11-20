import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, CreatedAt, DataType, Table, UpdatedAt } from 'sequelize-typescript';

import type { SurveyState } from '@intake24/common/surveys';

import BaseModel from '../model';
import Survey from './survey';
import User from './user';
import UserSurveyAlias from './user-survey-alias';

@Table({
  modelName: 'UserSurveySession',
  tableName: 'user_survey_sessions',
  freezeTableName: true,
  underscored: true,
})
export default class UserSurveySession extends BaseModel<
  InferAttributes<UserSurveySession>,
  InferCreationAttributes<UserSurveySession>
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
    unique: 'user_survey_sessions_unique',
  })
  declare userId: string;

  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.BIGINT,
    unique: 'user_survey_sessions_unique',
  })
  declare surveyId: string;

  @Column({
    allowNull: false,
    type: DataType.TEXT({ length: 'long' }),
  })
  get sessionData(): SurveyState {
    const val = this.getDataValue('sessionData') as unknown;
    return JSON.parse(val as string);
  }

  set sessionData(value: SurveyState) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('sessionData', JSON.stringify(value));
  }

  @CreatedAt
  declare readonly createdAt: CreationOptional<Date>;

  @UpdatedAt
  declare readonly updatedAt: CreationOptional<Date>;

  @BelongsTo(() => Survey, 'surveyId')
  declare survey?: NonAttribute<Survey>;

  @BelongsTo(() => User, 'userId')
  declare user?: NonAttribute<User>;

  @BelongsTo(() => UserSurveyAlias, { foreignKey: 'userId', targetKey: 'userId' })
  declare alias?: NonAttribute<UserSurveyAlias>;
}

export type UserSurveySessionAttributes = Attributes<UserSurveySession>;
export type UserSurveySessionCreationAttributes = CreationAttributes<UserSurveySession>;
