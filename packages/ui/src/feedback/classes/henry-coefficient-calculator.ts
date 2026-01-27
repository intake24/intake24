import type UserDemographic from './user-demographic';
import type { HenryCoefficient as HenryCoefficientRecord } from '@intake24/common/feedback';

import HenryCoefficient from './henry-coefficient';

export default class HenryCoefficientsCalculator {
  private readonly coefficients: HenryCoefficient[];

  constructor(henryCoefficients: HenryCoefficient[]) {
    this.coefficients = henryCoefficients.map(hc => hc.clone());
  }

  static fromJson(coefficients: HenryCoefficientRecord[]): HenryCoefficientsCalculator {
    return new HenryCoefficientsCalculator(
      coefficients.map(coefficient => HenryCoefficient.fromJson(coefficient)),
    );
  }

  getBMR(userDemographic: UserDemographic): number {
    const { heightCm, weightKg, sex } = userDemographic.physicalData;
    const age = userDemographic.getAge();
    const coefficients = this.coefficients.filter(c => c.matchesUserDemographic(sex, age));

    if (heightCm === null || weightKg === null)
      throw new Error('Cannot calculate BMR without heightCm or weightKg.');

    if (!coefficients.length)
      throw new Error('Henry coefficients matching user demographic were not found');

    return HenryCoefficientsCalculator.calculateBMR(heightCm, weightKg, coefficients[0]);
  }

  private static calculateBMR(height: number, weight: number, hCoef: HenryCoefficient): number {
    const { heightCoefficient, weightCoefficient, constant } = hCoef;

    return weightCoefficient * weight + heightCoefficient * (height / 100) + constant;
  }
}
