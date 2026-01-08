import type { CamelCase, Replace } from 'type-fest';
import { camelCase } from 'lodash-es';

import type { ComponentType } from '@intake24/common/prompts';

export const promptType = (component: ComponentType) => camelCase(component.replace('-prompt', '')) as CamelCase<Replace<ComponentType, '-prompt', ''>>;
