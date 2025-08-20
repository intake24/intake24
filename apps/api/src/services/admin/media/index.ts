import localStore from './local-store';

export * from './local-store';
export * from './media.service';
export { default as mediaService } from './media.service';
export * from './store';

export const mediaStores = {
  local: localStore,
};
