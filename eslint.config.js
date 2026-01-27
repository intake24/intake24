import antfu from '@antfu/eslint-config';

export default await antfu({
  stylistic: {
    semi: true,
  },
  markdown: false,
  vue: true,
  formatters: true,
  ignores: [
    'deployment',
    '**/public',
    'apps/api/src/food-index/language-backends/en/metaphone3.ts',
    'apps/api/src/food-index/language-backends/arabic-stemmer/index.js',
  ],
}, {
  rules: {
    'import/order': 'off',
    'no-console': 'off',
    'node/prefer-global/buffer': ['error', 'always'],
    'node/prefer-global/process': ['error', 'always'],
    'unused-imports/no-unused-vars': ['error', {
      ignoreRestSiblings: true,
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'jsdoc/require-returns-description': 'off',
    'perfectionist/sort-imports': ['error', {
      groups: [
        'type-import',
        ['type-parent', 'type-sibling', 'type-index', 'type-internal'],
        'value-builtin',
        'value-external',
        'value-internal',
        ['value-parent', 'value-sibling', 'value-index'],
        'side-effect',
        'ts-equals-import',
        'unknown',
      ],
      internalPattern: ['^@intake24/.*'],
      order: 'asc',
      type: 'natural',
    }],
    // TODO: migrate to pnpm catalog and enable
    'pnpm/json-enforce-catalog': 'off',
    'pnpm/json-prefer-workspace-settings': 'off',
    'pnpm/json-valid-catalog': 'off',

    'style/quote-props': ['error', 'as-needed'],
    'style/member-delimiter-style': ['error', { multiline: { delimiter: 'semi' }, singleline: { delimiter: 'semi' } }],
    'ts/ban-types': 'off',
    'ts/consistent-type-imports': 'off',
    'ts/consistent-type-definitions': 'off',
    'ts/no-explicit-any': 'off',
    'ts/no-use-before-define': 'warn',
    'unicorn/consistent-function-scoping': 'off',
    'vue/attributes-order': ['error', { alphabetical: true }],
    'vue/block-order': ['error', { order: [['script', 'template'], 'style'] }],
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/multi-word-component-names': 'warn',
    'vue/valid-v-slot': ['error', { allowModifiers: true }],
  },
});
