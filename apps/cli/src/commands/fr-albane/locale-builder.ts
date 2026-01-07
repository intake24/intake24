import type csvParser from 'csv-parser';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';

import path from 'node:path';
import parseCsv from 'csv-parser';
import { groupBy, mapValues, partition, sortBy, trim } from 'lodash';
import removeBOM from 'remove-bom-stream';

import { AlbaneAfpRow } from '@intake24/cli/commands/fr-albane/types/afp';
import {
  AlbaneAlternativeDescriptionRow,
} from '@intake24/cli/commands/fr-albane/types/alternative-descriptions';
import { AlbaneFacetsRow } from '@intake24/cli/commands/fr-albane/types/facets';
import { AlbaneFoodCategoryRow } from '@intake24/cli/commands/fr-albane/types/food-categories';
import { AlbaneFoodListRow } from '@intake24/cli/commands/fr-albane/types/food-list';
import { AlbaneStandardUnitRow } from '@intake24/cli/commands/fr-albane/types/standard-unit';
import { FrenchLocaleOptions } from '@intake24/cli/commands/fr-inca3/build-fr-locale-command';
import { PackageWriter } from '@intake24/cli/commands/packager/package-writer';
import type {
  PkgGlobalCategory,
  PkgLocalCategory,
} from '@intake24/cli/commands/packager/types/categories';
import type {
  PkgAssociatedFood,
  PkgGlobalFood,
  PkgLocalFood,
  PkgPortionSizeMethod,
  PkgStandardPortionPsm,
  PkgStandardUnit,
} from '@intake24/cli/commands/packager/types/foods';
import type { PkgLocale } from '@intake24/cli/commands/packager/types/locale';
import type { PkgNutrientTable } from '@intake24/cli/commands/packager/types/nutrient-tables';
import logger from '@intake24/common-backend/services/logger/logger';
import { Dictionary } from '@intake24/common/types';
import { capitalize } from '@intake24/common/util';

import { PkgAsServedSet } from '../packager/types/as-served';
import { AlbanePortionSizeImage } from './types/portion-size-images';
import { AlbaneQuantificationRow } from './types/quantification';

export type Logger = typeof logger;

const locale: PkgLocale = {
  id: 'fr_albane',
  localName: 'France (Albane)',
  englishName: 'France (Albane)',
  textDirection: 'ltr',
  prototypeLocale: null,
  respondentLanguage: 'fr',
  flagCode: 'fr',
  adminLanguage: 'fr',
  foodIndexLanguageBackendId: 'fr',
};

const dummyNutrientTable: PkgNutrientTable = {
  id: 'FR_TEMP',
  description: 'Placeholder nutrient table',
  csvFieldMapping: [],
  csvNutrientMapping: [],
  csvMapping: {
    idColumnOffset: 0,
    descriptionColumnOffset: 1,
    localDescriptionColumnOffset: 2,
    rowOffset: 1,
  },
  records: [
    {
      name: 'Placeholder record 1',
      recordId: 'FRPH1',
      nutrients: [['1', 100]], // Energy Kcal
      fields: [],
    },
  ],
};

