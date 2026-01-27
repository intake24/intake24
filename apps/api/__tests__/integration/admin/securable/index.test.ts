import type { SecurableType } from '@intake24/common/security';

import browse from './browse.test';

export default (desc: string, type: SecurableType) => {
  describe(`${desc}/securables`, browse(type));
};
