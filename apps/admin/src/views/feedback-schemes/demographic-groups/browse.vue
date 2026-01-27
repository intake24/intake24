<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <template #actions>
      <preview :feedback-scheme="currentFeedbackScheme" :images="refs?.images" />
    </template>
    <demographic-group-list
      v-model="data.demographicGroups"
      :nutrient-types="refs?.nutrientTypes"
    />
  </layout>
</template>

<script lang="ts">
import type { FeedbackSchemeForm } from '../form.vue';
import type { FeedbackSchemeEntry, FeedbackSchemeRefs } from '@intake24/common/types/http/admin';

import { computed, defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { DemographicGroupList, Preview } from '@intake24/admin/components/feedback';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';

export type FeedbackSchemeDemographicGroupsForm = Pick<FeedbackSchemeForm, 'demographicGroups'>;

export default defineComponent({
  name: 'FeedbackSchemeDemographicGroups',

  components: { DemographicGroupList, Preview },

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded, refs } = useEntry<FeedbackSchemeEntry, FeedbackSchemeRefs>(props);
    useEntryFetch(props);
    const { form: { data }, routeLeave, submit } = useEntryForm<
      FeedbackSchemeDemographicGroupsForm,
      FeedbackSchemeEntry
    >(props, {
      data: { demographicGroups: [] },
      editMethod: 'patch',
    });

    const currentFeedbackScheme = computed(() => ({ ...entry.value, ...data.value }));

    return { currentFeedbackScheme, entry, entryLoaded, refs, data, routeLeave, submit };
  },
});
</script>

<style lang="scss" scoped></style>
