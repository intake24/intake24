<template>
  <div>
    <v-toolbar color="grey-lighten-4">
      <v-icon color="secondary" end icon="fas fa-people-arrows" />
      <v-toolbar-title class="font-weight-medium">
        {{ $t('feedback-schemes.demographic-groups.title') }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        color="primary"
        icon="$add"
        size="small"
        :title="$t('feedback-schemes.demographic-groups.create')"
        @click.stop="add"
      />
      <options-menu>
        <select-resource
          resource="feedback-schemes"
          return-object="demographicGroups"
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
          v-for="(group, index) in items"
          :key="group.id"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-list-item-title class="font-weight-medium">
            {{ getListItemTitle(group) }}
          </v-list-item-title>
          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                :title="$t('feedback-schemes.demographic-groups.edit')"
                @click.stop="edit(index, group)"
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
                :label="$t('feedback-schemes.demographic-groups.remove')"
                @confirm="remove(index)"
              >
                {{ $t('common.action.confirm.delete', { name: getListItemTitle(group) }) }}
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
      :retain-focus="false"
      :scrim="false"
      transition="dialog-bottom-transition"
      :z-index="1050"
    >
      <v-card tile>
        <v-toolbar color="secondary">
          <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="reset" />
          <v-toolbar-title>
            <v-icon icon="fas fa-people-arrows" start />
            {{
              $t(`feedback-schemes.demographic-groups.${dialog.index === -1 ? 'create' : 'edit'}`)
            }}
          </v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-toolbar-items>
          <template #extension>
            <v-container>
              <v-tabs v-model="tab" bg-color="secondary">
                <v-tab v-for="item in ['general', 'sectors', 'json']" :key="item" :value="item">
                  {{ $t(`feedback-schemes.demographic-groups.tabs.${item}`) }}
                </v-tab>
              </v-tabs>
            </v-container>
          </template>
        </v-toolbar>
        <v-form ref="form" @submit.prevent="save">
          <v-container>
            <v-tabs-window v-model="tab" class="pt-1">
              <v-tabs-window-item value="general">
                <v-container>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="dialog.item.type"
                        hide-details="auto"
                        :items="cardTypes"
                        :label="$t('feedback-schemes.cards.type')"
                        name="type"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-autocomplete
                        v-model="dialog.item.nutrientTypeId"
                        hide-details="auto"
                        item-title="description"
                        item-value="id"
                        :items="nutrientTypes"
                        :label="$t('nutrient-types._')"
                        name="nutrientTypeId"
                        prepend-inner-icon="$nutrient-types"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="dialog.item.nutrientRuleType"
                        hide-details="auto"
                        :items="nutrientRuleTypes"
                        :label="$t('feedback-schemes.nutrientRuleTypes._')"
                        name="nutrientRuleType"
                        prepend-inner-icon="fas fa-divide"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="dialog.item.sex"
                        hide-details="auto"
                        :items="sexes"
                        :label="$t('feedback-schemes.sexes._')"
                        name="sex"
                        prepend-inner-icon="fas fa-genderless"
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
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="dialog.item.physicalActivityLevelId"
                        hide-details="auto"
                        item-title="name"
                        item-value="id"
                        :items="physicalActivityLevels"
                        :label="$t('feedback-schemes.physicalActivityLevels._')"
                        name="physicalActivityLevelId"
                        prepend-inner-icon="fas fa-running"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col v-for="item in rangeType" :key="item" cols="12" md="6">
                      <demographic-group-range
                        v-model="dialog.item[item]"
                        :type="item"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-tabs-window-item>
              <v-tabs-window-item value="sectors">
                <v-container>
                  <demographic-group-sectors
                    v-model="dialog.item.scaleSectors"
                  />
                </v-container>
              </v-tabs-window-item>
              <v-tabs-window-item value="json">
                <v-container>
                  <json-editor v-model="dialog.item" />
                </v-container>
              </v-tabs-window-item>
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
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { OptionsMenu, SelectResource } from '@intake24/admin/components/dialogs';
import { JsonEditor, JsonEditorDialog, useTinymce } from '@intake24/admin/components/editors';
import { useListWithDialog } from '@intake24/admin/composables';
import { useEntry } from '@intake24/admin/stores';
import { cardTypes as cardTypesRef, nutrientRuleTypes, rangeType, sexes } from '@intake24/common/feedback';
import type { DemographicGroup } from '@intake24/common/feedback';
import type { NutrientTypeResponse, PhysicalActivityLevelAttributes } from '@intake24/common/types/http/admin';
import { useI18n } from '@intake24/i18n';
import { ConfirmDialog } from '@intake24/ui';

import { getDemographicGroupDefaults } from './demographic-group';
import DemographicGroupRange from './demographic-group-range.vue';
import DemographicGroupSectors from './demographic-group-sectors.vue';

export default defineComponent({
  name: 'DemographicGroupList',

  components: {
    ConfirmDialog,
    DemographicGroupRange,
    DemographicGroupSectors,
    JsonEditor,
    JsonEditorDialog,
    OptionsMenu,
    SelectResource,
    VueDraggable,
  },

  props: {
    nutrientTypes: {
      type: Array as PropType<NutrientTypeResponse[]>,
      default: () => [],
    },
    modelValue: {
      type: Array as PropType<DemographicGroup[]>,
      required: true,
    },
  },

  setup(props, context) {
    useTinymce();
    const { i18n } = useI18n();
    const { dialog, form, items, add, edit, load, remove, reset: resetItem, save, update }
      = useListWithDialog(props, context, { newItem: getDemographicGroupDefaults });

    const tab = ref('general');

    const cardTypes = computed(() =>
      cardTypesRef.map(value => ({
        title: i18n.t(`feedback-schemes.cards.${value}.title`),
        value,
      })),
    );

    const reset = () => {
      tab.value = 'general';
      resetItem();
    };

    return {
      cardTypes,
      dialog,
      form,
      items,
      tab,
      add,
      edit,
      load,
      rangeType,
      remove,
      reset,
      save,
      update,
    };
  },

  data() {
    return {
      nutrientRuleTypes: nutrientRuleTypes.map(value => ({
        title: this.$t(`feedback-schemes.nutrientRuleTypes.${value}`),
        value,
      })),
      sexes: [
        { title: this.$t('common.not.selected'), value: null, icon: 'fas fa-genderless' },
        ...sexes.map(value => ({
          title: this.$t(`feedback-schemes.sexes.${value}`),
          value,
          icon: value === 'm' ? 'fas fa-mars' : 'fas fa-venus',
        })),
      ],
    };
  },

  computed: {
    physicalActivityLevels(): PhysicalActivityLevelAttributes[] {
      return [
        { name: this.$t('common.not.selected'), id: null },
        ...(useEntry().refs.physicalActivityLevels ?? []),
      ];
    },
  },

  methods: {
    getListItemTitle(group: DemographicGroup): string {
      const nutrient = this.nutrientTypes.find(({ id }) => group.nutrientTypeId === id);

      return [nutrient?.description, group.scaleSectors[0].name.en].filter(Boolean).join(' | ');
    },
  },
});
</script>

<style lang="scss" scoped></style>
