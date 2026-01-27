<template>
  <v-tabs-window-item value="content">
    <div class="d-flex flex-row">
      <v-tabs v-model="selectedKey" direction="vertical">
        <v-tab v-for="key in keys" :key="key" class="justify-start" :value="key">
          <v-icon icon="$languages" start />{{ key }}
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="selectedKey" class="flex-grow-1">
        <v-tabs-window-item v-for="key in keys" :key="key" class="pl-3" :value="key">
          <v-card border flat>
            <v-toolbar color="grey-lighten-4">
              <v-toolbar-title>
                <i18n-t keypath="survey-schemes.i18n.core">
                  <template #key>
                    <span class="font-weight-medium">{{ key }}</span>
                  </template>
                </i18n-t>
              </v-toolbar-title>
            </v-toolbar>
            <v-alert
              v-for="lang in getAvailableLanguages(key, items)"
              :key="lang"
              class="mb-0"
              tile
              type="info"
            >
              <template #prepend>
                <span :class="`fi fi-${lang} mr-3`" />
              </template>
              <template #default>
                <template v-if="$t(`prompts.${promptType}.${key}`, lang)">
                  <div
                    v-if="key.includes('description')"
                    v-html="$t(`prompts.${promptType}.${key}`, lang)"
                  />
                  <div v-else>
                    {{ $t(`prompts.${promptType}.${key}`, lang) }}
                  </div>
                </template>
                <div v-else>
                  {{ $t('survey-schemes.i18n.none') }}
                </div>
              </template>
            </v-alert>
            <template v-if="items[key]">
              <language-selector
                v-if="items[key]"
                v-model="items[key]"
                :label="$t(`survey-schemes.i18n.custom`, { key })"
                tile
                @lang-add="loadLanguage"
                @lang-remove="removeKey(key)"
              >
                <template v-for="lang in Object.keys(items[key])" :key="lang" #[`lang.${lang}`]>
                  <html-editor
                    v-if="richTextOnly.includes(key.toString())"
                    v-model="items[key][lang]"
                  />
                  <v-text-field
                    v-else
                    v-model="items[key][lang]"
                    hide-details="auto"
                    :label="$t(`survey-schemes.i18n.custom`, { key })"
                    variant="outlined"
                  />
                </template>
              </language-selector>
            </template>
            <v-card v-else flat link min-height="100px" @click="addKey(key)">
              <v-card-title class="d-flex justify-center font-weight-medium">
                {{ $t('survey-schemes.i18n.init') }}
              </v-card-title>
              <v-card-text class="d-flex justify-center align-center">
                <v-btn color="secondary" icon="$add" size="x-large" />
              </v-card-text>
            </v-card>
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { BasePrompt, ComponentType } from '@intake24/common/prompts';

import { useVModel } from '@vueuse/core';
import { get } from 'lodash-es';
import { computed, ref } from 'vue';

import { HtmlEditor } from '@intake24/admin/components/editors';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { getObjectNestedKeys } from '@intake24/common/util';
import { promptType as getPromptType, loadAdminLanguage, useI18n } from '@intake24/ui';

defineOptions({ name: 'PromptContent' });

const props = defineProps({
  component: {
    type: String as PropType<ComponentType>,
    required: true,
  },
  i18n: {
    type: Object as PropType<BasePrompt['i18n']>,
    required: true,
  },
});

const emit = defineEmits(['update:i18n']);

const { i18n } = useI18n();
const items = useVModel(props, 'i18n', emit);

const richTextOnly = ['description'];

const promptType = computed(() => getPromptType(props.component));

const keys = computed(() => {
  const messageObject = get(i18n.messages.value.en, `prompts.${promptType.value}`);
  if (messageObject === undefined)
    console.error(`Missing translation object: ${`prompts.${promptType.value}`}`);
  return getObjectNestedKeys(messageObject);
});
const selectedKey = ref(keys.value.length ? keys.value[0] : undefined);

async function loadLanguage(code: string) {
  await loadAdminLanguage(code);
}

async function addKey(key: string) {
  items.value = { ...items.value, [key]: {} };
}

function removeKey(key: string) {
  if (Object.keys(items.value[key]).length)
    return;

  delete items.value[key];
}

function getAvailableLanguages(key: string, items: BasePrompt['i18n']) {
  if (!items[key])
    return ['en'];

  const langs = Object.keys(items[key]);
  return langs.length ? langs : ['en'];
}
</script>

<style lang="scss" scoped></style>
