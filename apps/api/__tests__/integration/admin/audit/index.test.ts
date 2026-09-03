// import auditable from './auditable.test';
import get from './tables/get.test';
import set from './tables/set.test';

export default () => {
  describe('get /api/admin/audit/tables', get);
  describe('post /api/admin/audit/tables', set);
  // describe('get /api/admin/audit/log', auditable());
};
