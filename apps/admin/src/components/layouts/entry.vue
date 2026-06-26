<template>
  <v-card border class="ma-2 pa-4" flat rounded="xl">
    <v-toolbar color="surface">
      <v-btn
        icon="$back"
        :title="$t(`common.action.back`)"
        :to="{ name: resource.name }"
        variant="text"
      />
      <v-breadcrumbs v-if="breadcrumbs.length" id="entryBreadcrumb" class="px-1 py-2" :items="breadcrumbs">
        <template #divider>
          <v-icon icon="fas fa-caret-right" />
        </template>
      </v-breadcrumbs>
      <v-spacer />
      <div class="d-flex align-center gc-2">
        <v-menu
          v-if="slots.actions || canHandleEntry('delete')"
          :close-on-content-click="true"
          :persistent="false"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="$options"
              size="small"
              :title="$t('common.options._')"
            />
          </template>
          <v-list>
            <slot name="actions" />
            <v-divider v-if="slots.actions" />
            <confirm-dialog
              v-if="canHandleEntry('delete')"
              color="error"
              icon-left="$delete"
              :label="$t('common.action.delete')"
              :typed-confirm="['surveys'].includes(resource.name) ? entry?.name : undefined"
              @confirm="remove"
            >
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  base-color="error"
                  prepend-icon="$delete"
                  :title="$t('common.action.delete')"
                />
              </template>
              {{ $t('common.action.confirm.delete', { name: entry?.name ?? entry?.id }) }}
            </confirm-dialog>
          </v-list>
        </v-menu>
        <v-btn
          v-if="editsResource"
          color="primary"
          rounded="pill"
          :title="$t(`common.action.save`)"
          @click="$emit('save')"
        >
          <v-icon icon="$save" start />{{ $t(`common.action.save`) }}
        </v-btn>
      </div>
    </v-toolbar>
    <v-tabs id="entryTabs" color="primary">
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
    <v-divider />
    <slot />
    <slot name="addons" />
    <confirm-leave-dialog
      :model-value="routeLeave"
      @update:model-value="$emit('update:routeLeave', $event)"
    />
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { RouteLeave } from '@intake24/admin/types';
import type { Dictionary } from '@intake24/common/types';

import { has } from 'lodash-es';
import { computed, inject, useSlots } from 'vue';
import { useRouter } from 'vue-router';

import { useBreadcrumbs } from '@intake24/admin/composables/use-breadcrumbs.ts';
import resources from '@intake24/admin/router/resources';
import { useHttp } from '@intake24/admin/services';
import { useMessages, useResource, useUser } from '@intake24/admin/stores';
import { ConfirmDialog, useI18n } from '@intake24/ui';

import { ConfirmLeaveDialog } from '../dialogs';

defineOptions({ name: 'EntryLayout' });

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  entry: {
    type: Object as PropType<Dictionary>,
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
const slots = useSlots();

const { i18n: { t, locale, messages } } = useI18n();
const resource = useResource();
const { can } = useUser();
const http = useHttp();
const router = useRouter();

const { breadcrumbs } = useBreadcrumbs();

const resourceDef = computed(
  () => resources.find(item => item.name === resource.name),
);

const isCreate = computed(() => props.id === 'create');
const tabs = computed(() => {
  if (isCreate.value)
    return ['create'];

  if (!resourceDef.value || !props.entry)
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
  if (isCreate.value || !props.entry)
    return false;

  const { securables, ownerId } = props.entry;
  return can({ action, securables, ownerId });
};

function tabTitle(tab: string) {
  const check = has(messages.value[locale.value], `${resource.name}.${tab}.tab`);
  return t(check ? `${resource.name}.${tab}.tab` : `common.action.${tab}`);
};

async function remove() {
  if (!props.entry)
    return;

  const { id, name } = props.entry;

  await http.delete(`${resource.api}/${props.id}`);
  useMessages().success(t('common.msg.deleted', { name: name ?? id }));
  await router.push({ name: resource.name });
};
</script>

<style lang="scss">
</style>
