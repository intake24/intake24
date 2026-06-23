import { defineComponent } from 'vue';

import { EntryLayout } from '../layouts';

export default defineComponent({
  name: 'DetailMixin',

  components: { EntryLayout },

  props: {
    id: {
      type: String,
      default: 'create',
    },
  },
});
