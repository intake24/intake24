import type { Includeable } from '@intake24/db';

import { NotFoundError } from '@intake24/api/http/errors';
import {
  AsServedImage,
  AsServedSet,
  DrinkwareSet,
  GuideImage,
  ImageMap,
  StandardUnit,
} from '@intake24/db';

function portionSizeService() {
  /**
   * Get multiple records of as-served-images data
   *
   * @param {string} asServedSetId
   * @param {(string | string[])} id
   * @returns {Promise<AsServedImage[]>}
   */
  const getAsServedImages = async (
    asServedSetId: string,
    id: string | string[],
  ): Promise<AsServedImage[]> =>
    AsServedImage.findAll({
      where: { asServedSetId, id },
      order: [['weight', 'ASC']],
      include: [
        { association: 'image', required: true },
        { association: 'thumbnailImage', required: true },
      ],
    });

  /**
   * Get single record of as-served-images data
   *
   * @param {string} asServedSetId
   * @param {(string)} id
   * @returns {Promise<AsServedImage>}
   */
  const getAsServedImage = async (asServedSetId: string, id: string): Promise<AsServedImage> => {
    const [asServedImage] = await getAsServedImages(asServedSetId, id);

    if (!asServedImage)
      throw new NotFoundError('As served image not found.');

    return asServedImage;
  };

  /**
   * Get multiple records of as-served-set data
   *
   * @param {(string | string[])} id
   * @returns {Promise<AsServedSet[]>}
   */
  const getAsServedSets = async (id: string | string[]): Promise<AsServedSet[]> =>
    AsServedSet.findAll({
      where: { id },
      include: [
        { association: 'selectionImage', required: true },
        {
          association: 'asServedImages',
          include: [
            { association: 'image', required: true },
            { association: 'thumbnailImage', required: true },
          ],
        },
      ],
      order: [['asServedImages', 'weight', 'ASC']],
    });

  /**
   * Get single record of as-served-set data
   *
   * @param {string} id
   * @returns {Promise<AsServedSet>}
   */
  const getAsServedSet = async (id: string): Promise<AsServedSet> => {
    const [asServedSet] = await getAsServedSets(id);

    if (!asServedSet)
      throw new NotFoundError('As served set not found.');

    return asServedSet;
  };

  // Common scope to pull image map for guide image & image map queries
  const imageMapScope: Includeable[] = [
    { association: 'baseImage', required: true },
    { association: 'objects' },
  ];

  /**
   * Get multiple records of guide image data
   *
   * @param {(string | string[])} id
   * @returns {Promise<GuideImage[]>}
   */
  const getGuideImages = async (id: string | string[]): Promise<GuideImage[]> =>
    GuideImage.findAll({
      where: { id },
      include: [
        { association: 'imageMap', required: true, include: imageMapScope },
        { association: 'objects' },
      ],
      order: [['imageMap', 'objects', 'navigationIndex', 'ASC']],
    });

  /**
   * Get single record of guide image data
   *
   * @param {string} id
   * @returns {Promise<ImageMap>}
   */
  const getGuideImage = async (id: string): Promise<GuideImage> => {
    const [guideImage] = await getGuideImages(id);

    if (!guideImage)
      throw new NotFoundError('Guide image not found.');

    return guideImage;
  };

  /**
   * Get multiple records of image map data
   *
   * @param {(string | string[])} id
   * @returns {Promise<ImageMap[]>}
   */
  const getImageMaps = async (id: string | string[]): Promise<ImageMap[]> =>
    ImageMap.findAll({
      where: { id },
      include: imageMapScope,
      order: [['objects', 'navigationIndex', 'ASC']],
    });

  /**
   * Get single record of image map data
   *
   * @param {string} id
   * @returns {Promise<ImageMap>}
   */
  const getImageMap = async (id: string): Promise<ImageMap> => {
    const [imageMap] = await getImageMaps(id);

    if (!imageMap)
      throw new NotFoundError('Image map not found.');

    return imageMap;
  };

  /**
   * Get multiple records of drinkware data
   *
   * @param {(string | string[])} id
   * @returns {Promise<DrinkwareSet[]>}
   */
  const getDrinkwareSets = async (id: string | string[]): Promise<DrinkwareSet[]> =>
    DrinkwareSet.findAll({
      where: { id },
      include: [
        { association: 'scales', include: [{ association: 'volumeSamples' }] },
        { association: 'imageMap', include: [{ association: 'baseImage' }] },
      ],
      order: [
        ['scales', 'id', 'ASC'],
        ['scales', 'volumeSamples', 'fill', 'ASC'],
      ],
    });

  /**
   * Get single record of drinkware data
   *
   * @param {string} id
   * @returns {Promise<DrinkwareSet>}
   */
  const getDrinkwareSet = async (id: string): Promise<DrinkwareSet> => {
    const [drinkwareSet] = await getDrinkwareSets(id);

    if (!drinkwareSet)
      throw new NotFoundError('Drinkware set not found.');

    return drinkwareSet;
  };

  /**
   * Get multiple records of standard unit
   *
   * @param {(string | string[])} id
   * @returns {Promise<StandardUnit[]>}
   */
  const getStandardUnits = async (id: string | string[]): Promise<StandardUnit[]> =>
    StandardUnit.findAll({
      where: { id },
      attributes: ['id', 'estimateIn', 'howMany'],
      order: [['id', 'ASC']],
    });

  /**
   * Get single record of standard unit
   *
   * @param {string} id
   * @returns {Promise<StandardUnit>}
   */
  const getStandardUnit = async (id: string): Promise<StandardUnit> => {
    const [standardUnit] = await getStandardUnits(id);

    if (!standardUnit)
      throw new NotFoundError('Standard unit not found.');

    return standardUnit;
  };

  return {
    getAsServedImage,
    getAsServedImages,
    getAsServedSet,
    getAsServedSets,
    getGuideImage,
    getGuideImages,
    getImageMap,
    getImageMaps,
    getDrinkwareSet,
    getDrinkwareSets,
    getStandardUnit,
    getStandardUnits,
  };
}

export default portionSizeService;

export type PortionSizeService = ReturnType<typeof portionSizeService>;
