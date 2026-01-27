<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-row>
      <v-col cols="12">
        <v-table>
          <tbody>
            <tr>
              <th>{{ $t('image-maps.id') }}</th>
              <td>{{ entry.id }}</td>
            </tr>
            <tr>
              <th>{{ $t('common.description') }}</th>
              <td>{{ entry.description }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>
    <guide-drawer v-bind="{ entry, readonly: true, resource: 'image-maps' }" />
  </layout>
</template>

<script lang="ts">
import type { ImageMapEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

import GuideDrawer from '../guide-drawer.vue';

export default defineComponent({
  name: 'ImageMapDetail',

  components: { GuideDrawer },

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<ImageMapEntry>(props);

    return { entry, entryLoaded };
  },
});
</script>

<style lang="scss"></style>
