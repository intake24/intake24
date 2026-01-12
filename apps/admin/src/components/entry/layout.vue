<template>
  <v-card
    class="mb-5 px-2"
    :flat="$vuetify.display.mobile"
    :rounded="$vuetify.display.mobile ? 0 : undefined"
  >
    <v-toolbar class="toolbar-items" color="white">
      <v-btn color="grey-darken-1" :title="$t(`common.action.back`)" :to="{ name: resource.name }" variant="flat">
        <v-icon icon="$back" start />{{ $t(`common.action.back`) }}
      </v-btn>
      <v-btn
        v-if="editsResource"
        color="secondary"
        :title="$t(`common.action.save`)"
        variant="flat"
        @click="$emit('save')"
      >
        <v-icon icon="$save" start />{{ $t(`common.action.save`) }}
      </v-btn>
      <slot name="actions" />
      <v-spacer />
      <confirm-dialog
        v-if="canHandleEntry('delete')"
        color="error"
        icon-left="$delete"
        :label="$t('common.action.delete')"
        :typed-confirm="['surveys'].includes(resource.name) ? entry.name : undefined"
        variant="flat"
        @confirm="remove"
      >
        {{ $t('common.action.confirm.delete', { name: entry.name ? entry.name : entry.id }) }}
      </confirm-dialog>
    </v-toolbar>
  </v-card>
  <v-card :border="!$vuetify.display.mobile" :flat="$vuetify.display.mobile" :tile="$vuetify.display.mobile">
    <v-tabs bg-color="primary">
      <v-tab
        v-for="tab in tabs"
        :key="tab"
        :title="tabTitle(tab)"
        :to="{ name: `${resource.name}-${tab}`, params: tab === 'create' ? undefined : { id } }"
        :value="tab"
      >
        {{ tabTitle(tab) }}
      </v-tab>
    </v-tabs>
    <slot />
  </v-card>
  <slot name="addons" />
  <confirm-leave-dialog
    :model-value="routeLeave"
    @update:model-value="$emit('update:routeLeave', $event)"
  />
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { has } from 'lodash-es';
import { computed, inject } from 'vue';
import { useRouter } from 'vue-router';

import resources from '@intake24/admin/router/resources';
import { useHttp } from '@intake24/admin/services';
import { useMessages, useResource, useUser } from '@intake24/admin/stores';
import type { RouteLeave } from '@intake24/admin/types';
import type { Dictionary } from '@intake24/common/types';
import { ConfirmDialog, useI18n } from '@intake24/ui';

import ConfirmLeaveDialog from './confirm-leave-dialog.vue';

defineOptions({ name: 'EntryLayout' });

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  entry: {
    type: Object as PropType<Dictionary>,
    required: true,
  },
  routeLeave: {
    type: Object as PropType<RouteLeave>,
    default: () => ({
      dialog: false,
      to: null,
      confirmed: false,
    }),
  },
});

defineEmits(['save', 'update:routeLeave']);

const editsResource = inject('editsResource', false);

const { i18n: { t, locale, messages } } = useI18n();
const resource = useResource();
const { can } = useUser();
const http = useHttp();
const router = useRouter();

const resourceDef = computed(
  () => resources.find(item => item.name === resource.name),
);

const isCreate = computed(() => props.id === 'create');
const tabs = computed(() => {
  if (isCreate.value)
    return ['create'];

  if (!resourceDef.value)
    return [];

  const { securables, ownerId } = props.entry;
  const { name, module, routes } = resourceDef.value;

  return routes.filter(
    item =>
      item !== 'create'
      && can({ resource: module ?? name, action: item, securables, ownerId }),
  );
});

function canHandleEntry(action: string) {
  if (isCreate.value)
    return false;

  const { securables, ownerId } = props.entry;
  return can({ action, securables, ownerId });
};

function tabTitle(tab: string) {
  const check = has(messages.value[locale.value], `${resource.name}.${tab}.tab`);
  return t(check ? `${resource.name}.${tab}.tab` : `common.action.${tab}`);
};

async function remove() {
  const { id, name } = props.entry;

  await http.delete(`${resource.api}/${props.id}`);
  useMessages().success(t('common.msg.deleted', { name: name ?? id }));
  await router.push({ name: resource.name });
};
</script>

<style lang="scss">
</style>
