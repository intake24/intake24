<template>
  <v-dialog v-model="dialog" :fullscreen="$vuetify.display.smAndDown" max-width="560px">
    <template #activator="{ props: activatorProps }">
      <v-btn
        class="ai-suggest-btn"
        color="primary"
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
      <v-toolbar class="suggestion-toolbar" color="primary" density="comfortable">
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" variant="plain" @click="close" />
        <v-toolbar-title class="text-body-1 font-weight-medium">
          {{ $t('fdbs.foods.local.altNames.suggest') }}
        </v-toolbar-title>
        <v-spacer />
        <v-chip v-if="!loading && newSuggestionsCount > 0" class="mr-2" color="white" size="small" variant="outlined">
          {{ newSuggestionsCount }} {{ $t('fdbs.foods.local.altNames.new') }}
        </v-chip>
      </v-toolbar>

      <v-card-text class="pa-0">
        <!-- Loading State - Dynamic Skeleton -->
        <div v-if="loading" class="loading-container">
          <!-- Animated header -->
          <div class="loading-header">
            <div class="loading-icon-wrapper">
              <v-icon class="loading-icon" color="primary" icon="fas fa-wand-magic-sparkles" size="24" />
              <div class="loading-ripple" />
              <div class="loading-ripple loading-ripple-delayed" />
            </div>
            <div class="loading-status">
              <span class="loading-status-text">{{ loadingPhase }}</span>
              <span class="loading-dots">
                <span class="dot" />
                <span class="dot" />
                <span class="dot" />
              </span>
            </div>
            <div class="loading-food-name">
              {{ foodName }}
            </div>
          </div>

          <!-- Skeleton suggestions -->
          <div class="skeleton-list">
            <div v-for="i in 5" :key="i" class="skeleton-item" :style="{ animationDelay: `${i * 0.1}s` }">
              <div class="skeleton-checkbox" />
              <div class="skeleton-text" :style="{ width: `${40 + Math.random() * 40}%` }" />
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
          <v-btn class="mt-4" color="primary" variant="tonal" @click="fetchSuggestions">
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
              class="suggestion-item reveal-animation"
              :class="{
                'is-selected': selected.includes(suggestion),
                'is-existing': isExisting(suggestion),
              }"
              :ripple="!isExisting(suggestion)"
              :style="{ animationDelay: `${i * 0.05}s` }"
              @click="!isExisting(suggestion) && toggleSelection(suggestion)"
            >
              <template #prepend>
                <v-checkbox-btn
                  v-if="!isExisting(suggestion)"
                  color="primary"
                  :model-value="selected.includes(suggestion)"
                  @click.stop
                  @update:model-value="toggleSelection(suggestion)"
                />
                <v-icon
                  v-else
                  class="existing-icon"
                  color="grey-lighten-1"
                  icon="fas fa-check-circle"
                  size="20"
                />
              </template>
              <v-list-item-title class="suggestion-text" :class="{ 'existing-text': isExisting(suggestion) }">
                {{ suggestion }}
              </v-list-item-title>
              <template v-if="isExisting(suggestion)" #append>
                <v-chip class="existing-badge" color="grey-lighten-2" size="x-small" variant="flat">
                  {{ $t('fdbs.foods.local.altNames.alreadyAdded') }}
                </v-chip>
              </template>
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
          color="primary"
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
import { computed, defineComponent, onUnmounted, ref } from 'vue';

