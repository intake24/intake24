import DefaultTheme from 'vitepress/theme';

import MermaidDiagram from './MermaidDiagram.vue';

import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('MermaidDiagram', MermaidDiagram);
  },
};