// This is to differentiate references to guide images and as served images in FDQUANT file
const GUIDE_IMAGE_IDS = new Set(['Gdk_herring', 'Gdk_french_pastry', 'Gdk_crispbread', 'Gdk_sweets', 'Gchocbites', 'Gcbar_unwrapped', 'Gcbar_wrapped', 'Gbhaji', 'Gdk_wienerbroed', 'Gdk_toerkager', 'AUSalccans', 'Gbeerbot', 'Gmusselpipi', 'Gmuffscone', 'Gapl', 'Gaero', 'AUSchocobar', 'AUSsauce', 'AUSsoftdrink', 'AUSallcans', 'AUSbeerbot', 'AUSbonti', 'AUScanfish', 'Gtwix', 'gpie', 'Gmkyb', 'Gmnst', 'Gmlky', 'Gskps', 'Gwalk', 'Gpopcans', 'Gswts', 'Gmeatcan', 'Gcdmc', 'Ggalx', 'Gcanfish', 'Gmnms', 'Gkbar', 'Gciderbot', 'Gsqrs', 'Gmco', 'Gmars', 'Gumrs', 'Gkitk', 'Gprin', 'Gdori', 'Galccans', 'Gdekr', 'Gmbut', 'Gpopbottle', 'Ghula', 'Gcbar', 'Gwcho', 'Gmmcp', 'Gquav', 'Gwinebottle', 'Gban', 'Gbcn', 'Gbisc', 'Gbur', 'Gcake', 'Gcbisc1', 'Gcbisc2', 'Gchckbrst', 'Gchckleg', 'Gchoc', 'Gchoc1', 'Gchoc2', 'GchocPre', 'Gchse', 'Gcri', 'Gcri1', 'Gcri2', 'Gdes', 'Gdou', 'Gdrnk', 'Gfjta', 'Gflap', 'Gfrk', 'Gham', 'Gice1', 'Gice2', 'Gmlk01', 'Gmlk02', 'Gmlk03', 'Gmlk04', 'Gmug', 'Gorg', 'Gpiesaus', 'Gpik', 'Gpiz', 'Gprs', 'Groll', 'Gshk1', 'Gshk2', 'Gsli', 'Gsquash1', 'AUSsweets', 'AUScbar2', 'AUScbar4', 'Old_Gwatbottle', 'Old_Gspn', 'Old_Gspns', 'ABS_Slices', 'Gsquash2', 'Gsquash4', 'Gswb', 'Gswt1', 'Gswt2', 'Gtom', 'Gtur', 'Gwaf', 'Gwrp', 'Gyog', 'Gyog2', 'Gyor', 'Gbeans', 'Gmalt', 'Gcdmb', 'Gtwfk', 'Gskit', 'Gsnck', 'Gpopcarton', 'Gbonti', 'Gcans', 'Gcra', 'Gfrazz', 'Gsaus', 'Gsquash3', 'AUSaero', 'AUSbisc', 'AUScandrink', 'AUScadmilk', 'AUScbar3', 'AUScblock', 'NDNS_painauchoc', 'NDNS_croissant', 'NDNS_chicken_thighs', 'NDNS_chicken_legs', 'NDNS_cream_cake', 'NDNS_choux_pastries', 'Cocospns', 'NDNS_current_Gcake_iced', 'NDNS_Gsli_toast', 'NewGyog', 'Gwatbottle', 'SAB_Guava', 'Gallcans', 'Old_Gallcans', 'NDNS_burgers', 'Gspns', 'NDNS_Gshk1', 'SAB_chapatti', 'SAB_fritter', 'NZ23_Hashbrowns', 'Gspn', 'NDNS_gspn', 'NDNS_gtom', 'NDNS_Gmuffin', 'NDNS_gbeerbot', 'NDNS_gbut', 'NDNS_gccans', 'NDNS_gorg', 'NDNS_gpopcan', 'NDNS_gwine', 'NDNS_gmalt', 'NDNS_Gwalk', 'NDNS_Ghula', 'NDNS_Gdori', 'NDNS_gsaus', 'NZ23_Inst_noodles', 'NZ23_Tkway_bowl_sm', 'NZ23_Tkway_bowl_med', 'NZ23_Tkway_bowl_poke', 'NZ23_Tkway_noodle', 'NZ23_Choc blocks', 'NZ23_Choc pieces', 'NZ23_Choc bars', 'NZ23_Toddler cans', 'NZ23_Toddler pouches', 'NZ23_Juice bottles', 'NZ23_Soft drink cans', 'NZ23_Soft drink bottles', 'NZ23_Energy drinks', 'NZ23_Yoghurt pouch', 'NZ23_Yoghurt pots', 'NZ23_Banana loaf', 'NZ23_Fritters', 'NZ23_Crisps', 'NZ23_Beer bottles', 'NZ23_Beer cans', 'NZ23_Quiche', 'NZ23_Pies', 'NZ23_Meatballs', 'NZ23_Soft cheese', 'ABS_Beef Steak', 'ABS_Chicken Breasts', 'ABS_Lamb Chops', 'ABS_Chocolate Bars', 'ABS_Potato', 'ABS_Sweet Biscuits', 'ABS_Drink Bottles', 'ABS_Flavoured Milks Small', 'ABS_Yoghurt Tub Large', 'ABS_Yoghurt Pouch', 'ABS_Canned Fish', 'ABS_Canned Food Small', 'ABS_Canned Food Large', 'ABS_Mixed Drinks Cans', 'ABS_Mixed Drinks Bottles', 'ABS_Cider', 'ABS_Wine', 'ABS_Soft Drinks Large', 'ABS_Water Small', 'ABS_Water Large', 'ABS_Chocolate Bags', 'ABS_Lolly Bags', 'ABS_Extruded Snacks', 'ABS_Schnitzels', 'ABS_Breads', 'ABS_Takeaway Containers Square', 'ABS_Takeaway Containers Rect', 'ABS_Vege Chips', 'ABS_Flavoured Milks Large', 'ABS_Bananas', 'ABS_Apples', 'ABS_Pears', 'ABS_Fruit Juice_Drinks Small', 'ABS_Bread_Baguettes']);
const DRINKWARE_IDS = new Set(['takeaway_cups_cold', 'glasses_spirits', 'takeaway_cups_hot', 'glasses_soft', 'glasses_beer', 'NZ_cocktail_glasses', 'ABS_Glasses', 'ABS_Beer_Glasses', 'ABS_Wine_Glasses', 'ABS_Mugs', 'ABS_Plastic_Cups', 'NZ_Bowl', 'drinkwareSet_001', 'mugs', 'glasses_wine', 'gobelets', 'FR_Gobelet', 'FR_Vierres_Pied', 'FR_Baby_Bottles', 'FR_Mazagran', 'FR_Mugs', 'FR_Glasses', 'FR_Baby_Cups', 'FR_Ice_Cream_Glass', 'FR_Beer_Glasses', 'FR_Cocktail_Glasses', 'FR_Glasses_2', 'FR_Bowls', 'FR_Stemmed_Glasses', 'FR_Mugs_2', 'FR_Ramekins', 'FR_Plastic_Cups', 'FR_Verrines', 'FR_Shot_Glasses', 'FR_Stemmed_Glasses_Round', 'FR_Stemmed_Glasses_2']);

