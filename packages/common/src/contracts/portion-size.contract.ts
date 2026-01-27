import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  asServedSetResponse,
  drinkwareSetResponse,
  guideImageResponse,
  imageMapResponse,
  standardUnitResponse,
  weightResponse,
} from '../types/http';

const id = z.union([z.string().nonempty(), z.string().array().nonempty()]);

export const portionSize = initContract().router({
  asServedSets: {
    method: 'GET',
    path: '/portion-sizes/as-served-sets',
    query: z.object({ id }),
    responses: {
      200: asServedSetResponse.array(),
    },
    summary: 'Multiple as served sets',
    description: 'Get as served image definitions for the given as served sets.',
  },
  asServedSet: {
    method: 'GET',
    path: '/portion-sizes/as-served-sets/:id',
    responses: {
      200: asServedSetResponse,
    },
    summary: 'Single as served set',
    description: 'Get as served image definitions for the given as served set.',
  },
  drinkwareSets: {
    method: 'GET',
    path: '/portion-sizes/drinkware-sets',
    query: z.object({ id }),
    responses: {
      200: drinkwareSetResponse.array(),
    },
    summary: 'Multiple drinkware sets',
    description:
      'Get the definition of "sliding scale" which is the portion size estimation for hot and cold drinks.',
  },
  drinkwareSet: {
    method: 'GET',
    path: '/portion-sizes/drinkware-sets/:id',
    responses: {
      200: drinkwareSetResponse,
    },
    summary: 'Single drinkware set',
    description:
      'Get the definition of "sliding scale" which is the portion size estimation for hot and cold drinks.',
  },
  guideImages: {
    method: 'GET',
    path: '/portion-sizes/guide-images',
    query: z.object({ id }),
    responses: {
      200: guideImageResponse.array(),
    },
    summary: 'Multiple guide images',
    description:
      'Get definition of an image map which is an image of multiple objects from which one can be selected. Every object has an associated weight that is used for portion size weight calculations.',
  },
  guideImage: {
    method: 'GET',
    path: '/portion-sizes/guide-images/:id',
    responses: {
      200: guideImageResponse,
    },
    summary: 'Single guide image',
    description:
      'Get definition of an image map which is an image of multiple objects from which one can be selected. Every object has an associated weight that is used for portion size weight calculations.',
  },
  imageMaps: {
    method: 'GET',
    path: '/portion-sizes/image-maps',
    query: z.object({ id }),
    responses: {
      200: imageMapResponse.array(),
    },
    summary: 'Multiple image maps',
    description:
      'Returns an image map definition similar to guide images, but without the associated weights. Used for selecting objects from images where the object is not directly associated with a weight, e.g. selecting pizza slice sizes whose final weight also depends on pizza thickness and type.',
  },
  imageMap: {
    method: 'GET',
    path: '/portion-sizes/image-maps/:id',
    responses: {
      200: imageMapResponse,
    },
    summary: 'Single image map',
    description:
      'Returns an image map definition similar to guide images, but without the associated weights. Used for selecting objects from images where the object is not directly associated with a weight, e.g. selecting pizza slice sizes whose final weight also depends on pizza thickness and type.',
  },
  standardUnits: {
    method: 'GET',
    path: '/portion-sizes/standard-units',
    query: z.object({ id }),
    responses: {
      200: standardUnitResponse.array(),
    },
    summary: 'Multiple standard units',
    description: 'Get definitions for the given standard units.',
  },
  standardUnit: {
    method: 'GET',
    path: '/portion-sizes/standard-units/:id',
    responses: {
      200: standardUnitResponse,
    },
    summary: 'Single standard unit',
    description: 'Get definitions for the given standard units.',
  },
  weight: {
    method: 'GET',
    path: '/portion-sizes/weight',
    responses: {
      200: weightResponse,
    },
    summary: 'Get weight',
    description:
      'Dummy endpoint for manual weight entry estimation method. The method has no parameters and this request is needed to get the image URL for the portion size option selection screen.',
  },
});
