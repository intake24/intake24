<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-row>
      <v-col cols="12">
        <v-table>
          <tbody>
            <tr>
              <th>{{ $t('common.id') }}</th>
              <td colspan="3">
                {{ entry.id }}
              </td>
            </tr>
            <tr>
              <th>{{ $t('media.disks._') }}</th>
              <td>{{ $t(`media.disks.${entry.disk}`) }}</td>
              <th>{{ $t('media.collections._') }}</th>
              <td>{{ collection }}</td>
            </tr>
            <tr>
              <th>{{ $t('media.modelType') }}</th>
              <td>{{ $t(`${resource}._`) }}</td>
              <th>{{ $t('media.modelId') }}</th>
              <td>
                <router-link
                  v-if="entry.modelId && can(`${resource}:read`)"
                  :to="{ name: `${resource}-read`, params: { id: entry.modelId } }"
                >
                  {{ entry.modelId }}
                </router-link>
              </td>
            </tr>
            <tr>
              <th>{{ $t('media.name') }}</th>
              <td>{{ entry.name }}</td>
              <th>{{ $t('media.filename') }}</th>
              <td>{{ entry.filename }}</td>
            </tr>
            <tr>
              <th>{{ $t('media.mimetype') }}</th>
              <td>{{ entry.mimetype }}</td>
              <th>{{ $t('media.size') }}</th>
              <td>{{ entry.size }}</td>
            </tr>
            <tr>
              <th>{{ $t('media.urls.original') }}</th>
              <td colspan="3">
                <a :href="entry.url" target="_blank">
                  {{ entry.url }}
                </a>
              </td>
            </tr>
            <tr v-for="(value, key) in entry.sizes" :key="key">
              <th>{{ $t(`media.urls.${key}`) }}</th>
              <td colspan="3">
                <a :href="value" target="_blank">
                  {{ value }}
                </a>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <v-col cols="8">
        <v-img class="ma-2" rounded :src="entry.sizes.md" />
      </v-col>
    </v-row>
  </layout>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import { commonCollections } from '@intake24/common/types/http/admin';
import type { MediaEntry } from '@intake24/common/types/http/admin';
import { modelToResource } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

export default defineComponent({
  name: 'MediaDetail',

  mixins: [detailMixin],

  setup(props) {
    const { i18n: { t } } = useI18n();
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<MediaEntry>(props);

    const resource = computed(() => modelToResource(entry.value.modelType));
    const collection = computed(() => {
      const { collection } = entry.value;

      return commonCollections.includes(collection)
        ? t(`media.collections.${collection}`)
        : t(`media.collections.${resource.value}.${collection}`);
    });

    return {
      collection,
      entry,
      entryLoaded,
      resource,
    };
  },
});
</script>

<style lang="scss"></style>
