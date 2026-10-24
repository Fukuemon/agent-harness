// E2E のテストの書き方の規則の設定の雛形。<e2e.dir>/eslint.config.mjs に写す。
// 規則は ESLint の cwd から見た tests/ の下だけを見るので、<e2e.dir> で ESLint を流す。
import tsParser from '@typescript-eslint/parser'
import { plugin } from '@fukuemon/e2e-kit/eslint'

export default [
  {
    files: ['tests/**/*.ts'],
    languageOptions: { parser: tsParser },
    plugins: { e2e: plugin },
    rules: {
      'e2e/e2e-authoring-rule': [
        'error',
        {
          timeoutDefinitionFile: 'tests/fixtures/timeouts.ts',
          // widgets/ に書いてはいけない画面 ID の形。画面 ID の規則が無ければ、この行を消す
          screenIdPattern: '<画面 ID の正規表現>',
        },
      ],
    },
  },
]
