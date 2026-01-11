import { createReadStream } from 'node:fs';
import request from 'supertest';

import { suite } from '@intake24/api-tests/integration/helpers';

import asServedImages from './as-served-images/index.test';
import asServed from './as-served/index.test';
import drinkwareSets from './drinkware-sets/index.test';
import guideImages from './guide-images/index.test';
import imageMaps from './image-maps/index.test';

export default () => {
  // As served sets
  describe('get /api/admin/images/as-served-sets', asServed.browse);
  describe('post /api/admin/images/as-served-sets', asServed.store);
  describe('get /api/admin/images/as-served-sets/:asServedSetId', asServed.read);
  describe('put /api/admin/images/as-served-sets/:asServedSetId', asServed.update);
  describe('delete /api/admin/images/as-served-sets/:asServedSetId', asServed.destroy);

  // As served images
  describe('as served images', () => {
    beforeAll(async () => {
      await request(suite.app)
        .post('/api/admin/images/as-served-sets')
        .set('Accept', 'application/json')
        .set('Authorization', suite.bearer.superuser)
        .field('id', 'asServedSetForImages')
        .field('description', 'asServedSetForImages')
        .field('label[en]', 'asServedSetForImages')
        .attach(
          'selectionImage',
          createReadStream(suite.files.images.jpg),
          'asServedSetForImages.jpg',
        );
    });

    describe('get /api/admin/images/as-served-sets/:asServedSetId/images', asServedImages.browse);
    describe('post /api/admin/images/as-served-sets/:asServedSetId/images', asServedImages.store);
    describe(
      'get /api/admin/images/as-served-sets/:asServedSetId/images/:asServedImageId',
      asServedImages.read,
    );
    describe(
      'delete /api/admin/images/as-served-sets/:asServedSetId/images/:asServedImageId',
      asServedImages.destroy,
    );
  });

  // Drinkware sets - TODO
  describe('get /api/admin/images/drinkware-sets', drinkwareSets.browse);
  describe('post /api/admin/images/drinkware-sets', drinkwareSets.store);
  describe('get /api/admin/images/drinkware-sets/:drinkwareSetId', drinkwareSets.read);
  // describe('PUT /api/admin/images/drinkware-sets/:drinkwareSetId', drinkwareSets.update);
  // describe('DELETE /api/admin/images/guide-images/:drinkwareSetId', drinkwareSets.destroy);

  // Guided images
  describe('get /api/admin/images/guide-images', guideImages.browse);
  describe('post /api/admin/images/guide-images', guideImages.store);
  describe('get /api/admin/images/guide-images/:guideImageId', guideImages.read);
  describe('put /api/admin/images/guide-images/:guideImageId', guideImages.update);
  describe('delete /api/admin/images/guide-images/:guideImageId', guideImages.destroy);

  // Image Maps
  describe('get /api/admin/images/image-maps', imageMaps.browse);
  describe('post /api/admin/images/image-maps', imageMaps.store);
  describe('get /api/admin/images/image-maps/:imageMapId', imageMaps.read);
  describe('put /api/admin/images/image-maps/:imageMapId', imageMaps.update);
  describe('delete /api/admin/images/image-maps/:imageMapId', imageMaps.destroy);
};
