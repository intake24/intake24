<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-icon end icon="fas fa-sliders" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.slider.title') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-container>
      <v-row>
        <v-col class="pa-0 pr-1" cols="12" md="6">
          <v-card flat>
            <v-tabs v-model="tab" grow>
              <v-tab
                v-for="item in tabs"
                :key="item"
                :title="$t(`survey-schemes.prompts.slider.${item}.value`)"
                :value="item"
              >
                {{ $t(`survey-schemes.prompts.slider.${item}.value`) }}
              </v-tab>
            </v-tabs>
            <v-card-text>
              <v-tabs-window v-model="tab" class="pt-1">
                <v-tabs-window-item v-for="item in tabs" :key="item" :value="item">
                  <v-text-field
                    hide-details="auto"
                    :label="$t(`survey-schemes.prompts.slider.${item}.value`)"
                    :model-value="slider[item].value"
                    :name="`${item}.value`"
                    variant="outlined"
                    @update:model-value="
                      slider[item].value = Number.isNaN(parseFloat($event))
                        ? null
                        : parseFloat($event)
                    "
                  />
                  <v-switch
                    class="mb-4"
                    hide-details="auto"
                    :label="$t(`survey-schemes.prompts.slider.${item}.label`)"
                    :model-value="slider[item].label"
                    @update:model-value="updateLabel(item, $event)"
                  />
                  <language-selector
                    v-if="slider[item].label"
                    v-model="slider[item].label"
                    :label="$t(`survey-schemes.prompts.slider.${item}.label`)"
                  >
                    <template v-for="lang in Object.keys(slider[item].label)" :key="lang" #[`lang.${lang}`]>
                      <v-text-field

                        v-model="slider[item].label[lang]"
                        hide-details="auto"
                        :label="$t(`survey-schemes.prompts.slider.${item}.label`)"
                        :name="`${item}.label.${lang}`"
                        variant="outlined"
                      />
                    </template>
                  </language-selector>
                  <v-text-field
                    v-if="item === 'current'"
                    v-model.number="slider[item].size"
                    hide-details="auto"
                    :label="$t(`survey-schemes.prompts.slider.${item}.size`)"
                    :name="`${item}.size`"
                    :rules="isNumber"
                    variant="outlined"
                  />
                </v-tabs-window-item>
              </v-tabs-window>
            </v-card-text>
          </v-card>
        </v-col>
        <v-divider vertical />
        <v-col cols="12" md="6">
          <v-card-text>
            <v-text-field
              v-model.number="slider.step"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.slider.step')"
              name="step"
              :rules="isNumber"
              variant="outlined"
            />
            <v-switch
              v-if="!hideConfirm"
              v-model="slider.confirm"
              hide-details="auto"
              :label="$t('survey-schemes.prompts.slider.confirm')"
            />
          </v-card-text>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, ref } from 'vue';

import { LanguageSelector } from '@intake24/admin/components/forms';
import type { Slider } from '@intake24/common/prompts';

export default defineComponent({
  name: 'SliderSettings',

  components: { LanguageSelector },

  props: {
    hideConfirm: {
      type: Boolean as PropType<boolean>,
    },
    modelValue: {
      type: Object as PropType<Slider>,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const tabs = ['current', 'min', 'max'] as const;
    const tab = ref(tabs[0]);
    const isNumber = computed(() => [
      (value: string | null): boolean | string =>
        !Number.isNaN(value) || 'Value needs to be a number.',
    ]);

    const slider = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emit('update:modelValue', value);
      },
    });

    const updateLabel = (key: keyof Pick<Slider, 'current' | 'min' | 'max'>, value: boolean) => {
      slider.value[key].label = value ? { en: '' } : false;
    };

    return { isNumber, slider, updateLabel, tab, tabs };
  },
});
</script>

<style lang="scss" scoped></style>
