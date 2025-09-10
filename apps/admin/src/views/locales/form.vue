<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
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
                :label="$t('locales.code')"
                name="code"
                prepend-inner-icon="$locales"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.englishName"
                :error-messages="errors.get('englishName')"
                hide-details="auto"
                :label="$t('locales.englishName')"
                name="englishName"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.localName"
                :error-messages="errors.get('localName')"
                hide-details="auto"
                :label="$t('locales.localName')"
                name="localName"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <select-resource
                v-model="data.respondentLanguageId"
                :error-messages="errors.get('respondentLanguageId')"
                :initial-item="entry.respondentLanguage"
                item-id="code"
                item-name="englishName"
                :label="$t('locales.respondentLanguageId')"
                name="respondentLanguageId"
                resource="languages"
                @update:model-value="errors.clear('respondentLanguageId')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <select-resource
                v-model="data.adminLanguageId"
                :error-messages="errors.get('adminLanguageId')"
                :initial-item="entry.adminLanguage"
                item-id="code"
                item-name="englishName"
                :label="$t('locales.adminLanguageId')"
                name="adminLanguageId"
                resource="languages"
                @update:model-value="errors.clear('adminLanguageId')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="data.countryFlagCode"
                :error-messages="errors.get('countryFlagCode')"
                hide-details="auto"
                :items="flags"
                :label="$t('locales.countryFlagCode')"
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
            <v-col cols="12" md="6">
              <div class="text-h5 mb-4">
                {{ $t('locales.foodIndex._') }}
              </div>
              <v-switch
                v-model="data.foodIndexEnabled"
                class="mb-4"
                hide-details="auto"
                :label="$t('locales.foodIndex.enabled')"
                name="foodIndexEnabled"
              />
              <v-select
                v-model="data.foodIndexLanguageBackendId"
                :error-messages="errors.get('foodIndexLanguageBackendId')"
                hide-details="auto"
                :items="foodIndexLanguageBackends"
                :label="$t('locales.foodIndex.languageBackend')"
                name="foodIndexLanguageBackendId"
                variant="outlined"
                @update:model-value="errors.clear('foodIndexLanguageBackendId')"
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
          </v-row>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm, useSelects } from '@intake24/admin/composables';
import type { RecordVisibility } from '@intake24/common/security';
import type { LocaleEntry, LocaleRefs } from '@intake24/common/types/http/admin';

type LocaleForm = {
  id: string | null;
  code: string | null;
  englishName: string | null;
  localName: string | null;
  respondentLanguageId: string;
  adminLanguageId: string;
  countryFlagCode: string | null;
  textDirection: string;
  foodIndexEnabled: boolean;
  foodIndexLanguageBackendId: string;
  visibility: RecordVisibility;
};

export default defineComponent({
  name: 'LocaleForm',

  components: { SelectResource },

  mixins: [formMixin],

  setup(props) {
    const { flags, textDirections, visibilities } = useSelects();

    const { entry, entryLoaded, isEdit, refs, refsLoaded } = useEntry<LocaleEntry, LocaleRefs>(
      props,
    );
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<LocaleForm, LocaleEntry>(props, {
      data: {
        id: null,
        code: null,
        englishName: null,
        localName: null,
        respondentLanguageId: 'en',
        adminLanguageId: 'en',
        countryFlagCode: null,
        textDirection: 'ltr',
        foodIndexEnabled: false,
        foodIndexLanguageBackendId: 'en',
        visibility: 'public',
      },
    });

    return {
      entry,
      entryLoaded,
      isEdit,
      flags,
      refs,
      refsLoaded,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
      textDirections,
      visibilities,
    };
  },

  computed: {
    foodIndexLanguageBackends() {
      if (!this.refs.foodIndexLanguageBackends)
        return [{ value: 'en', title: this.$t('common.none') }];

      return this.refs.foodIndexLanguageBackends.map(backend => ({
        value: backend.id,
        title: backend.name,
      }));
    },
  },
});
</script>

<style lang="scss" scoped></style>
