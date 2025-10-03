<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="600px">
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-list-item link v-bind="props">
          <template #prepend>
            <v-icon icon="$download" start />
          </template>
          <v-list-item-title>
            {{ $t('survey-schemes.prompts.templates.add') }}
          </v-list-item-title>
        </v-list-item>
      </slot>
    </template>
    <v-card :loading="loading" :tile="$vuetify.display.smAndDown">
      <v-toolbar color="secondary">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click.stop="cancel" />
        <v-toolbar-title>
          {{ $t('survey-schemes.prompts.templates.title') }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-6 d-flex flex-column gr-4">
        <v-text-field
          v-model="search"
          clearable
          hide-details="auto"
          :label="$t('common.search._')"
          :loading="loading"
          prepend-inner-icon="$search"
          variant="outlined"
          @click:append="fetch"
          @click:clear="clear"
          @keyup.enter="fetch"
        />
        <v-alert v-if="promptAlreadyExists" type="error">
          {{
            $t('survey-schemes.prompts.templates.alreadyExists', {
              promptId: selected.at(0)?.id,
            })
          }}
        </v-alert>
        <template v-if="prompts.length">
          <v-list v-model:selected="selected" class="list-border" lines="two" min-height="350px">
            <v-list-item v-for="prompt in prompts" :key="prompt.id" :value="prompt">
              <template #prepend="{ isSelected, select }">
                <v-list-item-action class="mr-2">
                  <v-checkbox-btn :model-value="isSelected" @update:model-value="select" />
                </v-list-item-action>
                <v-icon>fas fa-question-circle</v-icon>
              </template>
              <v-list-item-title>{{ prompt.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ `ID: ${prompt.id} | Type: ${prompt.component}` }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <div class="text-center">
            <v-pagination v-model="page" :length="lastPage" rounded />
          </div>
        </template>
        <v-alert v-else color="secondary" type="info">
          {{ $t('survey-schemes.prompts.templates.none') }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-btn class="font-weight-bold" color="error" variant="text" @click.stop="cancel">
          <v-icon icon="$cancel" start />
          {{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          class="font-weight-bold"
          color="info"
          :disabled="!isSelected || promptAlreadyExists"
          variant="text"
          @click.stop="confirm"
        >
          <v-icon icon="$success" start />
          {{ $t('common.action.ok') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { useHttp } from '@intake24/admin/services';
import type { Prompt } from '@intake24/common/prompts';
import type { SurveySchemeTemplates } from '@intake24/common/types/http/admin';
import { copy } from '@intake24/common/util';

defineOptions({ name: 'LoadPromptDialog' });

const props = defineProps({
  schemeId: {
    type: String,
    required: true,
  },
  promptIds: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  items: {
    type: Array as PropType<Prompt[]>,
  },
});

const emit = defineEmits(['load']);

const http = useHttp();

const dialog = ref(false);
const loading = ref(false);

const page = ref<number>(1);
const lastPage = ref<number | undefined>();
const search = ref<string | null>(null);

const prompts = ref<Prompt[]>([]);
const selected = ref<Prompt[]>([]);

const isSelected = computed(() => !!selected.value.length);
const promptAlreadyExists = computed(() => !!props.promptIds.find(id => id === selected.value.at(0)?.id));

async function fetchLocally(search: string | null, page: number, limit = 5) {
  const currentPage = page - 1;

  const filtered = (props.items ?? []).filter(currentItem =>
    search ? currentItem.name.match(new RegExp(search, 'i')) : true,
  );

  const items = filtered.slice(currentPage * limit, currentPage * limit + limit);
  const lastPage = Math.floor(filtered.length / limit) + 1;

  return { items, lastPage };
}

async function fetchFromApi(search: string | null, page: number, limit = 5) {
  const {
    data: {
      data: items,
      meta: { lastPage },
    },
  } = await http.get<SurveySchemeTemplates>(
    `admin/survey-schemes/${props.schemeId}/templates`,
    { params: { search, page, limit } },
  );

  return { items, lastPage };
}

async function fetch() {
  loading.value = true;

  try {
    const result = props.items
      ? await fetchLocally(search.value, page.value)
      : await fetchFromApi(search.value, page.value);

    prompts.value = result.items;
    lastPage.value = result.lastPage;
  }
  finally {
    loading.value = false;
  }
}

function close() {
  selected.value = [];
  dialog.value = false;
};

function cancel() {
  close();
};

function confirm() {
  if (!isSelected.value)
    return;

  emit('load', copy(selected.value.at(0)));
  close();
};

async function clear() {
  search.value = null;
  await fetch();
}

watch(dialog, async (val) => {
  if (val && !prompts.value.length)
    await fetch();
});

watch(page, async () => {
  await fetch();
});

watchDebounced(
  search,
  () => {
    page.value = 1;
    fetch();
  },
  { debounce: 500, maxWait: 2000 },
);
</script>
