import type {
  Attributes,
  CreationAttributes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';
import type DrinkwareScale from './drinkware-scale';

import type DrinkwareScaleV2 from './drinkware-scale-v2';

import type ImageMap from './image-map';
import { Column, DataType, Table } from 'sequelize-typescript';
import type { LocaleTranslation } from '@intake24/common/types';
import BaseModel from '../model';

@Table({
  modelName: 'DrinkwareSet',
  tableName: 'drinkware_sets',
  freezeTableName: true,
  timestamps: false,
  underscored: true,
})
export default class DrinkwareSet extends BaseModel<
  InferAttributes<DrinkwareSet>,
  InferCreationAttributes<DrinkwareSet>
> {
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.STRING(32),
  })
  declare id: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(128),
  })
  declare description: string;

  @Column({
    allowNull: false,
    type: DataType.STRING(32),
  })
  declare imageMapId: string;

  @Column({
    allowNull: true,
    type: DataType.TEXT({ length: 'long' }),
  })
  get label(): CreationOptional<LocaleTranslation> {
    const val = this.getDataValue('label') as unknown as string | null;
    return val ? JSON.parse(val) : {};
  }

  set label(value: LocaleTranslation) {
    // @ts-expect-error: Sequelize/TS issue for setting custom values
    this.setDataValue('label', value && Object.keys(value).length ? JSON.stringify(value) : null);
  }

  declare imageMap?: NonAttribute<ImageMap>;

  declare scales?: NonAttribute<DrinkwareScale[]>;

  declare scalesV2?: NonAttribute<DrinkwareScaleV2[]>;
}

export type DrinkwareSetAttributes = Attributes<DrinkwareSet>;
export type DrinkwareSetCreationAttributes = CreationAttributes<DrinkwareSet>;
