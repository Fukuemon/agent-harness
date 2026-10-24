---
type: context
title: E2E のテスト
description: E2E のテストの context の例。Playwright と、e2e の kit の lint の規則を使う構成
status: draft
---

# E2E のテスト

パッケージ e2e のスキル write-e2e-test が読む、利用者の context の例。骨組みは write-e2e-test の `assets/` にあり、core の導入のスキルが写す。そのうち、Test Tool、Lint Rule Options、Running Tests のセクションを、Playwright を使う構成で埋めた。  
写して使うときは、利用者のリポジトリのディレクトリとコマンドに書き換える。

## Test Tool

E2E のテストは Playwright で書く。録画、ログインの保存、lint の規則は `@fukuemon/e2e-kit` を使う。  
スキル write-e2e-test が一般の語で書いたものは、Playwright の次の API に当たる。

| スキルの語 | Playwright |
| --- | --- |
| 確認（自動で待つ assertion） | `expect(locator)`。`expect.soft` と `expect.poll` も確認に当たる |
| testid で要素を拾う | `page.getByTestId()`。`locator()` と `getByRole()` などは `selectors/` の中だけで使う |
| 通信の差し替え | `page.route()` と `context.route()`。spec にだけ置く |
| 新しいタブの受け取り | `context.waitForEvent('page')` |
| ページを読み込むたびに実行するスクリプト | `page.addInitScript()` と `context.addInitScript()` |
| 時計の差し替えと時刻の固定 | `page.clock.install({ time })` の後に `page.clock.fastForward()`。日付だけなら `page.clock.setFixedTime()` |
| 値の読み取り | `innerText()`、`textContent()`、`inputValue()`、`getAttribute()`。lint の規則が止める |

- `networkidle` を待たない。取り直しを繰り返す画面では、通信が止まらない。
- 確認は `expect(locator).toHaveText()` のように locator を渡す。`expect(await locator.textContent())` は待たない。

## Lint Rule Options

`e2e/` で ESLint を流し、規則を `tests/**/*.ts` に掛ける。規則が見るのは、ESLint の cwd から見た `tests/` の下だけなので、ほかのディレクトリで流すと何も言わずに通る。

```js
// e2e/eslint.config.mjs
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
          screenIdPattern: '\\b(order|customer)-(list|detail|edit)\\b',
        },
      ],
    },
  },
]
```

## Running Tests

Playwright のプロジェクトを、準備、E2E、エビデンスの 3 つに分ける。CI は E2E だけを流し、エビデンスは pull request を作るときに手元で撮る。

```ts
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'
import { TIMEOUTS } from './tests/fixtures/timeouts'

export default defineConfig({
  testDir: 'tests',
  // spec はログインの状態のファイルを共有するので、worker は 1 つにする
  workers: 1,
  timeout: TIMEOUTS.test,
  expect: { timeout: TIMEOUTS.expect },
  use: { ...devices['Desktop Chrome'], baseURL: process.env.E2E_BASE_URL, trace: 'retain-on-failure' },
  projects: [
    { name: 'setup', testMatch: /setup\/.*\.setup\.ts/ },
    {
      name: 'e2e',
      testMatch: /tests\/specs\/.*\.e2e\.ts/,
      dependencies: ['setup'],
      use: { storageState: '.auth/user.json' },
    },
    // 録画は recordEvidence が新しいコンテキストで撮り、prepare の中でログインするので、setup に依らない
    { name: 'evidence', testMatch: /tests\/evidence\/.*\.e2e\.ts/, timeout: TIMEOUTS.evidence },
  ],
})
```

| コマンド | 流すもの |
| --- | --- |
| `npx playwright test --project=e2e` | E2E のテスト。CI も同じものを流す |
| `EVIDENCE_FOR=issue-<番号> npx playwright test --project=evidence` | エビデンスの spec。`.ai-out/evidence/issue-<番号>/` に動画を書き出す。pull request を作った後に初めて撮るなら `pr-<番号>` にする |
| `npx eslint && npx tsc --noEmit` | テストの書き方の規則と、型のチェック |
