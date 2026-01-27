<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('common.id') }}</th>
          <td>{{ entry.id }}</td>
          <th>{{ $t('users.id') }}</th>
          <td v-if="can('users:read') && entry.userId">
            <router-link :to="{ name: 'users-read', params: { id: entry.userId } }">
              {{ entry.userId }}
            </router-link>
          </td>
          <td v-else>
            {{ entry.userId }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('sign-in-logs.provider') }}</th>
          <td>{{ entry.provider }}</td>
          <th>{{ $t('sign-in-logs.providerKey') }}</th>
          <td>{{ entry.providerKey }}</td>
        </tr>
        <tr>
          <th>{{ $t('sign-in-logs.remoteAddress') }}</th>
          <td>{{ entry.remoteAddress }}</td>
          <th>{{ $t('sign-in-logs.successful') }}</th>
          <td>
            <v-icon v-if="entry.successful" color="success">
              $check
            </v-icon>
            <v-icon v-else color="error">
              $times
            </v-icon>
          </td>
        </tr>
        <tr>
          <th>{{ $t('sign-in-logs.userAgent') }}</th>
          <td colspan="3">
            {{ entry.userAgent }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('sign-in-logs.message') }}</th>
          <td colspan="3">
            {{ entry.message }}
          </td>
        </tr>
        <tr>
          <th>{{ $t('sign-in-logs.date') }}</th>
          <td colspan="3">
            {{ formatDateTime(entry.date) }}
          </td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import type { SignInLogAttributes } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useDateTime, useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'SignInLogDetail',

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<SignInLogAttributes>(props);
    const { formatDateTime } = useDateTime();

    return { entry, entryLoaded, formatDateTime };
  },
});
</script>

<style scoped></style>
