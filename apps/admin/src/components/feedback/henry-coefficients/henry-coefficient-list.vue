<template>
  <div>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end icon="fas fa-square-root-alt" />
      <v-toolbar-title class="font-weight-medium">
        {{ $t('feedback-schemes.henry-coefficients.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        icon="$add"
        size="small"
        :title="$t('feedback-schemes.henry-coefficients.create')"
        @click.stop="add"
      />
      <options-menu>
        <select-resource
          resource="feedback-schemes"
          return-object="henryCoefficients"
          @update:model-value="load"
        >
          <template #activator="{ props }">
            <v-list-item v-bind="props" link>
              <template #prepend>
                <v-icon icon="$download" />
              </template>
              <v-list-item-title>
                {{ $t('feedback-schemes.load') }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </select-resource>
        <json-editor-dialog v-model="items" @update:model-value="update" />
      </options-menu>
    </v-toolbar>
    <v-list class="list-border" lines="two">
      <vue-draggable
        v-model="items"
        :animation="300"
        handle=".drag-and-drop__handle"
        @end="update"
      >
        <v-list-item
          v-for="(coefficient, index) in items"
          :key="coefficient.id"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
            <v-icon>{{ getListItemIcon(coefficient) }}</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ getListItemTitle(coefficient) }}
          </v-list-item-title>
          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                :title="$t('feedback-schemes.henry-coefficients.edit')"
                @click.stop="edit(index, coefficient)"
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
                :label="$t('feedback-schemes.henry-coefficients.remove')"
                @confirm="remove(index)"
              >
                {{ $t('common.action.confirm.delete', { name: getListItemTitle(coefficient) }) }}
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
          <v-icon end icon="fas fa-square-root-alt" />
          <v-toolbar-title>
            {{
              $t(`feedback-schemes.henry-coefficients.${dialog.index === -1 ? 'create' : 'edit'}`)
            }}
          </v-toolbar-title>
        </v-toolbar>
        <v-divider />
        <v-form ref="form" @submit.prevent="save">
          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="dialog.item.sex"
                    hide-details="auto"
                    :items="sexes"
                    :label="$t('feedback-schemes.sexes._')"
                    name="sex"
                    variant="outlined"
                  >
                    <template #item="{ item, props }">
                      <v-list-item v-bind="props" :title="item.raw.title">
                        <template #prepend>
                          <v-icon :icon="item.raw.icon" start />
                        </template>
                      </v-list-item>
                    </template>
                    <template #selection="{ item }">
                      <v-icon :icon="item.raw.icon" start />
                      {{ item.raw.title }}
                    </template>
                  </v-select>
                </v-col>
              </v-row>
              <v-card-subtitle>
                {{ $t('feedback-schemes.age.range') }}
              </v-card-subtitle>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="dialog.item.age.start"
                    hide-details="auto"
                    :label="$t('feedback-schemes.age.start')"
                    name="age.start"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="dialog.item.age.end"
                    hide-details="auto"
                    :label="$t('feedback-schemes.age.end')"
                    name="age.end"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="dialog.item.weightCoefficient"
                    hide-details="auto"
                    :label="$t('feedback-schemes.henry-coefficients.weightCoefficient')"
                    name="weightCoefficient"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="dialog.item.heightCoefficient"
                    hide-details="auto"
                    :label="$t('feedback-schemes.henry-coefficients.heightCoefficient')"
                    name="heightCoefficient"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="dialog.item.constant"
                    hide-details="auto"
                    :label="$t('feedback-schemes.henry-coefficients.constant')"
                    name="constant"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
          <v-card-actions>
            <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="reset">
              <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn class="font-weight-bold" color="info" type="submit" variant="text">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

import type { HenryCoefficient, Sex } from '@intake24/common/feedback';

import { defineComponent } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { OptionsMenu, SelectResource } from '@intake24/admin/components/dialogs';
import { JsonEditorDialog } from '@intake24/admin/components/editors';
import { useListWithDialog } from '@intake24/admin/composables';
import { sexes } from '@intake24/common/feedback';
import { ConfirmDialog } from '@intake24/ui';

import { getHenryCoefficientDefaults } from './henry-coefficient';

export default defineComponent({
  name: 'HenryCoefficientList',

  components: { ConfirmDialog, JsonEditorDialog, OptionsMenu, SelectResource, VueDraggable },

  props: {
    modelValue: {
      type: Array as PropType<HenryCoefficient[]>,
      required: true,
    },
  },

  setup(props, context) {
    const { dialog, form, items, add, edit, load, remove, reset, save, update }
      = useListWithDialog(props, context, { newItem: getHenryCoefficientDefaults });

    return { dialog, form, items, add, edit, load, remove, reset, save, update };
  },

  data() {
    return {
      sexes: sexes.map(value => ({
        title: this.$t(`feedback-schemes.sexes.${value}`),
        value,
        icon: value === 'm' ? 'fas fa-mars' : 'fas fa-venus',
      })),
    };
  },

  methods: {
    getGenderIcon(gender: Sex): string {
      const icons: Record<Sex, string> = { m: 'fas fa-mars', f: 'fas fa-venus' };
      return icons[gender];
    },

    getListItemIcon(coefficient: HenryCoefficient): string {
      const { sex } = coefficient;

      return this.getGenderIcon(sex);
    },

    getListItemTitle(coefficient: HenryCoefficient): string {
      const { sex, age } = coefficient;

      return `${this.$t(`feedback-schemes.sexes.${sex}`)} (${age.start} => ${age.end})`;
    },
  },
});
</script>

<style lang="scss" scoped></style>
