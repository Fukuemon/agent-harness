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

## 字幕とカーソルを重ねて撮る

観点ごとに撮る spec を新しく書くときは、`assets/playwright-overlay/` の 4 つのファイルを対象のリポジトリへ写す。テストのフレームワークの依存は足さない。ffmpeg と ffprobe が要る。

- `record.ts` の `recordEvidence` が、1 本を録画し、`<検証名>/` の `mp4/`、`frames/`、README を書き出す。比べる条件はファイル名に入れる。
- 本体の中では、前提と操作の文を `step`、その時点の画面で判定できる文を `check` で字幕に出す。`check` は字幕を出し終えた時点の画面を `frames/` に撮る。
- 字幕の 1 段目はどの証跡か（例: 観点 / 条件 / 改修の前後）とカーソルの凡例、2 段目は手順の文である。手順の文は、検証の手順書の文をそのまま写す。
- 撮った環境を `header` に入れ、デプロイされたバージョンを `version` で画面から読む。改修の前後を撮ったとき、どのバージョンを撮ったかが字幕と README から分かる。ローカルの dev サーバのように、バージョンを返さない構成では、どのブランチを撮ったかを別に書く。
- 操作の間に見る判定の文は、操作の前に `step` で出す。字幕は次に変えるまで残る。
- 検証の手順に無い操作を撮影のために足すとき（地図を拡大する、画面の外へ出た対象まで動かすなど）は、その前に「(撮影のため、…)」の字幕を出す。手順と見分けられるようにする。
- 検証用のページは、`page.goto` で `file:` か `data:` の URL を開く。`page.setContent` は `addInitScript` を流し直さずに文書を書き直すので、字幕とカーソルが消える。
- README は、撮るたびに `webm/` の撮った記録から書き直す。人が書き足すと、次に撮ったときに消える。確認した結果は別のファイルか、添付する本文に書く。

### ログインを録画の外で済ませる

`recordEvidence` の `prepare` は、録画しないコンテキストでログインとデータの確認を行う。その後のログインの状態を、録画のコンテキストに入れる。

- `storageState` は cookie と `localStorage` だけを持つ。`sessionStorage` は、`addInitScript` でタブを開いたときに一度だけ入れ直す。読み込みのたびに入れると、画面が書き換えた値を戻してしまう。
- ログインの後に別のポートや別のホストへ移る構成では、移った先でログインの状態を取る。`localStorage` と `sessionStorage` は origin ごとに分かれる。

### 速さを決める

- 人が読む間は、字幕を変えるたびに止める時間で作る。マウスの移動は、`mouse.move` の `steps` で見える速さにする。
- `slowMo` は使わない。全部の操作が遅くなり、待ちの timeout を使い切ることがある。既存のテストを撮るときだけ使う。
- 並べて撮るのは、データを変えない spec だけにする。撮る中でデータを作る spec は、同じ画面を撮るほかの録画に映り込む。

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
uv run --no-project python {このスキルのディレクトリ}/scripts/collect-playwright-videos.py <置き場所>/<検証名>/report.json <置き場所>/<検証名>/<条件> --prefix <条件>
```

- 出力は `<出力先>/webm/<条件>-<spec のファイル名>-<連番>-<describe 名>-<テスト名>.webm`。describe 名が末尾の丸括弧に画面名を持つときは、括弧の中だけを使う。
- 終了コード 0: 全部のテストの録画を取り出した。
- 終了コード 1: 録画の無いテストがあった。標準エラーの一覧を見て、設定の `video` と、テストが実行されたかを確認する。

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

- 配信元は、そのブランチにしか無い import 元で確認する。`curl -s "http://localhost:<port>/src/<改修したファイル>" | grep -n '^import'` のように見る。前後のどちらにも現れる語では、間違えていても一致する。
- 継承元の `globalSetup` がポートを直に書いていたら、暖機もそのポートへ向ける。暖機を省くと、初回のコンパイルが待ち合わせの timeout を使い切り、要素が出ないという別の症状になる。
- 遷移の直後に非同期の判定を挟むアプリでは、続けて出した遷移が巻き戻される。`goto` の後は、URL が一定の時間変わらないことを待ってから次へ進む。
