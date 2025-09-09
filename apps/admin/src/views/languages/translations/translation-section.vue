<script lang="ts">
import type { PropType, VNodeChild } from 'vue';
import has from 'lodash/has';
import isPlainObject from 'lodash/isPlainObject';
import pick from 'lodash/pick';
import { computed, defineComponent, h, ref, watch } from 'vue';
import {
  VBtn,
  VCard,
  VCardTitle,
  VCol,
  VContainer,
  VDialog,
  VIcon,
  VRow,
  VSpacer,
  VTextField,
  VToolbar,
  VToolbarTitle,
} from 'vuetify/components';

import type { LanguageTranslationAttributes } from '@intake24/common/types/http/admin';
import { copy } from '@intake24/common/util';

import { useI18n } from '@intake24/i18n';
import type { LocaleMessageDictionary } from '@intake24/i18n';
import IntersectableSkeleton from './intersectable-skeleton.vue';

export default defineComponent({
  name: 'TranslationSection',

  components: { IntersectableSkeleton },

  props: {
    translation: {
      type: Object as PropType<LanguageTranslationAttributes>,
    },
  },

  emits: ['close', 'update'],

  setup(props, { emit }) {
    const { i18n } = useI18n();

    const dialog = ref(false);
    const chunk = 10;
    const allMessages = ref<LocaleMessageDictionary<any>>({});
    const loadedMessages = ref<LocaleMessageDictionary<any>>({});

    const sectionTitle = computed(() => {
      const key = props.translation?.section;
      if (!key)
        return '';

      const check = has(i18n.messages.value[i18n.locale.value], `${key}.title`);
      if (check)
        return i18n.t(`${key}.title`);

      return i18n.t(`languages.translations.sections.${key}`);
    });

    const allKeys = computed(() => Object.keys(allMessages.value));
    const loadedKeys = computed(() => Object.keys(loadedMessages.value));
    const messagesAvailableToLoad = computed(() => loadedKeys.value.length < allKeys.value.length);

    function loadMoreMessages(isIntersecting: boolean) {
      if (!isIntersecting || !messagesAvailableToLoad.value)
        return;

      const startIndex = loadedKeys.value.length;
      const endIndex
        = startIndex + chunk > allKeys.value.length
          ? allKeys.value.length
          : startIndex + chunk;

      const items = allKeys.value.slice(startIndex, endIndex);
      loadedMessages.value = { ...loadedMessages.value, ...pick(allMessages.value, items) };
    };

    function close() {
      dialog.value = false;
    };

    function cancel(event: Event) {
      event.stopPropagation();

      close();
    };

    function save(event: Event) {
      event.stopPropagation();

      if (!props.translation)
        return;

      const { translation: { id } } = props;

      emit('update', { id, messages: { ...allMessages.value, ...loadedMessages.value } });
      close();
    };

    function createInputs(
      translations: LocaleMessageDictionary<any>,
      path: string[] = [],
    ): VNodeChild[] {
      const items = Object.keys(translations);
      if (!items.length || props.translation === null)
        return [];

      const section = props.translation?.section;
      if (!section)
        return [];

      const inputs = items.map((item) => {
        const fullPath = [section, ...path, item].join('.');

        if (isPlainObject(translations[item]))
          return createInputs(translations[item], [...path, item]);

        return h(VCol, { cols: 12 }, () => h(VTextField, {
          messages: i18n.t(fullPath),
          label: fullPath,
          outlined: true,
          modelValue: translations[item],
          'onUpdate:modelValue': (event: string) => {
            translations[item] = event;
          },
        }));
      });

      return inputs;
    };

    watch(dialog, (val) => {
      if (!val)
        emit('close');
    });

    watch(() => props.translation, (val) => {
      if (!val)
        return;

      allMessages.value = copy(val.messages);
      loadedMessages.value = {};
      dialog.value = true;
    });

    return () => h(
      VDialog,
      {
        fullscreen: true,
        hideOverlay: true,
        modelValue: dialog.value,
        transition: 'dialog-bottom-transition',
        'onUpdate:modelValue': (event: boolean) => {
          dialog.value = event;
        },
      },
      {
        default: () => [
          h(VCard, {
            tile: true,
          }, {
            default: () => [
              h(
                VToolbar,
                { color: 'secondary' },
                {
                  default: () => [
                    h(
                      VBtn,
                      {
                        title: i18n.t('common.action.cancel'),
                        icon: '$cancel',
                        variant: 'plain',
                        onClick: cancel,
                      },
                    ),
                    h(VToolbarTitle, () => sectionTitle.value),
                    h(VSpacer),
                    h(
                      VBtn,
                      {
                        title: i18n.t('common.action.ok'),
                        variant: 'text',
                        onClick: save,
                      },
                      {
                        default: () => [
                          h(VIcon, { start: true }, () => '$success'),
                          i18n.t('common.action.ok'),
                        ],
                      },
                    ),
                  ],
                },
              ),
              h(VContainer, null, {
                default: () => [
                  h(
                    VCardTitle,
                    () => `${i18n.t('languages.translations.title')} - ${sectionTitle.value}`,
                  ),
                  h(VRow, null, {
                    default: () => [
                      createInputs(loadedMessages.value),
                      ...[
                        messagesAvailableToLoad.value
                          ? h(VCol, { cols: 12 }, {
                              default: () => [
                                h(IntersectableSkeleton, {
                                  type: 'list-item',
                                  onIntersected: loadMoreMessages,
                                }),
                              ],
                            })
                          : undefined,
                      ].filter(Boolean),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    );
  },
});
</script>

<style lang="scss" scoped></style>
