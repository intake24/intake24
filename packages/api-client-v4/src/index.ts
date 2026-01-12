import type { Logger } from 'winston';

import type { CredentialsV4 } from './credentials';
import type { DrinkwareScaleUpdate } from './drinkware';
import type { ApiClientOptionsV4 } from './options';
import { AsServedApiV4 } from './as-served';
import { BaseClientV4 } from './base-client-v4';
import { CategoriesApiV4 } from './categories';
import { DrinkwareApiV4 } from './drinkware';
import { FoodDatabasesApiV4 } from './fdbs';
import { FoodsApiV4 } from './foods';
import { GuideImageApiV4 } from './guide-images';
import { ImageMapApiV4 } from './image-maps';
import { LocalesApiV4 } from './locales';
import { NutrientTablesApiV4 } from './nutrient-tables';
import { getApiClientV4EnvOptions } from './options';

export type { ApiClientOptionsV4, CredentialsV4, DrinkwareScaleUpdate };

export { getApiClientV4EnvOptions };

export class ApiClientV4 {
  public readonly baseClient: BaseClientV4;
  public readonly locales: LocalesApiV4;
  public readonly foods: FoodsApiV4;
  public readonly fdbs: FoodDatabasesApiV4;
  public readonly categories: CategoriesApiV4;
  public readonly nutrientTables: NutrientTablesApiV4;
  public readonly portionSize: {
    readonly asServed: AsServedApiV4;
    readonly imageMaps: ImageMapApiV4;
    readonly guideImages: GuideImageApiV4;
    readonly drinkware: DrinkwareApiV4;
  };

  public constructor(logger: Logger, options: ApiClientOptionsV4) {
    this.baseClient = new BaseClientV4(logger, options);
    this.locales = new LocalesApiV4(this.baseClient);
    this.foods = new FoodsApiV4(this.baseClient);
    this.fdbs = new FoodDatabasesApiV4(this.baseClient);
    this.categories = new CategoriesApiV4(this.baseClient);
    this.nutrientTables = new NutrientTablesApiV4(this.baseClient);
    this.portionSize = {
      imageMaps: new ImageMapApiV4(this.baseClient),
      asServed: new AsServedApiV4(this.baseClient),
      guideImages: new GuideImageApiV4(this.baseClient),
      drinkware: new DrinkwareApiV4(this.baseClient),
    };
  }
}
