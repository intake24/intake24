import type { Cache } from '@intake24/api/services';
import type { AdminCategoryService } from '@intake24/api/services/admin/category.service';
import type { BulkCategoryInput } from '@intake24/common/types/http/admin';
import type { DatabasesInterface } from '@intake24/db/database';
import type { KyselyDatabases } from '@intake24/db/kysely-database';

import adminCategoryService from '@intake24/api/services/admin/category.service';
import {
  Category,
  FoodsLocale,
} from '@intake24/db';

import { initCache, releaseCache } from '../../helpers/cache';
import { getKyselyDbs, getSequelizeDbs, releaseDatabases, useDatabases } from '../../helpers/databases';

import '@intake24/api/bootstrap';

describe('category service', () => {
  let db: DatabasesInterface;
  let kyselyDb: KyselyDatabases;
  let cache: Cache;
  let service: AdminCategoryService;

  beforeAll(async () => {
    await useDatabases();
    db = getSequelizeDbs();
    kyselyDb = getKyselyDbs();
    cache = initCache();
    service = adminCategoryService({ cache, db, kyselyDb });

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
    await Category.destroy({ where: {}, truncate: true, cascade: true });
  });

  afterAll(async () => {
    await releaseDatabases();
    releaseCache(cache);
  });

  describe('bulkUpdateCategoryParents', () => {
    it('should link parent categories', async () => {
      const parent = await service.createCategory('en_GB', {
        code: 'PARENT_1',
        name: 'Parent 1',
        englishName: 'Parent 1',
        hidden: false,
        portionSizeMethods: [],
      });

      const child = await service.createCategory('en_GB', {
        code: 'CHILD_1',
        name: 'Child 1',
        englishName: 'Child 1',
        hidden: false,
        portionSizeMethods: [],
      });

      const input: BulkCategoryInput[] = [
        {
          code: 'CHILD_1',
          name: 'Child 1',
          englishName: 'Child 1',
          hidden: false,
          portionSizeMethods: [],
          parentCategories: [parent.code],
        },
      ];

      const idMap = new Map([[child.code, child.id]]);

      await service.bulkUpdateCategoryParents(kyselyDb.foods, 'en_GB', input, idMap);

      const parents = await kyselyDb.foods
        .selectFrom('categoriesCategories')
        .selectAll()
        .where('subCategoryId', '=', child.id)
        .execute();

      expect(parents).toHaveLength(1);
      expect(parents[0].categoryId).toBe(parent.id);
    });

    it('should overwrite existing parent links', async () => {
      const parent1 = await service.createCategory('en_GB', {
        code: 'PARENT_1',
        name: 'Parent 1',
        englishName: 'Parent 1',
        hidden: false,
        portionSizeMethods: [],
      });

      const parent2 = await service.createCategory('en_GB', {
        code: 'PARENT_2',
        name: 'Parent 2',
        englishName: 'Parent 2',
        hidden: false,
        portionSizeMethods: [],
      });

      const child = await service.createCategory('en_GB', {
        code: 'CHILD_1',
        name: 'Child 1',
        englishName: 'Child 1',
        hidden: false,
        portionSizeMethods: [],
        parentCategories: [{ id: parent1.id }],
      });

      const input: BulkCategoryInput[] = [
        {
          code: 'CHILD_1',
          name: 'Child 1',
          englishName: 'Child 1',
          hidden: false,
          portionSizeMethods: [],
          parentCategories: [parent2.code],
        },
      ];

      const idMap = new Map([[child.code, child.id]]);

      await service.bulkUpdateCategoryParents(kyselyDb.foods, 'en_GB', input, idMap);

      const links = await kyselyDb.foods
        .selectFrom('categoriesCategories')
        .selectAll()
        .where('subCategoryId', '=', child.id)
        .execute();

      expect(links).toHaveLength(1);
      expect(links[0].categoryId).toBe(parent2.id);
    });
  });

  describe('bulkUpdateCategoryAttributes', () => {
    it('should create category attributes', async () => {
      const category = await service.createCategory('en_GB', {
        code: 'ATTR_CAT_1',
        name: 'Attr Cat 1',
        englishName: 'Attr Cat 1',
        hidden: false,
        portionSizeMethods: [],
      });

      const input: BulkCategoryInput[] = [
        {
          code: 'ATTR_CAT_1',
          name: 'Attr Cat 1',
          englishName: 'Attr Cat 1',
          hidden: false,
          portionSizeMethods: [],
          attributes: {
            sameAsBeforeOption: true,
            readyMealOption: false,
            reasonableAmount: 100,
            useInRecipes: 1,
          },
        },
      ];

      const idMap = new Map([[category.code, category.id]]);

      await service.bulkUpdateCategoryAttributes(kyselyDb.foods, input, idMap);

      const attrs = await kyselyDb.foods
        .selectFrom('categoryAttributes')
        .selectAll()
        .where('categoryId', '=', category.id)
        .executeTakeFirst();

      expect(attrs).toBeDefined();
      expect(attrs!.sameAsBeforeOption).toBe(true);
      expect(attrs!.readyMealOption).toBe(false);
      expect(attrs!.reasonableAmount).toBe(100);
      expect(attrs!.useInRecipes).toBe(1);
    });
  });

  describe('bulkUpdateCategoryPortionSizeMethods', () => {
    it('should create portion size methods', async () => {
      const category = await service.createCategory('en_GB', {
        code: 'PSM_CAT_1',
        name: 'PSM Cat 1',
        englishName: 'PSM Cat 1',
        hidden: false,
        portionSizeMethods: [],
      });

      const input: BulkCategoryInput[] = [
        {
          code: 'PSM_CAT_1',
          name: 'PSM Cat 1',
          englishName: 'PSM Cat 1',
          hidden: false,
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
        },
      ];

      const idMap = new Map([[category.code, category.id]]);

      await service.bulkUpdateCategoryPortionSizeMethods(kyselyDb.foods, input, idMap);

      const psm = await kyselyDb.foods
        .selectFrom('categoryPortionSizeMethods')
        .selectAll()
        .where('categoryId', '=', category.id)
        .execute();

      expect(psm).toHaveLength(1);
      expect(psm[0].method).toBe('as-served');
      expect(psm[0].parameters).toEqual({ servingImageSet: 'set1' });
    });
  });

  describe('bulkUpdateCategories', () => {
    it('should create new categories in overwrite mode', async () => {
      const input: BulkCategoryInput[] = [
        {
          code: 'FULL_CAT',
          name: 'Full Cat',
          englishName: 'Full Cat',
          hidden: false,
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
          attributes: {
            sameAsBeforeOption: false,
            readyMealOption: true,
            reasonableAmount: 50,
            useInRecipes: 0,
          },
        },
      ];

      await service.bulkUpdateCategories('en_GB', input, 'overwrite');

      const cat = await kyselyDb.foods
        .selectFrom('categories')
        .select('id')
        .where('code', '=', 'FULL_CAT')
        .executeTakeFirst();

      expect(cat).toBeDefined();

      const attrs = await kyselyDb.foods
        .selectFrom('categoryAttributes')
        .selectAll()
        .where('categoryId', '=', cat!.id)
        .executeTakeFirst();

      expect(attrs).toBeDefined();
      expect(attrs!.readyMealOption).toBe(true);

      const psm = await kyselyDb.foods
        .selectFrom('categoryPortionSizeMethods')
        .selectAll()
        .where('categoryId', '=', cat!.id)
        .execute();

      expect(psm).toHaveLength(1);
      expect(psm[0].method).toBe('guide-image');
    });

    it('should update existing categories in overwrite mode', async () => {
      await service.createCategory('en_GB', {
        code: 'EXISTING_CAT_OVERWRITE',
        name: 'Original Name',
        englishName: 'Original Name',
        hidden: false,
        portionSizeMethods: [],
      });

      const input: BulkCategoryInput[] = [
        {
          code: 'EXISTING_CAT_OVERWRITE',
          name: 'Updated Name',
          englishName: 'Updated Name',
          hidden: true,
          portionSizeMethods: [],
        },
      ];

      await service.bulkUpdateCategories('en_GB', input, 'overwrite');

      const cat = await kyselyDb.foods
        .selectFrom('categories')
        .selectAll()
        .where('code', '=', 'EXISTING_CAT_OVERWRITE')
        .executeTakeFirst();

      expect(cat).toBeDefined();
      expect(cat!.name).toBe('Updated Name');
      expect(cat!.hidden).toBe(true);
    });

    it('should throw ConflictError on duplicate codes in abort mode', async () => {
      await service.createCategory('en_GB', {
        code: 'EXISTING_CAT',
        name: 'Existing',
        englishName: 'Existing',
        hidden: false,
        portionSizeMethods: [],
      });

      const input: BulkCategoryInput[] = [
        {
          code: 'EXISTING_CAT',
          name: 'New Name',
          englishName: 'New Name',
          hidden: false,
          portionSizeMethods: [],
        },
      ];

      await expect(
        service.bulkUpdateCategories('en_GB', input, 'abort'),
      ).rejects.toThrow('Category codes already exist: EXISTING_CAT');
    });

    it('should create categories in abort mode if no conflicts', async () => {
      const input: BulkCategoryInput[] = [
        {
          code: 'NEW_CAT_ABORT',
          name: 'New Cat Abort',
          englishName: 'New Cat Abort',
          hidden: false,
          portionSizeMethods: [],
        },
      ];

      await service.bulkUpdateCategories('en_GB', input, 'abort');

      const cat = await kyselyDb.foods
        .selectFrom('categories')
        .selectAll()
        .where('code', '=', 'NEW_CAT_ABORT')
        .executeTakeFirst();

      expect(cat).toBeDefined();
      expect(cat!.name).toBe('New Cat Abort');
    });

    it('should create new categories in skip mode', async () => {
      const input: BulkCategoryInput[] = [
        {
          code: 'NEW_CAT_SKIP',
          name: 'New Cat Skip',
          englishName: 'New Cat Skip',
          hidden: false,
          portionSizeMethods: [],
        },
      ];

      await service.bulkUpdateCategories('en_GB', input, 'skip');

      const cat = await kyselyDb.foods
        .selectFrom('categories')
        .selectAll()
        .where('code', '=', 'NEW_CAT_SKIP')
        .executeTakeFirst();

      expect(cat).toBeDefined();
    });

    it('should NOT update existing categories in skip mode', async () => {
      await service.createCategory('en_GB', {
        code: 'EXISTING_CAT_SKIP',
        name: 'Original Name',
        englishName: 'Original Name',
        hidden: false,
        portionSizeMethods: [],
      });

      const input: BulkCategoryInput[] = [
        {
          code: 'EXISTING_CAT_SKIP',
          name: 'New Name', // Should be ignored
          englishName: 'New Name',
          hidden: true, // Should be ignored
          portionSizeMethods: [],
        },
      ];

      await service.bulkUpdateCategories('en_GB', input, 'skip');

      const cat = await kyselyDb.foods
        .selectFrom('categories')
        .selectAll()
        .where('code', '=', 'EXISTING_CAT_SKIP')
        .executeTakeFirst();

      expect(cat).toBeDefined();
      expect(cat!.name).toBe('Original Name');
      expect(cat!.hidden).toBe(false);
    });

    it('should handle empty input array gracefully', async () => {
      await service.bulkUpdateCategories('en_GB', [], 'overwrite');
      // Should result in no errors and no database changes
    });

    it('should correctly update category tags', async () => {
      await service.createCategory('en_GB', {
        code: 'TAG_CAT',
        name: 'Tag Cat',
        englishName: 'Tag Cat',
        hidden: false,
        portionSizeMethods: [],
        tags: ['old_tag'],
      });

      const input: BulkCategoryInput[] = [
        {
          code: 'TAG_CAT',
          name: 'Tag Cat',
          englishName: 'Tag Cat',
          hidden: false,
          portionSizeMethods: [],
          tags: ['new_tag'],
        },
      ];

      await service.bulkUpdateCategories('en_GB', input, 'overwrite');

      const cat = await kyselyDb.foods
        .selectFrom('categories')
        .select(['tags'])
        .where('code', '=', 'TAG_CAT')
        .executeTakeFirst();

      expect(cat).toBeDefined();
      expect(cat!.tags).toEqual(['new_tag']);
    });
  });
});
