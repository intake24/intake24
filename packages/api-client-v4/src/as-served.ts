import type { BaseClientV4 } from './base-client-v4';
import type { CreateResult } from './create-response';
import type { AsServedImageEntry, AsServedSetEntry } from '@intake24/common/types/http/admin';

import { FormData } from 'formdata-node';

import { parseCreateResponse } from './create-response';
import { fileFromPathWithType } from './form-data-helpers';

export class AsServedApiV4 {
  private static readonly apiPath = '/api/admin/images/as-served-sets';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  public async create(
    id: string,
    description: string,
    selectionImageFilePath: string,
    label?: Record<string, string | null>,
  ): Promise<CreateResult<AsServedSetEntry>> {
    const formData = new FormData();

    const file = await fileFromPathWithType(selectionImageFilePath);

    formData.set('id', id);
    formData.set('description', description);

    if (label !== undefined)
      formData.set('label', JSON.stringify(label));

    formData.set('selectionImage', file);

    const response = await this.baseClient.postResponse<AsServedSetEntry>(
      AsServedApiV4.apiPath,
      formData,
    );

    return parseCreateResponse(response, this.baseClient.logger);
  }

  public async update(
    id: string,
    description: string,
    label?: Record<string, string | null>,
  ): Promise<AsServedSetEntry> {
    return await this.baseClient.put<AsServedSetEntry>(
      `${AsServedApiV4.apiPath}/${id}`,
      {
        description,
        label,
        images: [],
      },
    );
  }

  public async get(id: string): Promise<AsServedSetEntry | null> {
    return this.baseClient.getOptional<AsServedSetEntry>(`${AsServedApiV4.apiPath}/${id}`);
  }

  public async deleteImage(setId: string, imageId: string) {
    return this.baseClient.delete(`${AsServedApiV4.apiPath}/${setId}/images/${imageId}`);
  }

  public async deleteAllImages(setId: string): Promise<void> {
    return this.baseClient.delete(`${AsServedApiV4.apiPath}/${setId}/images`);
  }

  public async uploadImage(setId: string, weight: number, imageFilePath: string) {
    const formData = new FormData();

    const file = await fileFromPathWithType(imageFilePath);

    formData.set('weight', weight);
    formData.set('image', file);

    return await this.baseClient.post<AsServedImageEntry>(
      `${AsServedApiV4.apiPath}/${setId}/images`,
      formData,
    );
  }
}
