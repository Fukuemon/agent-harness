---
type: context
title: エビデンス
description: エビデンスの撮影の手段と添付の手順の例。Playwright の spec で撮り、agent-browser で探索し、GitHub か GitLab の CLI で添付する構成
status: draft
---

# エビデンス

パッケージ verification のスキルが読む、利用者の context の例。attach-evidence が写す骨組みのうち、撮影の手段の Capture Tools と、添付の手順の Attachment のセクションだけを埋めた。  
Capture Tools は Playwright と agent-browser を使う構成で書いた。Attachment は GitHub と GitLab の 2 つの例を並べたので、使う方だけを写す。  
写して使うときは、利用者のリポジトリのツールとコマンドに書き換える。

## Capture Tools

- エビデンスは Playwright の spec で撮る。agent-browser は、spec を書く前の探索と、Playwright で自動化できない認証を通る画面だけに使う。
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

## Attachment

### GitHub の場合

`gh` の `--attach` で上げる。使う `gh` が `--attach` を持つかは、`gh pr create --help | grep -- --attach` で確認する。なければ利用者に `gh` の更新を頼む。

- 使えるコマンドは、`--help` に `--attach` がある `gh issue create`、`gh issue edit`、`gh issue comment`、`gh pr create`、`gh pr edit`、`gh pr comment`。`gh pr review` と差分行のコメントには使えない。
- 本文に `![<名前>](./<path>)` と書き、同じパスを `--attach` に渡す。本文の参照は、上げた先の URL に書き換わる。本文が参照しないファイルは、本文の末尾に足される。
- 同じファイルを 2 度渡すと失敗する。ファイルを並べるときは `--attach` を繰り返す。1 回のコマンドで渡せる数の上限は、`--help` の `--attach` の説明にある。
- 一部のファイルだけ上げられなかったときも、上げられた分で本文は作られ、終了コードは 0 以外になる。本文の参照を数え直してから、足りない分を上げ直す。
- 上げられるファイルの大きさは、[Attaching files](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files) で確認する。動画の上限はプランで違う。
- 上げるには、リポジトリへの push の権限が要る。
- トークンを取り出して `uploads.github.com` を直接呼ばない。`gh` が使う口だが、公開の API の文書にない。

pull request を作るときに、本文の下書きと、表とスクリーンショットが参照するファイルを一緒に渡す。

```bash
gh pr create -R <owner>/<repo> --draft --title <題> --body-file <本文.md> \
  --attach ./media/<before>.mp4 --attach ./media/<after>.mp4 --attach ./frames/<frame>.png
```

- 作った後に足すときは `gh pr edit <number> --body-file <本文.md> --attach ...` にする。本文のファイルを渡さないと、ファイルは今の本文の末尾に足され、表に入らない。
- 撮り直して差し替えるときは、`gh pr view <number> --json body --jq .body` で今の本文を取り、差し替える参照だけを `./<path>` に戻して `gh pr edit` に渡す。手元の下書きから上げ直すと、画面で直した本文が消える。
- 本文の上限は文字数で数える。上げた先の URL は 1 つあたり 80 文字ほどで、上限に近づくのは `<details>` に貼るコードと出力である。
- 自分の pull request の差分行のコメントに動画を添えるときは、動画を先に本文に入れ、本文から URL を取って貼る。ほかの人の pull request では本文を書き換えず、pull request のコメントに上げてから、そのコメントの本文から URL を取る。

入ったことは、API で本文を取り、`user-attachments/assets/` の参照の数で確認する。

```bash
gh pr view <number> -R <owner>/<repo> --json body --jq .body | grep -o 'user-attachments/assets/' | wc -l
gh api repos/<owner>/<repo>/issues/comments/<id> --jq '.body' | grep -o 'user-attachments/assets/' | wc -l   # コメントのとき
```

- 表のセルの中の `![<名前>](./<path>)` は、`[<名前>](<URL>)` の形に書き換わる。画面では動画として表示される。ログインしていない画面では、動画はリンクで出る。
- private なリポジトリの URL は、認証がないと 404 になる。公開の場に URL を貼っても、権限のない人は見られない。

過去のコメントに付けた動画は、上げ直さずに、URL を本文の表へ移す。

1. `gh api repos/<owner>/<repo>/issues/<number>/comments` で、`user-attachments` を含むコメントを取る。
2. コメントの本文から URL を取り、観点ごとに本文の表のエビデンスの列に `[<名前>](<URL>)` で書く。
3. `gh pr edit <number> --body-file <本文.md>` で本文を置き換える。`--attach` は渡さない。
4. 参照の数が、移した URL の数と合うことを確認する。

コメントを消したときに、本文の URL が開けるかは未確認。

### GitLab の場合

- 画面から上げるときは、対話でブラウザを操作するツールで、ログイン済みの issue か merge request を開き、ファイルの入力欄にファイルを渡す。
- API から上げるときは、`glab api --form` で上げ、返る `markdown` を本文に貼る。複数のファイルと繰り返しに向く。使う `glab` が `--form` を持つかは、`glab api --help | grep -- --form` で確認する。
  - uploads の API は multipart/form-data しか受けない。`-F file=@<path>` は内容を文字列で送るため 400 になる。
  - トークンを取り出して `curl` で送らない。`glab auth status --show-token` の出力の形はバージョンで変わり、伏せたつもりのトークンがログに出る。
- 上げられるファイルの大きさは、インスタンスの設定で決まる。[Markdown uploads API](https://docs.gitlab.com/api/project_markdown_uploads/) と、インスタンスの管理者に確認する。

```bash
glab api --hostname <host> -X POST "projects/<group%2Frepo>/uploads" --form file=@<path> | jq -r .markdown
```

`glab` には、本文の参照を書き換えて上げる口がない。ファイルを先に上げ、返った `markdown` で本文の下書きの `./<path>` を置き換えてから、本文を渡す。

```bash
glab mr create --draft --title <題> --description "$(cat <本文.md>)"
glab mr update <iid> --description "$(cat <本文.md>)"   # 作った後に差し替えるとき
```

- `glab mr create` と `glab mr update` は、本文をファイルで受けない。`--description` に中身を渡す。issue は `glab issue create` と `glab issue update` の `--description` で同じように渡す。
- 返る `markdown` は `![<名前>](/uploads/<hash>/<file>)` の形で、動画の拡張子なら画面で動画として表示される。表のセルの中で再生されるかは未確認。
- 撮り直して差し替えるときは、`glab mr view <iid> -F json` の `description` から今の本文を取り、差し替える参照だけを置き換えて渡す。手元の下書きから渡し直すと、画面で直した本文が消える。
- 本文の上限は、文字数ではなくバイト数で数える。表と `<details>` で超えることはまずない。

入ったことは、API で本文かノートの本文を取り、`/uploads/` の参照の数と表の崩れで確認する。

- `/uploads/...` の URL は Cookie で認証する。アクセストークンで取ると、302 でログインのページの HTML が 200 で返る。添付の失敗と読まない。
- アップロードの一覧（`GET /projects/:id/uploads`）は Maintainer 以上でないと 403 になる。
- 権限がないときに確認できるのは、POST が URL を返したことと、本文がそれを参照していることまで。ブラウザでの再生の確認は依頼した人に任せると書く。
- 既存のスレッドを分けるときは、1 本を転用する。消して作り直すと、付いた議論も消える。
