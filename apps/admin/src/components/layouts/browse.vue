<template>
  <v-card border class="ma-2 pa-4" flat rounded="xl">
    <v-toolbar color="surface">
      <v-breadcrumbs v-if="breadcrumbs.length" class="px-1 py-2" :items="breadcrumbs">
        <template #divider>
          <v-icon icon="fas fa-caret-right" />
        </template>
      </v-breadcrumbs>
      <v-spacer />
      <div class="d-flex align-center gc-2">
        <v-menu
          v-if="slots.actions"
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
          </v-list>
        </v-menu>
        <slot name="create">
          <v-btn
            v-if="canCreate"
            color="primary"
            rounded="pill"
            :title="$t(`${resource.name}.create`)"
            :to="{ name: `${resource.name}-create` }"
          >
            <v-icon icon="$create" start />
            {{ $t(`${resource.name}.create`) }}
          </v-btn>
        </slot>
      </div>
    </v-toolbar>
    <slot />
  </v-card>
</template>

<script lang="ts" setup>
import { computed, useSlots } from 'vue';

import { useBreadcrumbs } from '@intake24/admin/composables/use-breadcrumbs.ts';
import resources from '@intake24/admin/router/resources';
import { useResource, useUser } from '@intake24/admin/stores';

defineOptions({ name: 'BrowseLayout' });

const slots = useSlots();

const resource = useResource();
const { can } = useUser();

const resourceDef = computed(
  () => resources.find(item => item.name === resource.name),
);

const canCreate = computed(() => resourceDef.value?.routes.includes('create') && can({ action: 'create' }));

const { breadcrumbs } = useBreadcrumbs();
</script>

<style lang="scss">
</style>
