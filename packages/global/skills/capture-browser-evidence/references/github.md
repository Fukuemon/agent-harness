# GitHub へ添付する

## 上げ方

gh 2.99.0 以降の `--attach` で上げる。`gh --version` で確認し、古ければ利用者に更新を頼む。

- 使えるコマンドは `gh issue create`、`gh issue edit`、`gh issue comment`、`gh pr create`、`gh pr edit`、`gh pr comment` である。`gh pr review` と差分行のコメントには使えない。
- 本文に `![<名前>](./<path>)` と書き、同じパスを `--attach` に渡す。本文の参照は、上げた先の URL に書き換わる。本文が参照しないファイルは、本文の末尾に足される。
- 同じファイルを 2 度渡すと失敗する。ファイルを並べるときは `--attach` を繰り返す。1 回のコマンドで渡せるのは 50 ファイルまで。
- 一部のファイルだけ上げられなかったときも、上げられた分で本文は作られ、終了コードは 0 以外になる。本文の参照を数え直してから、足りない分を上げ直す。
- 上げられる大きさは、画像が 10 MB、動画が Free のプランで 10 MB、有料のプランで 100 MB である。
- 上げるには、リポジトリへの push の権限が要る。
- トークンを取り出して `uploads.github.com` を直接呼ばない。gh が使う口だが、公開の API 文書にない。

## 本文に載せる

pull request を作るときに、本文の下書きと、表とスクリーンショットが参照するファイルを一緒に渡す。

```bash
gh pr create -R <owner>/<repo> --draft --title <題> --body-file <本文.md> \
  --attach ./media/<before>.mp4 --attach ./media/<after>.mp4 --attach ./frames/<frame>.png
```

- 作った後に足すときは `gh pr edit <number> --body-file <本文.md> --attach ...` にする。本文のファイルを渡さないと、ファイルは今の本文の末尾に足され、表に入らない。
- 撮り直して差し替えるときは、`gh pr view <number> --json body --jq .body` で今の本文を取り、差し替える参照だけを `./<path>` に戻して `gh pr edit` に渡す。手元の下書きから上げ直すと、画面で直した本文が消える。
- 本文の上限は 65,536 文字である。上げた先の URL は 1 つあたり 80 文字ほどで、上限に近づくのは `<details>` に貼るコードと出力である。

差分行のコメントに動画を添えるときは、先に pull request のコメントへ上げ、そのコメントの本文から URL を取って貼る。

## 添付できたことの確認の方法

- 投稿した後に、API で本文を取り、`https://github.com/user-attachments/assets/` の参照の数が、上げたファイルの数と合うことを確認する。
- 表のセルの中の `![<名前>](./<path>)` は、`[<名前>](<URL>)` の形に書き換わる。画面では動画として表示される。
- private なリポジトリの URL は、認証がないと 404 になる。公開の場に URL を貼っても、権限のない人は見られない。

```bash
gh pr view <number> -R <owner>/<repo> --json body --jq .body | grep -o 'github.com/user-attachments/assets/' | wc -l
gh api repos/<owner>/<repo>/issues/comments/<id> --jq '.body' | grep -o 'github.com/user-attachments/assets/' | wc -l   # コメントのとき
```
