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
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { PermissionEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';

type PermissionForm = {
  id: string | null;
  name: string | null;
  displayName: string | null;
  description: string | null;
};

export default defineComponent({
  name: 'PermissionForm',

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded, isEdit } = useEntry<PermissionEntry>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<PermissionForm, PermissionEntry>(
      props,
      {
        data: { id: null, name: null, displayName: null, description: null },
      },
    );

    return {
      entry,
      entryLoaded,
      isEdit,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
    };
  },
});
</script>

<style scoped></style>
