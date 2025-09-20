<template>
  <v-dialog
    v-model="dialog"
    attach="body"
    :fullscreen="$vuetify.display.smAndDown"
    max-width="80%"
    transition="dialog-bottom-transition"
  >
    <template #activator="{ props }">
      <slot name="activator" v-bind="{ props }">
        <v-btn
          v-if="mobile"
          class="order-3 nav-item__help"
          v-bind="props"
          value="help"
        >
          <v-icon icon="$info" />
          <span>{{ $t('common.faqs._') }}</span>
        </v-btn>
        <v-btn
          v-else
          color="grey"
          v-bind="props"
          :title="$t('common.faqs.title')"
          variant="flat"
        >
          <v-icon icon="$info" start />
          {{ $t('common.faqs._') }}
        </v-btn>
      </slot>
    </template>
    <v-card class="faqs__card" :tile="mobile">
      <v-toolbar
        color="primary"
        extended
        extension-height="200"
      >
        <v-btn icon="$cancel" :title="$t('common.action.cancel')" @click.stop="close" />
        <v-toolbar-title>{{ $t('common.faqs.title') }}</v-toolbar-title>
        <template #image>
          <v-img
            cover
            gradient="to bottom, rgba(255, 255, 255, 0) 75%, #fff 100%"
            src="/faq-orange.jpeg"
          />
        </template>
        <template #extension>
          <div class="px-4 d-flex justify-center items-center flex-column mx-auto">
            <v-card class="px-4 py-4 py-md-6 faqs-hero__card rounded-lg d-flex flex-column gr-2" flat>
              <h1 class="text-h1 font-weight-medium text-center px-4">
                {{ $t('common.faqs.title') }}
              </h1>
              <h2 class="text-h6 font-weight-medium text-center px-4">
                {{ $t('common.faqs.subtitle') }}
              </h2>
            </v-card>
          </div>
        </template>
      </v-toolbar>
      <v-sheet class="py-4 faqs-sections">
        <v-container class="container-max pa-2 pa-md-4">
          <div class="d-flex flex-column gr-4">
            <v-card
              v-for="section in sections"
              :key="section.id"
              class="pa-5 bg-primary-lighten-5"
              flat
              rounded
            >
              <div class="text-h5 font-weight-medium mb-4">
                {{ translate(section.title) }}
              </div>
              <v-expansion-panels focusable>
                <v-expansion-panel v-for="items in section.items" :key="items.id">
                  <v-expansion-panel-title>
                    {{ translate(items.title) }}
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div v-html="translate(items.content)" />
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card>
          </div>
        </v-container>
      </v-sheet>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { onMounted, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useI18n } from '@intake24/i18n';
import { useFAQs } from '@intake24/survey/stores';

const props = defineProps({
  surveyId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['open', 'close']);

const { mobile } = useDisplay();
const { translate } = useI18n();

function useFAQContent() {
  const faqs = useFAQs();
  const { sections } = storeToRefs(faqs);
  const { loadSections } = faqs;

  onMounted(async () => {
    await loadSections(props.surveyId);
  });

  return { faqs, sections };
}

const { sections } = useFAQContent();

const dialog = ref(false);

function close() {
  dialog.value = false;
}

watch(dialog, (val) => {
  emit(val ? 'open' : 'close');
});
</script>

<style lang="scss">
.faqs__card {
  .v-toolbar__content {
    background-color: rgba(0, 0, 0, 0.6);
  }
}

.faqs-hero__card {
  background-color: rgba(var(--v-theme-primary-lighten-5), 0.75);
}
</style>
