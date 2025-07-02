import type { PropType } from 'vue';
import type { FoodBrowser } from '@intake24/common/prompts';

export const foodBrowserProps = {
  categoriesFirst: {
    type: Object as PropType<FoodBrowser['categoriesFirst']>,
    required: true,
  },
  allowThumbnails: {
    type: Boolean as PropType<FoodBrowser['allowThumbnails']>,
    required: true,
  },
  enableGrid: {
    type: Boolean as PropType<FoodBrowser['enableGrid']>,
    required: true,
  },
  gridThreshold: {
    type: Number as PropType<FoodBrowser['gridThreshold']>,
    required: true,
  },
} as const;
