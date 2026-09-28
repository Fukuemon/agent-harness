---
name: setup-design-docs
description: パッケージ docs を導入した後に、文書のチェックを動かせるようにするとき、プロジェクトの用語の規則を prh.yml に足すときに使う。textlint を入れ、CONTRIBUTING.md に手順を書き、lefthook と CI にチェックを組み込み、コードベースと issue と pull request から用語の候補を集めて利用者と決める。
---

# setup-design-docs

core の導入のスキル setup-agent-harness を先に実行しておく。`.textlintrc.json`、`prh.yml`、CONTRIBUTING.md は、そのスキルが写す。  
既にあるファイルを書き換えるときは、差分を利用者に見せてから書く。

## チェックを動かせるようにする

1. docs のフックのディレクトリを探す。パッケージマネージャーが `.claude/hooks/docs/hooks/` か `.codex/hooks/docs/hooks/` に配置する。
   - 両方あれば `.claude/` を使う。以後の手順では、見つけたディレクトリを `<docs>` と書く。
   - どちらもなければ、docs はコーディングエージェントの標準の方法で入っている。lefthook と CI からは呼べないので、パッケージマネージャーで入れるよう伝え、用語の規則の手順だけを行う。
2. textlint を入れる。パッケージマネージャーは、リポジトリのロックファイルから決める。`package.json` がなければ、作るかを利用者に尋ねる。devDependencies に入れるのは次の 5 つ。
   - textlint
   - textlint-rule-preset-ai-words-ja
   - textlint-rule-prh
   - textlint-rule-no-mix-dearu-desumasu
   - textlint-rule-sentence-length
3. CONTRIBUTING.md の「文書を直すとき」の節を、次の内容で埋める。`<実行コマンド>` は手順 2 で決めたパッケージマネージャーのものに、`<docs>` は手順 1 のディレクトリに置き換える。案内のコメントは消す。

~~~markdown
## 文書を直すとき

文章の規則は textlint で、経緯の混入とリンクは docs のスクリプトで確かめる。指摘された語は言い換え、`--fix` は使わない。

```sh
<実行コマンド> textlint "**/*.md"
node <docs>/check-history.mjs
node <docs>/check-links.mjs
```

`verified_commit` の後に実装が変わった文書は、`node <docs>/list-drift.mjs` で一覧する。実装と読み比べてから `verified_commit` を進める。
~~~

4. `lefthook.yml` があれば、`pre-commit` に textlint を足す。対象はステージした Markdown だけにする。経緯の混入とリンクは、編集後のフックと CI が見るので、pre-commit には足さない。
5. CI のワークフローがあれば、チェックの手順を足す。
   - checkout で Git の履歴を全部取る。`list-drift.mjs` が Git の履歴を全部読むためである。
   - 配置先は Git で追跡しないので、チェックの前に `apm install --frozen` を実行する。
   - apm は、CONTRIBUTING.md の「開発の準備」と同じ手段で入れる。書かれていなければ、利用者に尋ねる。名前を推測して入れない。
   - textlint、`check-history.mjs`、`check-links.mjs` は失敗にする。`list-drift.mjs` の一覧は失敗にしない。
6. 足したチェックを 1 度ずつ実行し、結果を利用者に見せる。既存の文書に指摘が出たら、直すかを利用者と決める。

## 用語の規則を足す

`prh.yml` の規則は、どのプロジェクトでも成り立つものしか持たない。プロジェクトの用語は、利用者と決めて足す。  
導入のときに 1 度行い、用語が増えたときにも行う。

1. 候補を集める。
   - `context/domain.md` と PRD の用語の一覧。決まった表記の元になる。
   - コードの識別子。型、テーブル、API の名前と、用語の一覧の表記との対応を見る。
   - ホスティングサービスの CLI で読む、直近の 50 件の issue と pull request の題と本文、pull request のレビューのコメント。同じものを違う表記で呼んでいる箇所と、言い換えを求められた語を探す。
2. 候補を 3 種類に分ける。
   - 表記ゆれ。同じ概念の別の書き方。決まった表記に揃える。
   - 使わない語。曖昧な語、古い名前、社内でしか通じない略語。
   - 規則にしない語。文脈で意味が変わる語と、誤検知が多い語。
3. 利用者に尋ねる。1 回にまとめて番号を付け、候補ごとに推奨の案と、見つけた箇所の数を添える。答えを待ってから次へ進む。
4. 決まった規則を `prh.yml` の末尾に足す。1 つの規則に `expected`、`pattern`、`prh` を書く。`prh` には、なぜその表記にするかを 1 文で書く。

```yaml
  - expected: 注文
    pattern: /オーダー|発注(?!者)/
    prh: 利用者が行うのは注文。発注は仕入れ先への操作を指す
```

5. 既存の文書に textlint を実行し、足した規則ごとの指摘の数を見せる。誤検知が多い規則は、`pattern` を狭めるか外す。
6. 用語の一覧にない語を規則にしたときは、`context/domain.md` か PRD に足すよう促す。

## してはいけないこと

- issue と pull request の本文やコメントを、リポジトリのファイルに写さない。読むのは語を集めるためだけである。
- 利用者が決めていない規則を `prh.yml` に足さない。
- textlint の `--fix` で既存の文書を書き換えない。
