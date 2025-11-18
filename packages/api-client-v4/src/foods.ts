import type { BaseClientV4 } from './base-client-v4';

import type { CreateResult } from './create-response';
import { FormData } from 'formdata-node';
import type {
  CreateGlobalFoodRequest,
  CreateLocalFoodRequest,
  CreateLocalFoodRequestOptions,
  FoodEntry,
  UpdateGlobalFoodRequest,
} from '@intake24/common/types/http/admin';
import { parseCreateResponse } from './create-response';

import { fileFromPathWithType } from './form-data-helpers';

export class FoodsApiV4 {
  private static readonly globalApiPath = '/api/admin/foods/global';
  private static readonly localApiPath = '/api/admin/foods/local';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  public async createGlobalFood(
    createRequest: CreateGlobalFoodRequest,
  ): Promise<CreateResult<FoodEntry>> {
    const response = await this.baseClient.postResponse<FoodEntry>(
      `${FoodsApiV4.globalApiPath}`,
      createRequest,
      {},
    );

    return parseCreateResponse(response, this.baseClient.logger);
  }

  public async findGlobalFood(code: string): Promise<FoodEntry | null> {
    return await this.baseClient.getOptional<FoodEntry>(`${FoodsApiV4.globalApiPath}/${code}`);
  }

  public async updateGlobalFood(
    code: string,
    version: string,
    updateRequest: UpdateGlobalFoodRequest,
  ): Promise<FoodEntry> {
    return await this.baseClient.put(
      `${FoodsApiV4.globalApiPath}/${code}?version=${version}`,
      updateRequest,
    );
  }

  public async createLocalFood(
    localeId: string,
    createRequest: CreateLocalFoodRequest,
    options: CreateLocalFoodRequestOptions,
  ): Promise<CreateResult<FoodEntry>> {
    const response = await this.baseClient.postResponse<FoodEntry>(
      `${FoodsApiV4.localApiPath}/${localeId}`,
      createRequest,
      options,
    );

    return parseCreateResponse(response, this.baseClient.logger);
  }

  public async getEnabledFoods(localeId: string): Promise<{ enabledFoods: string[] } | null> {
    return this.baseClient.getOptional<{ enabledFoods: string[] }>(`${FoodsApiV4.localApiPath}/${localeId}/enabled-foods`);
  }

  public async updateEnabledFoods(localeId: string, enabledFoods: string[]) {
    await this.baseClient.post<FoodEntry>(`${FoodsApiV4.localApiPath}/${localeId}/enabled-foods`, {
      enabledFoods,
    });
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

  public async deleteLocalFood(localeId: string, foodCode: string): Promise<void> {
    await this.baseClient.delete(`${FoodsApiV4.localApiPath}/${localeId}/${foodCode}`);
  }
}
