import asServedSets from './as-served-sets.test';
import categories from './categories.test';
import drinkwareSets from './drinkware-sets.test';
import faqs from './faqs.test';
import feedbackSchemes from './feedback-schemes.test';
import foods from './foods.test';
import guideImages from './guide-images.test';
import imageMaps from './image-maps.test';
import languages from './languages.test';
import locales from './locales.test';
import nutrientTableRecords from './nutrient-table-records.test';
import nutrientTables from './nutrient-tables.test';
import nutrientTypes from './nutrient-types.test';
import standardUnits from './standard-units.test';
import surveySchemes from './survey-schemes.test';
import surveys from './surveys.test';

export default () => {
  describe('get /api/admin/references/as-served-sets', asServedSets);
  describe('get /api/admin/references/categories', categories);
  describe('get /api/admin/references/drinkware-sets', drinkwareSets);
  describe('get /api/admin/references/faqs', faqs);
  describe('get /api/admin/references/feedback-schemes', feedbackSchemes);

  describe('get /api/admin/references/foods', foods);
  describe('get /api/admin/references/guide-images', guideImages);
  describe('get /api/admin/references/image-maps', imageMaps);
  describe('get /api/admin/references/languages', languages);
  describe('get /api/admin/references/locales', locales);
  describe('get /api/admin/references/nutrient-tables', nutrientTables);
  describe(
    'get /api/admin/references/nutrient-tables/:nutrientTableId/records',
    nutrientTableRecords,
  );
  describe('get /api/admin/references/nutrient-types', nutrientTypes);
  describe('get /api/admin/references/standard-units', standardUnits);
  describe('get /api/admin/references/survey-schemes', surveySchemes);
  describe('get /api/admin/references/surveys', surveys);
};
