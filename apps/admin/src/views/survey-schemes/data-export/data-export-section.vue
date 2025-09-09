<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    persistent
    :scrim="false"
    transition="dialog-bottom-transition"
  >
    <v-card v-if="dialog" tile>
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="cancel" />
        <v-toolbar-title>
          {{ $t(`survey-schemes.data-export.sections.${section?.id}`) }}
        </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn :title="$t('common.action.ok')" variant="text" @click.stop="save">
            <v-icon icon="$success" start />{{ $t('common.action.ok') }}
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <v-container>
        <v-row class="mt-3">
          <v-col cols="12" md="6">
            <v-card-title>{{ $t('survey-schemes.data-export.current') }}</v-card-title>
            <v-list class="list-border" lines="two">
              <vue-draggable
                v-model="fields"
                :animation="300"
                handle=".drag-and-drop__handle"
              >
                <v-list-item
                  v-for="(field, index) in fields"
                  :key="field.id"
                >
                  <template #prepend>
                    <v-avatar class="drag-and-drop__handle" icon="$handle" />
                  </template>
                  <v-list-item-subtitle class="mb-1">
                    <span class="text--secondary">{{ $t('survey-schemes.data-export.fields.id') }}:</span>
                    {{ field.id }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle>
                    <span class="text--secondary">
                      {{ $t('survey-schemes.data-export.fields.label') }}:
                    </span>
                    {{ field.label }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-list-item-action>
                      <v-btn
                        icon
                        :title="$t('common.action.edit')"
                        @click.stop="edit(index, field)"
                      >
                        <v-icon color="secondary-lighten-2">
                          $edit
                        </v-icon>
                      </v-btn>
                    </v-list-item-action>
                    <v-list-item-action>
                      <v-btn color="error" icon="$delete" :title="$t('common.action.remove')" @click.stop="exclude(index)" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </vue-draggable>
            </v-list>
          </v-col>
          <v-divider vertical />
          <v-col cols="12" md="6">
            <div class="d-flex align-center justify-space-between mb-2">
              <v-card-title>
                {{ $t('survey-schemes.data-export.available') }}
              </v-card-title>
              <v-btn v-if="section?.id === 'externalSources'" color="primary" rounded="pill" @click="addCustom">
                {{ $t('survey-schemes.data-export.fields.custom') }}
              </v-btn>
            </div>
            <data-export-nutrients
              v-if="section?.id === 'foodNutrients'"
              v-model="fetchedRefFields"
            />
            <v-text-field
              v-model="search"
              clearable
              hide-details="auto"
              :label="$t('survey-schemes.data-export.fields.label')"
              prepend-inner-icon="$search"
              variant="outlined"
            />
            <v-list class="list-border" lines="two">
              <transition-group name="drag-and-drop" type="transition">
                <v-list-item
                  v-for="field in visibleFields"
                  :key="field.id"
                  link
                >
                  <v-list-item-subtitle class="mb-1">
                    <span class="text--secondary">{{ $t('survey-schemes.data-export.fields.id') }}:</span>
                    {{ field.id }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle>
                    <span class="text--secondary">
                      {{ $t('survey-schemes.data-export.fields.label') }}:
                    </span>
                    {{ field.label }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-list-item-action>
                      <v-btn color="info" icon="$add" :title="$t('common.action.add')" @click.stop="include(field)" />
                    </v-list-item-action>
                  </template>
                </v-list-item>
              </transition-group>
              <v-skeleton-loader
                v-if="fieldsAvailableToLoad"
                v-intersect="tryLoadMoreFields"
                type="list-item"
              />
            </v-list>
          </v-col>
        </v-row>
      </v-container>
      <v-dialog v-model="editDialog.show" max-width="500px">
        <v-card>
          <v-card-title>{{ $t('survey-schemes.data-export.fields._') }}</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editDialog.field.id"
                  :disabled="!isCustomField(editDialog.field.id)"
                  hide-details="auto"
                  :label="$t('survey-schemes.data-export.fields.id')"
                  name="id"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editDialog.field.label"
                  hide-details="auto"
                  :label="$t('survey-schemes.data-export.fields.label')"
                  name="label"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="editReset">
              <v-icon icon="$cancel" start />{{ $t('common.action.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn class="font-weight-bold" color="info" variant="text" @click.stop="editConfirm">
              <v-icon icon="$success" start />{{ $t('common.action.ok') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { DataExportNutrients } from '@intake24/admin/components/schemes';
import type { ExportField, ExportSection } from '@intake24/common/surveys';

defineOptions({ name: 'DataExportSection' });

const props = defineProps({
  section: {
    type: Object as PropType<ExportSection | null>,
    default: null,
  },
  refFields: {
    type: Array as PropType<ExportField[]>,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'update']);

function newEditDialog(show = false, custom = false) {
  return {
    show,
    custom,
    index: -1,
    field: { id: '', label: '' },
  };
}
const editDialog = ref(newEditDialog());

const dialog = ref(false);
const search = ref<string | null>(null);
const fields = ref<ExportField[]>([]);
const filteredFields = ref<ExportField[]>([]);
const visibleFields = ref<ExportField[]>([]);
const fetchedRefFields = ref<ExportField[]>([]);

const currentFields = computed(() => props.section?.id === 'foodNutrients' ? fetchedRefFields.value : props.refFields);

const availableFields = computed(() => {
  const fieldIds = fields.value.map(field => field.id);
  return currentFields.value.filter(field => !fieldIds.includes(field.id));
});

function isCustomField(id: string) {
  return !currentFields.value.find(f => f.id === id);
}

function loadMoreFields() {
  const startIndex = visibleFields.value.length;
  const endIndex
    = startIndex + 15 > filteredFields.value.length
      ? filteredFields.value.length
      : startIndex + 15;

  const items = filteredFields.value.slice(startIndex, endIndex);
  visibleFields.value.push(...items);
}

function loadFilteredFields() {
  filteredFields.value = search.value
    ? availableFields.value.filter(
        field => !!field.label.match(new RegExp(search.value, 'i')),
      )
    : [...availableFields.value];

  visibleFields.value = [];
  loadMoreFields();
}

const fieldsAvailableToLoad = computed(
  () => visibleFields.value.length < filteredFields.value.length,
);

function tryLoadMoreFields(isIntersecting: boolean) {
  if (isIntersecting && fieldsAvailableToLoad)
    loadMoreFields();
}

function include(field: ExportField) {
  fields.value.push(field);
};

function addCustom() {
  editDialog.value = newEditDialog(true, true);
};

function edit(index: number, field: ExportField) {
  editDialog.value = { ...newEditDialog(true), index, field: { ...field } };
};

function editConfirm() {
  const { index, field } = editDialog.value;

  if (index !== -1)
    fields.value.splice(index, 1, field);
  else
    fields.value.push(field);

  editReset();
};

function editReset() {
  editDialog.value = newEditDialog();
};

function exclude(index: number) {
  fields.value.splice(index, 1);
};

function close() {
  dialog.value = false;
};

function cancel() {
  close();
};

function save() {
  if (!props.section)
    return;

  emit('update', { id: props.section.id, fields: fields.value });
  close();
};

watch(
  availableFields,
  () => {
    loadFilteredFields();
  },
  { immediate: true },
);

watchDebounced(
  search,
  () => {
    loadFilteredFields();
  },
  { debounce: 500, maxWait: 1000 },
);

watch(
  () => props.section,
  (val) => {
    if (!val)
      return;

    fields.value = [...val.fields];
    dialog.value = true;
  },
);

watch(dialog, (val) => {
  if (!val)
    emit('close');
});
</script>

<style lang="scss" scoped></style>
