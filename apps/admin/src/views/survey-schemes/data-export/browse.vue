<template>
  <layout v-if="entryLoaded" v-bind="{ id, entry }" v-model:route-leave="routeLeave" @save="submit">
    <v-card-title>{{ $t('survey-schemes.data-export.title') }}</v-card-title>
    <v-card-text>
      <p>List of export sections to be exported.</p>
      <p>Export sections can be re-ordered using drag & drop.</p>
      <p>Each section can be modified to define specific fields and order for export.</p>
    </v-card-text>
    <v-toolbar color="grey-lighten-2">
      <v-toolbar-title class="font-weight-medium">
        {{ $t(`survey-schemes.data-export.sections._`) }}
      </v-toolbar-title>
      <v-spacer />
      <v-menu v-if="availableSections.length" :close-on-content-click="false" location="bottom left">
        <template #activator="{ props }">
          <v-btn color="primary" icon="$add" size="small" :title="$t('survey-schemes.data-export.add')" v-bind="props" />
        </template>
        <v-list density="compact">
          <v-list-item v-for="section in availableSections" :key="section.id" link>
            <v-list-item-title>{{ section.title }}</v-list-item-title>
            <template #append>
              <v-list-item-action class="my-1">
                <v-btn icon="$add" :title="$t('survey-schemes.data-export.add')" @click.stop="add(section.id)" />
              </v-list-item-action>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>
      <options-menu>
        <select-resource resource="survey-schemes" return-object="dataExport" @update:model-value="load">
          <template #activator="{ props }">
            <v-list-item v-bind="props" link>
              <template #prepend>
                <v-icon icon="$download" />
              </template>
              <v-list-item-title>
                {{ $t('survey-schemes.load') }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </select-resource>
        <json-editor-dialog v-model="data.dataExport" />
      </options-menu>
    </v-toolbar>
    <data-export-section
      :ref-fields="sectionRefFields"
      :section="selected"
      @close="close"
      @update="update"
    />
    <v-list class="list-border" lines="two">
      <vue-draggable
        v-model="data.dataExport"
        :animation="300"
        handle=".drag-and-drop__handle"
      >
        <v-list-item
          v-for="(section, idx) in data.dataExport"
          :key="section.id"
        >
          <template #prepend>
            <v-avatar class="drag-and-drop__handle" icon="$handle" />
          </template>
          <v-list-item-title>
            {{ $t(`survey-schemes.data-export.sections.${section.id}`) }}
          </v-list-item-title>
          <template #append>
            <v-list-item-action>
              <v-btn
                icon
                :title="$t('survey-schemes.data-export.edit')"
                @click.stop="edit(section)"
              >
                <v-icon color="secondary-lighten-2">
                  $edit
                </v-icon>
              </v-btn>
            </v-list-item-action>
            <v-list-item-action>
              <confirm-dialog
                color="error"
                icon
                icon-left="$delete"
                :label="$t('survey-schemes.data-export.remove')"
                @confirm="remove(idx)"
              >
                {{ $t('common.action.confirm.remove', { name: $t(`survey-schemes.data-export.sections.${section.id}`) }) }}
              </confirm-dialog>
            </v-list-item-action>
          </template>
        </v-list-item>
      </vue-draggable>
    </v-list>
  </layout>
</template>

<script lang="ts">
import type { SurveySchemeForm } from '../form.vue';
import type { ExportSection, ExportSectionId } from '@intake24/common/surveys';
import type {
  SurveySchemeEntry,
  SurveySchemeExportRefs,
} from '@intake24/common/types/http/admin';

import { computed, defineComponent, onMounted, ref } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';

import { OptionsMenu, SelectResource } from '@intake24/admin/components/dialogs';
import { JsonEditorDialog } from '@intake24/admin/components/editors';
import { formMixin } from '@intake24/admin/components/entry';
import { useEntry, useEntryFetch, useEntryForm } from '@intake24/admin/composables';
import { useHttp } from '@intake24/admin/services';
import { defaultExport, exportSectionIds } from '@intake24/common/surveys';
import { ConfirmDialog, useI18n } from '@intake24/ui';

import DataExportSection from './data-export-section.vue';

export type SurveySchemeDataExportForm = Pick<SurveySchemeForm, 'dataExport'>;

export default defineComponent({
  name: 'SurveySchemeDataExport',

  components: {
    ConfirmDialog,
    DataExportSection,
    JsonEditorDialog,
    OptionsMenu,
    SelectResource,
    VueDraggable,
  },

  mixins: [formMixin],

  setup(props) {
    const { i18n } = useI18n();
    const http = useHttp();
    const selected = ref<ExportSection | null>(null);
    const exportRefs = ref<SurveySchemeExportRefs | null>(null);

    const { entry, entryLoaded } = useEntry<SurveySchemeEntry>(props);
    const { fetch } = useEntryFetch(props);
    const { clearError, form: { data }, routeLeave, submit } = useEntryForm<
      SurveySchemeDataExportForm,
      SurveySchemeEntry
    >(props, {
      data: { dataExport: defaultExport },
      editMethod: 'patch',
    });

    const sectionRefFields = computed(() => {
      if (!selected.value || !exportRefs.value)
        return [];

      return exportRefs.value[selected.value.id] ?? [];
    });

    const availableSections = computed(() => {
      const used = data.value.dataExport.map(section => section.id);

      return exportSectionIds
        .filter(id => !used.includes(id))
        .map(id => ({ id, title: i18n.t(`survey-schemes.data-export.sections.${id}`) }));
    });

    const add = (section: ExportSectionId) => {
      data.value.dataExport.push({ id: section, fields: [] });
    };

    const edit = (section: ExportSection) => {
      selected.value = section;
    };

    const update = (section: ExportSection) => {
      const match = data.value.dataExport.find(field => field.id === section.id);
      if (!match)
        return;

      match.fields = [...section.fields];
    };

    const close = () => {
      selected.value = null;
    };

    const load = (exportSections: ExportSection[]) => {
      data.value.dataExport = [...exportSections];
    };

    const remove = (idx: number) => {
      data.value.dataExport.splice(idx, 1);
    };

    const fetchExportRefs = async () => {
      const { data } = await http.get<SurveySchemeExportRefs>(
        `admin/survey-schemes/${props.id}/data-export`,
      );
      exportRefs.value = data;
    };

    onMounted(async () => {
      await fetchExportRefs();
    });

    return {
      add,
      availableSections,
      clearError,
      close,
      edit,
      exportRefs,
      entry,
      entryLoaded,
      fetch,
      data,
      load,
      remove,
      routeLeave,
      sectionRefFields,
      selected,
      submit,
      update,
    };
  },

  watch: {
    async $route() {
      await this.fetch();
    },
  },
});
</script>

<style lang="scss" scoped></style>
