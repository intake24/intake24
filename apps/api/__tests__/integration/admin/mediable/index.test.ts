import type { MediaModel } from '@intake24/common/types/http/admin';

import browse from './browse.test';
import store from './store.test';

export default (desc: string, type: MediaModel) => {
  describe(`get ${desc}/media`, browse(type));
  describe(`post ${desc}/media`, store(type));
};
