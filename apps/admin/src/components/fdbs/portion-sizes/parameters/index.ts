import AsServed from './as-served.vue';
import Auto from './auto.vue';
import DrinkScale from './drink-scale.vue';
import GuideImage from './guide-image.vue';
import MilkInAHotDrink from './milk-in-a-hot-drink.vue';
import MilkOnCereal from './milk-on-cereal.vue';
import NoParameters from './no-parameters.vue';
import ParentFoodOption from './parent-food-portion.vue';
import Pizza from './pizza.vue';
import StandardPortion from './standard-portion.vue';
import Unknown from './unknown.vue';

export default {
  'as-served': AsServed,
  auto: Auto,
  cereal: NoParameters,
  'direct-weight': NoParameters,
  'drink-scale': DrinkScale,
  'guide-image': GuideImage,
  'milk-in-a-hot-drink': MilkInAHotDrink,
  'milk-on-cereal': MilkOnCereal,
  'parent-food-portion': ParentFoodOption,
  pizza: Pizza,
  'pizza-v2': NoParameters,
  'standard-portion': StandardPortion,
  unknown: Unknown,
};
