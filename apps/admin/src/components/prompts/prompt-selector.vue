<template>
  <v-dialog
    v-model="dialog.show"
    fullscreen
    no-click-animation
    persistent
    :retain-focus="false"
    :scrim="false"
    transition="dialog-bottom-transition"
    :z-index="1050"
  >
    <v-card tile>
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
        <v-toolbar-title>
          {{ $t(`survey-schemes.prompts.${dialog.index === -1 ? 'create' : 'edit'}`) }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save">
            <v-icon icon="$success" start />{{ $t('common.action.ok') }}
          </v-btn>
        </v-toolbar-items>
        <template #extension>
          <v-container :fluid="$vuetify.display.mdAndDown">
            <v-tabs v-model="tab" bg-color="secondary">
              <v-tab
                v-for="item in promptSettings[dialog.prompt.component].tabs"
                :key="item"
                :value="item"
              >
                {{ item }}
              </v-tab>
            </v-tabs>
          </v-container>
        </template>
      </v-toolbar>
      <v-form ref="form" @submit.prevent="save">
        <v-container class="prompt-container" :fluid="$vuetify.display.mdAndDown">
          <error-list v-bind="{ errors }" />
          <v-tabs-window v-model="tab" class="pt-1 flex-grow-1">
            <v-tabs-window-item key="general" value="general">
              <v-row>
                <v-col cols="12">
                  <v-card border flat>
                    <v-toolbar color="grey-lighten-4">
                      <v-icon end icon="fas fa-fingerprint" />
                      <v-toolbar-title>
                        {{ $t('survey-schemes.prompts.internal._') }}
                      </v-toolbar-title>
                    </v-toolbar>
                    <v-container fluid>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="dialog.prompt.id"
                            :disabled="isOverrideMode"
                            hide-details="auto"
                            :label="$t('survey-schemes.prompts.internal.id._')"
                            :messages="$t('survey-schemes.prompts.internal.id.hint')"
                            variant="outlined"
                          />
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="dialog.prompt.name"
                            :disabled="isOverrideMode"
                            hide-details="auto"
                            :label="$t('survey-schemes.prompts.internal.name._')"
                            :messages="$t('survey-schemes.prompts.internal.name.hint')"
                            variant="outlined"
                          />
                        </v-col>
                        <v-col v-if="dialog.prompt.type === 'custom'" cols="12" md="6">
                          <v-text-field
                            v-model="dialog.prompt.group"
                            :disabled="isOverrideMode"
                            hide-details="auto"
                            :label="$t('survey-schemes.prompts.internal.group._')"
                            :messages="$t('survey-schemes.prompts.internal.group.hint')"
                            variant="outlined"
                          />
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-card>
                </v-col>
                <v-col v-if="!isOverrideMode" cols="12">
                  <v-card border flat>
                    <v-toolbar color="grey-lighten-4">
                      <v-icon end icon="fas fa-circle-question" />
                      <v-toolbar-title>
                        {{ $t(`survey-schemes.prompts.type`) }}
                      </v-toolbar-title>
                      <template #extension>
                        <v-tabs v-model="promptTypeTab">
                          <v-tab
                            v-for="type in Object.keys(availableGroupedPrompts)"
                            :key="type"
                            class="font-weight-medium"
                          >
                            {{ $t(`survey-schemes.prompts.${type}._`) }}
                          </v-tab>
                        </v-tabs>
                      </template>
                    </v-toolbar>
                    <v-item-group
                      v-model="dialog.prompt.component"
                      selected-class="primary"
                      @update:model-value="updatePromptProps"
                    >
                      <v-tabs-window v-model="promptTypeTab">
                        <prompt-type-selector
                          v-for="(items, type) in availableGroupedPrompts"
                          :key="type"
                          v-bind="{ prompts: items, type }"
                        />
                      </v-tabs-window>
                    </v-item-group>
                  </v-card>
                </v-col>
              </v-row>
            </v-tabs-window-item>
            <prompt-content
              v-model:i18n="dialog.prompt.i18n"
              :component="dialog.prompt.component"
            />
            <prompt-actions v-model:actions="dialog.prompt.actions" />
            <prompt-conditions v-model:conditions="dialog.prompt.conditions" :prompt-section="section" />
            <prompt-validation
              v-if="
                'validation' in dialog.prompt
                  && promptSettings[dialog.prompt.component].tabs.includes('validation')
              "
              v-model:validation="dialog.prompt.validation"
              :limits="dialog.prompt.component === 'checkbox-list-prompt'"
            />
            <component
              :is="dialog.prompt.component"
              v-bind="dialog.prompt"
              @update:options="updateOptions"
              @validate="validate"
            />
            <prompt-json v-model="dialog.prompt" />
          </v-tabs-window>
          <v-card-actions>
            <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
              <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-card-actions>
        </v-container>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import type { VForm } from 'vuetify/components';

import { defineComponent, ref, useTemplateRef } from 'vue';
import { ErrorList } from '@intake24/admin/components/forms';
import {
  customPrompts,
  portionSizePrompts,
  promptSettings,
  standardPrompts,
} from '@intake24/admin/components/prompts';
import type { Prompt, PromptType } from '@intake24/common/prompts';
import {
  customPrompts as customPromptDefaults,
  portionSizePrompts as portionSizeDefaults,
  standardPrompts as standardPromptDefaults,
} from '@intake24/common/prompts';

import type { PromptSection } from '@intake24/common/surveys';
import { copy, merge } from '@intake24/common/util';
import { useTinymce } from '../editors';
import {
  PromptActions,
  PromptConditions,
  PromptContent,
  PromptJson,
  PromptValidation,
} from './partials';
import PromptTypeSelector from './prompt-type-selector.vue';

export type EditPrompt = Prompt & {
  origId?: string;
};

export type PromptDialog = {
  show: boolean;
  index: number;
  prompt: EditPrompt;
};

export default defineComponent({
  name: 'PromptSelector',

  components: {
    ErrorList,
    PromptActions,
    PromptConditions,
    PromptContent,
    PromptJson,
    PromptTypeSelector,
    PromptValidation,
    ...customPrompts,
    ...standardPrompts,
    ...portionSizePrompts,
  },

  props: {
    mode: {
      type: String as PropType<'full' | 'override'>,
      default: 'full',
    },
    section: {
      type: String as PropType<PromptSection>,
    },
    promptIds: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },

  emits: ['save'],

  setup() {
    useTinymce();

    const errors = ref<string[]>([]);
    const form = useTemplateRef<InstanceType<typeof VForm>>('form');

    return { errors, form };
  },

  data() {
    const prompts = [...customPromptDefaults, ...standardPromptDefaults, ...portionSizeDefaults];

    const groupedPrompts: Record<PromptType, Prompt[]> = {
      custom: customPromptDefaults,
      standard: standardPromptDefaults,
      'portion-size': portionSizeDefaults,
    };

    const dialog: PromptDialog = {
      show: false,
      index: -1,
      prompt: copy(prompts[0]),
    };

    return {
      dialog,
      prompts,
      groupedPrompts,
      promptSettings,
      tab: 'general',
      promptTypeTab: 0,
    };
  },

  computed: {
    isOverrideMode(): boolean {
      return this.mode === 'override';
    },
    availablePrompts(): Prompt[] {
      const { section } = this;
      if (!section)
        return this.prompts;

      return this.prompts.filter(prompt =>
        this.promptSettings[prompt.component].sections.includes(section),
      );
    },
    availableGroupedPrompts(): Record<PromptType, Prompt[]> {
      const { section } = this;
      if (!section)
        return this.groupedPrompts;

      return Object.entries(this.groupedPrompts).reduce(
        (acc, [key, value]) => {
          acc[key as PromptType] = value.filter(prompt =>
            this.promptSettings[prompt.component].sections.includes(section),
          );
          return acc;
        },
        {} as Record<PromptType, Prompt[]>,
      );
    },
  },

  methods: {
    newDialog(show = false): PromptDialog {
      return {
        show,
        index: -1,
        prompt: copy(this.availablePrompts[0]),
      };
    },

    updatePromptProps() {
      const { show, index, prompt } = this.dialog;
      const { component } = prompt;

      const newPrompt
        = this.availablePrompts.find(item => item.component === component)
          ?? this.availablePrompts[0];
      if (!newPrompt)
        return;

      this.dialog = {
        show,
        index,
        prompt: copy(newPrompt),
      };
    },

    updatePromptTypeTab(type: Prompt['type']) {
      switch (type) {
        case 'standard':
          this.promptTypeTab = 1;
          break;
        case 'portion-size':
          this.promptTypeTab = 2;
          break;
        default:
          this.promptTypeTab = 0;
      }
    },

    create() {
      this.dialog = this.newDialog(true);
      this.updatePromptTypeTab(this.dialog.prompt.type);
    },

    edit(index: number, prompt: Prompt, errors: string[]) {
      const promptDefaults = this.prompts.find(p => p.component === prompt.component);
      if (!promptDefaults) {
        console.warn(`Prompt defaults for prompt type '${prompt.component}' not found.`);
        return;
      }

      this.updatePromptTypeTab(prompt.type);

      this.dialog = {
        show: true,
        index,
        prompt: { origId: prompt.id, ...merge<Prompt>(promptDefaults, prompt) },
      };
      this.errors = [...errors];
    },

    async save() {
      const { valid } = await this.form?.validate() || {};
      if (!valid)
        return;

      const {
        index,
        prompt: { origId, i18n, ...rest },
      } = this.dialog;

      for (const [key, value] of Object.entries(i18n)) {
        if (!Object.keys(value).length)
          delete i18n[key];
      }

      this.$emit('save', { prompt: { i18n, ...rest }, index });

      this.reset();
    },

    reset() {
      this.tab = 'general';
      this.promptTypeTab = 0;
      this.dialog = this.newDialog();
      this.form?.resetValidation();
    },

    updateOptions(options: Partial<Prompt>) {
      this.dialog.prompt = merge<Prompt>(this.dialog.prompt, options);
    },

    validate() {
      this.form?.validate();
    },
  },
});
</script>

<style lang="scss" scoped>
.prompt-container {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 112px);
}
</style>
