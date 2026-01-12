import type { VForm } from 'vuetify/components';
import { useTemplateRef } from 'vue';

import { useI18n } from '@intake24/ui';

export type RuleCallback = (value: string | null) => boolean | string;

export type UseFormProps = {
  action?: (type: string, ...args: [id?: string, params?: object]) => void;
};

export function useForm({ action }: UseFormProps = {}) {
  const { i18n: { t } } = useI18n();

  const form = useTemplateRef<InstanceType<typeof VForm>>('form');

  function inputTooLog(max: number): RuleCallback {
    return (v: string | null) =>
      (v?.length ?? 0) <= max || t('common.validation.tooLong', { max });
  };

  async function submit() {
    const { valid } = await form.value?.validate() ?? {};
    if (!valid)
      return;

    action?.('next');
  }

  return {
    form,
    inputTooLog,
    submit,
  };
}
