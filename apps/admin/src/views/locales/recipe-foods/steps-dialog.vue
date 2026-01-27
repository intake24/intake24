<template>
  <v-dialog
    v-if="dialog"
    :fullscreen="$vuetify.display.smAndDown"
    max-width="700px"
    :model-value="dialog"
  >
    <v-card :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="$emit('close')" />
        <v-toolbar-title>
          {{ $t('locales.recipe-foods.steps') }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn color="primary" :title="$t('common.action.save')" @click.stop="saveSteps">
          {{ $t('common.action.save') }}
        </v-btn>
      </v-toolbar>
      <v-list class="list-border recipe-list">
        <v-list-item v-for="(item, idx) in data.items" :key="idx" class="mt-2">
          <v-list-item-title class="text-h4 font-weight-medium mb-4">
            <v-avatar class="mr-3" color="primary" size="28">
              <span class="text-white font-weight-medium text-h6">{{ item.order }}</span>
            </v-avatar>
            {{ translate(item.name) }}
          </v-list-item-title>
          <v-container class="px-2 v-list-item-content">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.trim="item.code"
                  hide-details="auto"
                  :label="$t('locales.recipe-foods.step_code')"
                  name="special"
                  readonly
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.trim="item.order"
                  hide-details="auto"
                  :label="$t('locales.recipe-foods.order')"
                  name="code"
                  readonly
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <language-selector
                  v-model="item.name"
                  border
                  :label="$t('locales.recipe-foods.name')"
                  required
                >
                  <template v-for="lang in Object.keys(item.name)" :key="lang" #[`lang.${lang}`]>
                    <v-text-field
                      v-model="item.name[lang]"
                      :error-messages="errors.get(`estimateIn.${lang}`)"
                      hide-details="auto"
                      :name="`estimateIn.${lang}`"
                      variant="outlined"
                      @update:model-value="errors.clear(`estimateIn.${lang}`)"
                    />
                  </template>
                </language-selector>
              </v-col>
              <v-col cols="12">
                <language-selector
                  v-model="item.name"
                  border
                  :label="$t('locales.recipe-foods.description')"
                  required
                >
                  <template v-for="lang in Object.keys(item.name)" :key="lang" #[`lang.${lang}`]>
                    <v-text-field
                      v-model="item.description[lang]"
                      :error-messages="errors.get(`recipe-foods.${lang}`)"
                      hide-details="auto"
                      :name="`recipe-foods.${lang}`"
                      variant="outlined"
                      @update:model-value="errors.clear(`recipe-foods.${lang}`)"
                    />
                  </template>
                </language-selector>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="item.repeatable"
                  hide-details="auto"
                  :label="$t('locales.recipe-foods.repeat')"
                  name="repeatable"
                />
                <v-switch
                  v-model="item.required"
                  hide-details="auto"
                  :label="$t('locales.recipe-foods.require')"
                  name="required"
                />
              </v-col>
              <v-col cols="12" md="6">
                <select-resource
                  v-model.trim="item.categoryCode"
                  item-id="code"
                  :label="$t('locales.recipe-foods.ingredientsCategory')"
                  name="ingredientsCategoryCode"
                  :query="{ localeId: locale.code }"
                  resource="categories"
                >
                  <template #title>
                    {{ $t(`fdbs.categories.title`) }}
                  </template>
                  <template #item="{ item: resItem }">
                    <v-list-item-title>{{ resItem.code }}</v-list-item-title>
                    <v-list-item-subtitle>{{ resItem.name }}</v-list-item-subtitle>
                  </template>
                </select-resource>
              </v-col>
            </v-row>
          </v-container>
          <template #append>
            <v-list-item-action class="v-list-item-action">
              <v-btn
                block
                class="full-width-btn"
                color="grey-lighten-3"
                :title="$t('locales.recipe-foods.remove')"
                variant="flat"
                @click.stop="removeStep(idx)"
              >
                <v-icon color="error" icon="$delete" />
              </v-btn>
            </v-list-item-action>
          </template>
        </v-list-item>
        <v-spacer class="pa-2" />
        <div class="justify-center d-flex">
          <v-btn
            class="text-h4"
            color="primary"
            icon="$add"
            :title="$t('locales.recipe-foods.add')"
            @click.stop="addStep"
          />
        </div>
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';

import type { RecipeFoodStepAttributes, RecipeFoodStepRequest } from '@intake24/common/types/http/admin';

import { SelectResource } from '@intake24/admin/components/dialogs';
import { LanguageSelector } from '@intake24/admin/components/forms';
import { useForm } from '@intake24/admin/composables';
import { useI18n } from '@intake24/ui';

export type LocaleRecipeFoodStepsForm = {
  items: RecipeFoodStepRequest[];
};

export type Locale = {
  id: string;
  code: string;
};

const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  activeRecipeFoodId: {
    type: String,
    required: true,
  },
  activeRecipeFoodCode: {
    type: String,
    required: true,
  },
  locale: {
    type: Object as PropType<Locale>,
    required: true,
  },
  items: {
    type: Array as PropType<RecipeFoodStepRequest[]>,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'updateSteps']);

const { translate } = useI18n();

const { data, errors, post } = useForm<LocaleRecipeFoodStepsForm>({ data: { items: props.items } });

async function saveSteps() {
  data.value.items = data.value.items
    .filter(({ name }) => name)
    .map((item, idx) => {
      item.order = idx + 1;
      return item;
    });

  const items = await post<RecipeFoodStepAttributes[]>(
    `admin/locales/${props.locale.id}/recipe-foods/${props.activeRecipeFoodId}/steps`,
  );

  emit('updateSteps', items);
}

function addStep() {
  data.value.items.push({
    id: undefined,
    code: `${props.activeRecipeFoodCode.substring(1)}_STP-${data.value.items.length + 1}`,
    recipeFoodsId: props.activeRecipeFoodId,
    name: { en: 'Name' },
    description: { en: 'Description' },
    order: data.value.items.length + 1,
    localeId: props.locale.code,
    categoryCode: '',
    repeatable: false,
    required: false,
  });
}

function removeStep(index: number) {
  console.log(index);
  data.value.items.splice(index, 1);
}
</script>

<style lang="scss">
.recipe-list {
  .v-list-item__append {
    align-self: stretch;
  }

  .v-list-item-action {
    align-self: stretch;

    > .full-width-btn {
      width: 100%;
      height: 80%;
    }
  }
}
</style>
