import { randomUUID } from 'node:crypto';

import { faker } from '@faker-js/faker';

import slugify from 'slugify';
import type {
  CreateAsServedSetInput,
  // LocaleRequest,
  NutrientTableRequest,
  NutrientTypeRequest,
  NutrientUnitRequest,
} from '@intake24/common/types/http/admin';
import { randomString, toStandardUnitId } from '@intake24/common/util';

import type { StandardUnitCreationAttributes } from '@intake24/db';
import { downloadImage } from '../util';

function category() {
  return {
    code: randomString(32),
    localeId: 'en_GB',
    englishName: faker.word.words(5),
    name: faker.word.words(5),
    simpleName: faker.word.words(5),
    hidden: faker.datatype.boolean(),
    version: randomUUID(),
  };
}

function food() {
  return {
    code: randomString(32),
    localeId: 'en_GB',
    englishName: faker.word.words(5),
    name: faker.word.words(5),
    version: randomUUID(),
  };
}

async function asServedSet(asServedSetId?: string): Promise<CreateAsServedSetInput> {
  const id = asServedSetId ?? randomString(32);
  const originalname = `${id}.jpg`;

  const filePath = await downloadImage('https://picsum.photos/1200/800.jpg', originalname);

  return {
    id,
    description: `${id}_description`,
    label: { en: `${id}_label` },
    file: { originalname: `${id}.jpg`, path: filePath },
    uploader: 'admin',
  };
}

/* const locale = (
  respLangId: string | undefined,
  adminLangId: string | undefined
): LocaleRequest => {
  const id = faker.location.countryCode();
  const englishName = faker.location.country();
  const localName = faker.location.country();
  const respondentLanguageId = respLangId ?? faker.location.countryCode();
  const adminLanguageId = adminLangId ?? faker.location.countryCode();
  const countryFlagCode = faker.location.countryCode();
  const textDirection = 'ltr';
  const foodIndexLanguageBackendId = 'en';

  return {
    id,
    englishName,
    localName,
    respondentLanguageId,
    adminLanguageId,
    countryFlagCode,
    textDirection,
    foodIndexLanguageBackendId,
  };
}; */

function nutrientTable(): NutrientTableRequest {
  return {
    id: slugify(randomString(16), { strict: true }),
    description: faker.word.words(5),
    csvMapping: {
      idColumnOffset: faker.number.int(100),
      descriptionColumnOffset: faker.number.int(100),
      localDescriptionColumnOffset: faker.number.int(100),
      rowOffset: faker.number.int(100),
    },
    csvMappingFields: [
      {
        fieldName: slugify(randomString(16), { strict: true }),
        columnOffset: faker.number.int(200),
      },
      {
        fieldName: slugify(randomString(16), { strict: true }),
        columnOffset: faker.number.int(200),
      },
      {
        fieldName: slugify(randomString(16), { strict: true }),
        columnOffset: faker.number.int(200),
      },
    ],
    csvMappingNutrients: [
      { nutrientTypeId: '1', columnOffset: faker.number.int(200) },
      { nutrientTypeId: '2', columnOffset: faker.number.int(200) },
      { nutrientTypeId: '3', columnOffset: faker.number.int(200) },
    ],
  };
}

function nutrientType(unitId: string, kcalPerUnit?: number | null): NutrientTypeRequest {
  return {
    id: faker.number.int({ min: 1000, max: 1000000 }).toString(),
    unitId,
    description: faker.word.words(5),
    kcalPerUnit,
  };
}

function nutrientUnit(): NutrientUnitRequest {
  return {
    id: faker.number.int({ min: 1000, max: 1000000 }).toString(),
    description: faker.word.words(5),
    symbol: faker.word.words(1),
  };
}

function standardUnit(): StandardUnitCreationAttributes {
  return {
    id: toStandardUnitId(faker.word.words(3)),
    name: faker.word.words(2),
    estimateIn: { en: faker.word.words(5), es: faker.word.words(5) },
    howMany: { en: faker.word.words(5), es: faker.word.words(5) },
  };
}

export default {
  category,
  food,
  asServedSet,
  // locale,
  nutrientTable,
  nutrientType,
  nutrientUnit,
  standardUnit,
};
