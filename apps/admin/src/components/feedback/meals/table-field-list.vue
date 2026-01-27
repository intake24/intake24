<template>
  <div>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end icon="fas fa-table-list" />
      <v-toolbar-title class="font-weight-medium">
        {{ $t('feedback-schemes.meals.table') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        icon="$add"
        size="small"
        :title="$t('feedback-schemes.meals.fields.create')"
        @click.stop="add"
      />
      <confirm-dialog
        color="error"
        :label="$t('feedback-schemes.meals.fields.reset._')"
        @confirm="resetList"
      >
        <template #activator="{ props }">
          <v-btn
            class="ml-3"
            color="error"
            icon="$sync"
            size="small"
            :title="$t('feedback-schemes.meals.fields.reset._')"
            v-bind="props"
          />
        </template>
        {{ $t('feedback-schemes.meals.fields.reset.text') }}
      </confirm-dialog>
    </v-toolbar>
    <v-list class="list-border" lines="two">
      <vue-draggable
        v-model="items"
        :animation="300"
        handle=".drag-and-drop__handle"
        @end="update"
      >
        <v-list-item
          v-for="(item, index) in items"
          :key="item.fieldId"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ item.header.en }}
          </v-list-item-title>
          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                :title="$t('feedback-schemes.meals.fields.edit')"
                @click.stop="edit(index, item)"
              >
                <v-icon color="secondary-lighten-2">
                  $edit
                </v-icon>
              </v-btn>
            </v-list-item-action>
            <v-list-item-action>
              <confirm-dialog
                color="error"
                icon
                icon-left="$delete"
                :label="$t('feedback-schemes.meals.fields.remove')"
                @confirm="remove(index)"
              >
                {{ $t('common.action.confirm.delete', { name: item.header.en }) }}
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
            <v-icon icon="fas fa-table-list" start />
            {{ $t(`feedback-schemes.meals.fields.${dialog.index === -1 ? 'create' : 'edit'}`) }}
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
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="dialog.item.type"
                    hide-details="auto"
                    :items="tableFieldTypes"
                    :label="$t('feedback-schemes.meals.fields.types._')"
                    name="type"
                    variant="outlined"
                    @update:model-value="updateProps"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <template v-if="dialog.item.type === 'nutrient'">
                    <v-autocomplete
                      v-model="dialog.item.types"
                      hide-details="auto"
                      item-title="description"
                      item-value="id"
                      :items="nutrientTypes"
                      :label="$t('nutrient-types.title')"
                      multiple
                      name="nutrientTypeId"
                      prepend-inner-icon="$nutrient-types"
                      :rules="nutrientRules"
                      variant="outlined"
                      @update:model-value="updateNutrientFields"
                    />
                  </template>
                  <v-select
                    v-if="dialog.item.type === 'standard'"
                    v-model="dialog.item.fieldId"
                    hide-details="auto"
                    :items="tableFieldStandardIds"
                    :label="$t('feedback-schemes.meals.fields.id')"
                    name="fieldId"
                    :rules="fieldIdRules"
                    variant="outlined"
                  />
                  <v-text-field
                    v-else
                    v-model="dialog.item.fieldId"
                    :disabled="dialog.item.type === 'nutrient'"
                    hide-details="auto"
                    :label="$t('feedback-schemes.meals.fields.id')"
                    :rules="fieldIdRules"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-card border flat>
                    <language-selector
                      v-model="dialog.item.header"
                      :label="$t('feedback-schemes.meals.fields.header')"
                      required
                    >
                      <template v-for="lang in Object.keys(dialog.item.header)" :key="lang" #[`lang.${lang}`]>
                        <v-text-field
                          v-model="dialog.item.header[lang]"
                          hide-details="auto"
                          :label="$t('feedback-schemes.meals.fields.header')"
                          variant="outlined"
                        />
                      </template>
                    </language-selector>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card border flat>
                    <language-selector
                      v-model="dialog.item.value"
                      :label="$t('feedback-schemes.meals.fields.value')"
                      required
                    >
                      <template v-for="lang in Object.keys(dialog.item.value)" :key="lang" #[`lang.${lang}`]>
                        <v-text-field
                          v-model="dialog.item.value[lang]"
                          hide-details="auto"
                          :label="$t('feedback-schemes.meals.fields.value')"
                          variant="outlined"
                        />
                      </template>
                    </language-selector>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
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
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { MealTableField } from '@intake24/common/feedback';
import type { NutrientTypeResponse } from '@intake24/common/types/http/admin';

