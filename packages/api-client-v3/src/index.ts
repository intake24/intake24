import type { Logger } from 'winston';

import type { CredentialsV3 } from './types';

import { BaseClientV3 } from './base-client-v3';
import { CategoriesApiV3 } from './categories';
import { FoodsApiV3 } from './foods';
import { ImageApiV3 } from './images';
import { LocalesApiV3 } from './locales';
import { PortionSizeApiV3 } from './portion-size';

export * from './types';

export class ApiClientV3 {
  public readonly baseClient: BaseClientV3;
  public readonly locales: LocalesApiV3;
  public readonly images: ImageApiV3;
  public readonly portionSize: PortionSizeApiV3;
  public readonly foods: FoodsApiV3;
  public readonly categories: CategoriesApiV3;

  public constructor(
    apiBaseUrl: string,
    logger: Logger,
    maxConcurrentRequests: number,
    refreshToken?: string,
    credentials?: CredentialsV3,
  ) {
    this.baseClient = new BaseClientV3(
      apiBaseUrl,
      logger,
      maxConcurrentRequests,
      refreshToken,
      credentials,
    );
    this.locales = new LocalesApiV3(this.baseClient);
    this.images = new ImageApiV3(this.baseClient);
    this.portionSize = new PortionSizeApiV3(this.baseClient);
    this.foods = new FoodsApiV3(this.baseClient);
    this.categories = new CategoriesApiV3(this.baseClient);
  }
}