function getIntake24FoodCode(foodCode: string): string {
  return `24F${foodCode}`;
}

export class FrenchAlbaneLocaleBuilder {
  private readonly sourceDirPath: string;
  private readonly outputDirPath: string;
  private readonly logger: Logger;

  private sourceFoodRecords: AlbaneFoodListRow[] | undefined;
  private foodSynonyms: Record<string, string[]> | undefined;
  private foodCategories: Record<string, string[]> | undefined;

  private categoryNames: Record<string, string> | undefined;

  private associatedFoodPrompts: Record<string, PkgAssociatedFood[]> | undefined;
  private facetFlags: Record<string, string[]> | undefined;
  private portionSizeMethods: Record<string, PkgPortionSizeMethod[]> | undefined;
  private portionSizeImages: AlbanePortionSizeImage[] | undefined;
  private householdMeasuresMap: Record<string, string> | undefined;

  constructor(logger: Logger, options: FrenchLocaleOptions) {
    this.sourceDirPath = options.inputPath;
    this.outputDirPath = options.outputPath;
    this.logger = logger;
  }

  private async readJSON<T>(relativePath: string): Promise<T> {
    const filePath = path.join(this.sourceDirPath, relativePath);
    return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
  }

  private async readFoodCategories(): Promise<void> {
    this.foodCategories = {};

    const categoryRecords = await this.readJSON<AlbaneFoodCategoryRow[]>('json/CATEGORIES_I24_FOOD.json');

    for (const row of categoryRecords) {
      const categoryCodes: string[] = [];

      for (const code of [row.code1, row.code2, row.code3, row.code4, row.code5]) {
        if (code === undefined)
          continue;
        const trimmed = trim(code);
        if (trimmed.length > 0)
          categoryCodes.push(trimmed);
      }

      if (categoryCodes.length > 0)
        this.foodCategories[row.A_CODE] = categoryCodes;
    }
  }

