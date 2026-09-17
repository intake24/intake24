import io from './io/index.test';
import locales from './locales/index.test';
import surveys from './surveys/index.test';

export default () => {
  describe('io', io);
  describe('locales', locales);
  describe('surveys', surveys);
};
