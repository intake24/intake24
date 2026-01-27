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
                :label="$t('as-served-sets.id')"
                name="id"
                prepend-inner-icon="$as-served-sets"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.description"
                :error-messages="errors.get('description')"
                :label="$t('common.description')"
                name="description"
                prepend-inner-icon="$description"
              />
            </v-col>
            <v-col cols="12">
              <language-selector
                v-if="data.label"
                v-model="data.label"
                border
                :label="$t('common.label')"
              >
                <template v-for="lang in Object.keys(data.label)" :key="lang" #[`lang.${lang}`]>
                  <v-text-field
                    v-if="data.label"
                    v-model="data.label[lang]"
                    :error-messages="errors.get('label')"
                    :label="$t('common.label')"
                  />
                </template>
              </language-selector>
            </v-col>
          </v-row>
        </v-card-text>
        <error-list :errors="nonInputErrors" tag="v-card-text" />
        <as-served-images
          :items="entry.images"
          :set-id="entry.id"
          @images="updateImages"
        />
        <v-card-text>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { LocaleTranslation } from '@intake24/common/types';
import type { AsServedImageEntry, AsServedSetEntry } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';

import AsServedImages from './images.vue';

type EditAsServedSetForm = {
  id: string | null;
  description: string | null;
  label: LocaleTranslation;
  images: AsServedImageEntry[];
};

export default defineComponent({
  name: 'EditAsServedSetForm',

  components: { AsServedImages, LanguageSelector },

  mixins: [formMixin],

  setup(props) {
    const loadCallback = (data: AsServedSetEntry) => {
      const { images, ...rest } = data;
      return { ...rest, images: images.map(({ id, weight }) => ({ id, weight })) };
    };

    const { entry, entryLoaded } = useEntry<AsServedSetEntry>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, nonInputErrors, routeLeave, submit } = useEntryForm<
      EditAsServedSetForm,
      AsServedSetEntry
    >(props, {
      data: { id: null, description: null, label: {}, images: [] },
      loadCallback,
      nonInputErrorKeys: ['images'],
    });

    function updateImages(images: AsServedImageEntry[]) {
      errors.clear('images');

      data.value.images = [...images];
    };

    return {
      entry,
      entryLoaded,
      clearError,
      data,
      errors,
      nonInputErrors,
      routeLeave,
      submit,
      updateImages,
    };
  },
});
</script>

<style lang="scss"></style>
