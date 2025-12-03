<template>
  <v-row>
    <scheme-settings-field
      v-model="switches.type"
      v-bind="{ override }"
      @change="toggle('type', $event)"
    >
      <v-select
        v-model="settings.type"
        :disabled="!switches.type"
        :error-messages="errors.get('settings.type')"
        :items="schemeTypes"
        :label="$t('survey-schemes.settings.types._')"
        name="settings.type"
        @update:model-value="errors.clear('settings.type')"
      />
    </scheme-settings-field>
    <scheme-settings-field
      v-model="switches.flow"
      v-bind="{ override }"
      @change="toggle('flow', $event)"
    >
      <v-select
        v-model="settings.flow"
        :disabled="!switches.flow"
        :error-messages="errors.get('settings.flow')"
        :items="recallFlows"
        :label="$t('survey-schemes.settings.flows._')"
        name="settings.flow"
        @update:model-value="errors.clear('settings.flow')"
      />
    </scheme-settings-field>
    <scheme-settings-field
      v-model="switches.recallDate"
      v-bind="{ override }"
      @change="toggle('recallDate', $event)"
    >
      <v-text-field
        v-model="settings.recallDate"
        :disabled="!switches.recallDate"
        :label="$t('survey-schemes.settings.recallDate')"
        name="settings.recallDate"
      />
    </scheme-settings-field>
    <scheme-settings-field
      v-model="switches.languages"
      v-bind="{ override }"
      @change="toggle('languages', $event)"
    >
      <v-select
        v-model="settings.languages"
        :disabled="!switches.languages"
        :error-messages="errors.get('settings.languages')"
        item-title="englishName"
        item-value="code"
        :items="languages"
        :label="$t('survey-schemes.settings.languages')"
        multiple
        name="settings.languages"
        @update:model-value="errors.clear('settings.languages')"
      />
    </scheme-settings-field>
  </v-row>
  <v-row>
    <scheme-settings-field
      v-model="switches.help"
      v-bind="{ override }"
      cols="12"
      md="12"
      @change="toggle('help', $event)"
    >
      <div class="text-subtitle-1 font-weight-medium">
        {{ $t('survey-schemes.settings.help._') }}
      </div>
      <template #addon>
        <v-col v-if="settings.help" cols="12">
          <v-switch
            v-model="settings.help.enabled"
            hide-details="auto"
            :label="$t('survey-schemes.settings.help.enabled')"
            name="settings.help.enabled"
          />
        </v-col>
        <v-col v-if="settings.help" cols="12" md="6">
          <v-select
            v-model="settings.help.available"
            :disabled="!settings.help.enabled"
            :error-messages="errors.get('settings.help.available')"
            hide-details="auto"
            :items="helpAvailableFields"
            :label="$t('survey-schemes.settings.help.available')"
            multiple
            name="settings.help.available"
            @update:model-value="errors.clear('settings.help.available')"
          />
        </v-col>
        <v-col v-if="settings.help" cols="12" md="6">
          <v-select
            v-model="settings.help.required"
            :disabled="!settings.help.enabled"
            :error-messages="errors.get('settings.help.required')"
            hide-details="auto"
            :items="helpRequiredFields"
            :label="$t('survey-schemes.settings.help.required')"
            multiple
            name="settings.help.required"
            @update:model-value="errors.clear('settings.help.required')"
          />
        </v-col>
      </template>
    </scheme-settings-field>
  </v-row>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import { computed } from 'vue';
import { useSelects } from '@intake24/admin/composables';
import type { ReturnUseErrors } from '@intake24/admin/composables';
import type { SchemeOverrides, SchemeSettings } from '@intake24/common/surveys';
import { defaultSchemeSettings } from '@intake24/common/surveys';
import { useApp } from '@intake24/ui/stores';
import SchemeSettingsField from './scheme-settings-field.vue';

const props = defineProps({
  errors: {
    type: Object as PropType<ReturnUseErrors>,
    required: true,
  },
  modelValue: {
    type: Object as PropType<SchemeSettings | SchemeOverrides['settings']>,
    required: true,
  },
  override: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const { helpAvailableFields, helpRequiredFields, recallFlows, schemeTypes } = useSelects();
const languages = computed(() => useApp().langs);

const settings = useVModel(props, 'modelValue', emit, { deep: true, passive: true });

const switches = computed(() => ({
  type: 'type' in settings.value,
  flow: 'flow' in settings.value,
  recallDate: 'recallDate' in settings.value,
  languages: 'languages' in settings.value,
  help: 'help' in settings.value,
}));

function toggle(key: keyof SchemeSettings, value: boolean) {
  if (!props.override)
    return;

  if (value) {
    settings.value = { ...settings.value, [key]: defaultSchemeSettings[key] };
    return;
  }

  const { [key]: _, ...rest } = settings.value;

  settings.value = rest;
}
</script>

<style lang="scss" scoped></style>
