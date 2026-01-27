import type { BaseClientV4 } from './base-client-v4';
import type { ImageMapEntryObject } from '@intake24/common/types/http/admin';
import type { ImageMap } from '@intake24/db';

import { FormData } from 'formdata-node';

import { fileFromPathWithType } from './form-data-helpers';

export class ImageMapApiV4 {
  private static readonly apiPath = '/api/admin/images/image-maps';

  private readonly baseClient: BaseClientV4;

  constructor(baseClient: BaseClientV4) {
    this.baseClient = baseClient;
  }

  public async create(
    id: string,
    description: string,
    baseImageFilePath: string,
    objects: ImageMapEntryObject[],
  ): Promise<ImageMap> {
    const formData = new FormData();

    const file = await fileFromPathWithType(baseImageFilePath);

    formData.set('id', id);
    formData.set('description', description);
    formData.set('objects', JSON.stringify(objects));
    formData.set('baseImage', file);

    return this.baseClient.post<ImageMap>(ImageMapApiV4.apiPath, formData);
  }

  public async update(
    id: string,
    description: string,
    objects: ImageMapEntryObject[],
  ): Promise<ImageMap> {
    return this.baseClient.put<ImageMap>(`${ImageMapApiV4.apiPath}/${id}`, {
      id,
      description,
      objects,
    });
  }

  public async updateImage(id: string, baseImageFilePath: string): Promise<ImageMap> {
    const formData = new FormData();
    const file = await fileFromPathWithType(baseImageFilePath);
    formData.set('baseImage', file);

    return this.baseClient.put<ImageMap>(`${ImageMapApiV4.apiPath}/${id}/base-image`, formData);
  }

  public async get(id: string): Promise<ImageMap | null> {
    return this.baseClient.getOptional<ImageMap>(`${ImageMapApiV4.apiPath}/${id}`);
  }
}
