import type { Router } from 'vue-router';

import { useAuth, useResource, useUser } from '../stores';
import resources from './resources';

export default (router: Router): void => {
  router.beforeEach(async (to, from, next) => {
    const { meta: { perm, public: unrestricted } = {} } = to;

    const auth = useAuth();
    const user = useUser();

    // Login page
    if (unrestricted) {
      const name = user.isVerified ? 'dashboard' : 'verify';
      if (auth.loggedIn && to.name !== name) {
        next({ name });
      }
      else {
        next();
      }

      return;
    }

    // Get logged-in user information if not yet loaded
    if (!auth.loggedIn)
      await auth.refresh(false);

    // Any other page (requires to be logged in)
    if (!auth.loggedIn) {
      next({ name: 'login' });
      return;
    }

    // Check correct permissions if any
    if (perm && !user.can(perm)) {
      next({ name: 'dashboard' });
      return;
    }

    next();
  });

  router.beforeResolve(async (to) => {
    const {
      meta: { module },
    } = to;

    // Update module/resource name
    const name = module.parent ?? module.current;
    const resource = resources.find(item => item.name === name);

    const resourceStore = useResource();

    if (resourceStore.name !== name)
      resourceStore.update({ name, module: resource?.module, api: resource?.api ?? `admin/${name}`, refs: resource?.refs });
  });
};
