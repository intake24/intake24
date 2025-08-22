import categories from './categories';
import codeLookup from './code-lookup.controller';
import fdbs from './fdbs';
import foods from './foods';
import images from './images';

export * from './categories';
export { CodeLookupController } from './code-lookup.controller';
export * from './fdbs';
export * from './foods';
export * from './images';

export default {
  fdbs,
  foods,
  categories,
  images,
  codeLookup,
};
