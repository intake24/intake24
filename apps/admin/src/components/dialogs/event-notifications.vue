<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="800px">
    <template #activator="{ props }">
      <v-btn
        block
        color="primary"
        rounded
        size="large"
        :title="$t('notifications.title')"
        variant="outlined"
        v-bind="props"
      >
        <v-icon icon="fas fa-paper-plane" start /> {{ $t('notifications.title') }}
      </v-btn>
    </template>
    <v-card tile>
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          {{ $t('notifications.title') }}
        </v-toolbar-title>
      </v-toolbar>
      <div class="d-flex justify-end pa-4">
        <v-btn color="primary" rounded size="large" :title="$t('notifications.add')" @click="add">
          <v-icon icon="fas fa-paper-plane" start /> {{ $t('notifications.add') }}
        </v-btn>
      </div>
      <v-list class="list-border py-0">
        <v-list-item v-for="(item, idx) in items" :key="idx">
          <template #prepend>
            <v-icon>fas fa-paper-plane</v-icon>
          </template>
          <v-container>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="item.type"
                  hide-details="auto"
                  :items="events"
                  :name="`type-${idx}`"
                  :title="$t('notifications.events._')"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="item.channel"
                  hide-details="auto"
                  :items="channels"
                  :name="`channel-${idx}`"
                  :title="$t('notifications.channels._')"
                  variant="outlined"
                  @update:model-value="updateProps(idx)"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field
                  v-if="item.channel === 'webhook'"
                  v-model="item.url"
                  hide-details="auto"
                  :label="$t('notifications.channels.url')"
                  :name="`url-${idx}`"
                  variant="outlined"
                />
                <v-text-field
                  v-else-if="item.channel === 'email'"
                  v-model="item.to"
                  hide-details="auto"
                  :label="$t('notifications.channels.to')"
                  :name="`to-${idx}`"
                  variant="outlined"
                />
                <v-text-field
                  v-else-if="item.channel === 'slack'"
                  v-model="item.channelId"
                  hide-details="auto"
                  :label="$t('notifications.channels.channelId')"
                  :name="`channelId-${idx}`"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-container>
          <template #append>
            <v-list-item-action>
              <v-btn color="error" icon="$delete" :title="$t('notifications.remove')" @click.stop="remove(idx)" />
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn class="font-weight-bold" color="info" variant="text" @click.stop="close">
          <v-icon icon="$success" start /> {{ $t('common.action.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { Notification, Notifications } from '@intake24/common/types';

import { useVModel } from '@vueuse/core';
import { ref } from 'vue';

import { eventTypes, notificationChannels } from '@intake24/common/types';
import { useI18n } from '@intake24/ui';

defineOptions({
  name: 'EventNotifications',
});

const props = defineProps({
  modelValue: {
    type: Array as PropType<Notification[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const defaultNotifications: Notifications = {
  webhook: {
    type: 'survey.session.started',
    channel: 'webhook',
    url: '',
  },
  email: {
    type: 'survey.session.started',
    channel: 'email',
    to: '',
  },
  slack: {
    type: 'survey.session.started',
    channel: 'slack',
    channelId: '',
  },
};

const { i18n } = useI18n();
const items = useVModel(props, 'modelValue', emit, {
  passive: true,
  deep: true,
});

const channels = notificationChannels.map(value => ({
  value,
  title: i18n.t(`notifications.channels.${value}`),
}));
const events = eventTypes.map(value => ({
  value,
  title: i18n.t(`notifications.events.${value}`),
}));

const dialog = ref(false);

function add() {
  items.value.push({ ...defaultNotifications.webhook });
}

function remove(idx: number) {
  items.value.splice(idx, 1);
}

function close() {
  dialog.value = false;
}

function updateProps(idx: number) {
  const defaults = defaultNotifications[items.value[idx].channel];
  items.value.splice(idx, 1, { ...defaults, type: items.value[idx].type });
}
</script>

<style lang="scss" scoped></style>
