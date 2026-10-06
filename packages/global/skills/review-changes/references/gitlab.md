# GitLab の merge request

glab で操作する。`<host>` と `<encoded>`（プロジェクトのパスの `/` を `%2F` にしたもの）と `<iid>` は、merge request の URL から取る。

- `glab api` には `-R` がなく、`--hostname <host>` で渡す。リポジトリの外では既定が gitlab.com になるため、必ず付ける。
- 権限が無いときも、GitLab は `404` を返す。パスとホストが正しければ、次に権限を確かめる。
- `glab api` は、`-f` か `-F` を付けると既定のメソッドが POST になる。一覧は `--paginate` を付けないと 1 ページ目しか返らない。

## head を取る

`merge_requests/<iid>/versions` の先頭の要素に、最新の version の `head_commit_sha`、`base_commit_sha`、`start_commit_sha` がある。投稿にも 3 つとも使う。

```sh
glab api --hostname <host> "projects/<encoded>/merge_requests/<iid>/versions" | jq '.[0]'
```

## スレッドを読む

`glab mr view -c` の出力には、コメントのファイルと行が出ない。ディスカッションから取る。

```sh
glab api --hostname <host> --paginate \
  "projects/<encoded>/merge_requests/<iid>/discussions" \
  | jq '.[] | {id, notes: [.notes[] | {id, type, author: .author.username, resolved, path: .position.new_path, line: .position.new_line, body}]}'
```

- 差分は `merge_requests/<iid>/diffs`（ページ送りあり）で取る。`changes` は非推奨で、大きな merge request では切り詰められる。

## 差分行に投稿する

順に進める。どれかを飛ばすと、行に紐付かない通常のコメントになる。

1. 行番号を、差分の種類で決める。
   - 追加した行は `new_line` だけ、削除した行は `old_line` だけ。
   - 変更していない行は `old_line` と `new_line` の両方。片方だけだと行に紐付かない。
   - 名前を変えたファイルでは、`old_path` に変更前のパスを入れる。
   - 複数の行にまたがるときは、`position.line_range` に始まりと終わりの `line_code` を入れる。形は `<new_path の SHA1>_<old_line>_<new_line>` で、差分にない行番号は拒否される。
2. `position` を JSON の本文に入れ、`discussions` へ POST する。`-f 'position[base_sha]=...'` の角括弧は zsh がグロブとして展開して失敗するので、JSON を `--input -` で送る。

   ```sh
   jq -n \
     --arg body "$body" \
     --arg base "<base_commit_sha>" --arg start "<start_commit_sha>" --arg head "<head_commit_sha>" \
     --arg path "<path>" --argjson line <new_line> \
     '{body: $body, position: {position_type: "text", base_sha: $base, start_sha: $start, head_sha: $head, old_path: $path, new_path: $path, new_line: $line}}' \
     | glab api --hostname <host> -X POST -H 'Content-Type: application/json' --input - \
       "projects/<encoded>/merge_requests/<iid>/discussions"
   ```

3. 自分のノートの `type` が `DiffNote` であることを確かめる。`position` が誤っていても、API はエラーを返さずに通常のコメントとして作ることがある。`DiffNote` でなければ、そのノートを削除し、手順 1 に戻る。

   ```sh
   glab api --hostname <host> --paginate "projects/<encoded>/merge_requests/<iid>/discussions" \
     | jq -r '.[].notes[] | select(.author.username == "<自分>") | [.id, .type, .position.new_path, (.position.new_line | tostring)] | @tsv'
   ```

## 対応の案の書き方

GitLab は `diff` の fence の全行を diff として色付けする。

- ファイル名は fence の外の見出しに書き、その下に `L32 を置換` のように位置を書く。
- 置換は、1 つの `diff` の fence に 1 か所だけ入れる。追加だけなら、言語の fence にする。`+` だけの塊は、置換と区別できない。

## 更新

本文を直すときは、削除せずに `PUT projects/<encoded>/merge_requests/<iid>/discussions/<discussion_id>/notes/<note_id>` で `body` を更新する。
