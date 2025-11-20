import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SurveySubmissionMeal from './survey-submission-meal';

@Scopes(() => ({
  meal: { include: [{ model: SurveySubmissionMeal }] },
}))
@Table({
  modelName: 'SurveySubmissionMealCustomField',
  tableName: 'survey_submission_meal_custom_fields',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SurveySubmissionMealCustomField extends BaseModel<
  InferAttributes<SurveySubmissionMealCustomField>,
  InferCreationAttributes<SurveySubmissionMealCustomField>
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.UUID,
    unique: 'survey_submission_meal_custom_fields_unique',
  })
  declare mealId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: 'survey_submission_meal_custom_fields_unique',
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(2048),
  })
  declare value: string;

  @BelongsTo(() => SurveySubmissionMeal, 'mealId')
  declare meal?: NonAttribute<SurveySubmissionMeal>;
}

export type SurveySubmissionMealCustomFieldAttributes = Attributes<SurveySubmissionMealCustomField>;
export type SurveySubmissionMealCustomFieldCreationAttributes
  = CreationAttributes<SurveySubmissionMealCustomField>;
