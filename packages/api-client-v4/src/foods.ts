import type { BaseClientV4 } from './base-client-v4';
import type { CreateResult } from './create-response';
import type {
  CreateFoodRequest,
  CreateFoodRequestOptions,
  FoodEntry,
} from '@intake24/common/types/http/admin';
import { parseCreateResponse } from './create-response';
import { fileFromPathWithType } from './form-data-helpers';

export class FoodsApiV4 {
  private static readonly apiPath = '/api/admin/foods/local';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  public async createFood(
    localeId: string,
    createRequest: CreateFoodRequest,
    options: CreateFoodRequestOptions,
  ): Promise<CreateResult<FoodEntry>> {
    const response = await this.baseClient.postResponse<FoodEntry>(
      `${FoodsApiV4.apiPath}/${localeId}`,
      createRequest,
      options,
    );

    return parseCreateResponse(response, this.baseClient.logger);
  }

  /* public async updateFood(
    code: string,
    version: string,
    updateRequest: UpdateGlobalFoodRequest,
  ): Promise<FoodEntry> {
    return await this.baseClient.put(
      `${FoodsApiV4.localApiPath}/${code}?version=${version}`,
      updateRequest,
    );
  } */

  public async getEnabledFoods(localeId: string): Promise<string[] | null> {
    return this.baseClient.getOptional<string[]>(`${FoodsApiV4.apiPath}/${localeId}/enabled-foods`);
  }

  public async updateThumbnail(localeId: string, foodCode: string, thumbnailImagePath: string) {
    const formData = new FormData();

    const file = await fileFromPathWithType(thumbnailImagePath);

    formData.set('image', file);

    await this.baseClient.put(
      `/api/admin/fdbs/${localeId}/${foodCode}/thumbnail`,
      formData,
    );
  }
}
