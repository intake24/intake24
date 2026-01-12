import type { SetupContext } from 'vue';
import { counterDefaults, sliderDefaults } from '@intake24/common/prompts';
import { useI18n } from '@intake24/ui';
import { useBasePrompt } from './use-base-prompt';

export function useMultiple(props: any, ctx: Pick<SetupContext<'update:options'[]>, 'emit'>) {
  const { i18n } = useI18n();
  const { update } = useBasePrompt(props, ctx);

  const multiDefaults = {
    counter: counterDefaults,
    slider: sliderDefaults,
  };
  const multipleTypes = [false, 'slider', 'counter'] as const;
  const multipleItems = multipleTypes.map(value => ({
    value,
    title: value ? i18n.t(`survey-schemes.prompts.${value}._`) : i18n.t('common.disabled'),
  }));

  const updateMultiple = (value: typeof multipleTypes[number] | boolean) => {
    update('multiple', typeof value === 'string' ? multiDefaults[value] : false);
  };

  return { multipleItems, updateMultiple };
}
