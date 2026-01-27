import type { UserPhysicalData } from '..';
import type { HenryCoefficient, WeightTargetCoefficient } from '@intake24/common/feedback';
import type { PhysicalActivityLevelAttributes } from '@intake24/db';

import { round } from '@intake24/common/util';

import HenryCoefficientsCalculator from './henry-coefficient-calculator';

export default class UserDemographic {
  readonly physicalData: NonNullable<UserPhysicalData>;

  readonly physicalActivityLevel?: PhysicalActivityLevelAttributes;

  private readonly weightTarget?: WeightTargetCoefficient;

  private readonly bmrCalculator: HenryCoefficientsCalculator;

  constructor(
    physicalData: NonNullable<UserPhysicalData>,
    henryCoefficients: HenryCoefficient[],
    physicalActivityLevel?: PhysicalActivityLevelAttributes,
    weightTarget?: WeightTargetCoefficient,
  ) {
    this.physicalData = physicalData;
    this.physicalActivityLevel = physicalActivityLevel;
    this.weightTarget = weightTarget;

    this.bmrCalculator = HenryCoefficientsCalculator.fromJson(henryCoefficients);
  }

  getAge(): number {
    const { birthdate } = this.physicalData;
    if (!birthdate) {
      console.warn('Cannot calculate age without birth date.');
      return 0;
    }

    return new Date().getFullYear() - birthdate;
  }

  getBmr(): number {
    return round(this.bmrCalculator.getBMR(this));
  }

  getEnergyRequirement(): number {
    const { physicalActivityLevel, weightTarget } = this;

    if (!physicalActivityLevel || !weightTarget) {
      console.warn(
        'Cannot calculate energy requirement without physicalActivityLevel or weightTarget.',
      );
      return 0;
    }

    return round(this.getBmr() * physicalActivityLevel.coefficient + weightTarget.coefficient);
  }

  hasData(): boolean {
    return Object.values(this.physicalData).some(value => value !== null);
  }
}
