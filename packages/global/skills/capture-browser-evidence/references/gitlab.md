# GitLab へ添付する

## 上げ方

- 画面から: agent-browser でログイン済みの issue か merge request を開き、`snapshot` でファイルの入力欄を探して `agent-browser upload @eN <path>` で渡す。
- API から: `glab api --form` で上げ、返る `markdown` を本文に貼って `glab mr note` か `glab issue note` で投稿する。複数のファイルと繰り返しに向く。
  - uploads の API は multipart/form-data しか受けない。`--form` は glab 1.115 以降にある。`-F file=@<path>` は内容を文字列で送るため 400 になる。
  - トークンを取り出して `curl` で送らない。`glab auth status --show-token` の出力の形はバージョンで変わり、伏せたつもりのトークンがログに出る。

```bash
glab api --hostname <host> -X POST "projects/<group%2Frepo>/uploads" --form file=@<path> | jq -r .markdown
```

## 添付できたことの確かめ方

- `/uploads/...` の URL は Cookie で認証する。`PRIVATE-TOKEN` で取ると、302 でログインのページの HTML が 200 で返る。添付の失敗と読まない。
- アップロードの一覧（`GET /projects/:id/uploads`）は Maintainer 以上でないと 403 になる。
- 権限が無いときに確かめられるのは、POST が URL を返したことと、本文がそれを参照していることまで。ブラウザでの再生の確認は依頼した人に任せると書く。
- 投稿した後は、API でノートの本文を取り、`/uploads/` の参照の数と表の崩れを確かめる。
- 既存のスレッドを分けるときは、1 本を転用する。消して作り直すと、付いた議論も消える。
