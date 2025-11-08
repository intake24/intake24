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
  modelName: 'SurveySubmissionFoodCustomField',
  tableName: 'survey_submission_food_custom_fields',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SurveySubmissionFoodCustomField extends BaseModel<
  InferAttributes<SurveySubmissionFoodCustomField>,
  InferCreationAttributes<SurveySubmissionFoodCustomField>
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.UUID,
    unique: 'survey_submission_food_custom_fields_unique',
  })
  declare foodId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
    unique: 'survey_submission_food_custom_fields_unique',
  })
  declare name: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(2048),
  })
  declare value: string;

  @BelongsTo(() => SurveySubmissionFood, 'foodId')
  declare food?: NonAttribute<SurveySubmissionFood>;
}

export type SurveySubmissionFoodCustomFieldAttributes = Attributes<SurveySubmissionFoodCustomField>;
export type SurveySubmissionFoodCustomFieldCreationAttributes
  = CreationAttributes<SurveySubmissionFoodCustomField>;
