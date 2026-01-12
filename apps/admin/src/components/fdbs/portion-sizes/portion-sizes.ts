import type { PortionSizeMethod } from '@intake24/common/surveys';
import { useI18n } from '@intake24/ui';

export type PortionSizeMethodItem = PortionSizeMethod;

export type InternalPortionSizeMethodItem = PortionSizeMethod & {
  _id: string;
};

export type PortionSizeMethodEvent = {
  index: number;
  item: InternalPortionSizeMethodItem;
};

export type PortionSizeMethodDialog = {
  show: boolean;
  index: number;
  item: InternalPortionSizeMethodItem;
};

export const psmDefaultAttributes: Omit<PortionSizeMethodItem, 'id' | 'method'> = {
  description: '',
  useForRecipes: false,
  conversionFactor: 1,
  orderBy: '0',
  parameters: {},
};

export const portionSizeSelectionImages = {
  grated: 'portion/cheg3.jpg',
  in_a_bag: 'portion/Gcri.jpg',
  in_a_bottle: 'portion/Gwatbottle.jpg',
  in_a_bowl: 'portion/CanFt4.jpg',
  in_a_can: 'portion/Galccans.jpg',
  in_a_carton: 'portion/Gpopcarton.jpg',
  in_a_glass: 'portion/gsoftdrnk.jpg',
  in_a_mug: 'portion/mugs.jpg',
  in_a_pot: 'portion/Gyog.jpg',
  in_a_takeaway_cup: 'portion/hotdrinks.jpg',
  in_baby_carrots: 'portion/carb5.jpg',
  in_bars: 'portion/Gwcho.jpg',
  in_batons: 'portion/baton3.jpg',
  in_berries: 'portion/blkb24.jpg',
  in_burgers: 'portion/Gbur.jpg',
  in_chopped_fruit: 'portion/apps4.jpg',
  in_crinkle_cut_chips: 'portion/chipcr2.jpg',
  in_cubes: 'portion/chec3.jpg',
  in_curly_fries: 'portion/curf2.jpg',
  in_dollops: 'portion/421.jpg',
  in_french_fries: 'portion/fren2.jpg',
  in_individual_cakes: 'portion/Gcake.jpg',
  in_individual_packs: 'portion/Gchse.jpg',
  in_individual_puddings: 'portion/Gyor.jpg',
  in_individual_sweets: 'Gswt2.jpg',
  in_spoonfuls: 'Gspn.jpg',
  in_slices: 'portion/chesl3.jpg',
  in_straight_cut_chips: 'portion/chipst2.jpg',
  in_thick_cut_chips: 'portion/chipth2.jpg',
  in_unwrapped_bars: 'portion/Gcdmc.jpg',
  in_whole_fruit_vegetables: 'portion/Gapl.jpg',
  in_wrapped_bars: 'portion/Gcdmb.jpg',
  milk_on_cereal: 'portion/standard-portion.jpg',
  on_a_knife: 'portion/butk4.jpg',
  on_a_plate: 'portion/m332.jpg',
  slice_from_a_large_cake: 'portion/m216.jpg',
  slice_from_a_large_pudding: 'portion/yorp4.jpg',
  spread_on_a_cracker: 'portion/butc4.jpg',
  spread_on_a_scone: 'portion/butsc4.jpg',
  spread_on_bread: 'portion/Gcsp04.jpg',
  use_a_standard_measure: 'portion/standard-portion.jpg',
  use_a_standard_portion: 'portion/standard-portion.jpg',
  use_an_image: 'portion/potatoes_boiled.jpg',
  use_these_crisps_in_a_bag: 'portion/Gskps.jpg',
  use_tortilla_chips_in_a_bowl: 'portion/tort4.jpg',
  weight: 'portion/weight.png',
};

export type PortionSizeSelectionImage = keyof typeof portionSizeSelectionImages;

export const psmDefaults: PortionSizeMethodItem[] = [
  {
    method: 'as-served',
    ...psmDefaultAttributes,
    description: 'use_an_image',
    parameters: { servingImageSet: '' },
  },
  {
    method: 'cereal',
    ...psmDefaultAttributes,
    description: 'use_an_image',
    parameters: { type: 'hoop', labels: false },
  },
  {
    method: 'direct-weight',
    ...psmDefaultAttributes,
    description: 'weight',
    parameters: {},
  },
  {
    method: 'drink-scale',
    ...psmDefaultAttributes,
    description: 'in_a_mug',
    parameters: {
      drinkwareId: '',
      initialFillLevel: 0.9,
      skipFillLevel: false,
      labels: false,
      multiple: false,
    },
  },
  {
    method: 'guide-image',
    ...psmDefaultAttributes,
    description: 'in_a_can',
    parameters: { guideImageId: '', labels: false },
  },
  {
    method: 'milk-in-a-hot-drink',
    ...psmDefaultAttributes,
    description: 'use_a_standard_portion',
    parameters: { options: { en: [] } },
  },
  {
    method: 'milk-on-cereal',
    ...psmDefaultAttributes,
    description: 'in_a_bowl',
    parameters: { labels: false },
  },
  {
    method: 'parent-food-portion',
    ...psmDefaultAttributes,
    description: 'use_a_standard_portion',
    parameters: { options: { _default: { en: [] } } },
  },
  {
    method: 'pizza',
    ...psmDefaultAttributes,
    description: 'use_an_image',
    parameters: { labels: false },
  },
  {
    method: 'pizza-v2',
    ...psmDefaultAttributes,
    description: 'use_an_image',
    parameters: { labels: false },
  },
  {
    method: 'standard-portion',
    ...psmDefaultAttributes,
    description: 'use_a_standard_portion',
    parameters: { units: [] },
  },
  {
    method: 'unknown',
    ...psmDefaultAttributes,
    description: 'unknown',
    parameters: {},
  },
];

export function usePortionSizeMethods() {
  const { i18n } = useI18n();

  const estimationMethods = psmDefaults.map(({ method: value }) => ({
    value,
    title: i18n.t(`fdbs.portionSizes.methods.${value}._`),
  }));

  const selections = Object.keys(portionSizeSelectionImages)
    .map(value => ({
      value,
      title: i18n.t(`prompts.portionSizeOption.selections.${value}`),
    }))
    .sort((a, b) => a.title.localeCompare(b.title)) as {
    value: PortionSizeSelectionImage;
    title: string;
  }[];

  return { estimationMethods, selections };
}
