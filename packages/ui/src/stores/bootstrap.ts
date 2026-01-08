import { PiniaDebounce } from '@pinia/plugin-debounce';
import { debounce } from 'lodash-es';
import { createPinia } from 'pinia';
import { createPersistedState } from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(createPersistedState({
  key: id => `${import.meta.env.VITE_APP_PREFIX ?? ''}${id}`,
  debug: import.meta.env.DEV,
}));
pinia.use(PiniaDebounce(debounce));

export default pinia;
