import type { BaseClientV4 } from './base-client-v4';
import type { NutrientTableRecordRequest, NutrientTableRequest } from '@intake24/common/types/http/admin';

export class NutrientTablesApiV4 {
  private static readonly apiPath = '/api/admin/nutrient-tables';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  async get(nutrientTableId: string) {
    return await this.baseClient.getOptional(`${NutrientTablesApiV4.apiPath}/${nutrientTableId}`);
  }

  async create(nutrientTableData: NutrientTableRequest) {
    await this.baseClient.post(NutrientTablesApiV4.apiPath, nutrientTableData);
  }

  async update(nutrientTableId: string, nutrientTableData: NutrientTableRequest) {
    await this.baseClient.put(
      `${NutrientTablesApiV4.apiPath}/${nutrientTableId}`,
      nutrientTableData,
    );
  }

  async updateRecords(nutrientTableId: string, records: NutrientTableRecordRequest[]) {
    await this.baseClient.put(`${NutrientTablesApiV4.apiPath}/${nutrientTableId}/records`, {
      records,
    });
  }
}
