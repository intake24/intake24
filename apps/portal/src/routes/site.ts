import { Router } from 'express';

import site from '../config/site';

const router = Router();

router.get('/', (req, res) => res.render('index'));

const global = [
  'contacts',
  'features',
  'feedback',
  'localisation',
  'open-source',
  'output',
  'publications',
  'recall',
  'validation',
];
const local = ['privacy', 'terms'];

for (const page of global) router.get(`/${page}`, (req, res) => res.render(page));
for (const page of local)
  router.get(`/${page}`, (req, res) => res.render(`${site.content}/${page}`));

router.get('/info/:section', (req, res) => {
  if (![...global, ...local].includes(req.params.section)) {
    res.status(404).render('errors/404');
    return;
  }

  res.redirect(301, `/${req.params.section}`);
});

// Catch Not Found (404)
router.get('/{*any}', (req, res) => res.status(404).render('errors/404'));

export default router;
