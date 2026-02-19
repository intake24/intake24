import browse from './browse.vue';
import foodBuilders from './food-builders';
import foodRanking from './food-ranking';
import form from './form.vue';
import read from './read.vue';
import securables from './securables';
import splitLists from './split-lists';
import splitWords from './split-words';
import synonymSets from './synonym-sets';
import tasks from './tasks';

export default {
  browse,
  create: form,
  read,
  edit: form,
  securables,
  'split-lists': splitLists,
  'split-words': splitWords,
  'synonym-sets': synonymSets,
  'food-ranking': foodRanking,
  'food-builders': foodBuilders,
  tasks,
};