import { computed, defineComponent, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { LanguageSelector } from '@intake24/admin/components/forms';
import { useListWithDialog } from '@intake24/admin/composables';
import { mealTableFieldStandardIds, mealTableFieldTypes } from '@intake24/common/feedback';
import { ConfirmDialog, useI18n } from '@intake24/ui';

import { getTableFieldDefaults } from './table-field';

export default defineComponent({
  name: 'TableFieldList',

  components: { ConfirmDialog, LanguageSelector, VueDraggable },

  props: {
    nutrientTypes: {
      type: Array as PropType<NutrientTypeResponse[]>,
      default: () => [],
    },
    defaults: {
      type: Array as PropType<MealTableField[]>,
      default: () => [],
    },
    modelValue: {
      type: Array as PropType<MealTableField[]>,
      required: true,
    },
  },

  setup(props, context) {
    const { i18n } = useI18n();

    const {
      dialog,
      form,
      items,
      newDialog,
      add,
      edit,
      load,
      remove,
      reset,
      resetList,
      save,
      update,
    } = useListWithDialog(props, context, { newItem: () => getTableFieldDefaults('standard') });

    const tab = ref(0);

    const tableFieldTypes = mealTableFieldTypes.map(value => ({
      title: i18n.t(`feedback-schemes.meals.fields.types.${value}`),
      value,
    }));

    const tableFieldStandardIds = mealTableFieldStandardIds.map(value => ({
      title: i18n.t(`feedback-schemes.meals.fields.types.${value}`),
      value,
    }));

    const fieldIdRules = computed(() => [
      (value: string | null): boolean | string => {
        if (!value)
          return i18n.t('feedback-schemes.meals.fields.validation.required');

        const {
          index,
          item: { type, fieldId },
        } = dialog.value;
        const match = items.value.find(
          (item, idx) => item.type === type && item.fieldId === fieldId && index !== idx,
        );

        return match ? i18n.t('feedback-schemes.meals.fields.validation.unique') : true;
      },
    ]);

    const nutrientRules = computed(() => [
      (value: string[]): boolean | string => {
        if (!value.length)
          return i18n.t('nutrient-types.validation.required');

        const { index } = dialog.value;
        const match = items.value.find(
          (item, idx) =>
            item.type === 'nutrient'
            && [...value].sort().join(':') === [...item.types].sort().join(':')
            && index !== idx,
        );

        return match ? i18n.t('nutrient-types.validation.unique') : true;
      },
    ]);

    const updateNutrientFieldId = (nutrientTypeId: string[]) => {
      if (!nutrientTypeId.length || dialog.value.item.type !== 'nutrient')
        return;

      dialog.value.item.fieldId = `nutrient-${dialog.value.item.types.sort().join(':')}`;
    };

    const updateNutrientLabel = (nutrientTypeId: string[]) => {
      if (!nutrientTypeId.length || dialog.value.item.type !== 'nutrient')
        return;

      const match = props.nutrientTypes.find(nutrient => nutrient.id === nutrientTypeId[0]);
      if (!match)
        return;

      dialog.value.item.header.en = match.description;
    };

    const updateNutrientFields = (nutrientTypeId: string[]) => {
      updateNutrientFieldId(nutrientTypeId);
      updateNutrientLabel(nutrientTypeId);
    };

    const updateProps = () => {
      const {
        show,
        index,
        item: { type },
      } = dialog.value;

      dialog.value = { show, index, item: getTableFieldDefaults(type) };
    };

    return {
      dialog,
      form,
      items,
      tab,
      add,
      newDialog,
      edit,
      load,
      remove,
      reset,
      resetList,
      save,
      update,
      tableFieldTypes,
      tableFieldStandardIds,
      fieldIdRules,
      nutrientRules,
      updateNutrientFields,
      updateProps,
    };
  },
});
</script>

<style lang="scss" scoped></style>
