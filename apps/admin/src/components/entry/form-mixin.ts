import { defineComponent } from 'vue';

import { ErrorList, SubmitFooter } from '@intake24/admin/components/forms';

import { EntryLayout } from '../layouts';

export default defineComponent({
  name: 'FormMixin',

  components: { ErrorList, EntryLayout, SubmitFooter },

  provide: () => ({
    editsResource: true,
  }),

  props: {
    id: {
      type: String,
      default: 'create',
    },
  },
});
