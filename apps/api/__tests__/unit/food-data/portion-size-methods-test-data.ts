/*
Category structure for getFoodData tests:

CAT1 (portionSizeMethods[1] in en_GB)
|- FOOD1 (portionSizeMethods[0] in en_GB)
|- FOOD2 (no portion size methods in en_GB)
CAT2 (no portion size methods in en_GB)
|- CAT3 (portionSizeMethods[2] in en_GB)
   |- FOOD3 (no portion size methods in en_GB)
   CAT4 (portionSizeMethods[3] in en_GB)
   |- FOOD3 (no portion size methods in en_GB)
|-CAT5 (portionSizeMethods[4] in en_GB)
  |-CAT6 (no portion size methods in en_GB)
    |- FOOD4 (no portion size methods in en_GB)
|-CAT7 (no portion size methods in en_GB)
  |-CAT8 (no portion size methods in en_GB)
    |- FOOD5 (no portion size methods in en_GB, portionSizeMethods[5] in en_AU)
 */

import { faker } from '@faker-js/faker';

import type { PortionSizeParameters } from '@intake24/common/surveys';
import type { UserPortionSizeMethod } from '@intake24/common/types/http/foods/user-food-data';
import {
  Category,
  CategoryCategory,
  CategoryPortionSizeMethod,
  Food,
  FoodCategory,
} from '@intake24/db';

import createLocales from './test-data-locales';

// TODO: use actual portion size method IDs and parameters.
// Random words are okay for now but could potentially cause weird issues like using
// reserved property names ('prototype' etc.)
function generateRandomPortionSizeMethods(count: number): UserPortionSizeMethod[] {
  const result: UserPortionSizeMethod[] = [];

  for (let i = 0; i < count; ++i) {
    const paramCount = faker.number.int(5);
    const parameters = {} as PortionSizeParameters;

    for (let j = 0; j < paramCount; ++j) {
      // @ts-expect-error proper type for parameters
      parameters[faker.word.words(1)] = faker.word.words(1);
    }

    result.push({
      conversionFactor: faker.number.float({ min: 0.1, max: 10, multipleOf: 2 }),
      description: faker.word.words(5),
      imageUrl: 'http://localhost:3000/images/portion/standard-portion.jpg',
      method: 'standard-portion',
      useForRecipes: false,
      orderBy: i.toString(),
      parameters,
    });
  }

  return result;
}

function generateRandomPortionSizeMethodSets(count: number): UserPortionSizeMethod[][] {
  const result: UserPortionSizeMethod[][] = [];

  for (let i = 0; i < count; ++i)
    result.push(generateRandomPortionSizeMethods(faker.number.int({ min: 1, max: 5 })));

  return result;
}

export const generatedPortionSizeMethods: UserPortionSizeMethod[][]
  = generateRandomPortionSizeMethodSets(10);

async function createCategoryPortionSizeMethods(
  categoryId: string,
  portionSizeMethods: UserPortionSizeMethod[],
): Promise<void> {
  for (let i = 0; i < portionSizeMethods.length; i++) {
    const catPsm = new CategoryPortionSizeMethod({
      categoryId,
      method: portionSizeMethods[i].method,
      description: portionSizeMethods[i].description,
      useForRecipes: portionSizeMethods[i].useForRecipes,
      conversionFactor: portionSizeMethods[i].conversionFactor,
      parameters: portionSizeMethods[i].parameters,
      orderBy: i.toString(),
    });

    await catPsm.save();
  }
}

