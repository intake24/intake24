import type {
  GuideImageResponse,
  ImageMapObjectResponse,
  ImageMapResponse,
} from '@intake24/common/types/http';
import type { GuideImage, ImageMap, ImageMapObject } from '@intake24/db';

import { InternalServerError } from '@intake24/api/http/errors';

export function imageMapsResponse(baseUrl: string) {
  /**
   * Response for image map objects
   *
   * @param {ImageMapObject} item
   * @returns {ImageMapObjectResponse}
   */
  const objectResponse = (item: ImageMapObject): ImageMapObjectResponse => {
    const { id, description, label, navigationIndex, outlineCoordinates } = item;

    return {
      id,
      description,
      label,
      navigationIndex,
      outlineCoordinates,
    };
  };

  /**
   * Response for image map
   *
   * @param {ImageMap} item
   * @returns {ImageMapResponse}
   */
  const imageResponse = (item: ImageMap): ImageMapResponse => {
    const { id, description, label, baseImage, objects } = item;

    if (!baseImage || !objects)
      throw new InternalServerError('ImageMapResponse: not loaded relationships.');

    return {
      id,
      description,
      label,
      baseImageUrl: `${baseUrl}/${baseImage.path}`,
      objects: objects.map(objectResponse),
    };
  };

  /**
   * Response for guide image
   *
   * @param {GuideImage} item
   * @returns {GuideImageResponse}
   */
  const guideResponse = (item: GuideImage): GuideImageResponse => {
    const { id, description, label, imageMap, objects } = item;

    if (!imageMap || !objects)
      throw new InternalServerError('GuideImageResponse: not loaded relationships.');

    return {
      id,
      description,
      label,
      imageMap: imageResponse(imageMap),
      objects: objects.reduce<GuideImageResponse['objects']>(
        (acc, { imageMapObjectId, label, weight }) => {
          acc[imageMapObjectId] = { label, weight };
          return acc;
        },
        {},
      ),
    };
  };

  return { guideResponse, imageResponse, objectResponse };
}

export default imageMapsResponse;

export type ImageMapsResponse = ReturnType<typeof imageMapsResponse>;
