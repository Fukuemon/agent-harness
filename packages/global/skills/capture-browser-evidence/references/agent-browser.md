# agent-browser で証跡を撮る

コマンドの仕様は `agent-browser skills get core` が返す。探索的テストのガイドは `agent-browser skills get dogfood` にある。

## 手順はスクリプトにする

コマンドを 1 つずつ打って撮ると、録画が途中で止まり、`record stop` が `✗ No recording in progress` を返したことがある。手順を bash のスクリプトにして流すと、headed でも headless でも止まらなかった。

- zsh では、引用符のない変数が単語に分かれない。`agent-browser mouse move $xy` に座標が渡らず、直前のポインタの位置を押す。スクリプトは bash で実行する。
- `record stop` の出力が `✓ Recording saved` であることと、動画の尺を確かめる。

## 録画は新しいコンテキストで始まる

`record start` は、ブラウザのコンテキストを開き直す。Cookie と localStorage は引き継ぐが、タブの構成は引き継がない。  
`record start` の後に `open` で画面を開き直してから、操作を始める。

```bash
agent-browser set viewport 1920 1200
agent-browser record start <path>.webm
agent-browser open <url>
# 操作
agent-browser record stop      # 保存したパスを出力する
```

## 動画は実時間より縮む

画面が変わらない間のフレームが落ち、約 45 秒の操作が 7〜12 秒の動画になった。`wait` で間を取っても、動画では間にならない。  
手順をゆっくり見せる必要があるときは、Playwright の `slowMo` で撮る。agent-browser の動画を使うときは、縮んでいることを README に書く。

## テストのモック

テストが Playwright の `route` で張るモックは、agent-browser のブラウザでは当たらない。

- 応答が固定なら、`agent-browser network route <url> --body <json>` で張る。
- 応答が要求で変わるなら、モックの handler を HTTP サーバで返し、開発サーバの proxy をそこへ向ける。

## タブ

- タブの増減は録画に映らない。`agent-browser tab` が出すタイトルと URL の一覧を一次の証跡にする。
- `agent-browser tab` はフォーカスを移すことがある。`agent-browser tab <tabId>` で戻してから `eval` する。別のタブで評価すると関数が未定義というエラーになり、実装の不具合と間違えやすい。
