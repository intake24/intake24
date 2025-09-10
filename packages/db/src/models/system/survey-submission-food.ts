import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import type { PortionSizeMethodId } from '@intake24/common/surveys';

import {
  SurveySubmissionExternalSource,
  SurveySubmissionField,
  SurveySubmissionFoodCustomField,
  SurveySubmissionMeal,
  SurveySubmissionNutrient,
  SurveySubmissionPortionSizeField,
} from '.';
import BaseModel from '../model';

@Scopes(() => ({
  meal: { include: [{ model: SurveySubmissionMeal }] },
  customFields: { include: [{ model: SurveySubmissionFoodCustomField }] },
  fields: { include: [{ model: SurveySubmissionField }] },
  nutrients: { include: [{ model: SurveySubmissionNutrient }] },
  portionSizes: { include: [{ model: SurveySubmissionPortionSizeField }] },
}))
@Table({
  modelName: 'SurveySubmissionFood',
  tableName: 'survey_submission_foods',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class SurveySubmissionFood extends BaseModel<
  InferAttributes<SurveySubmissionFood>,
  InferCreationAttributes<SurveySubmissionFood>
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
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare code: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare englishName: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(256),
  })
  declare localName: CreationOptional<string | null>;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare locale: string;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare readyMeal: boolean;

  @Column({
    allowNull: false,
    type: DataType.STRING(256),
  })
  declare searchTerm: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare portionSizeMethodId: PortionSizeMethodId;

  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  declare reasonableAmount: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING(128),
  })
  declare brand: string | null;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare nutrientTableId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(64),
  })
  declare nutrientTableCode: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(128),
  })
  declare barcode: string | null;

  @BelongsTo(() => SurveySubmissionMeal, 'mealId')
  declare meal?: NonAttribute<SurveySubmissionMeal>;

  @HasMany(() => SurveySubmissionFoodCustomField, 'foodId')
  declare customFields?: NonAttribute<SurveySubmissionFoodCustomField[]>;

  @HasMany(() => SurveySubmissionField, 'foodId')
  declare fields?: NonAttribute<SurveySubmissionField[]>;

  @HasMany(() => SurveySubmissionNutrient, 'foodId')
  declare nutrients?: NonAttribute<SurveySubmissionNutrient[]>;

  @HasMany(() => SurveySubmissionPortionSizeField, 'foodId')
  declare portionSizes?: NonAttribute<SurveySubmissionPortionSizeField[]>;

  @HasMany(() => SurveySubmissionExternalSource, {
    foreignKey: 'foodId',
    constraints: false,
    scope: {
      foodType: 'food',
    },
  })
  declare externalSources?: NonAttribute<SurveySubmissionExternalSource[]>;
}

export type SurveySubmissionFoodAttributes = Attributes<SurveySubmissionFood>;
export type SurveySubmissionFoodCreationAttributes = CreationAttributes<SurveySubmissionFood>;
