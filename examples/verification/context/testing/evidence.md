---
type: context
title: エビデンス
description: エビデンスの撮影の手段の例。Playwright の spec で撮り、agent-browser で探索する構成
status: draft
---

# エビデンス

パッケージ verification のスキルが読む、利用者の context の例。attach-evidence が写す骨組みのうち、撮影の手段の Capture Tools のセクションだけを、Playwright と agent-browser を使う構成で埋めた。  
写して使うときは、利用者のリポジトリのツールとコマンドに書き換える。

## Capture Tools

- 証跡は Playwright の spec で撮る。agent-browser は、spec を書く前の探索と、Playwright で自動化できない認証を通る画面だけに使う。
- viewport と録画のサイズは 1920x1200 にする。

### Playwright

対象のリポジトリの `node_modules` の Playwright を使い、依存を足さない。スクリプトを別の場所に置くときは、解決先を環境変数で渡す。

```js
const { chromium, firefox, webkit } = await import(process.env.PW_MODULE ?? '@playwright/test');
```

```sh
PW_MODULE="<対象のリポジトリ>/node_modules/@playwright/test/index.mjs" node record.mjs
```

- 入っているエンジンは、macOS なら `ls ~/Library/Caches/ms-playwright` で分かる。`firefox` と `webkit` はエンジンで、Firefox や Safari のアプリそのものではない。
- 録画は `context.close()` で確定する。パスは `page.video().path()` で取る。
- `viewport` と `recordVideo.size` を揃える。`video: 'on'` の既定は 800x450 に縮める。
- 字幕とカーソルは、スキル capture-browser-evidence の `references/playwright-overlay/` を写して重ねる。`recordEvidence` の `prepare` が、録画しないコンテキストでログインする。
  - `storageState` は `sessionStorage` を持たない。`addInitScript` で、タブを開いたときに一度だけ入れ直す。
  - 検証用のページは `page.goto` で開く。`page.setContent` は `addInitScript` を流し直さない。
- テストが `route` で張るモックは、Playwright が起動したブラウザの中でだけ当たる。

既存のテストを撮るときは、撮るための設定を置き場所に作り、`--config` で渡す。

```ts
// <置き場所>/playwright.capture.config.ts
import { defineConfig, devices } from '@playwright/test';
import base from '../playwright.config';

export default defineConfig({
  ...base,
  testDir: '../tests/e2e',                                     // 継承元の相対パスは解決できない
  globalSetup: require.resolve('../tests/e2e/global-setup.ts'),
  workers: 1,
  retries: 0,
  use: {
    ...base.use,
    ...devices['Desktop Chrome'],
    viewport: { width: 1920, height: 1200 },                  // devices の 1280x720 を上書きする
    launchOptions: { slowMo: 700 },
    video: { mode: 'on', size: { width: 1920, height: 1200 } },
  },
  projects: undefined,
});
```

```bash
npx playwright test --config <置き場所>/playwright.capture.config.ts \
  --reporter=json <specs> > <置き場所>/<検証名>/report.json
```

ローカルのサーバは、専用のポートで起動し、既存のサーバを使い回さない。

```ts
webServer: {
  command: `npm run dev -- --port ${PORT} --strictPort`,
  url: `http://localhost:${PORT}`,
  reuseExistingServer: false,
},
```

### agent-browser

コマンドの仕様は `agent-browser skills get core` が返す。探索的テストのガイドは `agent-browser skills get dogfood` にある。

```bash
agent-browser set viewport 1920 1200
agent-browser record start <path>.webm
agent-browser open <url>      # record start はコンテキストを開き直すので、開き直す
# 操作
agent-browser record stop     # 出力が ✓ Recording saved であることと、動画の尺を確認する
```

- セレクタは `agent-browser snapshot` が出す role と名前で取る。`@e1` のような参照は spec に持ち込まない。
- 手順は bash のスクリプトにして流す。zsh では `agent-browser mouse move $xy` に座標が渡らない。
- CDP で動くため、Chromium 系しか操作できない。
- 応答が固定のモックは `agent-browser network route <url> --body <json>` で張る。要求で変わるなら、モックの handler を HTTP サーバで返し、開発サーバの proxy をそこへ向ける。
- `agent-browser tab` はフォーカスを移すことがある。`agent-browser tab <tabId>` で戻してから `eval` する。
