<template>
  <v-card v-bind="{ border, flat, outlined, tile }">
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ label }}
      </v-toolbar-title>
      <v-spacer />
      <v-menu v-if="!readonly" location="bottom left">
        <template #activator="{ props }">
          <v-btn
            class="me-2"
            color="primary"
            :disabled="!availableLanguages.length"
            v-bind="props"
            icon="$add"
            size="small"
          />
        </template>
        <v-list class="bg-grey-lighten-3">
          <v-list-item v-for="lang in availableLanguages" :key="lang.code" @click="add(lang.code)">
            <span :class="`fi fi-${lang.countryFlagCode} mr-3`" />
            <span class="font-weight-medium">{{ lang.englishName }}</span>
          </v-list-item>
        </v-list>
      </v-menu>
      <template v-if="languages.length" #extension>
        <v-tabs v-model="selected" bg-color="grey-lighten-4">
          <v-tab v-for="lang in languages" :key="lang">
            <span :class="`fi fi-${getLanguageFlag(lang)} mr-3`" />
            <span class="font-weight-medium">{{ getLanguageName(lang) }}</span>
          </v-tab>
        </v-tabs>
      </template>
    </v-toolbar>
    <v-tabs-window v-model="selected">
      <v-tabs-window-item v-for="lang in languages" :key="lang">
        <v-card-text>
          <slot :lang="lang" :name="`lang.${lang}`" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn v-if="!readonly" color="error" :disabled="isRemoveDisabled" variant="text" @click.stop="remove">
            <v-icon icon="$delete" start />{{ $t('common.action.delete') }}
          </v-btn>
        </v-card-actions>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, ref, watch } from 'vue';
import { useApp } from '@intake24/admin/stores';

const english = { code: 'en', englishName: 'English', localName: 'English', countryFlagCode: 'gb' };

export default defineComponent({
  name: 'LanguageSelector',

  props: {
    border: {
      type: Boolean,
    },
    default: {
      type: [String, Array],
      default: '',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
    flat: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      required: true,
    },
    outlined: {
      type: Boolean,
    },
    required: {
      type: Boolean,
      default: false,
    },
    tile: {
      type: Boolean,
    },
  },

  emits: ['update:modelValue', 'langAdd', 'langRemove'],

  setup(props, { emit }) {
    const selected = ref<number | undefined>(undefined);
    const doNotRemove = computed(() => (props.required ? [english.code] : []));

    const languages = computed(() => Object.keys(props.modelValue));

    watch(
      () => languages.value.length,
      (val) => {
        selected.value = val - 1;
      },
    );

    const allLanguages = computed(() => useApp().langs ?? [english]);

    const availableLanguages = computed(() =>
      allLanguages.value.filter(lang => !languages.value.includes(lang.code)),
    );

    const isRemoveDisabled = computed(() => {
      if (selected.value === undefined)
        return true;

      return doNotRemove.value.includes(languages.value[selected.value]);
    });

    const getLanguageFlag = (code: string) =>
      allLanguages.value.find(lang => lang.code === code)?.countryFlagCode
      ?? english.countryFlagCode;

    const getLanguageName = (code: string) =>
      allLanguages.value.find(lang => lang.code === code)?.englishName ?? english.englishName;

    const add = async (code: string) => {
      emit('update:modelValue', { ...props.modelValue, [code]: props.default });
      emit('langAdd', code);
    };

    const remove = () => {
      if (selected.value === undefined)
        return;

      const code = languages.value[selected.value];
      const { [code]: remove, ...rest } = props.modelValue;
      emit('update:modelValue', { ...rest });
      emit('langRemove', code);
    };

    return {
      selected,
      doNotRemove,
      languages,
      allLanguages,
      availableLanguages,
      isRemoveDisabled,
      getLanguageFlag,
      getLanguageName,
      add,
      remove,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>
