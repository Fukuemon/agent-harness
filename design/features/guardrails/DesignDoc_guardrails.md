---
type: feature-design
title: ガードレール
description: 取り返しのつかない操作を止める仕組みと、プロダクトごとに有効にする規則。保護ブランチ、禁止するコマンド、秘密情報
status: draft
keywords: [保護ブランチ, 禁止するコマンド, 秘密情報, フック, lefthook, PreToolUse, secretlint]
---

# ガードレール

## 概要

パッケージ「ガードレール」の設計。全体像は [agent-harness Design Doc](../../DesignDoc.md) にある。  
取り返しのつかない操作を、モデルが指示を守るかどうかに関係なく止める。止める仕組みは 1 つで、何を止めるかはプロダクトごとの規則として `project.yml` で決める。

## 範囲

- 持つもの: 操作を止める仕組み。規則の一覧と、規則ごとの判定。値のファイルからの設定の読み取り。コーディングエージェントごとの対応表。
- 分類: ガードレール。
- 持たないもの: コーディングエージェントの権限の仕組み。ホスティングサービス側のブランチの保護の設定。結果を報告するだけのチェック。それらは文書の体系と開発プロセスが持つ。

## 設計

### 仕組み

仕組みは、規則によらず同じである。

- 呼び出し元は 2 つある。コーディングエージェントのツール実行前のフックと、Git のフックである。判定は 1 つのスクリプトにまとめ、両方から呼ぶ。規則を 2 か所に持たない。
- コーディングエージェントのフックの入力は、実行されるコマンドの文字列である。該当すれば、コマンドを拒否して理由を返す。シェルの変数や別名を経由した実行は文字列から判定できないので、Git のフックが最後の防ぎになる。
- Git のフックは lefthook で入れる。`pre-commit` は現在のブランチとステージした内容を見る。`pre-push` は標準入力の ref の更新を見る。
- 規則は `project.yml` の `guardrails` の下に、規則ごとのキーで書く。キーがない規則は、無効である。
- 許す場面は、規則ごとの宣言で決める。宣言が有効な間は、拒否せずに理由を表示する。自動で検出する条件は持たない。
  - ADR-0011: [保護ブランチへの直接コミットは、プロジェクトごとの値での宣言だけで許す](../../../adr/0011-direct-commit-declaration.md)
- 拒否しない操作を広げない。同期や作業ツリーの復元まで止めると、ガードレールそのものが外される。

### 規則

| 規則 | 止める操作 | 判定の入力 | 設定 |
| --- | --- | --- | --- |
| 保護ブランチ | 保護ブランチにいるときの `git commit`、`git merge`、`git rebase`、`git cherry-pick`、`git reset --hard`、`git commit --amend`。保護ブランチへの `git push --force` と `--force-with-lease`。保護ブランチの削除。`--no-verify` のようなフックを迂回する引数 | コマンドの文字列と現在のブランチ。`pre-push` では ref の更新 | `guardrails.protected_branches` |
| 禁止するコマンド | プロダクトごとに止めたいコマンド。`terraform apply` や `kubectl delete` のように、実行前の文字列で判定できるもの | コマンドの文字列 | `guardrails.forbidden_commands` |
| 秘密情報 | 認証情報の形式に一致する文字列を含むコミット | ステージした内容。判定は secretlint に任せる。Git のフックだけで動く | `guardrails.secrets` |

- 出典: [secretlint](https://github.com/secretlint/secretlint)

設定の形は次のとおり。

```yaml
guardrails:
  protected_branches:
    names: [main]
    direct_commit:
      allow: false
      reason: ""
  forbidden_commands:
    - pattern: "terraform apply"
      reason: 本番の基盤は CI からだけ変える
  secrets:
    enabled: true
```

- `forbidden_commands` の `pattern` は、コマンドの文字列に対する部分の一致である。`reason` は必須で、拒否のときに表示する。
- `secrets` の除外は、secretlint の設定で行う。

## 利用者のリポジトリでの形

- 置くファイル: なし。規則は `context/project.yml` の `guardrails` に書く。secretlint の設定は、テンプレートから写す。
- 読む値: `guardrails.protected_branches`、`guardrails.forbidden_commands`、`guardrails.secrets`。
- 動くフック: Claude Code と Codex CLI のツール実行前のフック。lefthook の `pre-commit` と `pre-push`。
- 対応表: コーディングエージェントごとに、フックが発火する条件と、確認したバージョンを README に載せる。Codex CLI は、利用者がプロジェクトのフックを信頼するまで発火しない。信頼するまでは、Git のフックだけが働く。

## 検証

- コーディングエージェントに保護ブランチへの直接コミットを指示し、拒否されること。AGENTS.md を空にしても変わらないこと。
- `direct_commit.allow` を `true` にした場合は通り、理由が表示されること。
- `forbidden_commands` に書いたコマンドを指示し、理由とともに拒否されること。
- 認証情報の形式の文字列を含むファイルをステージし、コミットが拒否されること。
