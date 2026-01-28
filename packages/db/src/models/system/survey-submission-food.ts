import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { CustomData, PortionSizeMethodId, PortionSizeState } from '@intake24/common/surveys';
import type { Dictionary } from '@intake24/common/types';

import { BelongsTo, Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import SurveySubmissionExternalSource from './survey-submission-external-source';
import SurveySubmissionMeal from './survey-submission-meal';

@Scopes(() => ({
  meal: { include: [{ model: SurveySubmissionMeal }] },
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

  @Column({
    allowNull: true,
    type: DataType.JSONB(),
  })
  get customData(): CreationOptional<CustomData> {
    return this.getDataValue('customData') ?? {} as CustomData;
  }

  @Column({
    allowNull: true,
    type: DataType.JSONB(),
  })
  get fields(): CreationOptional<Dictionary<string>> {
    return this.getDataValue('fields') ?? {} as Dictionary<string>;
  }

  @Column({
    allowNull: true,
    type: DataType.JSONB(),
  })
  get nutrients(): CreationOptional<Dictionary<number>> {
    return this.getDataValue('nutrients') ?? {} as Dictionary<number>;
  }

  @Column({
    allowNull: true,
    type: DataType.JSONB(),
  })
  get portionSize(): CreationOptional<PortionSizeState> {
    return this.getDataValue('portionSize') ?? {} as PortionSizeState;
  }

  @BelongsTo(() => SurveySubmissionMeal, 'mealId')
  declare meal?: NonAttribute<SurveySubmissionMeal>;

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
