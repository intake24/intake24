import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import type { LocaleTranslation } from '@intake24/common/types';

import { BelongsTo, Column, DataType, HasMany, Scopes, Table } from 'sequelize-typescript';

import BaseModel from '../model';
import DrinkwareSet from './drinkware-set';
import DrinkwareVolumeSample from './drinkware-volume-sample';

@Scopes(() => ({
  drinkwareSet: { include: [{ model: DrinkwareSet }] },
  volumeSamples: { include: [{ model: DrinkwareVolumeSample }] },
}))
@Table({
  modelName: 'DrinkwareScale',
  tableName: 'drinkware_scales',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class DrinkwareScale extends BaseModel<
  InferAttributes<DrinkwareScale>,
  InferCreationAttributes<DrinkwareScale>
> {
  @Column({
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  declare id: CreationOptional<string>;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare drinkwareSetId: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare width: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare height: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare emptyLevel: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  declare fullLevel: number;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  declare choiceId: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare baseImageUrl: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(512),
  })
  declare overlayImageUrl: string;

  @Column({
    allowNull: true,
    type: DataType.JSONB,
  })
  get label(): CreationOptional<LocaleTranslation> {
    return this.getDataValue('label') ?? {};
  }

  set label(value: CreationOptional<LocaleTranslation>) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('label', value && Object.keys(value).length ? value : null);
  }

  @BelongsTo(() => DrinkwareSet, 'drinkwareSetId')
  declare drinkwareSet?: NonAttribute<DrinkwareSet>;

  @HasMany(() => DrinkwareVolumeSample, 'drinkwareScaleId')
  declare volumeSamples?: NonAttribute<DrinkwareVolumeSample[]>;
}

export type DrinkwareScaleAttributes = Attributes<DrinkwareScale>;
export type DrinkwareScaleCreationAttributes = CreationAttributes<DrinkwareScale>;
