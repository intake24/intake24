import { asServedImages } from './as-served-images';
import { asServedSets } from './as-served-sets';
import { drinkwareScales } from './drinkware-scales';
import { drinkwareSets } from './drinkware-sets';
import { drinkwareVolumes } from './drinkware-volumes';
import { guideImageObjects } from './guide-image-objects';
import { guideImages } from './guide-images';
import { imageMapObjects } from './image-map-objects';
import { imageMaps } from './image-maps';
import { languages } from './languages';
import { locales } from './locales';
import { nutrientTypes } from './nutrient-types';
import { standardUnits } from './standard-units';

export default {
  'as-served-sets.images': asServedImages,
  'as-served-sets': asServedSets,
  'drinkware-sets': drinkwareSets,
  'drinkware-sets.scales': drinkwareScales,
  'drinkware-sets.volumes': drinkwareVolumes,
  'guide-images': guideImages,
  'guide-images.objects': guideImageObjects,
  'image-maps': imageMaps,
  'image-maps.objects': imageMapObjects,
  languages,
  locales,
  'nutrient-types': nutrientTypes,
  'standard-units': standardUnits,
};
