# agent-harness

コーディングエージェントに、プロジェクト固有の知識と文書の規則を与えるパッケージ。

複数のリポジトリで Claude Code や Codex CLI を使う開発者が対象である。  
モデルが知らないこと（そのプロジェクトの用語、規約、設計の置き場）だけを、スキルとフックとテンプレートで渡す。どのリポジトリでも同じ形で導入できる。

## パッケージ

| パッケージ | 役割 | スキル | フック |
| --- | --- | --- | --- |
| core | 固有の知識の置き場と、リポジトリの運用の取り決め | setup-agent-harness、write-harness-context、git-commit、issue-pr-writing、code-comments | セッションの開始で配置をそろえる。編集の後に、足したコメントを確かめるよう促す |
| docs | PRD、Design Doc、ADR、spec の形とチェック | setup-design-docs、write-design-docs | Markdown の編集の後に、経緯の混入とリンク切れを知らせる |

docs は、core が置く `context/project.yml` を前提にする。docs だけを入れるときは、`packages/core/skills/setup-agent-harness/assets/context/project.yml` を `context/` へ手で写す。

## 導入

前提は Node.js 22.12 以上である。

### パッケージマネージャー（推奨）

[microsoft/apm](https://github.com/microsoft/apm) で入れる。スキルとフックが `.claude/` と `.agents/`、`.codex/` に配置され、版はロックファイルで固定される。

```yaml
# apm.yml
name: my-project
version: 0.1.0
targets: [claude, codex]
dependencies:
  apm:
    - Fukuemon/agent-harness/packages/core#<ref>
    - Fukuemon/agent-harness/packages/docs#<ref>
```

`<ref>` には、タグかコミットの SHA を書く。最初のリリースまでは、main のコミットの SHA を書く。

```sh
apm install
```

### Claude Code のプラグイン

Claude Code だけで使うなら、プラグインとして入れられる。

```text
/plugin marketplace add Fukuemon/agent-harness
/plugin install core@agent-harness
/plugin install docs@agent-harness
```

この方法では、docs のチェックを lefthook と CI から呼べない。チェックのスクリプトは、パッケージマネージャーの配置先から呼ぶためである。

## 使い方

### 導入した直後

コーディングエージェントに、次の順で頼む。

1. 「agent-harness を導入して」: setup-agent-harness が、保護するブランチと文書のディレクトリ名を尋ねる。答えに合わせて、`context/project.yml`、context の骨組み、AGENTS.md、CONTRIBUTING.md、文書のテンプレートを写す。`.gitignore` には、配置先と `.ai-out/` を足す。
2. 「文書のチェックを動かせるようにして」: setup-design-docs が、textlint を入れ、CONTRIBUTING.md、lefthook、CI にチェックを組み込む。コードベース、issue、pull request から用語の候補を集め、利用者と決めて `prh.yml` に足す。
3. 写されたファイルをコミットする。以後は利用者のファイルとして編集する。

配置先は Git で追跡しない。clone した後の最初のセッションで、core のフックが `apm install --frozen` を実行して配置をそろえる。

### 日々の開発

スキルは、作業の内容に合わせてコーディングエージェントが読み込む。

- context を書くときは write-harness-context、PRD や Design Doc や ADR や spec を書くときは write-design-docs を読む。
- コミット、issue と pull request、コードのコメントは、git-commit、issue-pr-writing、code-comments に従う。
- ファイルを編集すると、フックが確かめるべき点をコンテキストに追加する。編集は拒否しない。

### パッケージを更新したとき

`apm.yml` の `<ref>` を変えて `apm install` を実行し、テンプレートとの差分を確かめる。

```sh
node .claude/skills/setup-agent-harness/scripts/setup.mjs --diff
```

Codex CLI だけで使っているときは、`.agents/skills/` の下の同じパスにある。既にあるファイルは上書きされない。差分を見て、取り込む変更を手で反映する。

## 対応するコーディングエージェント

- **Claude Code:** スキルとフックの両方が動く。リポジトリのルートで起動する。
- **Codex CLI:** スキルとフックの両方が動く。プロジェクトのフックは、利用者が承認するまで動かない。

## ドキュメント

- [PRD](PRD.md): 誰のどの課題を、何で解決するか。
- [Design Doc](design/DesignDoc.md): パッケージの構成、配布の形、パッケージに共通する方針。

## コントリビュート

開発の準備と、変更を取り込むまでの手順は [CONTRIBUTING.md](CONTRIBUTING.md) にある。

## ライセンス

[MIT](LICENSE)