  private async readCategoryNames(): Promise<void> {
    this.categoryNames = {};
    const missingTranslations: string[] = [];

    await this.readCSV(
      'CATEGORIES_I24_LIST.csv',
      (data) => {
        const trCol1 = data[1];
        const trCol2 = data[3];
        const trCol3 = data[5];
        const catCode = data[7];

        if (catCode) {
          const translatedName = trCol1 || trCol2 || trCol3;

          if (translatedName)
            this.categoryNames![catCode] = translatedName;
          else
            missingTranslations.push(catCode);
        }
      },
      { headers: false, skipLines: 1 },
    );

    if (missingTranslations.length > 0) {
      this.logger.warn(
        'Translations are missing for the following category codes (likely intentional because these categories are not used in the ANSES locale)',
      );

      this.logger.warn(`${missingTranslations.join(', ')}`);
    }
  }

  private async readFoodList(): Promise<void> {
    function getSynonyms(row: any, prefix: string): string[] {
      const synonyms: string[] = [];
      for (let i = 1; i <= 14; i++) {
        const synonymValue = row[`${prefix}SYNONYME_${i}`];
        if (typeof (synonymValue) === 'string') {
          const trimmed = trim(synonymValue);
          if (trimmed.length > 0)
            synonyms.push(capitalize(trimmed));
        }
      }
      return synonyms;
    }

    this.sourceFoodRecords = await this.readJSON<AlbaneFoodListRow[]>('json/FDLIST.json');

    const foodSynonymRecords = await this.readJSON<AlbaneAlternativeDescriptionRow[]>('json/ALTERNATIVE_FOOD_DESCRIPTION.json');

    this.foodSynonyms = Object.fromEntries(
      foodSynonymRecords.map(r => ([r.A_CODE, getSynonyms(r, 'A_')]) as [string, string[]]).filter(a => a[1].length > 0),
    );
  }

  private buildGlobalFoods(): PkgGlobalFood[] {
    const globalFoods: PkgGlobalFood[] = [];

    const saltCodes = ['41033', '41150', '41151', '41152', '41153', '41154', '41155', '41156', '41157', '41174'];

    for (const row of this.sourceFoodRecords!) {
      const categories = this.foodCategories![row.A_CODE];

      if (saltCodes.includes(row.A_CODE))
        categories.push('FRFSEL');

      if (!categories)
        logger.warn(`Food ${row.A_CODE} is not assigned to any categories`);

      globalFoods.push({
        version: randomUUID(),
        code: getIntake24FoodCode(row.A_CODE),
        parentCategories: categories ?? [],
        attributes: { sameAsBeforeOption: true },
        groupCode: 1,
        englishDescription: capitalize(row.A_LIBELLE_EN.substring(0, 128)),
      });
    }

    return globalFoods;
  }

  private buildLocalFoods(): PkgLocalFood[] {
    const localFoods: PkgLocalFood[] = [];

    for (const row of this.sourceFoodRecords!) {
      const foodSynonyms = this.foodSynonyms![row.A_CODE];
      const alternativeNames = foodSynonyms === undefined ? undefined : { fr: foodSynonyms.map(s => s.substring(0, 128)) };
      const facetFlags = this.facetFlags![row.A_CODE];

      const portionSizeMethods = this.portionSizeMethods![row.A_CODE];

      if (portionSizeMethods === undefined)
        throw new Error(`Quantification data missing for food ${row.A_CODE}`);

      localFoods.push({
        version: randomUUID(),
        code: getIntake24FoodCode(row.A_CODE),
        localDescription: capitalize(row.A_LIBELLE.substring(0, 128)),
        alternativeNames,
        tags: facetFlags,
        nutrientTableCodes: {
          FR_ALBANE_PILOT: row.A_CODE,
        },
        associatedFoods: this.associatedFoodPrompts![row.A_CODE] ?? [],
        portionSize: portionSizeMethods,
        brandNames: [],
      });
    }

    return localFoods;
  }

