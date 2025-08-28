import type { BaseClientV4 } from './base-client-v4';
import type { CreateResult } from './create-response';
import type { CategoryContents } from '@intake24/common/types/http';
import type {
  CreateCategoryRequest,
  MainCategoriesResponse,
  SimpleCategoryEntry,
  UpdateCategoryRequest,
} from '@intake24/common/types/http/admin';
import type { PaginateQuery } from '@intake24/db';
import { parseCreateResponse } from './create-response';

export class CategoriesApiV4 {
  private static readonly adminApiPath = '/api/admin/categories';
  private static readonly apiPath = '/api/categories';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  public async list(pagination: PaginateQuery): Promise<MainCategoriesResponse> {
    return this.baseClient.get<MainCategoriesResponse>(
      `${CategoriesApiV4.adminApiPath}`,
      undefined,
      pagination,
    );
  }

  public async getRootCategories(localeId: string): Promise<CategoryContents> {
    return this.baseClient.get<CategoryContents>(`${CategoriesApiV4.apiPath}/${localeId}`);
  }

  public async getCategoryContents(
    categoryCode: string,
    localeId: string,
  ): Promise<CategoryContents> {
    return this.baseClient.get<CategoryContents>(
      `${CategoriesApiV4.apiPath}/${localeId}/${categoryCode}`,
    );
  }

  public async createCategory(
    localeId: string,
    request: CreateCategoryRequest,
  ): Promise<CreateResult<any, SimpleCategoryEntry>> {
    const response = await this.baseClient.postResponse(
      `${CategoriesApiV4.adminApiPath}/local/${localeId}`,
      request,
    );

    return parseCreateResponse(response, this.baseClient.logger, request);
  }

  public async updateCategory(
    localeId: string,
    categoryCode: string,
    version: string,
    request: UpdateCategoryRequest,
  ): Promise<void> {
    await this.baseClient.put(
      `${CategoriesApiV4.adminApiPath}/local/${localeId}/${categoryCode}`,
      request,
      {
        version,
      },
    );
  }
}
