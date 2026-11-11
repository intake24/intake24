import type { SecurableType } from '@intake24/common/security';

import browse from './browse.test';
import users from './users.test';

export default (desc: string, type: SecurableType) => {
  describe(`get ${desc}/securables`, browse(type));
  describe(`${desc}/securables user lookup and assignment`, users(type));
};
