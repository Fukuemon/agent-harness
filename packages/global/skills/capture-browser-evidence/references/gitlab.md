# GitLab へ添付する

## 上げ方

- 画面から: agent-browser でログイン済みの issue か merge request を開き、`snapshot` でファイルの入力欄を探して `agent-browser upload @eN <path>` で渡す。
- API から: `glab api --form` で上げ、返る `markdown` を本文に貼る。複数のファイルと繰り返しに向く。
  - uploads の API は multipart/form-data しか受けない。`--form` は glab 1.115 以降にある。`-F file=@<path>` は内容を文字列で送るため 400 になる。
  - トークンを取り出して `curl` で送らない。`glab auth status --show-token` の出力の形はバージョンで変わり、伏せたつもりのトークンがログに出る。

```bash
glab api --hostname <host> -X POST "projects/<group%2Frepo>/uploads" --form file=@<path> | jq -r .markdown
```

## 本文に載せる

glab には、gh の `--attach` に当たる、本文の参照を書き換えて上げる口が無い。ファイルを先に上げ、返った `markdown` で本文の下書きの `./<path>` を置き換えてから、本文を渡す。

```bash
glab mr create --draft --title <題> --description "$(cat <本文.md>)"
glab mr update <iid> --description "$(cat <本文.md>)"   # 作った後に差し替えるとき
```

- `glab mr create` と `glab mr update` は、本文をファイルで受けない。`--description` に中身を渡す。issue は `glab issue create` と `glab issue update` の `--description` で同じように渡す。
- 返る `markdown` は `![<名前>](/uploads/<hash>/<file>)` の形で、動画の拡張子なら画面で動画として表示される。表のセルの中で再生されるかは未確認。
- 撮り直して差し替えるときは、`glab mr view <iid> -F json` の `description` から今の本文を取り、差し替える参照だけを置き換えて渡す。手元の下書きから渡し直すと、画面で直した本文が消える。
- 本文の上限は 1 MB（1,048,576 バイト）で、文字数ではなくバイト数で数える。表と `<details>` で超えることはまず無い。

## 添付できたことの確かめ方

- `/uploads/...` の URL は Cookie で認証する。`PRIVATE-TOKEN` で取ると、302 でログインのページの HTML が 200 で返る。添付の失敗と読まない。
- アップロードの一覧（`GET /projects/:id/uploads`）は Maintainer 以上でないと 403 になる。
- 権限が無いときに確かめられるのは、POST が URL を返したことと、本文がそれを参照していることまで。ブラウザでの再生の確認は依頼した人に任せると書く。
- 投稿した後は、API で本文かノートの本文を取り、`/uploads/` の参照の数と表の崩れを確かめる。
- 既存のスレッドを分けるときは、1 本を転用する。消して作り直すと、付いた議論も消える。
