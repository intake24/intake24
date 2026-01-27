import type { HenryCoefficient } from '@intake24/common/feedback';

import { copy, randomString } from '@intake24/common/util';

export const henryCoefficientDefaults: HenryCoefficient = {
  id: 'henry-coefficient',
  sex: 'm',
  age: { start: 0, end: 60 },
  constant: 0,
  heightCoefficient: 0,
  weightCoefficient: 0,
};

export function getHenryCoefficientDefaults(): HenryCoefficient {
  return copy({ ...henryCoefficientDefaults, id: randomString(6) });
}
