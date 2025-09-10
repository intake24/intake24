<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('locales.code') }}</th>
          <td>{{ entry.code }}</td>
        </tr>
        <tr>
          <th>{{ $t('locales.englishName') }}</th>
          <td>{{ entry.englishName }}</td>
        </tr>
        <tr>
          <th>{{ $t('locales.localName') }}</th>
          <td>{{ entry.localName }}</td>
        </tr>
        <tr>
          <th>{{ $t('locales.respondentLanguageId') }}</th>
          <td>
            <span :class="`fi fi-${entry.respondentLanguageId} mr-2`" />
            {{ entry.respondentLanguageId }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('locales.adminLanguageId') }}</th>
          <td>
            <span :class="`fi fi-${entry.adminLanguageId} mr-2`" />
            {{ entry.adminLanguageId }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('locales.countryFlagCode') }}</th>
          <td>
            <span :class="`fi fi-${entry.countryFlagCode} mr-2`" />
            {{ entry.countryFlagCode }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('languages.textDirections._') }}</th>
          <td>{{ entry.textDirection }}</td>
        </tr>
        <tr>
          <th>{{ $t('locales.foodIndex.enabled') }}</th>
          <td>{{ entry.foodIndexEnabled }}</td>
        </tr>
        <tr>
          <th>{{ $t('locales.foodIndex.languageBackend') }}</th>
          <td>
            <span :class="`fi fi-${entry.foodIndexLanguageBackendId} mr-2`" />
            {{ entry.foodIndexLanguageBackendId }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('securables.visibility._') }}</th>
          <td>{{ $t(`securables.visibility.${entry.visibility}`) }}</td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import type { LocaleEntry } from '@intake24/common/types/http/admin';

export default defineComponent({
  name: 'LocaleDetail',

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded, refs, refsLoaded } = useEntry<LocaleEntry>(props);

    return { entry, entryLoaded, refs, refsLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
