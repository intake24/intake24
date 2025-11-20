import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SurveySubmission from './survey-submission';

@Scopes(() => ({
  submission: { include: [{ model: SurveySubmission }] },
}))
@Table({
  modelName: 'SurveySubmissionCustomField',
  tableName: 'survey_submission_custom_fields',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SurveySubmissionCustomField extends BaseModel<
  InferAttributes<SurveySubmissionCustomField>,
  InferCreationAttributes<SurveySubmissionCustomField>
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.UUID,
    unique: 'survey_submission_custom_fields_unique',
  })
  declare surveySubmissionId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: 'survey_submission_custom_fields_unique',
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(2048),
  })
  declare value: string;

  @BelongsTo(() => SurveySubmission, 'surveySubmissionId')
  declare submission?: NonAttribute<SurveySubmission>;
}

export type SurveySubmissionCustomFieldAttributes = Attributes<SurveySubmissionCustomField>;
export type SurveySubmissionCustomFieldCreationAttributes
  = CreationAttributes<SurveySubmissionCustomField>;
