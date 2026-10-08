import type { SinglePrompt } from '@intake24/common/prompts';
import type { PromptSection, PromptSubsection, RecallPrompts } from '@intake24/common/surveys';

import { isMealSection } from '@intake24/common/surveys';

type Translate = (key: string) => string;

const sectionTitleSuffix = /\s+prompts$/i;

export function defaultSubsectionName(t: Translate, section: PromptSection, index: number) {
  const sectionBase = t(`survey-schemes.prompts.${section}.title`).replace(sectionTitleSuffix, '');

  return `${sectionBase} ${index + 1}`;
}

function subsectionKey(section: PromptSection, index: number) {
  return `${section}:${index}`;
}

export function withDefaultSubsections(prompts: RecallPrompts, sections: PromptSection[], t: Translate): RecallPrompts {
  const subsections = { ...prompts.ui?.subsections };

  for (const section of sections) {
    if (subsections[section]?.length)
      continue;

    const sectionPrompts: SinglePrompt[] = isMealSection(section) ? prompts.meals[section] : prompts[section];
    const defaultSubsection: PromptSubsection = {
      id: subsectionKey(section, 0),
      size: sectionPrompts.length,
      expanded: true,
      name: defaultSubsectionName(t, section, 0),
    };

    subsections[section] = [defaultSubsection];
  }

  return { ...prompts, ui: { ...prompts.ui, subsections } };
}
