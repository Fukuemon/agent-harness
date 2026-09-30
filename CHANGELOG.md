# Changelog

## 0.1.0 (2026-09-30)

最初のリリース。コーディングエージェント（Claude Code と Codex CLI）に、プロジェクト固有の知識と文書の規則を与えるパッケージ core と docs を公開する。

### core

利用者のリポジトリに固有の知識の置き場を作り、リポジトリの運用の取り決めを持つ。

- スキル
  - setup-agent-harness: 導入と、テンプレートからの更新の取り込み。`context/project.yml`、context の 6 種類の骨組みと目次、AGENTS.md、CONTRIBUTING.md、commitlint の設定を写す
  - write-context: context を種類ごとに決めて書き、更新する
  - write-skill: スキルを作り、直し、レビューする
  - write-commit: 変更の分け方とコミットメッセージ
  - write-issue-pr: issue と pull request の書き方。issue の form と pull request の雛形を持つ
  - write-comments: コード、スクリプト、設定ファイルのコメントの規約
- フック
  - セッションの開始: `apm.lock.yaml` にある配置先が欠けていれば `apm install --frozen` で配置し、パッケージから消えた写しと `.gitignore` の行をそろえる
  - ファイルの編集の後: 足されたコメントと lint の抑制を確かめるよう促す

### docs

PRD、Design Doc、ADR、spec の形と、文章の規則とチェックを持つ。

- スキル
  - setup-design-docs: 文書のチェック（textlint と prh）を lefthook と CI に組み込み、プロジェクトの用語の規則を利用者と決める
  - write-design-docs: PRD、Design Doc、ADR、spec の書き方とテンプレート
  - write-prose: 文書の分け方、文と段落、表、図、見出しと用語の規則
- チェック: 経緯の混入、リンク切れ、実装とのずれ。lefthook と CI から呼ぶ
- フック: Markdown の編集の後に、経緯の混入とリンク切れを確かめるよう促す

### 導入

`apm.yml` に `Fukuemon/agent-harness/packages/core#v0.1.0` と `Fukuemon/agent-harness/packages/docs#v0.1.0` を書く。  
`apm install` で配置する。手順は [README](https://github.com/Fukuemon/agent-harness/blob/v0.1.0/README.md#installation) にある。
