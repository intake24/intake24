<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="data.name"
                :disabled="isEdit"
                :error-messages="errors.get('name')"
                hide-details="auto"
                :label="$t('common.name')"
                name="name"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="data.displayName"
                :error-messages="errors.get('displayName')"
                hide-details="auto"
                :label="$t('common.displayName')"
                name="displayName"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="data.description"
                :error-messages="errors.get('description')"
                hide-details="auto"
                :label="$t('common.description')"
                name="description"
                prepend-inner-icon="$description"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <v-card-title>{{ $t('permissions.title') }}</v-card-title>
          <v-row>
            <v-col key="global" cols="4">
              <v-card height="100%">
                <v-card-title>
                  <h6>{{ $t('permissions.groups.global') }}</h6>
                </v-card-title>
                <v-card-text>
                  <v-switch
                    v-for="perm in permissions.global"
                    :key="perm.id"
                    v-model="data.permissions"
                    :disabled="!can(perm.name)"
                    :label="perm.displayName"
                    :value="perm.id"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          <template v-for="group in ['resources', 'surveys', 'fdbs']" :key="`${group}-title`">
            <v-card-title cols="12">
              <v-card-title>{{ $t(`permissions.groups.${group}`) }}</v-card-title>
            </v-card-title>
            <v-row>
              <v-col v-for="(pModule, key) in permissions[group]" :key="key" cols="4">
                <v-card height="100%">
                  <v-card-title>
                    <h6 v-if="group === 'resources'">
                      {{ $t(`${key}.title`) }}
                    </h6>
                    <h6 v-else>
                      {{ $t(`${group}._`) }} {{ key }}
                    </h6>
                  </v-card-title>
                  <v-card-text>
                    <v-switch
                      v-for="perm in pModule"
                      :key="perm.id"
                      v-model="data.permissions"
                      :disabled="!can(perm.name)"
                      :label="perm.displayName"
                      :value="perm.id"
                    />
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </template>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { PermissionListEntry, RoleEntry, RoleRefs } from '@intake24/common/types/http/admin';

import { orderBy } from 'lodash-es';
import { defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import resources from '@intake24/admin/router/resources';

type RoleForm = {
  id: string | null;
  name: string | null;
  displayName: string | null;
  description: string | null;
  permissions: string[];
};

type PermissionGroup = Record<string, PermissionListEntry[]>;

type PermissionGroups = {
  global: PermissionListEntry[];
  resources: PermissionGroup;
  surveys: PermissionGroup;
  fdbs: PermissionGroup;
};

export default defineComponent({
  name: 'RoleForm',

  mixins: [formMixin],

  setup(props) {
    const loadCallback = (data: Partial<RoleEntry>) => {
      const { permissions = [], ...rest } = data;
      return { ...rest, permissions: permissions.map(item => item.id) };
    };

    const { entry, entryLoaded, isEdit, refs, refsLoaded } = useEntry<RoleEntry, RoleRefs>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<RoleForm, RoleEntry>(props, {
      data: { id: null, name: null, displayName: null, description: null, permissions: [] },
      loadCallback,
    });

    return {
      entry,
      entryLoaded,
      isEdit,
      refs,
      refsLoaded,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
    };
  },

  computed: {
    permissions() {
      const groups: PermissionGroups = {
        global: [],
        resources: {},
        surveys: {},
        fdbs: {},
      };

      const { permissions } = this.refs;
      if (!permissions)
        return groups;

      const resourceNames = resources.map(({ name }) => name);

      return orderBy(permissions, 'name').reduce((acc, permission) => {
        if (permission.name.includes(':') || resourceNames.includes(permission.name)) {
          const key = permission.name.split(':')[0];
          if (!(key in acc.resources))
            acc.resources[key] = [];

          acc.resources[key].push(permission);
          return acc;
        }

        if (permission.name.includes('/')) {
          const [first, second] = permission.name.split('/');
          let key;
          let section: 'surveys' | 'fdbs';

          if (permission.name.startsWith('fdbm/')) {
            key = second;
            section = 'fdbs';
          }
          else {
            key = first;
            section = 'surveys';
          }

          if (!(key in acc[section]))
            acc[section][key] = [];

          acc[section][key].push(permission);
          return acc;
        }

        acc.global.push(permission);
        return acc;
      }, groups);
    },
  },
});
</script>

<style scoped></style>