async function createCategories() {
  const testData = {} as Record<string, string>;

  const cat1 = await Category.create({
    code: 'CAT1',
    localeId: 'en_GB',
    englishName: 'Test category 1',
    name: 'Test category 1',
    simpleName: 'Test category 1',
    hidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.CAT1 = cat1.id;

  await createCategoryPortionSizeMethods(cat1.id, generatedPortionSizeMethods[1]);

  const cat2 = await Category.create({
    code: 'CAT2',
    localeId: 'en_GB',
    englishName: 'Test category 2',
    name: 'Test category 2',
    simpleName: 'Test category 2',
    hidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.CAT2 = cat2.id;

  const cat3 = await Category.create({
    code: 'CAT3',
    localeId: 'en_GB',
    englishName: 'Test category 3',
    name: 'Test category 3',
    simpleName: 'Test category 3',
    hidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.CAT3 = cat3.id;

  await createCategoryPortionSizeMethods(cat3.id, generatedPortionSizeMethods[2]);

  const cat4 = await Category.create({
    code: 'CAT4',
    localeId: 'en_GB',
    englishName: 'Test category 4',
    name: 'Test category 4',
    simpleName: 'Test category 4',
    hidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.CAT4 = cat4.id;

  await createCategoryPortionSizeMethods(cat4.id, generatedPortionSizeMethods[3]);

  await CategoryCategory.create({ categoryId: cat2.id, subCategoryId: cat3.id });
  await CategoryCategory.create({ categoryId: cat2.id, subCategoryId: cat4.id });

  const cat5 = await Category.create({
    code: 'CAT5',
    localeId: 'en_GB',
    englishName: 'Test category 5',
    name: 'Test category 5',
    simpleName: 'Test category 5',
    hidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.CAT5 = cat5.id;

  await createCategoryPortionSizeMethods(cat5.id, generatedPortionSizeMethods[4]);

  const cat6 = await Category.create({
    code: 'CAT6',
    localeId: 'en_GB',
    englishName: 'Test category 6',
    name: 'Test category 6',
    simpleName: 'Test category 6',
    hidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.CAT6 = cat6.id;

  await CategoryCategory.create({ categoryId: cat5.id, subCategoryId: cat6.id });

  const cat7 = await Category.create({
    code: 'CAT7',
    localeId: 'en_GB',
    englishName: 'Test category 7',
    name: 'Test category 7',
    simpleName: 'Test category 7',
    hidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.CAT7 = cat7.id;

  const cat8 = await Category.create({
    code: 'CAT8',
    localeId: 'en_GB',
    englishName: 'Test category 8',
    name: 'Test category 8',
    simpleName: 'Test category 8',
    hidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.CAT8 = cat8.id;

  await CategoryCategory.create({ categoryId: cat7.id, subCategoryId: cat8.id });

  const food1 = await Food.create(
    {
      code: 'FOOD1',
      localeId: 'en_GB',
      englishName: 'Test food 1',
      name: 'Test food 1',
      simpleName: 'Test food 1',
      version: '00000000-0000-0000-0000-000000000000',
      portionSizeMethods: generatedPortionSizeMethods[0],
    },
    {
      include: [{ association: 'portionSizeMethods' }],
    },
  );
  testData.FOOD1 = food1.id;

  await FoodCategory.create({ foodId: food1.id, categoryId: cat1.id });

  const food2 = await Food.create({
    code: 'FOOD2',
    localeId: 'en_GB',
    englishName: 'Test food 2',
    name: 'Test food 2',
    simpleName: 'Test food 2',
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.FOOD2 = food2.id;

  await FoodCategory.create({ foodId: food2.id, categoryId: cat1.id });

  const food3 = await Food.create({
    code: 'FOOD3',
    localeId: 'en_GB',
    englishName: 'Test food 3',
    name: 'Test food 3',
    simpleName: 'Test food 3',
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.FOOD3 = food3.id;

  await FoodCategory.create({ foodId: food3.id, categoryId: cat3.id });
  await FoodCategory.create({ foodId: food3.id, categoryId: cat4.id });

  const food4 = await Food.create({
    code: 'FOOD4',
    localeId: 'en_GB',
    englishName: 'Test food 4',
    name: 'Test food 4',
    simpleName: 'Test food 4',
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.FOOD4 = food4.id;

  await FoodCategory.create({ foodId: food4.id, categoryId: cat6.id });

  const food5 = await Food.create({
    code: 'FOOD5',
    localeId: 'en_GB',
    englishName: 'Test food 5',
    name: 'Test food 5',
    simpleName: 'Test food 5',
    version: '00000000-0000-0000-0000-000000000000',
  });
  testData.FOOD5 = food5.id;

  await FoodCategory.create({ foodId: food5.id, categoryId: cat8.id });

  return testData;
}

export async function createTestData() {
  await createLocales();
  return await createCategories();
}
