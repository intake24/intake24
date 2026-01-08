import { orderBy } from 'lodash-es';

import { actionTypes as actionTypeRefs, conditionOpCodes, layoutTypes } from '@intake24/common/prompts';
import type { ConditionOpCode } from '@intake24/common/prompts';
import { recordVisibilities } from '@intake24/common/security';
import {
  helpAvailableFields as helpAvailableFieldRefs,
  helpRequiredFields as helpRequiredFieldRefs,
  recallFlows as recallFlowRefs,
  schemeTypes as schemeTypeRefs,
} from '@intake24/common/surveys';
import { colors as themeColors, variants as themeVariants } from '@intake24/common/theme';
import { textDirections as textDirectionRefs } from '@intake24/common/types';
import { useI18n } from '@intake24/i18n';

import { opToIconMap } from './op-icon-map';

export function useSelects() {
  const { i18n: { messages, locale, t } } = useI18n();

  const actions = actionTypeRefs.map(value => ({
    value,
    title: t(`survey-schemes.actions.types.${value}`),
  }));

  const variants = themeVariants.map(value => ({
    value,
    title: t(`survey-schemes.theme.variants.${value}`),
  }));

  const colors = Object.entries(themeColors).map(([key, color]) => ({
    value: key,
    title: key.toUpperCase(),
    color,
  }));

  const conditionOps: { icon: string; op: ConditionOpCode; title: string }[] = conditionOpCodes.map(op => ({
    icon: opToIconMap[op],
    op,
    title: t(`survey-schemes.conditions.ops.${op}`),
  }));

  const flags = orderBy(
    Object.entries(messages.value[locale.value].flags).map(([key, value]) => ({
      value: key,
      title: value,
    })),
    'title',
  );

  const layouts = layoutTypes.map(value => ({
    value,
    title: t(`survey-schemes.theme.layouts.${value}`),
  }));

  const orientations = ['column', 'row'].map(value => ({
    title: t(`survey-schemes.prompts.orientation.${value}`),
    value,
  }));

  const textDirections = textDirectionRefs.map(value => ({
    value,
    title: t(`languages.textDirections.${value}`),
    icon: value === 'ltr' ? 'fas fa-right-long' : 'fas fa-left-long',
  }));

  const visibilities = recordVisibilities.map(value => ({
    value,
    title: t(`securables.visibility.${value}`),
    icon: value === 'restricted' ? 'fas fa-eye-slash' : 'fas fa-eye',
  }));

  const schemeTypes = schemeTypeRefs.map(value => ({
    value,
    title: t(`survey-schemes.settings.types.${value}`),
  }));

  const recallFlows = recallFlowRefs.map(value => ({
    value,
    title: t(`survey-schemes.settings.flows.${value}`),
  }));

  const helpAvailableFields = helpAvailableFieldRefs.map(value => ({
    value,
    title: t(`survey-schemes.settings.help.${value}`),
  }));
  const helpRequiredFields = helpRequiredFieldRefs.map(value => ({
    value,
    title: t(`survey-schemes.settings.help.${value}`),
  }));

  return {
    actions,
    colors,
    conditionOps,
    flags,
    helpAvailableFields,
    helpRequiredFields,
    layouts,
    orientations,
    recallFlows,
    schemeTypes,
    textDirections,
    variants,
    visibilities,
  };
}
