<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('locales.food-ranking.title') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card>
      <v-card-title>{{ $t('locales.food-ranking.description') }} </v-card-title>
      <v-card-actions>
        <csv-upload
          :dialog-title="$t('locales.food-ranking.upload')"
          :endpoint="endpoint"
          job-type="LocaleFoodRankingUpload"
          :label="$t('locales.food-ranking.upload')"
          :survey-id="id"
        />
      </v-card-actions>
    </v-card>
  </layout>
</template>

<script lang="ts">
import type { LocaleEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import CsvUpload from '@intake24/admin/components/dialogs/csv-upload/csv-upload.vue';
import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'LocaleFoodRanking',

  components: { CsvUpload },

  mixins: [detailMixin],

  setup(props) {
    const { entry, entryLoaded } = useEntry<LocaleEntry>(props);
    useEntryFetch(props);

    return { entry, entryLoaded };
  },

  computed: {
    endpoint() {
      return `admin/locales/${this.entry.id}/food-ranking`;
    },
  },

  methods: {
    deleteRankingData() {
      throw new Error('Not implemented');
    },
  },
});
</script>

<style lang="scss" scoped></style>