  private buildGlobalCategories(): PkgGlobalCategory[] {
    return [
      {
        code: 'FRPEPO',
        attributes: {},
        englishDescription: 'Baby food and savoury snacks',
        parentCategories: ['19TODSFD'],
        version: '0fd3f027-6f2a-47f3-9838-7bb0037a4fd4',
        isHidden: false,
      },
      {
        code: 'FRDEIN',
        attributes: {},
        englishDescription: 'Baby desserts',
        parentCategories: ['19TODSFD'],
        version: '64f6bd7b-0f0b-41b6-ab20-afac96078a28',
        isHidden: false,
      },
      {
        code: 'FRCEBI',
        attributes: {},
        englishDescription: 'Baby cereals and biscuits',
        parentCategories: ['19TODSFD'],
        version: '7e12b7a1-e7e3-4c57-9f2a-ddf5c1c05f3b',
        isHidden: false,
      },
      {
        code: 'FRLABO',
        attributes: {},
        englishDescription: 'Baby milk and drinks',
        parentCategories: ['19TODSFD'],
        version: '7e12b7a1-e7e3-4c57-9f2a-ddf5c1c05f3b',
        isHidden: false,
      },
      {
        code: 'FRLAMA',
        attributes: {},
        englishDescription: 'Breast milk',
        parentCategories: ['FRLABO'],
        version: 'e309274c-12be-49d0-88e2-26744ce7f3c1',
        isHidden: false,
      },
      {
        code: 'FRCIT',
        attributes: {},
        englishDescription: 'Lemon juice for cooking',
        parentCategories: ['COND'],
        version: '0555155a-8073-4a00-b30c-26691082b7d1',
        isHidden: false,
      },
      {
        code: 'FRHPME',
        attributes: {},
        englishDescription: 'Chili oil',
        parentCategories: ['COND'],
        version: 'eeba6915-790e-42a6-be9d-2fd78ee80567',
        isHidden: false,
      },
      {
        code: 'FRFSEL',
        attributes: {},
        englishDescription: 'Salt (for salt facet)',
        parentCategories: [],
        version: '3fa6db23-873a-4726-9a5e-501950692d49',
        isHidden: true,
      },
    ];
  }

  private buildLocalCategories(): PkgLocalCategory[] {
    const localCategories: PkgLocalCategory[] = [
      {
        code: 'FRPEPO',
        localDescription: 'Petits pots salés & plats infantiles',
        portionSize: [],
      },
      {
        code: 'FRDEIN',
        localDescription: 'Desserts infantiles',
        portionSize: [],
      },
      {
        code: 'FRCEBI',
        localDescription: 'Céréales & biscuits infantiles',
        portionSize: [],
      },
      {
        code: 'FRLABO',
        localDescription: 'Laits & boissons infantiles',
        portionSize: [],
      },
      {
        code: 'FRLAMA',
        localDescription: 'Lait maternel',
        portionSize: [],
      },
      {
        code: 'FRCIT',
        localDescription: 'Jus de citron',
        portionSize: [],
      },
      {
        code: 'FRHPME',
        localDescription: 'Huile pimentée',
        portionSize: [],
      },
      {
        code: 'FRFSEL',
        localDescription: 'Sel (pour la facette)',
        portionSize: [],
      },
    ];

    if (this.categoryNames !== undefined) {
      for (const [code, localDescription] of Object.entries(this.categoryNames)) {
        if (localCategories.some(cat => cat.code === code)) {
          logger.warn(`Category code ${code} is a built-in Albane category, skipping translation from CATEGORIES_I24_LIST file`);
          continue;
        }

        localCategories.push({
          code,
          localDescription,
          portionSize: [],
        });
      }
    }

    return localCategories;
  }

