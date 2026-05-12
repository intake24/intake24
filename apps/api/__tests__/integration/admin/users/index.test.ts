import browse from './browse.test';
import destroy from './destroy.test';
import permissions from './permissions.test';
import read from './read.test';
import refs from './refs.test';
import roles from './roles.test';
import securables from './securables.test';
import store from './store.test';
import update from './update.test';

export default () => {
  describe('get /api/admin/users', browse);
  describe('post /api/admin/users', store);
  describe('get /api/admin/users/refs', refs);
  describe('get /api/admin/users/:userId', read);
  describe('put /api/admin/users/:userId', update);
  describe('delete /api/admin/users/:userId', destroy);
  describe('get /api/admin/users/:userId/permissions', permissions);
  describe('get /api/admin/users/:userId/roles', roles);
  describe('get /api/admin/users/:userId/securables', securables);
};
