# Playwright で証跡を撮る

## 依存を足さない

対象のプロジェクトの `node_modules` の Playwright を使う。  
スクリプトを別の場所に置くとき、ESM はスクリプトの位置から解決するため、cwd を変えても解決先は変わらない。解決先を環境変数で渡す。

```js
const { chromium, firefox, webkit } = await import(process.env.PW_MODULE ?? '@playwright/test');
```

```sh
PW_MODULE="<対象のリポジトリ>/node_modules/@playwright/test/index.mjs" node record.mjs
```

入っているエンジンは、macOS なら `ls ~/Library/Caches/ms-playwright` で分かる。  
Safari の「ウインドウの代わりにタブでページを開く」のような、アプリの設定に依存する事象はエンジンでは測れない。証跡に、測っていない項目として書く。

## 録画の癖

- 録画は Page ごとに分かれる。同じコンテキストで開いたタブは、それぞれ別の `.webm` になる。
- 録画は `context.close()` で確定する。パスは `page.video().path()` で取り、名前は `close()` の後で変える。
- `viewport` と `recordVideo.size` を揃える。揃えないと縮小され、文字が読めない。`video: 'on'` の既定は 800x450 に縮める。

## 既存のテストを撮る

テストの本体と既存の設定は変えない。撮るための設定を証跡の置き場所に作り、`--config` で渡す。

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

継承元の `testDir` と `globalSetup` は相対パスのため、設定ファイルの位置が変わると解決できない。上書きする。

## slowMo は挙動を変える

連続したクリックは等倍では一瞬で終わるため、`slowMo` を 500 から 700 ms にする。遅くしたときだけ失敗するテストは、前提がタイミングに依存している。録画の設定より先に、テストを調べる。

- ダブルクリックで確定する操作では、1 回目のクリックが入力に数えられるかが間隔で変わる。境界を突く検証では、どちらに転んでも結論が変わらない数を渡す。
- 等倍と撮る速度の両方で、同じ条件で 2 回以上通してから証跡にする。

## 録画は JSON のレポートから取り出す

録画のディレクトリ名は、テスト名を途中で切る。JSON のレポートには完全なテスト名と動画のパスが入る。

```bash
npx playwright test --config <置き場所>/playwright.capture.config.ts \
  --reporter=json <specs> > <置き場所>/<検証名>/report.json
python3 scripts/collect-playwright-videos.py <置き場所>/<検証名>/report.json <置き場所>/<検証名>/<条件> --prefix <条件>
```

- 出力は `<出力先>/webm/<条件>-<spec のファイル名>-<連番>-<describe 名>-<テスト名>.webm`。describe 名が末尾の丸括弧に画面名を持つときは、括弧の中だけを使う。
- 終了コード 0: 全部のテストの録画を取り出した。
- 終了コード 1: 録画の無いテストがあった。標準エラーの一覧を見て、設定の `video` と、テストが実行されたかを確かめる。

## ローカルのサーバの間違い

`webServer.reuseExistingServer` が有効だと、別のブランチや worktree で起動したサーバを使う。間違えたまま成功するため気付けない。  
既定のポートはほかの worktree が使っていることがある。止めずに、専用のポートと `reuseExistingServer: false` の設定を足す。

```ts
webServer: {
  command: `npm run dev -- --port ${PORT} --strictPort`,
  url: `http://localhost:${PORT}`,
  reuseExistingServer: false,
},
```

- 配信元は、そのブランチにしか無い import 元で確かめる。`curl -s "http://localhost:<port>/src/<改修したファイル>" | grep -n '^import'` のように見る。前後のどちらにも現れる語では、間違えていても一致する。
- 継承元の `globalSetup` がポートを直に書いていたら、暖機もそのポートへ向ける。暖機を省くと、初回のコンパイルが待ち合わせの timeout を使い切り、要素が出ないという別の症状になる。
- 遷移の直後に非同期の判定を挟むアプリでは、続けて出した遷移が巻き戻される。`goto` の後は、URL が一定の時間変わらないことを待ってから次へ進む。
