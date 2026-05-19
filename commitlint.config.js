/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'perf', 'test', 'docs', 'style', 'chore', 'ci', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      ['auth', 'user', 'catalog', 'cart', 'order', 'payment', 'media', 'common', 'config', 'db'],
    ],
    'scope-empty': [1, 'never'],   // warn nếu không có scope
    'subject-max-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-full-stop': [2, 'never', '.'],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
};
