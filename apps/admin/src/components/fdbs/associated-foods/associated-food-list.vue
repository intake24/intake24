<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-toolbar-title class="font-weight-medium">
        {{ $t('fdbs.associatedFoods.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        v-if="!disabled"
        color="primary"
        icon="$add"
        size="small"
        :title="$t('fdbs.associatedFoods.add')"
        @click.stop="add"
      />
    </v-toolbar>
    <v-list class="list-border py-0" lines="two">
      <vue-draggable
        v-model="items"
        :animation="300"
        handle=".drag-and-drop__handle"
        @end="update"
      >
        <v-list-item
          v-for="(item, index) in items"
          :key="item._id"
          :class="errors.has(`associatedFoods[${index}]*`) ? 'text-error' : undefined"
          :variant="errors.has(`associatedFoods[${index}]*`) ? 'tonal' : undefined"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-list-item-title>{{ translate(item.genericName) }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ translate(item.text) }}
          </v-list-item-subtitle>
          <template #append>
            <list-item-error :errors="errors.get(`associatedFoods[${index}]*`)" />
            <v-list-item-action v-if="!disabled">
              <v-btn icon="$edit" :title="$t('fdbs.associatedFoods.edit')" @click.stop="edit(index, item)" />
            </v-list-item-action>
            <v-list-item-action v-if="!disabled">
              <confirm-dialog
                color="error"
                icon
                icon-left="$delete"
                :label="$t('fdbs.associatedFoods.remove')"
                @confirm="remove(index)"
              >
                {{ $t('common.action.confirm.remove', { name: item.genericName }) }}
              </confirm-dialog>
            </v-list-item-action>
          </template>
        </v-list-item>
      </vue-draggable>
    </v-list>
    <v-dialog
      v-model="dialog.show"
      fullscreen
      persistent
      :scrim="false"
      transition="dialog-bottom-transition"
    >
      <v-card tile>
        <v-toolbar color="secondary">
          <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
          <v-toolbar-title>
            {{ $t(`fdbs.associatedFoods.${dialog.index === -1 ? 'add' : 'edit'}`) }}
          </v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-form ref="form" @submit.prevent="save">
          <v-container>
            <error-list v-if="dialog.index !== -1" :errors="errors.get(`associatedFoods[${dialog.index}]*`)" />
            <v-row class="mt-2">
              <v-col cols="12" md="6">
                <v-card-title>{{ $t('common.options._') }}</v-card-title>
                <v-switch
                  v-model="dialog.item.linkAsMain"
                  hide-details="auto"
                  :label="$t('fdbs.associatedFoods.linkAsMain')"
                  name="linkAsMain"
                />
                <v-switch
                  v-model="dialog.item.multiple"
                  hide-details="auto"
                  :label="$t('fdbs.associatedFoods.multiple')"
                  name="multiple"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-card-title>{{ $t('fdbs.associatedFoods.association') }}</v-card-title>
                <select-resource
                  v-model="dialog.item.associatedCategoryCode"
                  :initial-item="dialog.item.associatedCategory"
                  item-id="code"
                  :label="$t('fdbs.categories._')"
                  name="associatedCategoryCode"
                  resource="categories"
                  @update:model-value="clearFood"
                >
                  <template #title>
                    {{ $t(`fdbs.categories.title`) }}
                  </template>
                  <template #item="{ item }">
                    <v-list-item-title>{{ item.code }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.name }}</v-list-item-subtitle>
                  </template>
                </select-resource>
                <select-resource
                  v-model="dialog.item.associatedFoodCode"
                  :initial-item="dialog.item.associatedFood"
                  item-id="code"
                  :label="$t('fdbs.foods._')"
                  name="associatedFoodCode"
                  resource="foods"
                  @update:model-value="clearCategory"
                >
                  <template #title>
                    {{ $t(`fdbs.foods.title`) }}
                  </template>
                  <template #item="{ item }">
                    <v-list-item-title>{{ item.code }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.name }}</v-list-item-subtitle>
                  </template>
                </select-resource>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <language-selector
                  v-model="dialog.item.genericName"
                  border
                  :label="$t('fdbs.associatedFoods.genericName')"
                  required
                >
                  <template v-for="lang in Object.keys(dialog.item.genericName)" :key="lang" #[`lang.${lang}`]>
                    <v-text-field
                      v-model="dialog.item.genericName[lang]"
                      hide-details="auto"
                      :label="$t('fdbs.associatedFoods.genericName')"
                      :name="`genericName.${lang}`"
                      variant="outlined"
                    />
                  </template>
                </language-selector>
              </v-col>
              <v-col cols="12">
                <language-selector
                  v-model="dialog.item.text"
                  border
                  :label="$t('fdbs.associatedFoods.text')"
                  required
                >
                  <template v-for="lang in Object.keys(dialog.item.text)" :key="lang" #[`lang.${lang}`]>
                    <v-text-field
                      v-model="dialog.item.text[lang]"
                      hide-details="auto"
                      :label="$t('fdbs.associatedFoods.text')"
                      :name="`text.${lang}`"
                      variant="outlined"
                    />
                  </template>
                </language-selector>
              </v-col>
            </v-row>
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
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { AssociatedFoodItem } from './associated-foods';
import { VueDraggable } from 'vue-draggable-plus';
import { SelectResource } from '@intake24/admin/components/dialogs';
import { ErrorList, LanguageSelector } from '@intake24/admin/components/forms';
import { ListItemError } from '@intake24/admin/components/lists';
import { useListWithDialog } from '@intake24/admin/composables';
import type { ReturnUseErrors } from '@intake24/admin/composables/use-errors';
import { withIdAndOrder, withoutIdAndOrder } from '@intake24/admin/util';
import { randomString } from '@intake24/common/util';
import { useI18n } from '@intake24/i18n';
import { ConfirmDialog } from '@intake24/ui';
import { createDefaultAssociatedFood } from './associated-foods';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  errors: {
    type: Object as PropType<ReturnUseErrors>,
    required: true,
  },
  foodCode: {
    type: String,
    required: true,
  },
  localeId: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Array as PropType<AssociatedFoodItem[]>,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const { translate } = useI18n();

function newItem() {
  return {
    ...createDefaultAssociatedFood(props.foodCode, props.localeId),
    _id: randomString(6),
  };
}

const { dialog, form, items, add, edit, remove, reset, save, update } = useListWithDialog(props, { emit }, {
  newItem,
  transformIn: withIdAndOrder,
  transformOut: withoutIdAndOrder,
});

function clearCategory(code: string | null) {
  if (!code)
    return;

  dialog.value.item.associatedCategoryCode = null;
}

function clearFood(code: string | null) {
  if (!code)
    return;

  dialog.value.item.associatedFoodCode = null;
}
</script>
