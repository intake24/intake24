import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';
import type { CustomData } from '@intake24/common/surveys';
import BaseModel from '../model';
import SurveySubmission from './survey-submission';
import SurveySubmissionFood from './survey-submission-food';
import SurveySubmissionMissingFood from './survey-submission-missing-food';

@Scopes(() => ({
  submission: { include: [{ model: SurveySubmission }] },
  foods: { include: [{ model: SurveySubmissionFood }] },
  missingFoods: { include: [{ model: SurveySubmissionMissingFood }] },
}))
@Table({
  modelName: 'SurveySubmissionMeal',
  tableName: 'survey_submission_meals',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SurveySubmissionMeal extends BaseModel<
  InferAttributes<SurveySubmissionMeal>,
  InferCreationAttributes<SurveySubmissionMeal>
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
  declare surveySubmissionId: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare hours: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare minutes: number;

  @Column({
    allowNull: true,
    type: DataType.STRING(64),
  })
  declare name: string | null;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
  })
  declare duration: number | null;

  @Column({
    allowNull: true,
    type: DataType.JSONB(),
  })
  get customData(): CreationOptional<CustomData> {
    return this.getDataValue('customData') ?? {} as CustomData;
  }

  @BelongsTo(() => SurveySubmission, 'surveySubmissionId')
  declare submission?: NonAttribute<SurveySubmission>;

  @HasMany(() => SurveySubmissionFood, 'mealId')
  declare foods?: NonAttribute<SurveySubmissionFood[]>;

  @HasMany(() => SurveySubmissionMissingFood, 'mealId')
  declare missingFoods?: NonAttribute<SurveySubmissionMissingFood[]>;
}

export type SurveySubmissionMealAttributes = Attributes<SurveySubmissionMeal>;
export type SurveySubmissionMealCreationAttributes = CreationAttributes<SurveySubmissionMeal>;
