<template>
  <v-card flat tile>
    <v-toolbar color="grey-lighten-2">
      <v-icon color="secondary" end icon="$nutrient-types" />
      <v-toolbar-title class="font-weight-medium">
        {{ $t('nutrient-types.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn color="primary" icon="$add" size="small" :title="$t('nutrient-types.create')" @click.stop="add" />
      <confirm-dialog
        color="error"
        :label="$t('nutrient-types.reset._')"
        @confirm="resetList"
      >
        <template #activator="{ props }">
          <v-btn
            class="ml-3"
            color="error"
            icon="$sync"
            size="small"
            :title="$t('nutrient-types.reset._')"
            v-bind="props"
          />
        </template>
        {{ $t('nutrient-types.reset.text') }}
      </confirm-dialog>
    </v-toolbar>
    <v-list class="list-border">
      <vue-draggable
        v-model="items"
        :animation="300"
        handle=".drag-and-drop__handle"
        @end="update"
      >
        <v-list-item
          v-for="(nutrientType, idx) in items"
          :key="nutrientType.id.join(':')"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-list-item-title>{{ nutrientType.name.en }}</v-list-item-title>
          <template #append>
            <v-list-item-action>
              <v-btn icon="$edit" :title="$t('nutrient-types.edit')" @click.stop="edit(idx, nutrientType)" />
            </v-list-item-action>
            <v-list-item-action>
              <confirm-dialog
                color="error"
                icon
                icon-left="$delete"
                :label="$t('nutrient-types.remove')"
                @confirm="remove(idx)"
              >
                {{ $t('common.action.confirm.delete', { name: nutrientType.name.en }) }}
              </confirm-dialog>
            </v-list-item-action>
          </template>
        </v-list-item>
      </vue-draggable>
    </v-list>
    <v-dialog
      v-model="dialog.show"
      :fullscreen="$vuetify.display.smAndDown"
      max-width="600px"
      persistent
    >
      <v-card :tile="$vuetify.display.smAndDown">
        <v-toolbar color="secondary">
          <v-icon end icon="$nutrient-types" />
          <v-toolbar-title>
            {{ $t(`nutrient-types.${dialog.index === -1 ? 'create' : 'edit'}`) }}
          </v-toolbar-title>
        </v-toolbar>
        <v-divider />
        <v-form ref="form" @submit.prevent="save">
          <v-card-text>
            <v-autocomplete
              v-model="dialog.item.id"
              hide-details="auto"
              item-title="description"
              item-value="id"
              :items="nutrientTypes"
              :label="$t('nutrient-types.title')"
              multiple
              name="nutrientTypeId"
              prepend-inner-icon="$nutrient-types"
              :rules="rules"
              variant="outlined"
              @update:model-value="updateNutrientLabel"
            />
          </v-card-text>
          <language-selector
            v-model="dialog.item.name"
            :label="$t('nutrient-types.label')"
            required
          >
            <template v-for="lang in Object.keys(dialog.item.name)" :key="lang" #[`lang.${lang}`]>
              <v-text-field
                v-model="dialog.item.name[lang]"
                hide-details="auto"
                :label="$t('nutrient-types.label')"
                variant="outlined"
              />
            </template>
          </language-selector>
          <v-card-actions>
            <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
              <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
              <v-icon icon="$success" start />
              {{ $t('common.action.ok') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { useListWithDialog } from '@intake24/admin/composables';
import type { Nutrient } from '@intake24/common/feedback';
import type { NutrientTypeResponse } from '@intake24/common/types/http/admin';
import { ConfirmDialog } from '@intake24/ui';

import { LanguageSelector } from '../forms';

export default defineComponent({
  name: 'NutrientTypeList',

  components: { ConfirmDialog, LanguageSelector, VueDraggable },

  props: {
    nutrientTypes: {
      type: Array as PropType<NutrientTypeResponse[]>,
      required: true,
    },
    defaults: {
      type: Array as PropType<Nutrient[]>,
      default: () => [],
    },
    modelValue: {
      type: Array as PropType<Nutrient[]>,
      required: true,
    },
  },

  setup(props, context) {
    const defaultItem = () => ({
      id: [props.nutrientTypes[0].id],
      name: { en: props.nutrientTypes[0].description },
    });

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
    } = useListWithDialog(props, context, { newItem: defaultItem });

    const updateNutrientLabel = (nutrientTypeId: string) => {
      const match = props.nutrientTypes.find(nutrient => nutrient.id === nutrientTypeId);
      if (!match)
        return;

      dialog.value.item.name.en = match.description;
    };

    return {
      dialog,
      form,
      items,
      newDialog,
      add,
      edit,
      load,
      remove,
      reset,
      save,
      update,
      resetList,
      updateNutrientLabel,
    };
  },

  computed: {
    rules() {
      return [
        (value: string[]): boolean | string => {
          if (!value.length)
            return this.$t('nutrient-types.validation.required');

          const { index } = this.dialog;
          const match = this.items.find(
            (nutrientType, idx) =>
              [...value].sort().join(':') === [...nutrientType.id].sort().join(':') && index !== idx,
          );

          return match ? this.$t('nutrient-types.validation.unique') : true;
        },
      ];
    },
  },
});
</script>

<style lang="scss" scoped></style>
