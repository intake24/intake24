import { Router } from 'express';

import local from './local';

export default () => {
  const router = Router();

  router.use('/local', local());

  return router;
};
