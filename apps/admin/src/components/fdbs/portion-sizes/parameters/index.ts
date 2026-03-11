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
  'as-served-params': AsServed,
  'auto-params': Auto,
  'cereal-params': NoParameters,
  'direct-weight-params': NoParameters,
  'drink-scale-params': DrinkScale,
  'guide-image-params': GuideImage,
  'milk-in-a-hot-drink-params': MilkInAHotDrink,
  'milk-on-cereal-params': MilkOnCereal,
  'parent-food-portion-params': ParentFoodOption,
  'pizza-params': Pizza,
  'pizza-v2-params': NoParameters,
  'standard-portion-params': StandardPortion,
  'unknown-params': Unknown,
};
