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
                :label="$t('drinkware-sets.id')"
                name="id"
                prepend-inner-icon="$drinkware-sets"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.imageMapId"
                disabled
                :error-messages="errors.get('imageMapId')"
                :label="$t('image-maps._')"
                name="imageMapId"
                prepend-inner-icon="$image-maps"
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
          <v-row>
            <v-col cols="12" md="6">
              <v-card flat>
                <v-card-title>{{ $t('drinkware-sets.imageMapTitle') }}</v-card-title>
                <v-card-subtitle> {{ $t('drinkware-sets.imageMapSubtitle') }} </v-card-subtitle>
                <v-card-text>
                  <image-placeholder v-if="imageMapLoading" />
                  <drinkware-object-chooser
                    v-if="imageMapData"
                    :id="selectedObjectId"
                    :config="{
                      labels: false,
                      pinchZoom: false,
                    }"
                    :image-map-data="imageMapData"
                    :index="selectedObjectIndex"
                    @confirm="onObjectConfirmed"
                    @select="onObjectSelected"
                  />
                </v-card-text>
              </v-card>
              <v-card v-if="selectedScale" class="mt-4" flat>
                <v-card-title>{{ $t('drinkware-sets.label.title') }}</v-card-title>
                <v-card-text>
                  <language-selector
                    v-model="selectedScale.label"
                    border
                    :label="$t('guide-images.objects.label._')"
                  >
                    <template v-for="lang in Object.keys(selectedScale.label)" :key="lang" #[`lang.${lang}`]>
                      <v-text-field
                        v-model="selectedScale.label[lang]"
                        :label="$t('guide-images.objects.label._')"
                      />
                    </template>
                  </language-selector>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <!-- No object selected -->
              <v-card v-if="selectedObjectId === undefined" flat>
                <v-card-title>{{ $t('drinkware-sets.selector.empty.title') }}</v-card-title>
                <v-card-text>{{ $t('drinkware-sets.selector.empty.text') }}</v-card-text>
              </v-card>
              <!-- Object selected, but scale data is undefined -->
              <v-card v-if="selectedObjectId !== undefined && selectedScaleIndex === -1" flat>
                <v-card-title>
                  <v-icon class="mx-2">
                    fas fa-exclamation-circle
                  </v-icon>{{ $t('drinkware-sets.slidingScale.missing.title') }}
                </v-card-title>
                <v-card-text>{{ $t('drinkware-sets.slidingScale.missing.text') }}</v-card-text>
                <v-expand-transition>
                  <v-card v-if="baseImagePreviewUrls[selectedObjectId]" flat>
                    <v-card-title>
                      {{
                        $t('drinkware-sets.slidingScale.imagePreview')
                      }}
                    </v-card-title>
                    <v-card-text>
                      <v-img
                        :src="baseImagePreviewUrls[selectedObjectId]"
                        style="width: 50%"
                      />
                    </v-card-text>
                  </v-card>
                </v-expand-transition>
                <v-card flat>
                  <v-card-title>{{ $t('drinkware-sets.slidingScale.baseImageFile') }}</v-card-title>
                  <v-card-text>
                    <v-file-input
                      v-model="baseImageFiles[selectedObjectId]"
                      :label="$t('image-maps.baseImage')"
                      name="baseImage"
                      prepend-icon=""
                      prepend-inner-icon="fas fa-paperclip"
                    />
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      color="primary"
                      :disabled="!baseImageFiles[selectedObjectId]"
                      size="large"
                      @click="createSlidingScale(selectedObjectId)"
                    >
                      <v-icon class="mr-2">
                        fas fa-file-circle-plus
                      </v-icon>{{ $t('drinkware-sets.slidingScale.createButtonLabel') }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-card>
              <!-- Object selected and sliding scale is available  -->
              <div v-if="selectedObjectId !== undefined && selectedScaleIndex !== -1">
                <sliding-scale-editor
                  :scale-index="selectedScaleIndex"
                  @base-image-changed="onBaseImageChanged"
                />
                <v-card flat>
                  <v-card-title>
                    {{ $t('drinkware-sets.volumeMethod.title') }}
                  </v-card-title>
                  <v-card-text>
                    <v-select
                      v-if="selectedObjectId !== undefined && selectedScaleIndex !== -1"
                      v-model="entry.scales[selectedScaleIndex].volumeMethod"
                      item-value="method"
                      :items="volumeMethodSelectList"
                      :label="$t('drinkware-sets.volumeMethod.title')"
                    />
                  </v-card-text>
                </v-card>
                <volume-samples-table
                  class="mt-4"
                  :scale-index="selectedScaleIndex"
                />
              </div>
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
import { mapValues } from 'lodash-es';
import { computed, defineComponent, onUnmounted, ref, watch } from 'vue';
import { formMixin } from '@intake24/admin/components/entry';
import { LanguageSelector } from '@intake24/admin/components/forms';
import ImagePlaceholder from '@intake24/admin/components/util/ImagePlaceholder.vue';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import resources from '@intake24/admin/router/resources';
import { useHttp } from '@intake24/admin/services';
import type { LocaleTranslation } from '@intake24/common/types';
import type { ImageMapResponse } from '@intake24/common/types/http';
import type { DrinkwareScaleV2Entry, DrinkwareSetEntry, UpdateDrinkwareScaleInput } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/ui';
import DrinkwareObjectChooser from './components/DrinkwareObjectChooser.vue';
import SlidingScaleEditor from './components/SlidingScaleEditor.vue';
import VolumeSamplesTable from './components/VolumeSamplesTable.vue';

type EditDrinkwareSetForm = {
  id: string | null;
  description: string | null;
  imageMapId: string | null;
  label: LocaleTranslation;
  scales: UpdateDrinkwareScaleInput[];
  baseImage: Record<string, File>;
};

export default defineComponent({
  name: 'EditDrinkwareSetForm',

  components: {
    LanguageSelector,
    VolumeSamplesTable,
    SlidingScaleEditor,
    DrinkwareObjectChooser,
    ImagePlaceholder,
  },

  mixins: [formMixin],

  setup(props) {
    const http = useHttp();
    const { entry, entryLoaded } = useEntry<DrinkwareSetEntry>(props);
    useEntryFetch(props);
    const {
      clearError,
      form,
      routeLeave,
      submit: formSubmit,
    } = useEntryForm<EditDrinkwareSetForm, DrinkwareSetEntry>(props, {
      config: { multipart: true },
      data: { id: null, imageMapId: null, description: null, scales: [], baseImage: {}, label: {} },
    });
    const { data, errors } = form;

    const { i18n: { t } } = useI18n();

    const imageMapEntryUrl = resources.find(r => r.name === 'image-maps')?.api;

    const imageMapData = ref<ImageMapResponse | undefined>(undefined);
    const imageMapLoading = ref(false);

    const selectedObjectId = ref<string | undefined>(undefined);
    const selectedObjectIndex = ref<number | undefined>(undefined);

    const selectedScaleIndex = computed(() => {
      if (selectedObjectId.value === undefined)
        return -1;

      const index = entry.value.scales.findIndex(
        scale => scale.choiceId.toString() === selectedObjectId.value,
      );

      return index;
    });

    const selectedScale = computed(() => {
      if (selectedScaleIndex.value === -1)
        return undefined;
      return entry.value.scales[selectedScaleIndex.value];
    });

    const baseImageFiles = ref<Record<string, File>>({});

    const baseImagePreviewUrls = ref<Record<string, string>>({});

    function releasePreviewObjectURLs() {
      for (const url of Object.values(baseImagePreviewUrls.value))
        URL.revokeObjectURL(url);
    }

    watch(baseImageFiles.value, (newValue) => {
      releasePreviewObjectURLs();
      baseImagePreviewUrls.value = mapValues(newValue, (file) => {
        return URL.createObjectURL(file);
      });
    });

    onUnmounted(() => {
      releasePreviewObjectURLs();

      if (entry.value.scales !== undefined) {
        for (const scale of entry.value.scales)
          URL.revokeObjectURL(scale.baseImageUrl);
      }
    });

    let loadedImageMapId: string | undefined;

    watch(entry, async (newEntry) => {
      if (loadedImageMapId !== newEntry.imageMapId) {
        imageMapLoading.value = true;

        if (imageMapEntryUrl !== undefined) {
          // This is clunky, there should be a better way to access other resources
          imageMapData.value = (await http.get(`${imageMapEntryUrl}/${newEntry.imageMapId}`))
            .data as ImageMapResponse;
          imageMapLoading.value = false;
          loadedImageMapId = newEntry.imageMapId;
        }
        else {
          console.error(`Couldn't find API configuration for resource 'image-maps'`);
        }
      }
    });

    const createSlidingScale = (objectId: string) => {
      entry.value.scales.push({
        version: 2,
        choiceId: objectId,
        baseImageUrl: baseImagePreviewUrls.value[objectId] || '',
        label: {},
        volumeSamples: [],
        volumeSamplesNormalised: [],
        volumeMethod: 'lookUpTable',
        outlineCoordinates: [],
      });
    };

    const onObjectSelected = (index: number, id: string) => {
      selectedObjectIndex.value = index;
      selectedObjectId.value = id;
    };
    const onObjectConfirmed = () => {};

    const toUrl = (file: File) => {
      if (file)
        return URL.createObjectURL(file);
      return undefined;
    };

    const submit = () => {
      const scaleFields = entry.value.scales.filter(s => s.version === 2).map((s) => {
        const v2 = s as DrinkwareScaleV2Entry;

        return {
          choiceId: v2.choiceId,
          label: v2.label,
          outlineCoordinates: v2.outlineCoordinates,
          volumeSamples: v2.volumeSamples,
          volumeMethod: v2.volumeMethod,
        };
      });

      for (const [objectId, baseImageFile] of Object.entries(baseImageFiles.value))
        data.value.baseImage[`choiceId-${objectId}`] = baseImageFile;

      data.value.scales = scaleFields;

      formSubmit();
    };

    const onBaseImageChanged = (objectId: string, newBaseImage: File) => {
      baseImageFiles.value[objectId] = newBaseImage;
    };

    const volumeMethodSelectList
      = [{
        method: 'lookUpTable',
        title: t('drinkware-sets.volumeMethod.lookUpTable'),
      }, {
        method: 'cylindrical',
        title: t('drinkware-sets.volumeMethod.cylindrical'),
      }];

    return {
      entry,
      entryLoaded,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
      imageMapLoading,
      imageMapData,
      selectedObjectId,
      selectedObjectIndex,
      selectedScaleIndex,
      selectedScale,
      onObjectSelected,
      onObjectConfirmed,
      createSlidingScale,
      baseImagePreviewUrls,
      baseImageFiles,
      onBaseImageChanged,
      toUrl,
      volumeMethodSelectList,
    };
  },
});
</script>

<style lang="scss"></style>
