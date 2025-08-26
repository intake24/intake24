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
import type { SequelizeTS } from '@intake24/db';
import {
  Category,
  CategoryCategory,
  CategoryLocal,
  CategoryPortionSizeMethod,
  Food,
  FoodCategory,
  FoodLocal,
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
      imageUrl: 'portion/standard-portion.jpg',
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
  categoryLocalId: string,
  portionSizeMethods: UserPortionSizeMethod[],
): Promise<void> {
  for (let i = 0; i < portionSizeMethods.length; i++) {
    const catPsm = new CategoryPortionSizeMethod({
      categoryLocalId,
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

async function createCategories(): Promise<void> {
  await Category.create({
    code: 'CAT1',
    name: 'Test category 1',
    isHidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });

  const catLocal1 = await CategoryLocal.create({
    categoryCode: 'CAT1',
    localeId: 'en_GB',
    name: 'Test category 1',
    simpleName: 'Test category 1',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await createCategoryPortionSizeMethods(catLocal1.id, generatedPortionSizeMethods[1]);

  await Category.create({
    code: 'CAT2',
    name: 'Test category 2',
    isHidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });

  await CategoryLocal.create({
    categoryCode: 'CAT2',
    localeId: 'en_GB',
    name: 'Test category 2',
    simpleName: 'Test category 2',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await Category.create({
    code: 'CAT3',
    name: 'Test category 3',
    isHidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });

  const catLocal3 = await CategoryLocal.create({
    categoryCode: 'CAT3',
    localeId: 'en_GB',
    name: 'Test category 3',
    simpleName: 'Test category 3',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await createCategoryPortionSizeMethods(catLocal3.id, generatedPortionSizeMethods[2]);

  await Category.create({
    code: 'CAT4',
    name: 'Test category 4',
    isHidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });

  const catLocal4 = await CategoryLocal.create({
    categoryCode: 'CAT4',
    localeId: 'en_GB',
    name: 'Test category 4',
    simpleName: 'Test category 4',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await createCategoryPortionSizeMethods(catLocal4.id, generatedPortionSizeMethods[3]);

  await CategoryCategory.create({ categoryCode: 'CAT2', subcategoryCode: 'CAT3' });

  await CategoryCategory.create({ categoryCode: 'CAT2', subcategoryCode: 'CAT4' });

  await new Category({
    code: 'CAT5',
    name: 'Test category 5',
    isHidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  }).save();

  const catLocal5 = await CategoryLocal.create({
    categoryCode: 'CAT5',
    localeId: 'en_GB',
    name: 'Test category 5',
    simpleName: 'Test category 5',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await createCategoryPortionSizeMethods(catLocal5.id, generatedPortionSizeMethods[4]);

  await Category.create({
    code: 'CAT6',
    name: 'Test category 6',
    isHidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });

  await CategoryCategory.create({ categoryCode: 'CAT5', subcategoryCode: 'CAT6' });

  await Category.create({
    code: 'CAT7',
    name: 'Test category 7',
    isHidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });

  await Category.create({
    code: 'CAT8',
    name: 'Test category 8',
    isHidden: false,
    version: '00000000-0000-0000-0000-000000000000',
  });

  await CategoryCategory.create({ categoryCode: 'CAT7', subcategoryCode: 'CAT8' });
}

async function createFoods(sequelize: SequelizeTS): Promise<void> {
  const food1 = new Food({
    code: 'FOOD1',
    name: 'Test food 1',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await food1.save();

  await sequelize.transaction(t =>
    FoodLocal.create(
      {
        foodCode: 'FOOD1',
        localeId: 'en_GB',
        name: 'Test food 1',
        simpleName: 'Test food 1',
        version: '00000000-0000-0000-0000-000000000000',
        portionSizeMethods: generatedPortionSizeMethods[0],
      },
      {
        transaction: t,
        include: [{ association: 'portionSizeMethods' }],
      },
    ),
  );

  const foodCategory1 = new FoodCategory({
    foodCode: 'FOOD1',
    categoryCode: 'CAT1',
  });

  await foodCategory1.save();

  const food2 = new Food({
    code: 'FOOD2',
    name: 'Test food 2',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await food2.save();

  const foodLocal2 = new FoodLocal({
    foodCode: 'FOOD2',
    localeId: 'en_GB',
    name: 'Test food 2',
    simpleName: 'Test food 2',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await foodLocal2.save();

  const foodCategory2 = new FoodCategory({
    foodCode: 'FOOD2',
    categoryCode: 'CAT1',
  });

  await foodCategory2.save();

  const food3 = new Food({
    code: 'FOOD3',
    name: 'Test food 3',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await food3.save();

  await foodLocal2.save();

  await new FoodCategory({
    foodCode: 'FOOD3',
    categoryCode: 'CAT3',
  }).save();

  await new FoodCategory({
    foodCode: 'FOOD3',
    categoryCode: 'CAT4',
  }).save();

  await new Food({
    code: 'FOOD4',
    name: 'Test food 4',
    version: '00000000-0000-0000-0000-000000000000',
  }).save();

  await new FoodCategory({
    foodCode: 'FOOD4',
    categoryCode: 'CAT6',
  }).save();

  await Food.create({
    code: 'FOOD5',
    name: 'Test food 5',
    version: '00000000-0000-0000-0000-000000000000',
  });

  await FoodCategory.create({
    foodCode: 'FOOD5',
    categoryCode: 'CAT8',
  });

  await sequelize.transaction(t =>
    FoodLocal.create(
      {
        foodCode: 'FOOD5',
        localeId: 'en_AU',
        name: 'Test food 5 local name',
        simpleName: 'Test food 5 local name',
        version: '00000000-0000-0000-0000-000000000000',
        portionSizeMethods: generatedPortionSizeMethods[5],
      },
      {
        transaction: t,
        include: [{ association: 'portionSizeMethods' }],
      },
    ),
  );
}

export async function createTestData(sequelize: SequelizeTS): Promise<void> {
  await createLocales();
  await createCategories();
  await createFoods(sequelize);
}