  private async readAssociatedFoodPrompts(): Promise<void> {
    this.associatedFoodPrompts = {};

    const afpRows = await this.readJSON<AlbaneAfpRow[]>('json/ASSOCIATED_FOOD_PROMPTS.json');

    for (let i = 0; i < afpRows.length; i++) {
      const row = afpRows[i];

      const prompts: PkgAssociatedFood[] = [];

      // Just sense checking
      if (row.code.length === 0) {
        logger.warn(`Food code column empty in row ${i + 1} of the associated food prompts file`);
        continue;
      }

      if (row.genericName.length === 0) {
        logger.warn(`Generic name column empty in row ${i + 1} (Albane food code ${row.code}) of the associated food prompts file`);
        continue;
      }

      if (row.categoryCode1.length > 0) {
        if (row.promptText1.length === 0) {
          logger.warn(`Category code defined but prompt text 1 column is empty in row ${i + 1} (Albane food code ${row.code}) of the associated food prompts file`);
          continue;
        }

        prompts.push({
          linkAsMain: false,
          genericName: { fr: row.genericName },
          promptText: { fr: row.promptText1 },
          categoryCode: row.categoryCode1,
        });
      }

      if (row.categoryCode2.length > 0) {
        if (row.promptText2.length === 0) {
          logger.warn(`Category code defined but prompt text 2 column is empty in row ${i + 1} (Albane food code ${row.code}) of the associated food prompts file`);
          continue;
        }

        prompts.push({
          linkAsMain: false,
          genericName: { fr: row.genericName },
          promptText: { fr: row.promptText2 },
          categoryCode: row.categoryCode2,
        });
      }

      if (row.categoryCode3.length > 0) {
        if (row.promptText3.length === 0) {
          logger.warn(`Category code defined but prompt text 3 column is empty in row ${i + 1} (Albane food code ${row.code}) of the associated food prompts file`);
          continue;
        }

        prompts.push({
          linkAsMain: false,
          genericName: { fr: row.genericName },
          promptText: { fr: row.promptText3 },
          categoryCode: row.categoryCode3,
        });
      }

      this.associatedFoodPrompts[row.code] = prompts;
    }
  }

  private async readFacetFlags(): Promise<void> {
    const facetsRows
      = (await this.readJSON<AlbaneFacetsRow[]>('json/FACETS.json'));

    this.facetFlags = {};

    for (const row of facetsRows) {
      const flags = Object.keys(row)
        .map(k => trim(k))
        .filter(k => !(['A_CODE', 'A_LIBELLE'].includes(k)))
        .filter(k => row[k] === '1');
      this.facetFlags[row.A_CODE] = flags;
    }
  }

  private async readCSV(
    relativePath: string,
    onRowData: (data: any) => void,
    optionsOrHeaders?: csvParser.Options | ReadonlyArray<string>,
  ): Promise<void> {
    return new Promise((resolve) => {
      createReadStream(path.join(this.sourceDirPath, relativePath))
        .pipe(removeBOM())
        .pipe(parseCsv(optionsOrHeaders))
        .on('data', (data: any) => {
          onRowData(data);
        })
        .on('end', () => {
          resolve();
        });
    });
  }

  private async readPortionSizeImages(): Promise<void> {
    this.portionSizeImages = [];

    await this.readCSV(
      path.join('List.Photos_HHM_Shapes_INCA3_v06082024.csv'),
      (data) => {
        if (data.fileName && data.pictureId)
          this.portionSizeImages!.push(data);
      },
      {
        headers: [
          'owner',
          'copyright',
          'updateYear',
          'pictureId',
          'name',
          'portionId',
          'fileName',
          'rawCooked',
          'edible',
          'weight',
          'edibleWeight',
          'comment',
        ],
        skipLines: 1,
      },
    );
  }

  private async readStandardUnits(): Promise<Dictionary<PkgStandardPortionPsm>> {
    function getStandardUnits(rows: AlbaneStandardUnitRow[]): PkgStandardUnit[] {
      return sortBy(rows, row => Number.parseInt(row.US_NUM)).map((row) => {
        const description = row.US_LIBELLE.replace(/^1\s+/, '');

        if (row.US_UNITE !== 'G' && row.US_UNITE !== 'V') {
          logger.warn(
            `Unexpected weight unit for a standard unit option: "${row.US_UNITE}", for food id ${row.A_CODE}, standard unit number ${row.US_NUM} `,
          );
        }

        return {
          name: `ALBANE_${row.A_CODE}_${row.US_NUM}`,
          weight: Number.parseFloat(row.US_POIDS),
          omitFoodDescription: true,
          inlineEstimateIn: description,
          inlineHowMany: `Combien de ${description}`,
        };
      });
    }

    const standardUnitRows = new Array<AlbaneStandardUnitRow>();

    await this.readCSV(
      path.join('US.csv'),
      (data) => {
        if (data.A_CODE)
          standardUnitRows.push(data);
      },
    );

    const groupedStandardUnits = groupBy(standardUnitRows, row => row.A_CODE);

    return mapValues(groupedStandardUnits, rows => ({
      method: 'standard-portion' as const,
      description: 'use_a_standard_portion',
      useForRecipes: true,
      conversionFactor: 1,
      units: getStandardUnits(rows),
    }));
  }

