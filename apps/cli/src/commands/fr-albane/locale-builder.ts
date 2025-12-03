import type csvParser from 'csv-parser';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';

import path from 'node:path';

import parseCsv from 'csv-parser';
import { groupBy, mapValues, partition, sortBy, trim } from 'lodash';
import stripBomStream from 'strip-bom-stream';
import * as XLSX from 'xlsx';

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
  PkgCategory,
} from '@intake24/cli/commands/packager/types/categories';
import type {
  PkgAssociatedFood,
  PkgFood,
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
import { PkgPortionSizeImageLabels } from '../packager/types/portion-size-image-labels';
import { AlbanePortionSizeImage } from './types/portion-size-images';
import { AlbaneQuantificationRow } from './types/quantification';

export type Logger = typeof logger;

const locale: PkgLocale = {
  id: 'fr_albane',
  localName: 'France (Albane)',
  englishName: 'France (Albane)',
  textDirection: 'ltr',
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
const GUIDE_IMAGE_IDS = new Set(['Gdk_herring', 'Gdk_french_pastry', 'Gdk_crispbread', 'Gdk_sweets', 'Gchocbites', 'Gcbar_unwrapped', 'Gcbar_wrapped', 'Gbhaji', 'Gdk_wienerbroed', 'Gdk_toerkager', 'AUSalccans', 'Gbeerbot', 'Gmusselpipi', 'Gmuffscone', 'Gapl', 'Gaero', 'AUSchocobar', 'AUSsauce', 'AUSsoftdrink', 'AUSallcans', 'AUSbeerbot', 'AUSbonti', 'AUScanfish', 'Gtwix', 'gpie', 'Gmkyb', 'Gmnst', 'Gmlky', 'Gskps', 'Gwalk', 'Gpopcans', 'Gswts', 'Gmeatcan', 'Gcdmc', 'Ggalx', 'Gcanfish', 'Gmnms', 'Gkbar', 'Gciderbot', 'Gsqrs', 'Gmco', 'Gmars', 'Gumrs', 'Gkitk', 'Gprin', 'Gdori', 'Galccans', 'Gdekr', 'Gmbut', 'Gpopbottle', 'Ghula', 'Gcbar', 'Gwcho', 'Gmmcp', 'Gquav', 'Gwinebottle', 'Gban', 'Gbcn', 'Gbisc', 'Gbur', 'Gcake', 'Gcbisc1', 'Gcbisc2', 'Gchckbrst', 'Gchckleg', 'Gchoc', 'Gchoc1', 'Gchoc2', 'GchocPre', 'Gchse', 'Gcri', 'Gcri1', 'Gcri2', 'Gdes', 'Gdou', 'Gdrnk', 'Gfjta', 'Gflap', 'Gfrk', 'Gham', 'Gice1', 'Gice2', 'Gmlk01', 'Gmlk02', 'Gmlk03', 'Gmlk04', 'Gmug', 'Gorg', 'Gpiesaus', 'Gpik', 'Gpiz', 'Gprs', 'Groll', 'Gshk1', 'Gshk2', 'Gsli', 'Gsquash1', 'AUSsweets', 'AUScbar2', 'AUScbar4', 'Old_Gwatbottle', 'Old_Gspn', 'Old_Gspns', 'ABS_Slices', 'Gsquash2', 'Gsquash4', 'Gswb', 'Gswt1', 'Gswt2', 'Gtom', 'Gtur', 'Gwaf', 'Gwrp', 'Gyog', 'Gyog2', 'Gyor', 'Gbeans', 'Gmalt', 'Gcdmb', 'Gtwfk', 'Gskit', 'Gsnck', 'Gpopcarton', 'Gbonti', 'Gcans', 'Gcra', 'Gfrazz', 'Gsaus', 'Gsquash3', 'AUSaero', 'AUSbisc', 'AUScandrink', 'AUScadmilk', 'AUScbar3', 'AUScblock', 'NDNS_painauchoc', 'NDNS_croissant', 'NDNS_chicken_thighs', 'NDNS_chicken_legs', 'NDNS_cream_cake', 'NDNS_choux_pastries', 'Cocospns', 'NDNS_current_Gcake_iced', 'NDNS_Gsli_toast', 'NewGyog', 'Gwatbottle', 'SAB_Guava', 'Gallcans', 'Old_Gallcans', 'NDNS_burgers', 'Gspns', 'NDNS_Gshk1', 'SAB_chapatti', 'SAB_fritter', 'NZ23_Hashbrowns', 'Gspn', 'NDNS_gspn', 'NDNS_gtom', 'NDNS_Gmuffin', 'NDNS_gbeerbot', 'NDNS_gbut', 'NDNS_gccans', 'NDNS_gorg', 'NDNS_gpopcan', 'NDNS_gwine', 'NDNS_gmalt', 'NDNS_Gwalk', 'NDNS_Ghula', 'NDNS_Gdori', 'NDNS_gsaus', 'NZ23_Inst_noodles', 'NZ23_Tkway_bowl_sm', 'NZ23_Tkway_bowl_med', 'NZ23_Tkway_bowl_poke', 'NZ23_Tkway_noodle', 'NZ23_Choc blocks', 'NZ23_Choc pieces', 'NZ23_Choc bars', 'NZ23_Toddler cans', 'NZ23_Toddler pouches', 'NZ23_Juice bottles', 'NZ23_Soft drink cans', 'NZ23_Soft drink bottles', 'NZ23_Energy drinks', 'NZ23_Yoghurt pouch', 'NZ23_Yoghurt pots', 'NZ23_Banana loaf', 'NZ23_Fritters', 'NZ23_Crisps', 'NZ23_Beer bottles', 'NZ23_Beer cans', 'NZ23_Quiche', 'NZ23_Pies', 'NZ23_Meatballs', 'NZ23_Soft cheese', 'ABS_Beef Steak', 'ABS_Chicken Breasts', 'ABS_Lamb Chops', 'ABS_Chocolate Bars', 'ABS_Potato', 'ABS_Sweet Biscuits', 'ABS_Flavoured Milks Small', 'ABS_Yoghurt Tub Large', 'ABS_Yoghurt Pouch', 'ABS_Canned Fish', 'ABS_Canned Food Small', 'ABS_Canned Food Large', 'ABS_Mixed Drinks Cans', 'ABS_Mixed Drinks Bottles', 'ABS_Cider', 'ABS_Wine', 'ABS_Soft Drinks Large', 'ABS_Water Small', 'ABS_Water Large', 'ABS_Chocolate Bags', 'ABS_Lolly Bags', 'ABS_Extruded Snacks', 'ABS_Schnitzels', 'ABS_Breads', 'ABS_Takeaway Containers Square', 'ABS_Takeaway Containers Rect', 'ABS_Vege Chips', 'ABS_Flavoured Milks Large', 'ABS_Bananas', 'ABS_Apples', 'ABS_Pears', 'ABS_Fruit Juice_Drinks Small', 'ABS_Bread_Baguettes', 'ALBANE_Charcuterie', 'ALBANE_French_Breads', 'ALBANE_Sliced_Breads', 'ALBANE_Cakes_Brioches', 'ALBANE_Crispbreads', 'ALBANE_Inst_noodles', 'ALBANE_SWICH_baguettes', 'ALBANE_SWICH_viennois', 'ALBANE_SWICH_Sliced_breads', 'ALBANE_SWICH_Sliced_breads_half', 'ALBANE_SWICH_wraps', 'ALBANE_Yoghurts', 'ALBANE_White_Cheeses', 'ALBANE_Desserts', 'ALBANE_Desserts_Creams', 'ALBANE_Mms']);
const DRINKWARE_IDS = new Set(['takeaway_cups_cold', 'glasses_spirits', 'takeaway_cups_hot', 'glasses_soft', 'glasses_beer', 'NZ_cocktail_glasses', 'ABS_Glasses', 'ABS_Beer_Glasses', 'ABS_Wine_Glasses', 'ABS_Mugs', 'ABS_Plastic_Cups', 'NZ_Bowl', 'drinkwareSet_001', 'mugs', 'glasses_wine', 'gobelets', 'FR_Gobelet', 'FR_Vierres_Pied', 'FR_Baby_Bottles', 'FR_Mazagran', 'FR_Mugs', 'FR_Glasses', 'FR_Baby_Cups', 'FR_Ice_Cream_Glass', 'FR_Beer_Glasses', 'FR_Cocktail_Glasses', 'FR_Glasses_2', 'FR_Bowls', 'FR_Stemmed_Glasses', 'FR_Mugs_2', 'FR_Ramekins', 'FR_Plastic_Cups', 'FR_Verrines', 'FR_Shot_Glasses', 'FR_Stemmed_Glasses_Round', 'FR_Stemmed_Glasses_2', 'ALBANE_Small_bowl_1', 'ALBANE_Big_bowl_1', 'ALBANE_Big_bowl_2', 'ABS_Drink Bottles', 'ABS_DrinkBottles_Albanecopy']);

// Originally, List.Photos_HHM_Shapes.xlsx contained data only for the new Albane-specific images
// Now it also contains descriptions of some of the images from other Intake24 locales (UK, ABS).
//
// These need to be ignored to avoid creating duplicates.
const IGNORE_AS_SERVED = new Set(['ABS_Extruded_Cereal', 'popcorn', 'mixed_nuts', 'flaked_almonds', 'raisins', 'puffed_cereals', 'ABS_Vegemite', 'ABS_Nutella', 'butk', 'butter_spread', 'cream_cheese_spread', 'ABS_Peanut_Butter', 'ABS_Vegemite_2', 'jam', 'carrot_raw', 'mixed_peppers', 'cucumber', 'pumpkin', 'cabbage', 'peas', 'broccoli', 'NZ23_Bok_choy_cut', 'mix_veg_boiled', 'NDNS_bolognese_sauce', 'tomato_sauce', 'ABS_Gravy', 'sauce_dollop', 'NZ23_boilupsoup', 'potatoes_boiled', 'potatoes_mashed', 'rice', 'SAB_newvegrice1', 'NDNS_stirfry_noodles', 'paella', 'NDNS_lentil_curry', 'canned_fish', 'ABS_Fish_Fillets', 'chicken_sauce', 'NDNS_meat_stew', 'SAB_newvegcurry1', 'chicken_breast_slices', 'NZ23_Tofu_Cubes', 'ABS_White_Sauce', 'milk_pudding', 'NDNS_berries', 'apps', 'bans', 'NDNS_cheesecake', 'ice_cream']);

const ALBANE_SALT_CODES = ['41033', '41150', '41151', '41152', '41153', '41154', '41155', '41156', '41157', '41174', '41191'];

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
  private reasonableAmount: Record<string, number> | undefined;
  private portionSizeImages: AlbanePortionSizeImage[] | undefined;
  private standardUnitLabels: Record<string, Record<string, string>> | undefined;
  private householdMeasuresMap: Record<string, string> | undefined;
  private categoryTags: Record<string, Set<string>> | undefined;

  constructor(logger: Logger, options: FrenchLocaleOptions) {
    this.sourceDirPath = options.inputPath;
    this.outputDirPath = options.outputPath;
    this.logger = logger;
  }

  private async readJSON<T>(relativePath: string): Promise<T> {
    const filePath = path.join(this.sourceDirPath, relativePath);
    return JSON.parse(await fs.readFile(filePath, 'utf-8')) as T;
  }

  private readXLSX<T>(relativePath: string, options?: XLSX.Sheet2JSONOpts, sheetName?: string): T[] {
    const filePath = path.join(this.sourceDirPath, relativePath);
    const workbook = XLSX.readFile(filePath);
    const name = sheetName ?? workbook.SheetNames[0];
    const sheet = workbook.Sheets[name];
    const json = XLSX.utils.sheet_to_json(sheet, options);
    // Cell values are expected to be strings but XLSX tries to be clever and converts numbers
    return json.map((row: any) => mapValues(row, (v: any) => v?.toString())) as T[];
  }

  private async readFoodCategories(): Promise<void> {
    this.foodCategories = {};

    const categoryRecords = this.readXLSX<AlbaneFoodCategoryRow>('CATEGORIES_I24_FOOD.xlsx');

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

  private async readCategoryList(): Promise<void> {
    function readTags(str: string | undefined, existing: Set<string> | undefined): Set<string> {
      const result = new Set<string>();

      if (str !== undefined) {
        for (const s of str.split(',')) {
          const trimmed = s.trim();
          if (trimmed.length > 0)
            result.add(trimmed);
        }
      }

      if (existing !== undefined) {
        existing.forEach(tag => result.add(tag));
      }

      return result;
    }

    this.categoryNames = {};
    this.categoryTags = {};
    const missingTranslations: string[] = [];

    const rows = this.readXLSX<Record<number, string>>('CATEGORIES_I24_LIST.xlsx', { header: 1, range: 1 });

    for (const row of rows) {
      const trCol1 = row[1];
      const trCol2 = row[3];
      const trCol3 = row[5];
      const catCode = row[7];

      if (catCode) {
        const translatedName = trCol1 || trCol2 || trCol3;

        if (translatedName)
          this.categoryNames![catCode] = translatedName;
        else
          missingTranslations.push(catCode);

        this.categoryTags![catCode] = readTags(row[8], this.categoryTags![catCode]);
      }
    }

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

    this.sourceFoodRecords = this.readXLSX<AlbaneFoodListRow>('FDLIST_EN.xlsx', { });

    const foodSynonymRecords = this.readXLSX<AlbaneAlternativeDescriptionRow>('ALTERNATIVE_FOOD_DESCRIPTION.xlsx');

    this.foodSynonyms = Object.fromEntries(
      foodSynonymRecords.map(r => ([r.A_CODE, getSynonyms(r, 'A_')]) as [string, string[]]).filter(a => a[1].length > 0),
    );
  }

  private buildFoods(): PkgFood[] {
    const foods: PkgFood[] = [];

    for (const row of this.sourceFoodRecords!) {
      const categories = this.foodCategories![row.A_CODE];

      if (ALBANE_SALT_CODES.includes(row.A_CODE))
        categories.push('FRFSEL');

      if (!categories)
        logger.warn(`Food ${row.A_CODE} is not assigned to any categories`);

      const foodSynonyms = this.foodSynonyms![row.A_CODE];
      const alternativeNames = foodSynonyms === undefined ? undefined : { fr: foodSynonyms.map(s => s.substring(0, 128)) };
      const portionSizeMethods = this.portionSizeMethods![row.A_CODE];

      const categoryTags = new Set<string>();

      for (const categoryCode of this.foodCategories![row.A_CODE]) {
        for (const tag of (this.categoryTags![categoryCode] ?? []))
          categoryTags.add(tag);
      }

      const facetFlags = this.facetFlags![row.A_CODE];

      if (portionSizeMethods === undefined)
        throw new Error(`Quantification data missing for food ${row.A_CODE}`);

      foods.push({
        version: randomUUID(),
        code: getIntake24FoodCode(row.A_CODE),
        name: capitalize(row.A_LIBELLE.substring(0, 128)),
        englishName: capitalize(row.A_LIBELLE_EN.substring(0, 128)),
        attributes: { sameAsBeforeOption: true, reasonableAmount: this.reasonableAmount![row.A_CODE] },
        alternativeNames,
        tags: [...facetFlags, ...categoryTags],
        nutrientTableCodes: {
          FR_ALBANE: row.A_CODE,
        },
        associatedFoods: this.associatedFoodPrompts![row.A_CODE] ?? [],
        parentCategories: categories ?? [],
        portionSize: portionSizeMethods,
        brandNames: [],
      });
    }

    return foods;
  }

  private buildCategories(): PkgCategory[] {
    const categories = [
      {
        code: 'FRPEPO',
        attributes: {},
        englishName: 'Baby food and savoury snacks',
        name: 'Petits pots salés & plats infantiles',
        parentCategories: ['19TODSFD'],
        portionSize: [],
        version: '0fd3f027-6f2a-47f3-9838-7bb0037a4fd4',
        hidden: false,
      },
      {
        code: 'FRDEIN',
        attributes: {},
        englishName: 'Baby desserts',
        name: 'Desserts infantiles',
        parentCategories: ['19TODSFD'],
        portionSize: [],
        version: '64f6bd7b-0f0b-41b6-ab20-afac96078a28',
        hidden: false,
      },
      {
        code: 'FRCEBI',
        attributes: {},
        englishName: 'Baby cereals and biscuits',
        name: 'Céréales & biscuits infantiles',
        parentCategories: ['19TODSFD'],
        portionSize: [],
        version: '7e12b7a1-e7e3-4c57-9f2a-ddf5c1c05f3b',
        hidden: false,
      },
      {
        code: 'FRLABO',
        attributes: {},
        englishName: 'Baby milk and drinks',
        name: 'Laits & boissons infantiles',
        parentCategories: ['19TODSFD'],
        portionSize: [],
        version: '7e12b7a1-e7e3-4c57-9f2a-ddf5c1c05f3b',
        hidden: false,
      },
      {
        code: 'FRLAMA',
        attributes: {},
        englishName: 'Breast milk',
        name: 'Lait maternel',
        parentCategories: ['FRLABO'],
        portionSize: [],
        version: 'e309274c-12be-49d0-88e2-26744ce7f3c1',
        hidden: false,
      },
      {
        code: 'FRCIT',
        attributes: {},
        englishName: 'Lemon juice for cooking',
        name: 'Jus de citron',
        parentCategories: ['COND'],
        portionSize: [],
        version: '0555155a-8073-4a00-b30c-26691082b7d1',
        hidden: false,
      },
      {
        code: 'FRHPME',
        attributes: {},
        englishName: 'Chili oil',
        name: 'Huile pimentée',
        parentCategories: ['COND'],
        portionSize: [],
        version: 'eeba6915-790e-42a6-be9d-2fd78ee80567',
        hidden: false,
      },
      {
        code: 'FRFSEL',
        attributes: {},
        englishName: 'Salt (for salt facet)',
        name: 'Sel (pour la facette)',
        parentCategories: [],
        portionSize: [],
        version: '3fa6db23-873a-4726-9a5e-501950692d49',
        hidden: true,
      },
    ];

    if (this.categoryNames !== undefined) {
      for (const [code, name] of Object.entries(this.categoryNames)) {
        if (categories.some(cat => cat.code === code)) {
          logger.warn(`Category code ${code} is a built-in Albane category, skipping translation from CATEGORIES_I24_LIST file`);
          continue;
        }

        categories.push({
          code,
          name,
          englishName: name,
          hidden: false,
          attributes: {},
          parentCategories: [],
          portionSize: [],
          version: randomUUID(),
        });
      }
    }

    return categories;
  }

  private async readAssociatedFoodPrompts(): Promise<void> {
    this.associatedFoodPrompts = {};

    const afpRows = this.readXLSX<AlbaneAfpRow>('ASSOCIATED_FOOD_PROMPTS.xlsx', { header: ['code', 'label', 'categoryCode1', 'promptText1', 'categoryCode2', 'promptText2', 'categoryCode3', 'promptText3', 'genericName'], range: 1 });

    for (let i = 0; i < afpRows.length; i++) {
      const row = afpRows[i];

      const prompts: PkgAssociatedFood[] = [];

      // Just sense checking
      if (!row.code) {
        logger.warn(`Food code column empty in row ${i + 1} of the associated food prompts file`);
        continue;
      }

      if (!row.genericName) {
        logger.warn(`Generic name column empty in row ${i + 1} (Albane food code ${row.code}) of the associated food prompts file`);
        continue;
      }

      if (row.categoryCode1) {
        if (!row.promptText1) {
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

      if (row.categoryCode2) {
        if (!row.promptText2) {
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

      if (row.categoryCode3) {
        if (!row.promptText3) {
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
      = this.readXLSX<AlbaneFacetsRow>('FACETS.xlsx');

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
        .pipe(stripBomStream())
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

    const data = this.readXLSX<AlbanePortionSizeImage>('List.Photos_HHM_Shapes.xlsx', { header: [
      'owner',
      'copyright',
      'copyrightV0',
      'updateYear',
      'order',
      'pictureId',
      'name',
      'portionId',
      'fileName',
      'rawCooked',
      'edible',
      'weight',
      'edibleWeight',
      'paperInstructions',
      'intake24Instructions',
    ], range: 1 });

    for (const row of data) {
      if (row.fileName && row.pictureId)
        this.portionSizeImages!.push(row);
    }

    const standardUnitRows = this.readXLSX<Record<number, string>>('List.Photos_HHM_Shapes.xlsx', { header: 1, range: 1 }, 'Photo standard units');

    this.standardUnitLabels = {};

    for (const row of standardUnitRows) {
      let id = row[5];
      const label = row[15];

      if (!id || !label)
        continue;

      if (/^\d+$/.test(id))
        id = `ALBANE_${id}`;

      this.standardUnitLabels[id] = { fr: label };
    }
  }

  private async readStandardUnits(): Promise<Dictionary<PkgStandardPortionPsm>> {
    function getStandardUnits(rows: AlbaneStandardUnitRow[]): PkgStandardUnit[] {
      return sortBy(rows, row => Number.parseInt(row.US_NUM)).map((row) => {
        const description = row.US_LIBELLE.replace(/^1\s+/, '');

        if (row.US_UNITE !== 'G' && row.US_UNITE !== 'V' && row.US_UNITE !== 'ml') {
          // Doesn't really do anything, just checking to make sure input data is in the expected format
          logger.warn(
            `Unexpected weight unit for a standard unit option: "${row.US_UNITE}", for food id ${row.A_CODE}, standard unit number ${row.US_NUM} `,
          );
        }

        const weight = Number.parseFloat(row.US_POIDS_FINAL);

        if (Number.isNaN(weight))
          throw new Error(`Failed to parse weight value: "${row.US_POIDS_FINAL}" for food id ${row.A_CODE}, standard unit number ${row.US_NUM} `);

        if (ALBANE_SALT_CODES.includes(row.A_CODE) && row.US_LIBELLE.trim().toLowerCase() === 'quantité inconnue') {
          return {
            name: 'unknown',
            weight,
            omitFoodDescription: false,
          };
        }
        else {
          return {
            name: `ALBANE_${row.A_CODE}_${row.US_NUM}`,
            weight,
            omitFoodDescription: true,
            inlineEstimateIn: description,
            inlineHowMany: `Combien de ${description}`,
          };
        }
      });
    }

    const standardUnitRows = this.readXLSX<AlbaneStandardUnitRow>('US.xlsx').filter(row => !!row.A_CODE);

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
    this.reasonableAmount = {};
    const quantificationRows = this.readXLSX<AlbaneQuantificationRow>('FDQUANT.xlsx').filter(row => !!row.A_CODE);

    const standardUnits = await this.readStandardUnits();

    for (const row of quantificationRows) {
      const foodCode = row.A_CODE;
      const foodPortionSizeMethods = new Array<PkgPortionSizeMethod>();

      const asServedSetIds = new Set<string>();
      const guideImageIds = new Set<string>();
      const drinkwareSetIds = new Set<string>();

      const asServedConversionFactors: Record<string, number> = {};
      const guideImageConversionFactors: Record<string, number> = {};
      const drinkwareConversionFactors: Record<string, number> = {};

      if (row.LISTE_photos) {
        const ids = row.LISTE_photos.split(',').map(s => s.trim());
        const conversionFactors = row.VALEURS_conversion_photo.split(',').map(s => Number.parseFloat(s.trim()));

        if (ids.length !== conversionFactors.length) {
          logger.error(`LISTE_photos has ${ids.length} values but VALUERS_conversion_photos has ${conversionFactors.length} values for food ${row.A_CODE}, they must have the same length`);
          continue;
        }

        for (let i = 0; i < ids.length; ++i) {
          const id = ids[i];
          const conversionFactor = conversionFactors[i];
          // 038 looks like it's supposed to be a guide image and has no corresponding data in
          // List.Photos_HHM_Shapes_INCA3.xlsx
          // Replaced with new guide image FR_Bread_Slices
          if (id === '038') {
            guideImageIds.add('FR_Bread_Slices');
            guideImageConversionFactors.FR_Bread_Slices = conversionFactor;
          }
          // numerical ids refer to Albane photos converted to as-served in Intake24
          // with the ALBANE_ prefix
          else if (/^\d+$/.test(id)) {
            const i24id = `ALBANE_${id}`;
            asServedSetIds.add(i24id);
            asServedConversionFactors[i24id] = conversionFactor;
          }
          else if (GUIDE_IMAGE_IDS.has(id)) {
            guideImageIds.add(id);
            guideImageConversionFactors[id] = conversionFactor;
          }
          else if (DRINKWARE_IDS.has(id)) {
            drinkwareSetIds.add(id);
            drinkwareConversionFactors[id] = conversionFactor;
          }
          else {
            asServedSetIds.add(id);
            asServedConversionFactors[id] = conversionFactor;
          }
        }
      }

      if (row.METHODE_poids === '1') {
        foodPortionSizeMethods.push({
          method: 'direct-weight',
          description: 'weight',
          useForRecipes: true,
          conversionFactor: 1.0,
        });
      }

      if (row.LISTE_hhm) {
        const hhmIds = row.LISTE_hhm.split(',').map(s => s.trim());
        const conversionFactor = Number.parseFloat(row.VALEUR_densite_hhm);

        for (const id of hhmIds) {
          // If the ID looks like one of Albane HHM ids (e.g., H001, H030) try and map it into Intake24 drinkware set id
          // via the household measures map. This is required because records in the FDQUANT file refer to individual
          // images that are combined into sets in Intake24, and we don't want duplicates.
          if (/^H\d+$/.test(id)) {
            const drinkwareId = this.householdMeasuresMap[id];
            if (drinkwareId === undefined) {
              throw new Error(`Unexpected household measure ID: ${id}, check FDQUANT for food code ${foodCode}`);
            }
            else {
              drinkwareSetIds.add(drinkwareId);
              drinkwareConversionFactors[drinkwareId] = conversionFactor;
            }
          }
          else {
            // otherwise assume it's either an Intake24 guide image id or an Intake24 as served set
            if (GUIDE_IMAGE_IDS.has(id)) {
              guideImageIds.add(id);
              guideImageConversionFactors[id] = conversionFactor;
            }
            else if (DRINKWARE_IDS.has(id)) {
              drinkwareSetIds.add(id);
              drinkwareConversionFactors[id] = conversionFactor;
            }
            else {
              asServedSetIds.add(id);
              asServedConversionFactors[id] = conversionFactor;
            }
          }
        }
      }

      for (const asServedId of [...asServedSetIds].sort()) {
        foodPortionSizeMethods.push({
          method: 'as-served',
          description: 'use_an_image',
          useForRecipes: true,
          conversionFactor: asServedConversionFactors[asServedId],
          servingImageSet: asServedId,
          multiple: true,
        });
      }

      for (const guideImageId of [...guideImageIds].sort()) {
        foodPortionSizeMethods.push({
          method: 'guide-image',
          guideImageId,
          description: 'use_an_image',
          useForRecipes: true,
          conversionFactor: guideImageConversionFactors[guideImageId],
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
          conversionFactor: drinkwareConversionFactors[drinkwareId],
          multiple: true,
        });
      }

      if (standardUnits[foodCode] !== undefined) {
        foodPortionSizeMethods.push(standardUnits[foodCode]);
      }

      if (row.VALEUR_ne_sait_pas !== undefined) {
        foodPortionSizeMethods.push({
          method: 'unknown',
          conversionFactor: 1.0,
          description: 'unknown',
          useForRecipes: true,
        });
      }

      this.portionSizeMethods[foodCode] = foodPortionSizeMethods;

      if (row.VALEUR_maximale !== undefined) {
        const v = Number.parseFloat(row.VALEUR_maximale);
        if (!Number.isNaN(v))
          this.reasonableAmount[foodCode] = v;
      }
    }
  }

  private buildAsServed(): PkgAsServedSet[] {
    const imagesById = groupBy(this.portionSizeImages!.filter(row => !IGNORE_AS_SERVED.has(row.pictureId)), record => record.pictureId);
    return Object.entries(imagesById).map(([imageId, images]) => {
      return {
        id: imageId.startsWith('ALBANE_') ? imageId : `ALBANE_${imageId}`,
        description: images[0].name,
        label: images[0].intake24Instructions ? { fr: images[0].intake24Instructions } : undefined,
        selectionImagePath: '',
        images: images.map(image => ({
          imagePath: `Albane/${image.fileName}`,
          weight: Number.parseFloat(image.weight),
          imageKeywords: [],
        })),
      };
    });
  }

  private buildPortionSizeImageLabels(): PkgPortionSizeImageLabels {
    const asServedImagesById = groupBy(this.portionSizeImages!, record => record.pictureId);

    const asServed: Record<string, Record<string, string>> = {};
    const guide: Record<string, Record<string, string>> = {};
    const drinkware: Record<string, Record<string, string>> = {};

    for (const [id, images] of Object.entries(asServedImagesById)) {
      if (!images[0].intake24Instructions)
        continue;

      const prefixedId = /^\d+$/.test(id) ? `ALBANE_${id}` : id;

      asServed[prefixedId] = {
        fr: images[0].intake24Instructions,
      };
    }

    for (const [id, label] of Object.entries(this.standardUnitLabels!)) {
      if (GUIDE_IMAGE_IDS.has(id))
        guide[id] = label;
      else if (DRINKWARE_IDS.has(id))
        drinkware[id] = label;
      else
        asServed[id] = label;
    }

    return {
      asServed,
      guide,
      drinkware,
    };
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
    await this.readCategoryList();
    await this.readAssociatedFoodPrompts();
    await this.readFacetFlags();
    await this.readPortionSizeImages();
    await this.readPortionSizeMethods();

    const foods = this.buildFoods();
    const categories = this.buildCategories();

    const categoriesRecord = {
      [locale.id]: categories,
    };

    const foodsRecord = {
      [locale.id]: foods,
    };

    const enabledLocalFoods = {
      [locale.id]: foods.map(f => f.code),
    };

    const asServedSets = this.buildAsServed();

    const portionSizeImageLabels = this.buildPortionSizeImageLabels();

    const writer = new PackageWriter(this.logger, this.outputDirPath);

    await writer.writeLocales([locale]);
    await writer.writeFoods(foodsRecord);
    await writer.writeCategories(categoriesRecord);
    await writer.writeEnabledLocalFoods(enabledLocalFoods);
    await writer.writeNutrientTables([dummyNutrientTable]);
    await writer.writeAsServedSets(asServedSets);
    await writer.writePortionSizeImageLabels(portionSizeImageLabels);
  }
}
