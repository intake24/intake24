<template>
  <v-card border flat>
    <v-toolbar color="grey-lighten-4">
      <v-icon end icon="fas fa-globe" />
      <v-toolbar-title>
        {{ $t('survey-schemes.prompts.externalSources.title') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text class="d-flex flex-column ga-4">
      <v-select
        :items="sources"
        :label="$t('survey-schemes.prompts.externalSources.sources._')"
        :model-value="source.type"
        name="source"
        variant="outlined"
        @update:model-value="updateType"
      />
      <template v-if="source.type === 'open-food-facts'">
        <v-combobox

          :items="countries"
          :label="$t('survey-schemes.prompts.externalSources.countries._')"
          :model-value="source.country"
          name="country"
          variant="outlined"
        />
        <v-toolbar flat tile>
          <v-toolbar-title class="font-weight-medium">
            <div class="text-h5">
              {{ $t('common.options._') }}
            </div>
          </v-toolbar-title>
          <v-spacer />
          <v-btn color="primary" icon size="small" :title="$t('common.options.add')" @click.stop="addQuery">
            <v-icon size="small">
              $add
            </v-icon>
          </v-btn>
        </v-toolbar>
        <v-list>
          <v-list-item
            v-for="(item, idx) in query"
            :key="item.key"
            link
            :ripple="false"
          >
            <div class="d-flex flex-row align-stretch gc-2 py-2">
              <v-text-field
                v-model="item.key"
                density="compact"
                hide-details="auto"
                :label="$t('common.options.key')"
                variant="outlined"
              />
              <v-text-field
                v-model="item.value"
                density="compact"
                hide-details="auto"
                :label="$t('common.options.value')"
                variant="outlined"
              />
            </div>
            <template #append>
              <v-list-item-action>
                <v-btn color="error" icon="$delete" :title="$t('common.options.remove')" @click.stop="removeQuery(idx)" />
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import type { ExternalSource, ExternalSourceOptions } from '@intake24/common/prompts';
import { defaultExternalSourceOptions, externalSources } from '@intake24/common/prompts';
import { copy } from '@intake24/common/util';
import { useI18n } from '@intake24/ui';

const props = defineProps({
  source: {
    type: Object as PropType<ExternalSourceOptions>,
    required: true,
  },
});
const emit = defineEmits(['update:source']);

const { i18n } = useI18n();

const source = useVModel(props, 'source', emit, { passive: true, deep: true });

const sources = externalSources.map(value => ({
  title: i18n.t(`survey-schemes.prompts.externalSources.sources.${value}`),
  value,
}));
const countries = computed(() => ['world']);

function updateType(value: ExternalSource) {
  source.value = copy(defaultExternalSourceOptions[value]);
}

// Each external sources should be extracted to a separate component
const query = ref(Object.entries(source.value.query).map(([key, value]) => ({ key, value })));
function addQuery() {
  query.value.push({ key: `key-${query.value.length}`, value: `value-${query.value.length}` });
}

function removeQuery(index: number) {
  query.value.splice(index, 1);
}

watch(query, () => {
  source.value.query = query.value.reduce((acc, cur) => ({ ...acc, [cur.key]: cur.value }), {});
}, { deep: true });
</script>

<style lang="scss" scoped></style>