  private async readPortionSizeMethods(): Promise<void> {
    this.buildHouseholdMeasuresMap();

    if (this.householdMeasuresMap === undefined)
      throw new Error('Household measures map must be built before calling this function');

    this.portionSizeMethods = {};
    const quantificationRows = new Array<AlbaneQuantificationRow>();

    await this.readCSV(
      path.join('FDQUANT.csv'),
      (data) => {
        if (data.A_CODE)
          quantificationRows.push(data);
      },
    );

    const standardUnits = await this.readStandardUnits();

    for (const row of quantificationRows) {
      const foodCode = row.A_CODE;
      const foodPortionSizeMethods = new Array<PkgPortionSizeMethod>();

      const asServedSetIds = new Set<string>();
      const guideImageIds = new Set<string>();
      const drinkwareSetIds = new Set<string>();

      if (row.METHODE_photos) {
        if (!row.LISTE_photos) {
          logger.warn(`METHODE_photos is enabled for food code ${foodCode}, but LISTE_photos is empty`);
        }
        else {
          const ids = row.LISTE_photos.split(';').map(s => s.trim());

          for (const id of ids) {
            // 038 looks like it's supposed to be a guide image and has no corresponding data in
            // List.Photos_HHM_Shapes_INCA3.xlsx
            // Replaced with new guide image FR_Bread_Slices
            if (id === '038') {
              guideImageIds.add('FR_Bread_Slices');
            }
            // numerical ids refer to Albane photos converted to as-served in Intake24
            // with the ALBANE_ prefix
            else if (/^\d+$/.test(id)) {
              asServedSetIds.add(`ALBANE_${id}`);
            }
            else if (GUIDE_IMAGE_IDS.has(id)) {
              guideImageIds.add(id);
            }
            else if (DRINKWARE_IDS.has(id)) {
              drinkwareSetIds.add(id);
            }
            else {
              asServedSetIds.add(id);
            }
          }
        }
      }

      if (row.METHODE_poids === 'P' || row.METHODE_volume === 'V') {
        foodPortionSizeMethods.push({
          method: 'direct-weight',
          description: 'weight',
          useForRecipes: true,
          conversionFactor: 1.0,
        });
      }

      if (row.METHODE_mesure_menagere === 'H') {
        if (!row.LISTE_hhm) {
          logger.warn(`METHODE_mesure_menagere is enabled for food code ${foodCode}, but LISTE_hhm is empty, skipping`);
        }
        else {
          const hhmIds = row.LISTE_hhm.split(',').map(s => s.trim());

          for (const id of hhmIds) {
            // If the ID looks like one of Albane HHM ids (e.g., H001, H030) try and map it into Intake24 drinkware set id
            // via the household measures map. This is required because records in the FDQUANT file refer to individual
            // images that are combined into sets in Intake24, and we don't want duplicates.
            if (/^H\d+$/.test(id)) {
              const drinkwareId = this.householdMeasuresMap[id];
              if (drinkwareId === undefined)
                throw new Error(`Unexpected household measure ID: ${id}, check FDQUANT for food code ${foodCode}`);
              else
                drinkwareSetIds.add(drinkwareId);
            }
            else {
              // otherwise assume it's either an Intake24 guide image id or an Intake24 as served set
              if (GUIDE_IMAGE_IDS.has(id))
                guideImageIds.add(id);
              else if (DRINKWARE_IDS.has(id))
                drinkwareSetIds.add(id);
              else
                asServedSetIds.add(id);
            }
          }
        }
      }

      for (const asServedId of [...asServedSetIds].sort()) {
        foodPortionSizeMethods.push({
          method: 'as-served',
          description: 'use_an_image',
          useForRecipes: true,
          conversionFactor: 1.0,
          servingImageSet: asServedId,
        });
      }

      for (const guideImageId of [...guideImageIds].sort()) {
        foodPortionSizeMethods.push({
          method: 'guide-image',
          guideImageId,
          description: 'use_an_image',
          useForRecipes: true,
          conversionFactor: 1.0,
        });
      }

      const pushToEndIds = ['FR_Baby_Bottles', 'FR_Baby_Cups'];

      const [endIds, startIds] = partition([...drinkwareSetIds].sort(), id => pushToEndIds.includes(id));

      for (const drinkwareId of [...startIds, ...endIds]) {
        foodPortionSizeMethods.push({
          method: 'drink-scale',
          drinkwareId,
          initialFillLevel: 0.9,
          skipFillLevel: false,
          description: 'use_an_image',
          useForRecipes: true,
          conversionFactor: 1.0,
          multiple: true,
        });
      }

      if (standardUnits[foodCode] !== undefined) {
        foodPortionSizeMethods.push(standardUnits[foodCode]);
      }

      this.portionSizeMethods[foodCode] = foodPortionSizeMethods;
    }
  }

