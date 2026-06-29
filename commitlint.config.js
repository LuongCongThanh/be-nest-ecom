module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['auth', 'user', 'catalog', 'cart', 'order', 'payment', 'media', 'common', 'config', 'db'],
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
