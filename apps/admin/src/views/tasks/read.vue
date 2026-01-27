<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <template #actions>
      <confirm-dialog
        v-if="can({ action: 'edit' })"
        color="primary"
        icon-left="fas fa-play"
        :label="$t('tasks.run._')"
        @confirm="triggerJob"
      >
        {{ $t('tasks.run.confirm') }}
      </confirm-dialog>
    </template>
    <v-table>
      <tbody>
        <tr>
          <th>{{ $t('common.name') }}</th>
          <td>{{ entry.name }}</td>
        </tr>
        <tr>
          <th>{{ $t('tasks.job') }}</th>
          <td>{{ entry.job }}</td>
        </tr>
        <tr>
          <th>{{ $t('tasks.cron') }}</th>
          <td>
            <pre>{{ readableCron }} | "{{ entry.cron }}"</pre>
          </td>
        </tr>
        <tr>
          <th>{{ $t('common.action.active') }}</th>
          <td>
            <v-icon v-if="entry.active" color="success" start>
              $check
            </v-icon>
            <v-icon v-else color="error" start>
              $times
            </v-icon>
            {{ $t(`common.${entry.active}`) }}
          </td>
        </tr>
        <tr v-if="entry.bullJob?.next">
          <th>{{ $t('tasks.run.next') }}</th>
          <td>{{ formatDateTime(new Date(entry.bullJob!.next)) }}</td>
        </tr>
        <tr>
          <th>{{ $t('common.description') }}</th>
          <td>{{ entry.description }}</td>
        </tr>
      </tbody>
    </v-table>
  </layout>
</template>

<script lang="ts">
import type { TaskResponse } from '@intake24/common/types/http/admin';

import cronstrue from 'cronstrue';
import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useDateTime, useEntry, useEntryFetch } from '@intake24/admin/composables';
import { ConfirmDialog } from '@intake24/ui';

export default defineComponent({
  name: 'TaskDetail',

  components: { ConfirmDialog },

  mixins: [detailMixin],

  setup(props) {
    useEntryFetch(props);
    const { entry, entryLoaded } = useEntry<TaskResponse>(props);
    const { formatDateTime } = useDateTime();

    return { entry, entryLoaded, formatDateTime };
  },

  computed: {
    readableCron(): string {
      return cronstrue.toString(this.entry.cron, { use24HourTimeFormat: true, verbose: true });
    },
  },

  methods: {
    async triggerJob() {
      await this.$http.post(`admin/tasks/${this.id}/run`);
    },
  },
});
</script>

<style scoped></style>
