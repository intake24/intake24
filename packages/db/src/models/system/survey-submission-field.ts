import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SurveySubmissionFood from './survey-submission-food';

@Scopes(() => ({
  food: { include: [{ model: SurveySubmissionFood }] },
}))
@Table({
  modelName: 'SurveySubmissionField',
  tableName: 'survey_submission_fields',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SurveySubmissionField extends BaseModel<
  InferAttributes<SurveySubmissionField>,
  InferCreationAttributes<SurveySubmissionField>
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  declare foodId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare fieldName: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare value: string;

  @BelongsTo(() => SurveySubmissionFood, 'foodId')
  declare food?: NonAttribute<SurveySubmissionFood>;
}

export type SurveySubmissionFieldAttributes = Attributes<SurveySubmissionField>;
export type SurveySubmissionFieldCreationAttributes = CreationAttributes<SurveySubmissionField>;