  private buildAsServed(): PkgAsServedSet[] {
    const imagesById = groupBy(this.portionSizeImages, record => record.pictureId);
    return Object.entries(imagesById).map(([imageId, images]) => {
      return {
        id: `ALBANE_${imageId}`,
        description: images[0].name,
        selectionImagePath: '',
        images: images.map(image => ({
          imagePath: `Albane/${image.fileName}`,
          weight: Number.parseFloat(image.weight),
          imageKeywords: [],
        })),
      };
    });
  }

  private buildHouseholdMeasuresMap() {
    this.householdMeasuresMap = {};

    const hhmap = this.householdMeasuresMap;

    function addRange(fromInclusive: number, toInclusive: number, i24id: string) {
      for (let i = fromInclusive; i <= toInclusive; ++i) {
        const sourceId = `H${i.toString().padStart(3, '0')}`;
        hhmap[sourceId] = i24id;
      }
    }

    addRange(1, 6, 'FR_Stemmed_Glasses');
    addRange(7, 7, 'FR_Cocktail_Glasses');
    addRange(8, 9, 'FR_Stemmed_Glasses_Round');
    addRange(10, 12, 'FR_Stemmed_Glasses_2');
    addRange(13, 16, 'FR_Glasses');
    addRange(17, 19, 'FR_Shot_Glasses');
    addRange(20, 21, 'FR_Glasses_2');
    addRange(22, 23, 'FR_Glasses');
    addRange(24, 24, 'FR_Beer_Glasses');
    addRange(25, 27, 'FR_Plastic_Cups');
    addRange(28, 31, 'FR_Mugs');
    addRange(32, 32, 'FR_Mazagran');
    addRange(33, 34, 'FR_Mugs_2');
    addRange(35, 39, 'FR_Bowls');
    addRange(40, 42, 'FR_Verrines');
    addRange(43, 45, 'FR_Ramekins');
    addRange(46, 46, 'FR_Ice_Cream_Glass');
    addRange(47, 50, 'FR_Baby_Cups');
    addRange(51, 54, 'FR_Baby_Bottles');
  }

  public async buildPackage(): Promise<void> {
    await this.readFoodList();
    await this.readFoodCategories();
    await this.readCategoryNames();
    await this.readAssociatedFoodPrompts();
    await this.readFacetFlags();
    await this.readPortionSizeImages();
    await this.readPortionSizeMethods();

    const globalFoods = this.buildGlobalFoods();
    const localFoods = this.buildLocalFoods();

    const globalCategories = this.buildGlobalCategories();
    const localCategories = this.buildLocalCategories();

    const localCategoriesRecord = {
      [locale.id]: localCategories,
    };

    const localFoodsRecord = {
      [locale.id]: localFoods,
    };

    const enabledLocalFoods = {
      [locale.id]: localFoods.map(f => f.code),
    };

    const asServedSets = this.buildAsServed();

    const writer = new PackageWriter(this.logger, this.outputDirPath);

    await writer.writeLocales([locale]);
    await writer.writeGlobalFoods(globalFoods);
    await writer.writeLocalFoods(localFoodsRecord);
    await writer.writeGlobalCategories(globalCategories);
    await writer.writeLocalCategories(localCategoriesRecord);
    await writer.writeEnabledLocalFoods(enabledLocalFoods);
    await writer.writeNutrientTables([dummyNutrientTable]);
    await writer.writeAsServedSets(asServedSets);
  }
}
