<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-row>
      <v-col cols="12">
        <v-table>
          <tbody>
            <tr>
              <th>{{ $t('guide-images.id') }}</th>
              <td>{{ entry.id }}</td>
            </tr>
            <tr>
              <th>{{ $t('common.description') }}</th>
              <td>{{ entry.description }}</td>
            </tr>
            <tr>
              <th>{{ $t('image-maps._') }}</th>
              <td>{{ entry.imageMapId }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
    <guide-drawer v-bind="{ entry, readonly: true, resource: 'guide-images' }" />
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import type { GuideImageEntry } from '@intake24/common/types/http/admin';

import GuideDrawer from '../guide-drawer.vue';

export default defineComponent({
  name: 'GuideImageDetail',

  components: { GuideDrawer },

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<GuideImageEntry>(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss"></style>
