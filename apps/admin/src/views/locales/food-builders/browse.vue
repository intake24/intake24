<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <food-builder-list v-model="data.items" :errors :locale-id="entry.code" :synonyms />
  </layout>
</template>

<script lang="ts">
import type { FoodBuilderEntry, FoodBuilderRequest, LocaleEntry, SynonymSetAttributes } from '@intake24/common/types/http/admin';

import { defineComponent, onMounted, ref } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { FoodBuilderList } from '@intake24/admin/components/food-builders';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { useEntry as useStoreEntry } from '@intake24/admin/stores';
import { useHttp } from '@intake24/ui/services';

export type FoodBuildersForm = {
  items: FoodBuilderRequest[];
};

export default defineComponent({
  name: 'FoodBuilders',

  components: { FoodBuilderList },

  mixins: [formMixin],

  setup(props) {
    const http = useHttp();
    const { entry, entryLoaded } = useEntry<LocaleEntry>(props);
    useEntryFetch(props);
    const { form: { data, errors, post }, routeLeave, toForm } = useEntryForm<
      FoodBuildersForm,
      LocaleEntry
    >(props, {
      data: { items: [] },
      config: { transform: ({ items }) => items },
    });

    const synonyms = ref<SynonymSetAttributes[]>([]);

    async function submit() {
      const items = await post<FoodBuilderEntry[]>(`admin/locales/${props.id}/food-builders`);

      useStoreEntry().updateEntry({ items });
    };

    onMounted(async () => {
      const [{ data: items }, { data: synonymsSets }] = await Promise.all([
        http.get<FoodBuilderEntry[]>(`admin/locales/${props.id}/food-builders`),
        http.get<SynonymSetAttributes[]>(`admin/locales/${props.id}/synonym-sets`),
      ]);

      toForm({ items });
      synonyms.value = synonymsSets;
    });

    return {
      entry,
      entryLoaded,
      data,
      errors,
      routeLeave,
      submit,
      synonyms,
    };
  },
});
</script>

<style lang="scss" scoped></style>
