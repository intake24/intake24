<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.mobile || fullscreen" max-width="800px">
    <template #activator="{ props }">
      <v-btn
        color="primary"
        :title="$t('jobs.repeat._')"
        v-bind="props"
      >
        <v-icon icon="$jobs" start /> {{ $t('jobs.repeat._') }}
      </v-btn>
    </template>
    <v-card :tile="$vuetify.display.mobile">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('jobs.title') }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          v-if="!$vuetify.display.mobile"
          :icon="fullscreen ? 'fas fa-minimize' : 'fas fa-maximize'"
          title="Fullscreen"
          variant="plain"
          @click="toggleFullscreen"
        />
      </v-toolbar>
      <v-card-text class="px-4 py-2 flex-shrink-1">
        <v-switch v-model="override" hide-details :label="$t('jobs.repeat.override')" />
      </v-card-text>
      <json-editor v-model="job" class="flex-grow-1" :read-only="!override" />
      <v-card-actions>
        <v-spacer />
        <v-btn class="font-weight-bold" color="info" variant="text" @click.stop="repeat">
          <v-icon icon="fas fa-play" start /> {{ $t('jobs.repeat.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { JobAttributes } from '@intake24/common/types/http/admin';

import { ref } from 'vue';

import { JsonEditor } from '@intake24/admin/components/editors';
import { useHttp } from '@intake24/admin/services';
import { copy } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

defineOptions({ name: 'JobRepeat' });

const props = defineProps({
  modelValue: {
    type: Object as PropType<JobAttributes>,
    required: true,
  },
});

const { i18n } = useI18n();
const http = useHttp();

const dialog = ref(false);
const fullscreen = ref(false);
const override = ref(false);
const job = ref(copy(props.modelValue));

function close() {
  dialog.value = false;
}

async function repeat() {
  const { id } = props.modelValue;
  const payload = override.value ? { type: job.value.type, params: job.value.params } : undefined;

  await http.post(`admin/jobs/${id}/repeat`, payload);
  useMessages().success(i18n.t('jobs.repeat.confirmed', { name: id }));
  close();
};

function toggleFullscreen() {
  fullscreen.value = !fullscreen.value;
}
</script>

<style lang="scss" scoped></style>
