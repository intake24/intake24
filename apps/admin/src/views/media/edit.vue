<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.id"
                disabled
                :error-messages="errors.get('id')"
                :label="$t('common.id')"
                name="id"
                prepend-inner-icon="$media"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.name"
                :error-messages="errors.get('name')"
                :label="$t('common.name')"
                name="name"
                prepend-inner-icon="$description"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { MediaEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';

type EditMediaForm = {
  id: string | null;
  modelType: string | null;
  modelId: string | null;
  name: string | null;
  collection: string | null;
};

export default defineComponent({
  name: 'MediaEdit',

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded } = useEntry<MediaEntry>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<
      EditMediaForm,
      MediaEntry
    >(props, {
      data: {
        id: null,
        modelType: null,
        modelId: null,
        name: null,
        collection: null,
      },
      editMethod: 'patch',
    });

    return {
      entry,
      entryLoaded,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
    };
  },
});
</script>

<style lang="scss"></style>
