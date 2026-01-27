<template>
  <layout v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-title>{{ $t('nutrient-tables._') }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.id"
                :disabled="isEdit"
                :error-messages="errors.get('id')"
                hide-details="auto"
                :label="$t('common.id')"
                name="id"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.description"
                :error-messages="errors.get('description')"
                hide-details="auto"
                :label="$t('common.description')"
                name="description"
                prepend-inner-icon="$description"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-title>{{ $t('nutrient-tables.mapping.source._') }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.csvMapping.idColumnOffset"
                :error-messages="errors.get('csvMapping.idColumnOffset')"
                hide-details="auto"
                :label="$t('nutrient-tables.mapping.source.idColumnOffset')"
                name="csvMapping.idColumnOffset"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.csvMapping.descriptionColumnOffset"
                :error-messages="errors.get('csvMapping.descriptionColumnOffset')"
                hide-details="auto"
                :label="$t('nutrient-tables.mapping.source.descriptionColumnOffset')"
                name="csvMapping.descriptionColumnOffset"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.csvMapping.localDescriptionColumnOffset"
                :error-messages="errors.get('csvMapping.localDescriptionColumnOffset')"
                hide-details="auto"
                :label="$t('nutrient-tables.mapping.source.localDescriptionColumnOffset')"
                name="csvMapping.localDescriptionColumnOffset"
                variant="outlined"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.csvMapping.rowOffset"
                :error-messages="errors.get('csvMapping.rowOffset')"
                hide-details="auto"
                :label="$t('nutrient-tables.mapping.source.rowOffset')"
                name="csvMapping.rowOffset"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-toolbar flat tile>
          <v-toolbar-title>
            {{ $t('nutrient-tables.mapping.fields._') }}
          </v-toolbar-title>
          <v-spacer />
          <v-btn
            color="primary"
            rounded
            :title="$t('nutrient-tables.mapping.fields.create')"
            @click.stop="addField"
          >
            <v-icon icon="$add" start />{{ $t('nutrient-tables.mapping.fields.create') }}
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <v-alert v-if="errors.has('csvMappingFields')" border="start" type="error">
            {{ errors.get('csvMappingFields') }}
          </v-alert>
          <v-table>
            <thead>
              <tr>
                <th>{{ $t('nutrient-tables.mapping.fields.fieldName') }}</th>
                <th>{{ $t('nutrient-tables.mapping.fields.columnOffset') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(field, idx) in data.csvMappingFields" :key="`csv-mapping-fields-${idx}`">
                <td class="py-2">
                  <v-text-field
                    v-model="field.fieldName"
                    density="compact"
                    hide-details="auto"
                    :label="$t('nutrient-tables.mapping.fields.fieldName')"
                    :name="`fieldName-${idx}`"
                    variant="outlined"
                  />
                </td>
                <td class="py-2">
                  <v-text-field
                    v-model="field.columnOffset"
                    density="compact"
                    hide-details="auto"
                    :label="$t('nutrient-tables.mapping.fields.columnOffset')"
                    :name="`field-columnOffset-${idx}`"
                    variant="outlined"
                  />
                </td>
                <td class="py-2">
                  <v-btn
                    color="error"
                    icon="$delete"
                    :title="$t('nutrient-tables.mapping.fields.delete')"
                    variant="text"
                    @click="removeField(idx)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-toolbar flat tile>
          <v-toolbar-title>
            {{ $t('nutrient-tables.mapping.nutrients._') }}
          </v-toolbar-title>
          <v-spacer />
          <v-btn
            color="primary"
            rounded
            :title="$t('nutrient-tables.mapping.nutrients.create')"
            @click.stop="addNutrient"
          >
            <v-icon icon="$add" start />{{ $t('nutrient-tables.mapping.nutrients.create') }}
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <v-alert
            v-if="errors.has('csvMappingNutrients')"
            border="start"
            type="error"
          >
            {{ errors.get('csvMappingNutrients') }}
          </v-alert>
          <v-table>
            <thead>
              <tr>
                <th>{{ $t('nutrient-tables.mapping.nutrients.nutrient') }}</th>
                <th>{{ $t('nutrient-tables.mapping.nutrients.columnOffset') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="(nutrient, idx) in nutrients" :key="nutrient.nutrientTypeId">
                <td class="py-2">
                  <v-select
                    v-model="nutrient.nutrientTypeId"
                    density="compact"
                    hide-details="auto"
                    item-title="description"
                    item-value="id"
                    :items="refs.nutrientTypes"
                    :label="$t('nutrient-tables.mapping.nutrients.nutrient')"
                    :name="`nutrient-${idx}`"
                    variant="outlined"
                  />
                </td>
                <td class="py-2">
                  <v-text-field
                    v-model="nutrient.columnOffset"
                    density="compact"
                    hide-details="auto"
                    :label="$t('nutrient-tables.mapping.nutrients.columnOffset')"
                    :name="`nutrient-columnOffset-${idx}`"
                    variant="outlined"
                  />
                </td>
                <td class="py-2">
                  <v-btn
                    color="error"
                    icon="$delete"
                    :title="$t('nutrient-tables.mapping.nutrients.delete')"
                    variant="text"
                    @click="removeNutrient(idx)"
                  />
                </td>
              </tr>
              <v-skeleton-loader
                v-if="nutrientsAvailableToLoad"
                v-intersect="loadMoreNutrients"
                type="table-row"
              />
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-text>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { NutrientTableEntry, NutrientTableRefs } from '@intake24/common/types/http/admin';

import { computed, defineComponent, ref, watch } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { excelColumnToOffset, offsetToExcelColumn } from '@intake24/common/util';

export type CsvMappingField = { fieldName: string; columnOffset: string };
export type CsvMappingNutrient = { nutrientTypeId: string; columnOffset: string };

export type NutrientTableForm = {
  id: string | null;
  description: string | null;
  csvMapping: {
    idColumnOffset: string;
    descriptionColumnOffset: string;
    localDescriptionColumnOffset: string | null;
    rowOffset: number;
  };
  csvMappingFields: CsvMappingField[];
  csvMappingNutrients: CsvMappingNutrient[];
};

export function transformIn(data: NutrientTableEntry) {
  const { csvMapping, csvMappingFields, csvMappingNutrients } = data;
  const { idColumnOffset, descriptionColumnOffset, localDescriptionColumnOffset } = csvMapping;

  return {
    ...data,
    csvMapping: {
      ...csvMapping,
      idColumnOffset: offsetToExcelColumn(idColumnOffset),
      descriptionColumnOffset: offsetToExcelColumn(descriptionColumnOffset),
      localDescriptionColumnOffset: offsetToExcelColumn(localDescriptionColumnOffset),
    },
    csvMappingFields: csvMappingFields.map(({ fieldName, columnOffset }) => ({
      fieldName,
      columnOffset: offsetToExcelColumn(columnOffset),
    })),
    csvMappingNutrients: csvMappingNutrients.map(({ nutrientTypeId, columnOffset }) => ({
      nutrientTypeId,
      columnOffset: offsetToExcelColumn(columnOffset),
    })),
  };
}

export function transformOut(data: NutrientTableForm) {
  const { csvMapping, csvMappingFields, csvMappingNutrients } = data;
  const { idColumnOffset, descriptionColumnOffset, localDescriptionColumnOffset } = csvMapping;

  return {
    ...data,
    csvMapping: {
      ...csvMapping,
      idColumnOffset: excelColumnToOffset(idColumnOffset),
      descriptionColumnOffset: excelColumnToOffset(descriptionColumnOffset),
      localDescriptionColumnOffset: localDescriptionColumnOffset
        ? excelColumnToOffset(localDescriptionColumnOffset)
        : null,
    },
    csvMappingFields: csvMappingFields
      .filter(field => field.fieldName && field.columnOffset)
      .map(({ fieldName, columnOffset }) => ({
        fieldName,
        columnOffset: excelColumnToOffset(columnOffset),
      })),
    csvMappingNutrients: csvMappingNutrients
      .filter(nutrient => nutrient.nutrientTypeId && nutrient.columnOffset)
      .map(({ nutrientTypeId, columnOffset }) => ({
        nutrientTypeId,
        columnOffset: excelColumnToOffset(columnOffset),
      })),
  };
}

export default defineComponent({
  name: 'NutrientTableForm',

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded, isEdit, refs, refsLoaded } = useEntry<
      NutrientTableEntry,
      NutrientTableRefs
    >(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<
      NutrientTableForm,
      NutrientTableEntry
    >(props, {
      data: {
        id: null,
        description: null,
        csvMapping: {
          idColumnOffset: 'A',
          descriptionColumnOffset: 'B',
          localDescriptionColumnOffset: null,
          rowOffset: 1,
        },
        csvMappingFields: [],
        csvMappingNutrients: [],
      },
      loadCallback: transformIn,
      config: { transform: transformOut },
    });

    const chunk = 10;
    const nutrients = ref<CsvMappingNutrient[]>([]);

    const nutrientsAvailableToLoad = computed(() => nutrients.value.length < data.value.csvMappingNutrients.length);

    function loadMoreNutrients(isIntersecting: boolean) {
      if (!isIntersecting || !nutrientsAvailableToLoad.value)
        return;

      const startIndex = nutrients.value.length;
      const endIndex
        = startIndex + chunk > data.value.csvMappingNutrients.length
          ? data.value.csvMappingNutrients.length
          : startIndex + chunk;

      const items = data.value.csvMappingNutrients.slice(startIndex, endIndex);
      nutrients.value.push(...items);
    };

    function addField() {
      data.value.csvMappingFields.push({ fieldName: 'new_field', columnOffset: 'A' });
    };

    function removeField(index: number) {
      data.value.csvMappingFields.splice(index, 1);
    };

    function addNutrient() {
      data.value.csvMappingNutrients.push({
        nutrientTypeId: refs.value.nutrientTypes[0].id,
        columnOffset: 'A',
      });
    };

    function removeNutrient(index: number) {
      data.value.csvMappingNutrients.splice(index, 1);
    };

    watch(() => data.value.csvMappingFields, () => {
      errors.clear('csvMappingFields');
    });

    watch(() => data.value.csvMappingNutrients, () => {
      errors.clear('csvMappingNutrients');
    });

    return {
      addField,
      addNutrient,
      entry,
      entryLoaded,
      isEdit,
      loadMoreNutrients,
      nutrientsAvailableToLoad,
      nutrients,
      refs,
      refsLoaded,
      clearError,
      data,
      errors,
      removeField,
      removeNutrient,
      routeLeave,
      submit,
    };
  },
});
</script>

<style lang="scss" scoped></style>
