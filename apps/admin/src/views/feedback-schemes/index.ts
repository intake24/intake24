import browse from './browse.vue';
import cards from './cards';
import demographicGroups from './demographic-groups';
import form from './form.vue';
import henryCoefficients from './henry-coefficients';
import meals from './meals';
import media from './media';
import read from './read.vue';
import securables from './securables';
import topFoods from './top-foods';

export default {
  browse,
  create: form,
  read,
  edit: form,
  cards,
  'top-foods': topFoods,
  meals,
  media,
  'demographic-groups': demographicGroups,
  'henry-coefficients': henryCoefficients,
  securables,
};
