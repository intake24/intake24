<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-container fluid>
      <v-form @keydown="clearError" @submit.prevent="submit">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.id"
                :disabled="isEdit"
                :error-messages="errors.get('id')"
                hide-details="auto"
                :label="$t('nutrient-types.id')"
                name="id"
                prepend-inner-icon="$nutrient-types"
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
            <v-col cols="12" md="6">
              <v-select
                v-model="data.unitId"
                :error-messages="errors.get('unitId')"
                hide-details="auto"
                item-title="description"
                item-value="id"
                :items="nutrientUnits"
                :label="$t('nutrient-units._')"
                name="unitId"
                prepend-inner-icon="$nutrient-units"
                variant="outlined"
                @update:model-value="errors.clear('unitId')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="data.kcalPerUnit"
                :error-messages="errors.get('kcalPerUnit')"
                hide-details="auto"
                :label="$t('nutrient-types.kcalPerUnit')"
                name="kcalPerUnit"
                prepend-inner-icon="fas fa-bolt"
                variant="outlined"
              />
            </v-col>
          </v-row>
          <submit-footer :disabled="errors.any.value" />
        </v-card-text>
      </v-form>
    </v-container>
  </layout>
</template>

<script lang="ts">
import type { NutrientTypeRefs, NutrientTypeResponse } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';

type NutrientTypeForm = {
  id: string | null;
  description: string | null;
  unitId: string | null;
  kcalPerUnit: number | null;
};

export default defineComponent({
  name: 'NutrientTypeForm',

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded, isEdit, refs, refsLoaded } = useEntry<
      NutrientTypeResponse,
      NutrientTypeRefs
    >(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<
      NutrientTypeForm,
      NutrientTypeResponse
    >(props, {
      data: { id: null, description: null, unitId: null, kcalPerUnit: null },
    });

    return {
      entry,
      entryLoaded,
      isEdit,
      refs,
      refsLoaded,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
    };
  },

  computed: {
    nutrientUnits() {
      const nutrientUnits = [{ id: null, description: this.$t('common.none') }];

      if (!this.refs.units)
        return nutrientUnits;

      return [...nutrientUnits, ...this.refs.units];
    },
  },
});
</script>

<style lang="scss" scoped></style>
