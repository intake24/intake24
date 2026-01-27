import type { BaseClientV4 } from './base-client-v4';
import type { CreateResult } from './create-response';
import type {
  LocaleEntry,
  LocaleRequest,
  LocalesResponse,
  UpdateLocaleRequest,
} from '@intake24/common/types/http/admin';
import type { PaginateQuery } from '@intake24/db';

import { parseCreateResponse } from './create-response';

export class LocalesApiV4 {
  private static readonly apiPath = '/api/admin/locales';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  public async list(pagination: PaginateQuery): Promise<LocalesResponse> {
    return this.baseClient.get<LocalesResponse>(`${LocalesApiV4.apiPath}`, undefined, pagination);
  }

  public async get(localeId: string): Promise<LocaleEntry | null> {
    return this.baseClient.getOptional<LocaleEntry>(`${LocalesApiV4.apiPath}/${localeId}`);
  }

  public async findByCode(localeCode: string): Promise<LocaleEntry | null> {
    return this.baseClient.getOptional<LocaleEntry>(
      `${LocalesApiV4.apiPath}/by-code/${localeCode}`,
    );
  }

  public async create(
    localeId: string,
    locale: LocaleRequest,
  ): Promise<CreateResult<LocaleEntry>> {
    const response = await this.baseClient.postResponse<LocaleEntry>(
      `${LocalesApiV4.apiPath}`,
      locale,
      {},
    );

    return parseCreateResponse(response, this.baseClient.logger);
  }

  public async update(localeId: string, locale: UpdateLocaleRequest): Promise<LocaleEntry> {
    return this.baseClient.put<LocaleEntry>(`${LocalesApiV4.apiPath}/${localeId}`, locale);
  }
}
