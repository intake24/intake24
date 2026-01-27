<template>
  <layout v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.code"
                :disabled="isEdit"
                :error-messages="errors.get('code')"
                hide-details="auto"
                :label="$t('languages.code')"
                name="code"
                prepend-inner-icon="$languages"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="data.countryFlagCode"
                :error-messages="errors.get('countryFlagCode')"
                hide-details="auto"
                :items="flags"
                :label="$t('languages.countryFlagCode')"
                name="countryFlagCode"
                variant="outlined"
                @update:model-value="errors.clear('countryFlagCode')"
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props" :title="item.raw.title">
                    <template #prepend>
                      <span :class="`fi fi-${item.raw.value} mr-3`" />
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <span :class="`fi fi-${item.raw.value} mr-3`" />
                  {{ item.raw.title }}
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.englishName"
                :error-messages="errors.get('englishName')"
                hide-details="auto"
                :label="$t('languages.englishName')"
                name="englishName"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.localName"
                :error-messages="errors.get('localName')"
                hide-details="auto"
                :label="$t('languages.localName')"
                name="localName"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="data.textDirection"
                :error-messages="errors.get('textDirection')"
                hide-details="auto"
                :items="textDirections"
                :label="$t('languages.textDirections._')"
                name="textDirection"
                variant="outlined"
                @update:model-value="errors.clear('textDirection')"
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props" :title="item.raw.title">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon" start />
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <v-icon :icon="item.raw.icon" start />
                  {{ item.raw.title }}
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="data.visibility"
                :error-messages="errors.get('visibility')"
                hide-details="auto"
                :items="visibilities"
                :label="$t('securables.visibility._')"
                name="visibility"
                variant="outlined"
                @update:model-value="errors.clear('visibility')"
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props" :title="item.raw.title">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon" start />
                    </template>
                  </v-list-item>
                </template>
                <template #selection="{ item }">
                  <v-icon :icon="item.raw.icon" start />
                  {{ item.raw.title }}
                </template>
              </v-select>
            </v-col>
          </v-row>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { RecordVisibility } from '@intake24/common/security';
import type { LanguageEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm, useSelects } from '@intake24/admin/composables';

type LanguageForm = {
  id: string | null;
  code: string | null;
  englishName: string | null;
  localName: string | null;
  countryFlagCode: string;
  textDirection: string;
  visibility: RecordVisibility;
};

export default defineComponent({
  name: 'LanguageForm',

  mixins: [formMixin],

  setup(props) {
    const { flags, textDirections, visibilities } = useSelects();

    const { entry, entryLoaded, isEdit } = useEntry<LanguageEntry>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<LanguageForm, LanguageEntry>(
      props,
      {
        data: {
          id: null,
          code: null,
          englishName: null,
          localName: null,
          countryFlagCode: 'gb',
          textDirection: 'ltr',
          visibility: 'public',
        },
      },
    );

    return {
      entry,
      entryLoaded,
      flags,
      isEdit,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
      textDirections,
      visibilities,
    };
  },
});
</script>

<style lang="scss" scoped></style>
