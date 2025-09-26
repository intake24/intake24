import type { BaseClientV4 } from './base-client-v4';
import type { FoodEntry } from '@intake24/common/types/http/admin';

export class FoodDatabasesApiV4 {
  private static readonly apiPath = '/api/admin/fdbs';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  public async getFood(
    localeId: string,
    foodId: string,
  ): Promise<FoodEntry | null> {
    return this.baseClient.getOptional<FoodEntry>(
      `${FoodDatabasesApiV4.apiPath}/${localeId}/foods/${foodId}`,
    );
  }

  public async getFoodByCode(
    localeId: string,
    foodId: string,
  ): Promise<FoodEntry | null> {
    return this.baseClient.getOptional<FoodEntry>(
      `${FoodDatabasesApiV4.apiPath}/${localeId}/foods/by-code/${foodId}`,
    );
  }
}
