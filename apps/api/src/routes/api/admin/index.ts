import { Router } from 'express';

import { authenticate, isAccountVerified } from '@intake24/api/http/middleware';

import categories from './categories';
import codeLookup from './code-lookup';
import fdbs from './fdbs';
import foods from './foods';
import images from './images';

export default () => {
  const router = Router();

  // Authenticated & verified
  authenticate(router, 'admin');
  router.use(isAccountVerified);

  router.use('/categories', categories());
  router.use('/code-lookup', codeLookup());
  router.use('/fdbs', fdbs());
  router.use('/foods', foods());
  router.use('/images', images());

  return router;
};
