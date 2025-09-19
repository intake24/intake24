<template>
  <v-tabs-window-item value="options">
    <div class="d-flex flex-row ga-2">
      <div>
        <v-btn class="mb-4" color="primary" @click="add">
          <v-icon icon="$add" start />
          {{ $t('survey-schemes.prompts.addon-foods-prompt.add') }}
        </v-btn>
        <v-tabs v-model="selected" direction="vertical">
          <vue-draggable
            v-model="addons"
            :animation="300"
            class="d-flex flex-column"
            handle=".drag-and-drop__handle"
          >
            <v-tab v-for="(addon) in addons" :key="addon.id" class="d-flex ga-3" :value="addon.id">
              <v-icon class="drag-and-drop__handle" icon="$handle" start />
              {{ `${addon.entity}:${addon.code}` }}
            </v-tab>
          </vue-draggable>
        </v-tabs>
      </div>
      <v-tabs-window v-model="selected" class="flex-grow-1">
        <v-tabs-window-item v-for="(addon, idx) in addons" :key="addon.id" :value="addon.id">
          <v-card border flat>
            <v-card-title>
              <v-icon icon="fas fa-location-arrow" start />
              {{ `${addon.entity}:${addon.code}` }}
            </v-card-title>
            <v-container>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="addon.id"
                    hide-details="auto"
                    :label="$t('common.id')"
                    :name="`id.${addon.id}`"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4" sm="6">
                  <v-select
                    v-model="addon.entity"
                    class="mb-4"
                    hide-details="auto"
                    :items="['category', 'food']"
                    :label="$t('survey-schemes.prompts.addon-foods-prompt.entity')"
                    :name="`entity.${addon.id}`"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4" sm="6">
                  <v-text-field
                    v-model="addon.code"
                    hide-details="auto"
                    :label="$t('survey-schemes.prompts.addon-foods-prompt.code')"
                    :name="`code.${addon.id}`"
                    variant="outlined"
                  />
                </v-col>
                <v-col>
                  <language-selector
                    v-model="addon.name"
                    border
                    :label="$t('survey-schemes.prompts.addon-foods-prompt.name')"
                    required
                  >
                    <template v-for="lang in Object.keys(addon.name)" :key="lang" #[`lang.${lang}`]>
                      <v-text-field
                        v-model="addon.name[lang]"
                        hide-details="auto"
                        :label="$t('survey-schemes.prompts.addon-foods-prompt.name')"
                        :name="`name.${addon.id}${lang}`"
                        variant="outlined"
                      />
                    </template>
                  </language-selector>
                </v-col>
                <v-col cols="12">
                  <condition-list v-model="addon.filter" prompt="addon-foods-prompt" />
                </v-col>
              </v-row>
            </v-container>
            <v-card-actions>
              <v-spacer />
              <v-btn class="font-weight-bold" color="error" variant="text" @click="remove(idx)">
                <v-icon icon="$delete" start />
                {{ $t('survey-schemes.prompts.addon-foods-prompt.remove') }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
  </v-tabs-window-item>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { deepEqual } from 'fast-equals';
import { ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { LanguageSelector } from '@intake24/admin/components/forms';
import type { Prompts } from '@intake24/common/prompts';
import { copy, randomString } from '@intake24/common/util';
import { ConditionList, useBasePrompt } from '../partials';

const props = defineProps({
  addons: {
    type: Object as PropType<Prompts['addon-foods-prompt']['addons']>,
    required: true,
  },
});

const emit = defineEmits(['update:options']);

const { update } = useBasePrompt(props, { emit });

const addons = ref(copy(props.addons));

watch(() => props.addons, (val) => {
  if (deepEqual(val, addons.value))
    return;

  addons.value = copy(val);
}, { deep: true });

watch(addons, (val) => {
  update('addons', val);
}, { deep: true });

const selected = ref(addons.value.length ? 0 : undefined);

function add() {
  const length = addons.value.push({
    id: randomString(6),
    entity: 'category',
    code: '',
    name: {},
    filter: [],
  });

  selected.value = length - 1;
};

function remove(index: number) {
  addons.value?.splice(index, 1);

  selected.value = addons.value.length ? addons.value.length - 1 : undefined;
};
</script>

<style lang="scss" scoped></style>
