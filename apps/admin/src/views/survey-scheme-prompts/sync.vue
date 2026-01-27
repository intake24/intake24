<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }">
    <v-card-title>
      {{
        $t(`survey-scheme-prompts.sync.title`, { id: entry.prompt.id })
      }}
    </v-card-title>
    <v-card-text v-if="!schemes.length">
      <v-alert color="secondary" type="info">
        {{ $t(`survey-scheme-prompts.sync.noSchemes`) }}
      </v-alert>
    </v-card-text>
    <v-list lines="two">
      <v-list-item
        v-for="scheme in schemes"
        :key="scheme.id"
        :class="scheme.synced ? `green lighten-5` : `ternary`"
      >
        <template #prepend>
          <v-icon>fas fa-route</v-icon>
        </template>
        <v-list-item-title class="mb-2">
          {{ $t('survey-schemes._') }}: {{ scheme.name }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ $t('common.status') }}: {{ $t(`survey-scheme-prompts.sync.${scheme.synced}`) }}
        </v-list-item-subtitle>
        <template #append>
          <v-list-item-action>
            <v-icon
              v-if="scheme.synced"
              color="success"
              size="large"
              :title="$t('survey-scheme-prompts.sync.true')"
            >
              fa-check-circle
            </v-icon>
            <confirm-dialog
              v-else
              color="warning"
              icon
              icon-left="$sync"
              :label="$t('survey-scheme-prompts.sync.synchronize')"
              @confirm="sync(scheme)"
            >
              <template #activator="{ props }">
                <v-btn v-bind="props" icon :title="$t('survey-scheme-prompts.sync.false')">
                  <v-icon color="warning" size="large">
                    $sync
                  </v-icon>
                </v-btn>
              </template>
              {{ $t('survey-scheme-prompts.sync.confirm') }}
            </confirm-dialog>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-list>
  </layout>
</template>

<script lang="ts">
import type { PromptSection } from '@intake24/common/surveys';
import type {
  SurveySchemePromptEntry,
  SurveySchemePromptRefs,
} from '@intake24/common/types/http/admin';

import { deepEqual } from 'fast-equals';
import { defineComponent } from 'vue';

import { detailMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch } from '@intake24/admin/composables';
import { flattenSchemeWithSection } from '@intake24/common/surveys';
import { ConfirmDialog } from '@intake24/ui';

export type SchemeStatus = {
  id: string;
  name: string;
  section: PromptSection;
  synced: boolean;
};

export default defineComponent({
  name: 'SchemePromptSync',

  components: { ConfirmDialog },

  mixins: [detailMixin],

  setup(props) {
    const { entry, entryLoaded, refs, refsLoaded } = useEntry<
      SurveySchemePromptEntry,
      SurveySchemePromptRefs
    >(props);
    const { fetch } = useEntryFetch(props);

    return { entry, entryLoaded, fetch, refs, refsLoaded };
  },

  computed: {
    schemes(): SchemeStatus[] {
      if (!this.refsLoaded)
        return [];

      return this.refs.schemes.reduce<SchemeStatus[]>((acc, scheme) => {
        const prompts = flattenSchemeWithSection(scheme.prompts);

        const match = prompts.find(
          prompt => prompt.id === this.entry.prompt.id && prompt.name === this.entry.prompt.name,
        );
        if (match) {
          const { section, ...prompt } = match;

          acc.push({
            id: scheme.id,
            name: scheme.name,
            section,
            synced: deepEqual(this.entry.prompt, prompt),
          });
        }

        return acc;
      }, []);
    },
  },

  methods: {
    async sync(scheme: SchemeStatus) {
      const { prompt } = this.entry;
      const { id: surveySchemeId, section } = scheme;

      await this.$http.post(`admin/${this.module}/${this.id}/sync`, {
        surveySchemeId,
        section,
        prompt,
      });
      await this.fetch();
    },
  },
});
</script>

<style lang="scss" scoped></style>
