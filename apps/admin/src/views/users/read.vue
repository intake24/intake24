<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('users.name') }}</th>
          <td>{{ entry.name }}</td>
        </tr>
        <tr>
          <th>{{ $t('users.simpleName') }}</th>
          <td>{{ entry.name }}</td>
        </tr>
        <tr>
          <th>{{ $t('common.email') }}</th>
          <td>{{ entry.email }}</td>
        </tr>
        <tr>
          <th>{{ $t('common.phone') }}</th>
          <td>{{ entry.phone }}</td>
        </tr>
        <tr>
          <th>{{ $t('users.verified') }}</th>
          <td>{{ entry.verifiedAt ? $t('common.yes') : $t('common.no') }}</td>
        </tr>
        <tr>
          <th>{{ $t('users.disabled') }}</th>
          <td>{{ entry.disabledAt ? $t('common.yes') : $t('common.no') }}</td>
        </tr>
        <tr>
          <th>{{ $t('users.mfa._') }}</th>
          <td>{{ entry.multiFactorAuthentication ? $t('common.yes') : $t('common.no') }}</td>
        </tr>
        <tr>
          <th>{{ $t('users.notifications.email') }}</th>
          <td>{{ entry.emailNotifications ? $t('common.yes') : $t('common.no') }}</td>
        </tr>
        <tr>
          <th>{{ $t('users.notifications.sms') }}</th>
          <td>{{ entry.smsNotifications ? $t('common.yes') : $t('common.no') }}</td>
        </tr>
      </tbody>
    </v-table>
    <v-card-title>
      {{ $t('users.customFields.title') }}
    </v-card-title>
    <v-table>
      <thead>
        <tr>
          <th>{{ $t('users.customFields.name') }}</th>
          <th>{{ $t('users.customFields.value') }}</th>
        </tr>
      </thead>
      <tbody v-if="entry.customFields.length">
        <tr v-for="field in entry.customFields" :key="field.name">
          <th>{{ field.name }}</th>
          <td>{{ field.value }}</td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="2">
            {{ $t('users.customFields.none') }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-card-title>
      {{ $t('users.aliases.title') }}
    </v-card-title>
    <v-table>
      <thead>
        <tr>
          <th>{{ $t('users.aliases.surveyId') }}</th>
          <th>{{ $t('users.aliases.username') }}</th>
          <th>{{ $t('users.aliases.urlAuthToken') }}</th>
        </tr>
      </thead>
      <tbody v-if="entry.aliases.length">
        <tr v-for="alias in entry.aliases" :key="alias.username">
          <th>{{ alias.surveyId }}</th>
          <th>{{ alias.username }}</th>
          <td>{{ alias.urlAuthToken }}</td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="3">
            {{ $t('users.aliases.none') }}
          </td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import type { UserEntry, UserRefs } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';

export default defineComponent({
  name: 'UserDetail',

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded, refs, refsLoaded } = useEntry<UserEntry, UserRefs>(props);

    return { entry, entryLoaded, refs, refsLoaded };
  },
});
</script>

<style lang="scss" scoped></style>
