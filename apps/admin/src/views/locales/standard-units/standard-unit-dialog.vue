<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    persistent
    :retain-focus="false"
    :scrim="false"
    transition="dialog-bottom-transition"
    :z-index="1050"
  >
    <v-card tile>
      <v-toolbar>
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="close" />
        <v-toolbar-title>
          <v-icon icon="$standard-units" start />
          {{ $t(`locales.standard-units.${itemId ? 'edit' : 'add'}`) }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn :title="$t('common.action.save')" variant="text" @click.stop="save">
            <v-icon icon="$success" start />{{ $t('common.action.save') }}
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-form @keydown="clearError" @submit.prevent="save">
        <v-container>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.code"
                :error-messages="errors.get('code')"
                :label="$t('locales.standard-units.code')"
                name="code"
                prepend-inner-icon="$standard-units"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.name"
                :error-messages="errors.get('name')"
                :label="$t('common.name')"
                name="name"
              />
            </v-col>
            <v-col cols="12" md="6">
              <select-icon
                v-model="data.icon"
                clearable
                :error-messages="errors.get('icon')"
                name="icon"
                @update:model-value="errors.clear('icon')"
              />
            </v-col>
            <v-col cols="12">
              <language-selector
                v-model="data.estimateIn"
                border
                :label="$t('locales.standard-units.estimateIn')"
                required
              >
                <template v-for="lang in Object.keys(data.estimateIn)" :key="lang" #[`lang.${lang}`]>
                  <v-text-field
                    v-model="data.estimateIn[lang]"
                    :error-messages="errors.get(`estimateIn.${lang}`)"
                    :name="`estimateIn.${lang}`"
                    @update:model-value="errors.clear(`estimateIn.${lang}`)"
                  />
                </template>
              </language-selector>
            </v-col>
            <v-col cols="12">
              <language-selector
                v-model="data.howMany"
                border
                :label="$t('locales.standard-units.howMany')"
                required
              >
                <template v-for="lang in Object.keys(data.howMany)" :key="lang" #[`lang.${lang}`]>
                  <v-text-field
                    v-model="data.howMany[lang]"
                    :error-messages="errors.get(`howMany.${lang}`)"
                    :name="`howMany.${lang}`"
                    @update:model-value="errors.clear(`howMany.${lang}`)"
                  />
                </template>
              </language-selector>
            </v-col>
          </v-row>
          <submit-footer :disabled="errors.any.value" />
        </v-container>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { StandardUnitAttributes, StandardUnitRequest } from '@intake24/common/types/http/admin';

import { shallowRef } from 'vue';

import { LanguageSelector, SubmitFooter } from '@intake24/admin/components/forms';
import { useForm } from '@intake24/admin/composables';
import { copy } from '@intake24/common/util';
import { SelectIcon, useI18n } from '@intake24/ui';
import { useMessages } from '@intake24/ui/stores';

const props = defineProps({
  localeId: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['changed']);

function newItem(): StandardUnitRequest {
  return {
    code: '',
    name: '',
    icon: null,
    estimateIn: { en: '' },
    howMany: { en: '' },
  };
}

const { i18n: { t } } = useI18n();

const { clearError, data, errors, post, put } = useForm<StandardUnitRequest>({ data: newItem() });

const dialog = shallowRef(false);
const itemId = shallowRef<string | undefined>();

async function save() {
  if (itemId.value) {
    const item = await put<StandardUnitAttributes>(`${props.url}/${itemId.value}`);
    useMessages().success(t('common.msg.updated', { name: item.name ?? item.id }));
  }
  else {
    const item = await post<StandardUnitAttributes>(props.url);
    useMessages().success(t('common.msg.created', { name: item.name ?? item.id }));
  }

  dialog.value = false;
  emit('changed');
}

function close() {
  dialog.value = false;
}

function add() {
  itemId.value = undefined;
  data.value = newItem();
  dialog.value = true;
}

function edit(item?: StandardUnitAttributes) {
  dialog.value = true;
  if (item) {
    const { id, ...rest } = item;
    itemId.value = id;
    data.value = copy(rest);
  }
  else {
    itemId.value = undefined;
    data.value = newItem();
  }
}

defineExpose({ add, edit });
</script>

<style lang="scss">
</style>
