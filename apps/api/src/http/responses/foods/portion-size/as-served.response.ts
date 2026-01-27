import type { AsServedImageResponse, AsServedSetResponse } from '@intake24/common/types/http';
import type { AsServedImage, AsServedSet } from '@intake24/db';

import { InternalServerError } from '@intake24/api/http/errors';

export function asServedResponse(baseUrl: string) {
  const imageResponse = (item: AsServedImage): AsServedImageResponse => {
    const { image, label, thumbnailImage, weight } = item;

    if (!image || !thumbnailImage)
      throw new InternalServerError('AsServedImageResponse: not loaded relationships.');

    return {
      label,
      mainImageUrl: `${baseUrl}/${image.path}`,
      thumbnailUrl: `${baseUrl}/${thumbnailImage.path}`,
      weight,
    };
  };

  const setResponse = (item: AsServedSet): AsServedSetResponse => {
    const { id, description, label, selectionImage, asServedImages } = item;

    if (!selectionImage || !asServedImages)
      throw new InternalServerError('AsServedSetResponse: not loaded relationships.');

    return {
      id,
      description,
      label,
      selectionImageUrl: `${baseUrl}/${selectionImage.path}`,
      images: asServedImages.map(imageResponse),
    };
  };

  return { imageResponse, setResponse };
}

export default asServedResponse;

export type AsServedResponse = ReturnType<typeof asServedResponse>;
