<template>
  <v-card class="mb-2" flat rounded="xl">
    <v-toolbar class="toolbar-items" color="surface">
      <v-breadcrumbs v-if="breadcrumbs.length" class="px-1 py-2" :items="breadcrumbs">
        <template #divider>
          <v-icon icon="fas fa-caret-right" />
        </template>
      </v-breadcrumbs>
      <v-spacer />
      <slot name="create">
        <v-btn
          v-if="actions && canCreate"
          color="primary"
          rounded="pill"
          :title="$t(`${resource.name}.create`)"
          :to="{ name: `${resource.name}-create` }"
        >
          <v-icon icon="$create" start />
          {{ $t(`${resource.name}.create`) }}
        </v-btn>
      </slot>
      <slot name="actions" />
    </v-toolbar>
    <v-divider />
    <slot />
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import { computed } from 'vue';

import { useBreadcrumbs } from '@intake24/admin/composables/use-breadcrumbs.ts';
import resources from '@intake24/admin/router/resources';
import { useResource, useUser } from '@intake24/admin/stores';

defineOptions({ name: 'BrowseLayout' });

defineProps({
  actions: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
});

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