import { useHttp } from '@intake24/admin/services';
import { useI18n } from '@intake24/i18n';
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
    const { i18n } = useI18n();

    const dialog = ref(false);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const suggestions = ref<string[]>([]);
    const reasoning = ref<string | undefined>(undefined);
    const selected = ref<string[]>([]);
    const loadingPhase = ref(i18n.t('fdbs.foods.local.altNames.loading.analyzing'));

    let phaseInterval: ReturnType<typeof setInterval> | null = null;

    // Normalize for comparison (lowercase, trimmed)
    const normalizedExisting = computed(() =>
      new Set(props.existingSynonyms.map(s => s.toLowerCase().trim())),
    );

    const isExisting = (suggestion: string) =>
      normalizedExisting.value.has(suggestion.toLowerCase().trim());

    const newSuggestionsCount = computed(() =>
      suggestions.value.filter(s => !isExisting(s)).length,
    );

    const resetState = () => {
      loading.value = false;
      error.value = null;
      suggestions.value = [];
      reasoning.value = undefined;
      selected.value = [];
      loadingPhase.value = 'Analyzing';
      if (phaseInterval) {
        clearInterval(phaseInterval);
        phaseInterval = null;
      }
    };

    const startLoadingAnimation = () => {
      const phases = [
        i18n.t('fdbs.foods.local.altNames.loading.analyzing'),
        i18n.t('fdbs.foods.local.altNames.loading.findingVariations'),
        i18n.t('fdbs.foods.local.altNames.loading.checkingScripts'),
        i18n.t('fdbs.foods.local.altNames.loading.generatingIdeas'),
      ];
      let index = 0;
      phaseInterval = setInterval(() => {
        index = (index + 1) % phases.length;
        loadingPhase.value = phases[index];
      }, 2000);
    };

    const fetchSuggestions = async () => {
      loading.value = true;
      error.value = null;
      startLoadingAnimation();

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
          uiLanguage: i18n.locale.value,
        });

        if (!response.data.enabled) {
          error.value = 'AI synonym suggestions are not enabled';
          return;
        }

        suggestions.value = response.data.suggestions;
        reasoning.value = response.data.reasoning;
        // Pre-select only NEW suggestions (not already existing)
        selected.value = response.data.suggestions.filter(s => !isExisting(s));
      }
      catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch suggestions';
      }
      finally {
        loading.value = false;
        if (phaseInterval) {
          clearInterval(phaseInterval);
          phaseInterval = null;
        }
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
      if (isExisting(suggestion))
        return;
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

    onUnmounted(() => {
      if (phaseInterval) {
        clearInterval(phaseInterval);
      }
    });

    return {
      dialog,
      loading,
      loadingPhase,
      error,
      suggestions,
      reasoning,
      selected,
      newSuggestionsCount,
      isExisting,
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

// ============================================
// Loading State - Dynamic & Engaging
// ============================================
.loading-container {
  min-height: 320px;
  background: linear-gradient(180deg, rgba(238, 103, 45, 0.04) 0%, rgba(238, 103, 45, 0.01) 100%);
}

.loading-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
}

.loading-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 1rem;
}

.loading-icon {
  z-index: 1;
  animation: pulse-icon 2s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.loading-ripple {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(238, 103, 45, 0.3);
  border-radius: 50%;
  animation: ripple-out 2s ease-out infinite;
}

.loading-ripple-delayed {
  animation-delay: 1s;
}

@keyframes ripple-out {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.loading-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.loading-status-text {
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.75);
}

.loading-dots {
  display: flex;
  gap: 3px;
  margin-left: 2px;
}

.dot {
  width: 4px;
  height: 4px;
  background: rgba(238, 103, 45, 0.6);
  border-radius: 50%;
  animation: dot-bounce 1.4s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
}

@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.loading-food-name {
  font-size: 0.8125rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  color: rgba(0, 0, 0, 0.5);
  padding: 0.25rem 0.75rem;
  background: rgba(238, 103, 45, 0.06);
  border-radius: 4px;
}

// Skeleton list
.skeleton-list {
  padding: 0.5rem 0;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  animation: skeleton-fade-in 0.3s ease-out both;

  &:last-child {
    border-bottom: none;
  }
}

@keyframes skeleton-fade-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.skeleton-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.06) 25%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-text {
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.06) 25%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.06) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// ============================================
// Results State
// ============================================
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

// Reveal animation for suggestions
.reveal-animation {
  animation: reveal-slide 0.3s ease-out both;
}

@keyframes reveal-slide {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.suggestion-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(.is-existing) {
    background: rgba(238, 103, 45, 0.04);
  }

  &.is-selected:not(.is-existing) {
    background: rgba(238, 103, 45, 0.08);
  }

  // Existing/already-added state
  &.is-existing {
    background: rgba(0, 0, 0, 0.02);
    cursor: default;
    opacity: 0.7;

    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }
  }
}

.existing-icon {
  margin-left: 10px;
  margin-right: 14px;
}

.suggestion-text {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;

  &.existing-text {
    color: rgba(0, 0, 0, 0.45);
  }
}

.existing-badge {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
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
