<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <template #actions>
      <preview :feedback-scheme="currentFeedbackScheme" :images="refs?.images" />
    </template>
    <card-list v-model="data.cards" :images="refs?.images" :nutrient-types="refs?.nutrientTypes" />
  </layout>
</template>

<script lang="ts">
import type { FeedbackSchemeForm } from '../form.vue';
import type { FeedbackSchemeEntry, FeedbackSchemeRefs } from '@intake24/common/types/http/admin';

import { computed, defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { CardList, Preview } from '@intake24/admin/components/feedback';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';

export type FeedbackSchemeFoodGroupsForm = Pick<FeedbackSchemeForm, 'cards'>;

export default defineComponent({
  name: 'FeedbackSchemeFoodGroups',

  components: { CardList, Preview },

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded, refs } = useEntry<FeedbackSchemeEntry, FeedbackSchemeRefs>(props);
    useEntryFetch(props);
    const { form: { data }, routeLeave, submit } = useEntryForm<
      FeedbackSchemeFoodGroupsForm,
      FeedbackSchemeEntry
    >(props, {
      data: { cards: [] },
      editMethod: 'patch',
    });

    const currentFeedbackScheme = computed(() => ({
      ...entry.value,
      ...data.value,
    }));

    return { currentFeedbackScheme, entry, entryLoaded, refs, data, routeLeave, submit };
  },
});
</script>

<style lang="scss" scoped></style>
