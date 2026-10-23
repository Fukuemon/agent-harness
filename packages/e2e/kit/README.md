# @fukuemon/e2e-kit

Playwright の E2E のテストで使う kit。字幕とカーソルを重ねたエビデンスの録画、エビデンスの名前と置き場、ログインの状態の保存と、テストの書き方の ESLint の規則を持つ。  
[agent-harness](https://github.com/Fukuemon/agent-harness) のパッケージ e2e の一部で、スキル write-e2e-test と同じバージョンで公開する。

## Installation

```sh
npm install --save-dev @fukuemon/e2e-kit
```

- `@playwright/test` の 1.59 以上を peer に取る。ESLint の規則を使うときは、ESLint の 9 以上と `@typescript-eslint/parser` も入れる。
- 録画を mp4 に変換するので、`ffmpeg` と `ffprobe` が要る。
- Node.js の 22.12 以上で動く。

## Usage

kit は 4 つのサブパスに分かれる。

| サブパス | 持つもの |
| --- | --- |
| `@fukuemon/e2e-kit/recording` | 1 本を録画する `recordEvidence`、pull request か issue に添付するエビデンスを撮る `recordPrEvidence` |
| `@fukuemon/e2e-kit/evidence` | 改修前と改修後のどちらを撮るかを決める `variants` と `variantsFromEnv`、配置先の `evidenceDir`、ファイル名の `evidenceName` |
| `@fukuemon/e2e-kit/auth` | ログインの状態を保存して使い回す `ensureSavedLogin`、人がファイルに書いた認証コードを読む `otpFromFile` |
| `@fukuemon/e2e-kit/eslint` | テストの書き方の規則 `rule` と、それを持つプラグイン `plugin` |

pull request に添付するエビデンスは、利用者のリポジトリの薄い層から `recordPrEvidence` を呼んで撮る。

```ts
import { fileURLToPath } from 'node:url'
import { test } from '@playwright/test'
import { variantsFromEnv } from '@fukuemon/e2e-kit/evidence'
import { recordPrEvidence } from '@fukuemon/e2e-kit/recording'

const root = fileURLToPath(new URL('../..', import.meta.url))

for (const variant of variantsFromEnv('http://localhost:3000')) {
  test(`一覧を開く ${variant.label}`, async ({ browser }) => {
    await recordPrEvidence(
      browser,
      { root, appName: 'my-app', viewport: { width: 1280, height: 800 } },
      { name: 'open-list', title: '一覧を開く', actor: 'ログインなし', variant },
      async (page) => page.goto('/'),
      async ({ page, step, check }) => {
        await page.goto('/')
        await step('前提 トップの画面を開いている')
        await page.getByTestId('nav-list').click()
        await check('ならば 一覧が表示される')
      },
    )
  })
}
```

- 環境変数 `EVIDENCE_NO` に pull request か issue の番号を渡して流す。`<root>/.ai-out/evidence/<番号>/open-list.mp4` に添付する動画ができる。
- `EVIDENCE_BEFORE_URL` を渡すと改修前と改修後を両方撮り、`EVIDENCE_ONLY` に `before` か `after` を渡すと片方だけを撮る。

ESLint の規則は、テストのディレクトリの親で流す設定に入れる。

```js
// eslint.config.mjs
import tsParser from '@typescript-eslint/parser'
import { plugin } from '@fukuemon/e2e-kit/eslint'

export default [
  {
    files: ['tests/**/*.ts'],
    languageOptions: { parser: tsParser },
    plugins: { e2e: plugin },
    rules: {
      'e2e/e2e-authoring-rule': ['error', { timeoutDefinitionFile: 'tests/fixtures/timeouts.ts' }],
    },
  },
]
```

規則が見るのは、ESLint の cwd から見たテストのディレクトリ（既定は `tests`）の下だけ。options と、層、待ち方、要素の指し方の考え方は、[パッケージ e2e の Design Doc](https://github.com/Fukuemon/agent-harness/blob/main/packages/e2e/DesignDoc.md) にある。

## License

MIT
