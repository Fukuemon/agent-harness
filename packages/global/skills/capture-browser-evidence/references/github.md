# GitHub へ添付する

## 上げ方

gh 2.99.0 以降の `--attach` で上げる。`gh --version` で確かめ、古ければ利用者に更新を頼む。

- 使えるコマンドは `gh issue create`、`gh issue edit`、`gh issue comment`、`gh pr create`、`gh pr edit`、`gh pr comment` である。`gh pr review` と差分行のコメントには使えない。
- 本文に `![<名前>](./<path>)` と書き、同じパスを `--attach` に渡す。本文の参照は、上げた先の URL に書き換わる。本文が参照しないファイルは、本文の末尾に足される。
- 同じファイルを 2 度渡すと失敗する。ファイルを並べるときは `--attach` を繰り返す。
- 上げられる大きさは、画像が 10 MB、動画が Free のプランで 10 MB、有料のプランで 100 MB である。
- 上げるには、リポジトリへの push の権限が要る。
- トークンを取り出して `uploads.github.com` を直接呼ばない。gh が使う口だが、公開の API 文書にない。

```bash
gh pr comment <number> -R <owner>/<repo> --body-file <本文.md> --attach ./media/<file>.mp4
```

差分行のコメントに動画を添えるときは、先に pull request のコメントへ上げ、そのコメントの本文から URL を取って貼る。

## 添付できたことの確かめ方

- 投稿した後に、API でコメントの本文を取り、`https://github.com/user-attachments/assets/` の参照の数が、上げたファイルの数と合うことを確かめる。
- 表のセルの中の `![<名前>](./<path>)` は、`[<名前>](<URL>)` の形に書き換わる。画面では動画として表示される。
- private なリポジトリの URL は、認証がないと 404 になる。公開の場に URL を貼っても、権限のない人は見られない。

```bash
gh api repos/<owner>/<repo>/issues/comments/<id> --jq '.body' | grep -o 'github.com/user-attachments/assets/' | wc -l
```
