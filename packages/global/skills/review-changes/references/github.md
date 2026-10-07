# GitHub の pull request

gh と `gh api` で操作する。`<owner>/<repo>` と `<number>` は、pull request の URL から取る。

## head を取る

```sh
gh pr view <number> -R <owner>/<repo> --json headRefOid,baseRefOid
```

## スレッドを読む

`gh pr view --comments` には、差分行のコメントのファイルと行が出ない。GraphQL の `reviewThreads` から取る。解決済みかどうかも、ここにしか出ない。

```sh
gh api graphql --paginate -f query='
query($o: String!, $r: String!, $n: Int!, $endCursor: String) {
  repository(owner: $o, name: $r) { pullRequest(number: $n) {
    reviewThreads(first: 100, after: $endCursor) {
      pageInfo { hasNextPage endCursor }
      nodes { isResolved isOutdated path line startLine
        comments(first: 50) { nodes { databaseId author { login } body } } }
    }
  } }
}' -f o=<owner> -f r=<repo> -F n=<number>
```

- 差分行に付かないコメントは `gh api --paginate repos/<owner>/<repo>/issues/<number>/comments` で取る。
- レビューの本文は `gh api --paginate repos/<owner>/<repo>/pulls/<number>/reviews` で取る。
- `gh api` の一覧は、`--paginate` を付けないと 1 ページ目しか返らない。

## 差分行に投稿する

`commit_id` に head SHA を、`line` に変更後のファイルの行番号を入れる。

```sh
gh api repos/<owner>/<repo>/pulls/<number>/comments \
  -f body="$body" -f commit_id=<head_sha> -f path=<path> -F line=<line> -f side=RIGHT
```

- 削除した行は `side=LEFT` にし、`line` に変更前の行番号を入れる。
- 複数の行にまたがるときは、`-F start_line=<n> -f start_side=RIGHT` を足す。`line` が終わりの行になる。
- 差分にない行を指すと、`422` の `could not be resolved` で失敗する。通常のコメントにはならないので、行番号を差分で確かめ直す。
- 応答の `line` が指定した行であることを確かめる。
- `gh pr review` は差分行に投稿できない。

## 対応の案の書き方

- 1 か所の置換は、`suggestion` の fence で書く。author が画面から適用できる。

  ````md
  ```suggestion
  置き換えた後の行
  ```
  ````

- 複数のファイルや離れた行にまたがる案は、`diff` の fence で書く。GitHub は `+` と `-` で始まる行だけを色付けし、ほかの行は文脈として表示する。

## 更新と返信

- 本文を直すときは、`gh api -X PATCH repos/<owner>/<repo>/pulls/comments/<id> -f body=...` で更新する。
- スレッドに返信するときは、`gh api repos/<owner>/<repo>/pulls/<number>/comments/<id>/replies -f body=...` で送る。

## 動画を添えるとき

差分行のコメントには、gh の `--attach` を使えない。  
先にスキル capture-browser-evidence の手順で、pull request のコメントに添付する。そのコメントの本文から `https://github.com/user-attachments/assets/...` の URL を取り、差分行のコメントの本文に貼る。動画として表示される。
