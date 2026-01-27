import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { BelongsTo, Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SurveySubmissionExternalSource from './survey-submission-external-source';
import SurveySubmissionMeal from './survey-submission-meal';

@Scopes(() => ({
  meal: { include: [{ model: SurveySubmissionMeal }] },
}))
@Table({
  modelName: 'SurveySubmissionMissingFood',
  tableName: 'survey_submission_missing_foods',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SurveySubmissionMissingFood extends BaseModel<
  InferAttributes<SurveySubmissionMissingFood>,
  InferCreationAttributes<SurveySubmissionMissingFood>
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    allowNull: true,
    type: DataType.UUID,
  })
  declare parentId: CreationOptional<string | null>;

  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  declare mealId: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare index: number;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare name: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(512),
  })
  declare brand: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(1024),
  })
  declare description: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(1024),
  })
  declare portionSize: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(1024),
  })
  declare leftovers: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(128),
  })
  declare barcode: string | null;

  @BelongsTo(() => SurveySubmissionMeal, 'mealId')
  declare meal?: NonAttribute<SurveySubmissionMeal>;

  @HasMany(() => SurveySubmissionExternalSource, {
    foreignKey: 'foodId',
    constraints: false,
    scope: {
      foodType: 'missing-food',
    },
  })
  declare externalSources?: NonAttribute<SurveySubmissionExternalSource[]>;
}

export type SurveySubmissionMissingFoodAttributes = Attributes<SurveySubmissionMissingFood>;
export type SurveySubmissionMissingFoodCreationAttributes
  = CreationAttributes<SurveySubmissionMissingFood>;
