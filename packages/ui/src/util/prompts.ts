import type { CamelCase, Replace } from 'type-fest';

import type { ComponentType } from '@intake24/common/prompts';

import { camelCase } from 'lodash-es';

export const promptType = (component: ComponentType) => camelCase(component.replace('-prompt', '')) as CamelCase<Replace<ComponentType, '-prompt', ''>>;
