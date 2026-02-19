import type { Cache } from '@intake24/api/services';
import type { AdminFoodService } from '@intake24/api/services/admin/food.service';
import type { BulkFoodInput } from '@intake24/common/types/http/admin';
import type { DatabasesInterface } from '@intake24/db/database';
import type { KyselyDatabases } from '@intake24/db/kysely-database';

import { randomUUID } from 'node:crypto';

import adminFoodService from '@intake24/api/services/admin/food.service';
import {
  Category,
  Food,
  FoodsLocale,
  NutrientTable,
  NutrientTableRecord,
} from '@intake24/db';

import { initCache, releaseCache } from '../../helpers/cache';
import { getKyselyDbs, getSequelizeDbs, releaseDatabases, useDatabases } from '../../helpers/databases';

import '@intake24/api/bootstrap';

describe('food service', () => {
  let db: DatabasesInterface;
  let kyselyDb: KyselyDatabases;
  let cache: Cache;
  let service: AdminFoodService;

  beforeAll(async () => {
    await useDatabases();
    db = getSequelizeDbs();
    kyselyDb = getKyselyDbs();
    cache = initCache();
    service = adminFoodService({ cache, db, kyselyDb });

    await FoodsLocale.create({
      id: 'en_GB',
      englishName: 'English',
      localName: 'English',
      countryFlagCode: 'gb',
      textDirection: 'ltr',
      respondentLanguageId: 'en',
      adminLanguageId: 'en',
    });
  });

  beforeEach(async () => {
    await Food.destroy({ where: {}, truncate: true, cascade: true });
    await Category.destroy({ where: {}, truncate: true, cascade: true });
    await NutrientTableRecord.destroy({ where: {}, truncate: true, cascade: true });
    await NutrientTable.destroy({ where: {}, truncate: true, cascade: true });
  });

  afterAll(async () => {
    await releaseDatabases();
    releaseCache(cache);
  });

  describe('bulkUpdateFoodParents', () => {
    it('should link parent categories', async () => {
      const parent = await Category.create({
        code: 'PARENT_1',
        name: 'Parent 1',
        englishName: 'Parent 1',
        simpleName: 'Parent 1',
        localeId: 'en_GB',
        hidden: false,
        version: randomUUID(),
      });

      const food = await service.createFood('en_GB', {
        code: 'FOOD_1',
        name: 'Food 1',
        englishName: 'Food 1',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      const input: BulkFoodInput[] = [
        {
          code: 'FOOD_1',
          name: 'Food 1',
          englishName: 'Food 1',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: ['PARENT_1'],
          attributes: {},
        },
      ];

      const idMap = new Map([[food.code, food.id]]);

      await service.bulkUpdateParentCategories(kyselyDb.foods, 'en_GB', input, idMap);

      const parents = await kyselyDb.foods
        .selectFrom('foodsCategories')
        .selectAll()
        .where('foodId', '=', food.id)
        .execute();

      expect(parents).toHaveLength(1);
      expect(parents[0].categoryId).toBe(parent.id);
    });
  });

  describe('bulkUpdateFoodAttributes', () => {
    it('should create food attributes', async () => {
      const food = await service.createFood('en_GB', {
        code: 'ATTR_FOOD_1',
        name: 'Attr Food 1',
        englishName: 'Attr Food 1',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      const input: BulkFoodInput[] = [
        {
          code: 'ATTR_FOOD_1',
          name: 'Attr Food 1',
          englishName: 'Attr Food 1',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: [],
          attributes: {
            sameAsBeforeOption: true,
            readyMealOption: false,
            reasonableAmount: 100,
            useInRecipes: 1,
          },
        },
      ];

      const idMap = new Map([[food.code, food.id]]);

      await service.bulkUpdateFoodAttributes(kyselyDb.foods, input, idMap);

      const attrs = await kyselyDb.foods
        .selectFrom('foodAttributes')
        .selectAll()
        .where('foodId', '=', food.id)
        .executeTakeFirst();

      expect(attrs).toBeDefined();
      expect(attrs!.sameAsBeforeOption).toBe(true);
      expect(attrs!.readyMealOption).toBe(false);
      expect(attrs!.reasonableAmount).toBe(100);
      expect(attrs!.useInRecipes).toBe(1);
    });
  });

  describe('bulkUpdateFoodPortionSizeMethods', () => {
    it('should create portion size methods', async () => {
      const food = await service.createFood('en_GB', {
        code: 'PSM_FOOD_1',
        name: 'PSM Food 1',
        englishName: 'PSM Food 1',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      const input: BulkFoodInput[] = [
        {
          code: 'PSM_FOOD_1',
          name: 'PSM Food 1',
          englishName: 'PSM Food 1',
          altNames: {},
          tags: [],
          portionSizeMethods: [
            {
              method: 'as-served',
              description: 'As Served',
              conversionFactor: 1.0,
              orderBy: '1',
              parameters: { servingImageSet: 'set1' },
              pathways: ['search', 'afp'],
            },
          ],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: [],
          attributes: {},
        },
      ];

      const idMap = new Map([[food.code, food.id]]);

      await service.bulkUpdateFoodPortionSizeMethods(kyselyDb.foods, input, idMap);

      const psm = await kyselyDb.foods
        .selectFrom('foodPortionSizeMethods')
        .selectAll()
        .where('foodId', '=', food.id)
        .execute();

      expect(psm).toHaveLength(1);
      expect(psm[0].method).toBe('as-served');
      expect(psm[0].parameters).toEqual({ servingImageSet: 'set1' });
    });
  });

  describe('bulkUpdateAssociatedFoods', () => {
    it('should create associated foods', async () => {
      const food = await service.createFood('en_GB', {
        code: 'FOOD_1',
        name: 'Food 1',
        englishName: 'Food 1',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      await service.createFood('en_GB', {
        code: 'ASSOC_FOOD_1',
        name: 'Assoc Food 1',
        englishName: 'Assoc Food 1',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      await Category.create({
        code: 'ASSOC_CATEGORY_1',
        name: 'Assoc Category 1',
        englishName: 'Assoc Category 1',
        simpleName: 'Assoc Category 1',
        localeId: 'en_GB',
        hidden: false,
        version: randomUUID(),
      });

      const input: BulkFoodInput[] = [
        {
          code: 'FOOD_1',
          name: 'Food 1 bleh',
          englishName: 'Food 1 bleh',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [
            {
              associatedFoodCode: 'ASSOC_FOOD_1',
              associatedCategoryCode: null,
              text: { en: 'bleh' },
              linkAsMain: false,
              multiple: false,
              genericName: { en: 'Generic' },
              orderBy: '1',
            },
            {
              associatedFoodCode: null,
              associatedCategoryCode: 'ASSOC_CATEGORY_1',
              text: { en: 'bleh' },
              linkAsMain: false,
              multiple: false,
              genericName: { en: 'Generic' },
              orderBy: '1',
            },

          ],
          nutrientRecords: [],
          parentCategories: ['ASSOC_CATEGORY_1'],
          attributes: {},
        },
      ];

      const idMap = new Map([[food.code, food.id]]);

      await service.bulkUpdateAssociatedFoods(kyselyDb.foods, input, idMap);

      const assoc = await kyselyDb.foods
        .selectFrom('associatedFoods')
        .selectAll()
        .where('foodId', '=', food.id)
        .execute();

      expect(assoc).toHaveLength(2);
      expect(assoc[0].associatedFoodCode).toBe('ASSOC_FOOD_1');
      expect(assoc[1].associatedCategoryCode).toBe('ASSOC_CATEGORY_1');
      expect(assoc[0].text).toEqual({ en: 'bleh' });
      expect(assoc[1].genericName).toEqual({ en: 'Generic' });
    });
  });

  describe('bulkUpdateFoodNutrientRecords', () => {
    it('should create food nutrient records', async () => {
      await NutrientTable.create({
        id: 'NDNS',
        description: 'NDNS',
      });

      const record = await NutrientTableRecord.create({
        nutrientTableId: 'NDNS',
        nutrientTableRecordId: 'REC1',
        name: 'Record 1',
        localName: 'Record 1',
      });

      const food = await service.createFood('en_GB', {
        code: 'NUT_FOOD_1',
        name: 'Nut Food 1',
        englishName: 'Nut Food 1',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      const input: BulkFoodInput[] = [
        {
          code: 'NUT_FOOD_1',
          name: 'Nut Food 1',
          englishName: 'Nut Food 1',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [{ nutrientTableId: 'NDNS', nutrientTableRecordId: 'REC1' }],
          parentCategories: [],
          attributes: {},
        },
      ];

      const idMap = new Map([[food.code, food.id]]);

      await service.bulkUpdateFoodNutrientRecords(kyselyDb.foods, input, idMap);

      const nutrients = await kyselyDb.foods
        .selectFrom('foodsNutrients')
        .select(['nutrientTableRecordId'])
        .where('foodId', '=', food.id)
        .execute();

      expect(nutrients).toHaveLength(1);
      expect(nutrients[0].nutrientTableRecordId).toBe(record.id);
    });
  });

  describe('bulkUpdateFoods', () => {
    it('should create new foods in overwrite mode', async () => {
      const input: BulkFoodInput[] = [
        {
          code: 'FULL_FOOD',
          name: 'Full Food',
          englishName: 'Full Food',
          altNames: {},
          tags: [],
          portionSizeMethods: [
            {
              method: 'guide-image',
              description: 'Guide',
              conversionFactor: 1.0,
              orderBy: '1',
              parameters: { guideImageId: 'G1' },
              pathways: ['search', 'afp'],
            },
          ],
          associatedFoods: [],
          nutrientRecords: [],
          attributes: {
            sameAsBeforeOption: false,
            readyMealOption: true,
            reasonableAmount: 50,
            useInRecipes: 0,
          },
          parentCategories: [],
        },
      ];

      await service.bulkUpdateFoods('en_GB', input, 'overwrite');

      const food = await kyselyDb.foods
        .selectFrom('foods')
        .select('id')
        .where('code', '=', 'FULL_FOOD')
        .executeTakeFirst();

      expect(food).toBeDefined();

      const attrs = await kyselyDb.foods
        .selectFrom('foodAttributes')
        .selectAll()
        .where('foodId', '=', food!.id)
        .executeTakeFirst();

      expect(attrs).toBeDefined();
      expect(attrs!.readyMealOption).toBe(true);

      const psm = await kyselyDb.foods
        .selectFrom('foodPortionSizeMethods')
        .selectAll()
        .where('foodId', '=', food!.id)
        .execute();

      expect(psm).toHaveLength(1);
      expect(psm[0].method).toBe('guide-image');
    });

    it('should update existing foods in overwrite mode', async () => {
      await service.createFood('en_GB', {
        code: 'EXISTING_FOOD_OVERWRITE',
        name: 'Original Name',
        englishName: 'Original Name',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      const input: BulkFoodInput[] = [
        {
          code: 'EXISTING_FOOD_OVERWRITE',
          name: 'Updated Name',
          englishName: 'Updated Name',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: [],
          attributes: {},
        },
      ];

      await service.bulkUpdateFoods('en_GB', input, 'overwrite');

      const food = await kyselyDb.foods
        .selectFrom('foods')
        .selectAll()
        .where('code', '=', 'EXISTING_FOOD_OVERWRITE')
        .executeTakeFirst();

      expect(food).toBeDefined();
      expect(food!.name).toBe('Updated Name');
    });

    it('should throw ConflictError on duplicate codes in abort mode', async () => {
      await service.createFood('en_GB', {
        code: 'EXISTING_FOOD',
        name: 'Existing',
        englishName: 'Existing',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      const input: BulkFoodInput[] = [
        {
          code: 'EXISTING_FOOD',
          name: 'New Name',
          englishName: 'New Name',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: [],
          attributes: {},
        },
      ];

      await expect(
        service.bulkUpdateFoods('en_GB', input, 'abort'),
      ).rejects.toThrow('Food codes already exist: EXISTING_FOOD');
    });

    it('should create foods in abort mode if no conflicts', async () => {
      const input: BulkFoodInput[] = [
        {
          code: 'NEW_FOOD_ABORT',
          name: 'New Food Abort',
          englishName: 'New Food Abort',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: [],
          attributes: {},
        },
      ];

      await service.bulkUpdateFoods('en_GB', input, 'abort');

      const food = await kyselyDb.foods
        .selectFrom('foods')
        .selectAll()
        .where('code', '=', 'NEW_FOOD_ABORT')
        .executeTakeFirst();

      expect(food).toBeDefined();
      expect(food!.name).toBe('New Food Abort');
    });

    it('should create new foods in skip mode', async () => {
      const input: BulkFoodInput[] = [
        {
          code: 'NEW_FOOD_SKIP',
          name: 'New Food Skip',
          englishName: 'New Food Skip',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: [],
          attributes: {},
        },
      ];

      await service.bulkUpdateFoods('en_GB', input, 'skip');

      const food = await kyselyDb.foods
        .selectFrom('foods')
        .selectAll()
        .where('code', '=', 'NEW_FOOD_SKIP')
        .executeTakeFirst();

      expect(food).toBeDefined();
    });

    it('should NOT update existing foods in skip mode', async () => {
      await service.createFood('en_GB', {
        code: 'EXISTING_FOOD_SKIP',
        name: 'Original Name',
        englishName: 'Original Name',
        altNames: {},
        tags: [],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      const input: BulkFoodInput[] = [
        {
          code: 'EXISTING_FOOD_SKIP',
          name: 'New Name',
          englishName: 'New Name',
          altNames: {},
          tags: [],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: [],
          attributes: {},
        },
      ];

      await service.bulkUpdateFoods('en_GB', input, 'skip');

      const food = await kyselyDb.foods
        .selectFrom('foods')
        .selectAll()
        .where('code', '=', 'EXISTING_FOOD_SKIP')
        .executeTakeFirst();

      expect(food).toBeDefined();
      expect(food!.name).toBe('Original Name');
    });

    it('should correctly update food tags', async () => {
      await service.createFood('en_GB', {
        code: 'TAG_FOOD',
        name: 'Tag Food',
        englishName: 'Tag Food',
        altNames: {},
        tags: ['old_tag'],
        portionSizeMethods: [],
        associatedFoods: [],
        nutrientRecords: [],
      });

      const input: BulkFoodInput[] = [
        {
          code: 'TAG_FOOD',
          name: 'Tag Food',
          englishName: 'Tag Food',
          altNames: {},
          tags: ['new_tag1', 'new_tag2'],
          portionSizeMethods: [],
          associatedFoods: [],
          nutrientRecords: [],
          parentCategories: [],
          attributes: {},
        },
      ];

      await service.bulkUpdateFoods('en_GB', input, 'overwrite');

      const food = await kyselyDb.foods
        .selectFrom('foods')
        .select(['tags'])
        .where('code', '=', 'TAG_FOOD')
        .executeTakeFirst();

      expect(food).toBeDefined();
      expect(food!.tags).toEqual(['new_tag1', 'new_tag2']);
    });
  });
});
