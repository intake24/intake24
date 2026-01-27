import type { DemographicGroup } from '@intake24/common/feedback';

import { demographicGroupDefaults } from '@intake24/common/feedback';
import { copy, randomString } from '@intake24/common/util';

export function getDemographicGroupDefaults(): DemographicGroup {
  return copy({ ...demographicGroupDefaults, id: randomString(6) });
}
