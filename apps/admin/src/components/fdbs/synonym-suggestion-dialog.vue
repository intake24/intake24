<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="560px">
    <template #activator="{ props: activatorProps }">
      <v-btn
        class="ai-suggest-btn"
        color="deep-purple-accent-2"
        :disabled="!foodName"
        size="small"
        :title="$t('fdbs.foods.local.altNames.suggest')"
        variant="tonal"
        v-bind="activatorProps"
        @click="onOpen"
      >
        <v-icon icon="fas fa-wand-magic-sparkles" size="small" start />
        <span class="d-none d-sm-inline">{{ $t('fdbs.foods.local.altNames.suggest') }}</span>
      </v-btn>
    </template>

    <v-card class="suggestion-card" :tile="$vuetify.display.smAndDown">
      <v-toolbar class="suggestion-toolbar" color="deep-purple-darken-1" density="comfortable">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click="close" />
        <v-toolbar-title class="text-body-1 font-weight-medium">
          {{ $t('fdbs.foods.local.altNames.suggest') }}
        </v-toolbar-title>
        <v-spacer />
        <v-chip v-if="!loading && suggestions.length" class="mr-2" color="white" size="small" variant="outlined">
          {{ suggestions.length }} {{ $t('fdbs.foods.local.altNames.found') }}
        </v-chip>
      </v-toolbar>

      <v-card-text class="pa-0">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-content">
            <v-progress-circular color="deep-purple-accent-2" indeterminate size="48" width="3" />
            <div class="loading-text mt-4">
              {{ $t('fdbs.foods.local.altNames.generating') }}
            </div>
            <div class="loading-subtext mt-1 text-medium-emphasis">
              {{ foodName }}
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container pa-6">
          <v-alert color="error" icon="fas fa-exclamation-triangle" variant="tonal">
            <div class="text-body-2">
              {{ error }}
            </div>
          </v-alert>
          <v-btn class="mt-4" color="deep-purple" variant="tonal" @click="fetchSuggestions">
            <v-icon icon="fas fa-rotate" start />
            {{ $t('common.action.retry') }}
          </v-btn>
        </div>

        <!-- Empty State -->
        <div v-else-if="!suggestions.length" class="empty-container pa-6">
          <v-icon color="grey-lighten-1" icon="fas fa-lightbulb" size="48" />
          <div class="empty-text mt-4 text-body-2 text-medium-emphasis">
            {{ $t('fdbs.foods.local.altNames.noSuggestions') }}
          </div>
        </div>

        <!-- Results -->
        <template v-else>
          <div class="suggestions-header pa-4 pb-2">
            <div class="text-body-2 text-medium-emphasis">
              {{ $t('fdbs.foods.local.altNames.selectSuggestions') }}
            </div>
          </div>

          <v-list class="suggestions-list py-0" select-strategy="leaf">
            <v-list-item
              v-for="(suggestion, i) in suggestions"
              :key="i"
              class="suggestion-item"
              :class="{ 'is-selected': selected.includes(suggestion) }"
              :ripple="false"
              @click="toggleSelection(suggestion)"
            >
              <template #prepend>
                <v-checkbox-btn
                  color="deep-purple-accent-2"
                  :model-value="selected.includes(suggestion)"
                  @update:model-value="toggleSelection(suggestion)"
                />
              </template>
              <v-list-item-title class="suggestion-text">
                {{ suggestion }}
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- Reasoning -->
          <div v-if="reasoning" class="reasoning-container pa-4">
            <div class="reasoning-label text-caption text-uppercase text-medium-emphasis mb-1">
              {{ $t('fdbs.foods.local.altNames.reasoning') }}
            </div>
            <div class="reasoning-text text-body-2">
              {{ reasoning }}
            </div>
          </div>
        </template>
      </v-card-text>

      <v-divider v-if="!loading" />

      <v-card-actions v-if="!loading" class="pa-4">
        <v-btn color="grey-darken-1" variant="text" @click="close">
          {{ $t('common.action.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="deep-purple-accent-2"
          :disabled="!selected.length"
          variant="flat"
          @click="confirm"
        >
          <v-icon icon="fas fa-plus" size="small" start />
          {{ $t('fdbs.foods.local.altNames.addSelected') }}
          <span v-if="selected.length" class="ml-1">({{ selected.length }})</span>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

import { useHttp } from '@intake24/admin/services';
import { useMessages } from '@intake24/ui/stores';

export default defineComponent({
  name: 'SynonymSuggestionDialog',

  props: {
    foodName: {
      type: String,
      required: true,
    },
    languageCode: {
      type: String,
      required: true,
    },
    existingSynonyms: {
      type: Array as () => string[],
      default: () => [],
    },
    category: {
      type: String,
      default: undefined,
    },
  },

  emits: ['addSynonyms'],

  setup(props, { emit }) {
    const http = useHttp();

    const dialog = ref(false);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const suggestions = ref<string[]>([]);
    const reasoning = ref<string | undefined>(undefined);
    const selected = ref<string[]>([]);

    const resetState = () => {
      loading.value = false;
      error.value = null;
      suggestions.value = [];
      reasoning.value = undefined;
      selected.value = [];
    };

    const fetchSuggestions = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await http.post<{
          enabled: boolean;
          suggestions: string[];
          reasoning?: string;
        }>('admin/ai/synonyms/suggest', {
          foodName: props.foodName,
          languageCode: props.languageCode,
          existingSynonyms: props.existingSynonyms,
          category: props.category,
        });

        if (!response.data.enabled) {
          error.value = 'AI synonym suggestions are not enabled';
          return;
        }

        suggestions.value = response.data.suggestions;
        reasoning.value = response.data.reasoning;
        // Pre-select all suggestions by default
        selected.value = [...response.data.suggestions];
      }
      catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch suggestions';
      }
      finally {
        loading.value = false;
      }
    };

    const onOpen = () => {
      resetState();
      fetchSuggestions();
    };

    const close = () => {
      dialog.value = false;
    };

    const toggleSelection = (suggestion: string) => {
      const index = selected.value.indexOf(suggestion);
      if (index === -1) {
        selected.value.push(suggestion);
      }
      else {
        selected.value.splice(index, 1);
      }
    };

    const confirm = () => {
      if (selected.value.length) {
        emit('addSynonyms', [...selected.value]);
        useMessages().success(`Added ${selected.value.length} synonym(s)`);
      }
      close();
    };

    return {
      dialog,
      loading,
      error,
      suggestions,
      reasoning,
      selected,
      onOpen,
      close,
      toggleSelection,
      confirm,
      fetchSuggestions,
    };
  },
});
</script>

<style lang="scss" scoped>
.ai-suggest-btn {
  text-transform: none;
  letter-spacing: normal;
}

.suggestion-card {
  overflow: hidden;
}

.suggestion-toolbar {
  :deep(.v-toolbar-title) {
    color: rgba(255, 255, 255, 0.95);
  }
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  background: linear-gradient(180deg, rgba(103, 58, 183, 0.03) 0%, transparent 100%);
}

.loading-content {
  text-align: center;
}

.loading-text {
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
}

.loading-subtext {
  font-size: 0.8125rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.error-container {
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-container {
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.suggestions-header {
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.suggestions-list {
  max-height: 320px;
  overflow-y: auto;
}

.suggestion-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(103, 58, 183, 0.04);
  }

  &.is-selected {
    background: rgba(103, 58, 183, 0.08);
  }
}

.suggestion-text {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
}

.reasoning-container {
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.reasoning-label {
  letter-spacing: 0.05em;
  font-weight: 600;
}

.reasoning-text {
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.5;
}
</style>
