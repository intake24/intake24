import type {
  Attributes,
  CreationAttributes,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SystemNutrientType from './nutrient-type';
import SurveySubmissionFood from './survey-submission-food';

@Scopes(() => ({
  food: { include: [{ model: SurveySubmissionFood }] },
  nutrientType: { include: [{ model: SystemNutrientType }] },
}))
@Table({
  modelName: 'SurveySubmissionNutrient',
  tableName: 'survey_submission_nutrients',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SurveySubmissionNutrient extends BaseModel<
  InferAttributes<SurveySubmissionNutrient>,
  InferCreationAttributes<SurveySubmissionNutrient>
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
    type: DataType.DOUBLE,
  })
  declare amount: number;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare nutrientTypeId: string;

  @BelongsTo(() => SurveySubmissionFood, 'foodId')
  declare food?: NonAttribute<SurveySubmissionFood>;

  @BelongsTo(() => SystemNutrientType, 'nutrientTypeId')
  declare nutrientType?: NonAttribute<SystemNutrientType>;
}

export type SurveySubmissionNutrientAttributes = Attributes<SurveySubmissionNutrient>;
export type SurveySubmissionNutrientCreationAttributes
  = CreationAttributes<SurveySubmissionNutrient>;
