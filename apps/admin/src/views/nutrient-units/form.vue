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
                :label="$t('nutrient-units.id')"
                name="id"
                prepend-inner-icon="$nutrient-units"
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
              <v-text-field
                v-model="data.symbol"
                :error-messages="errors.get('symbol')"
                hide-details="auto"
                :label="$t('nutrient-units.symbol')"
                name="symbol"
                prepend-inner-icon="fas fa-square-root-variable"
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
import type { NutrientUnitAttributes } from '@intake24/common/types/http/admin';

import { defineComponent } from 'vue';

import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';

type NutrientUnitForm = {
  id: string | null;
  description: string | null;
  symbol: string | null;
};

export default defineComponent({
  name: 'NutrientTypeForm',

  mixins: [formMixin],

  setup(props) {
    const { entry, entryLoaded, isEdit } = useEntry<NutrientUnitAttributes>(props);
    useEntryFetch(props);
    const { clearError, form: { data, errors }, routeLeave, submit } = useEntryForm<
      NutrientUnitForm,
      NutrientUnitAttributes
    >(props, {
      data: { id: null, description: null, symbol: null },
    });

    return {
      entry,
      entryLoaded,
      isEdit,
      clearError,
      data,
      errors,
      routeLeave,
      submit,
    };
  },
});
</script>

<style lang="scss" scoped></style>
