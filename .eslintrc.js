module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
        jest: true
    },
    extends: ['standard', 'eslint:recommended', 'prettier', 'plugin:prettier/recommended'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module'
    },
    rules: {
        indent: ['error', 4, { SwitchCase: 1 }],
        'linebreak-style': ['error', 'unix'],
        quotes: ['error', 'single'],
        semi: ['error', 'never'],
        'arrow-body-style': 'off',
        'prettier/prettier': ['error']
    },
    plugins: ['prettier']
}
