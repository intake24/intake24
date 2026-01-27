<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <template #actions>
      <preview :feedback-scheme="currentFeedbackScheme" :images="refs?.images" />
    </template>
    <henry-coefficient-list v-model="data.henryCoefficients" />
  </layout>
</template>

<script lang="ts">
import type { FeedbackSchemeForm } from '../form.vue';
import type { FeedbackSchemeEntry, FeedbackSchemeRefs } from '@intake24/common/types/http/admin';

import { computed, defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { HenryCoefficientList, Preview } from '@intake24/admin/components/feedback';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';

export type FeedbackSchemeHenryCoefficientsForm = Pick<FeedbackSchemeForm, 'henryCoefficients'>;

export default defineComponent({
  name: 'FeedbackSchemeHenryCoefficients',

  components: { HenryCoefficientList, Preview },

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded, refs } = useEntry<FeedbackSchemeEntry, FeedbackSchemeRefs>(props);
    useEntryFetch(props);
    const { form: { data }, routeLeave, submit } = useEntryForm<
      FeedbackSchemeHenryCoefficientsForm,
      FeedbackSchemeEntry
    >(props, {
      data: { henryCoefficients: [] },
      editMethod: 'patch',
    });

    const currentFeedbackScheme = computed(() => ({ ...entry.value, ...data.value }));

    return { currentFeedbackScheme, entry, entryLoaded, data, refs, routeLeave, submit };
  },
});
</script>

<style lang="scss" scoped></style>
