# agent-harness

コーディングエージェントに、プロジェクト固有の知識と文書の規則を与えるパッケージ。  
Claude Code と Codex CLI で、どのリポジトリでも同じ形で使える。

## パッケージ

| パッケージ | 役割 | スキル |
| --- | --- | --- |
| core | 固有の知識の置き場と、リポジトリの運用の取り決め | setup-agent-harness、write-harness-context、git-commit、issue-pr-writing、code-comments |
| docs | PRD、Design Doc、ADR、spec の形とチェック | setup-design-docs、write-design-docs |

どちらもフックを持つ。ファイルを編集すると、確かめるべき点をコーディングエージェントに伝える。編集は拒否しない。

## 導入

### 1. apm を入れる

パッケージは [microsoft/apm](https://github.com/microsoft/apm) で入れる。apm がなければ、[mise](https://mise.jdx.dev/) で Node.js と一緒に入れる。

```toml
# mise.toml
[tools]
node = "24"
uv = "0.12"
"pipx:apm-cli" = "0.32.0"
```

```sh
mise install
```

### 2. パッケージを入れる

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

`<ref>` にはタグかコミットの SHA を書く。最初のリリースまでは、main のコミットの SHA を書く。

```sh
apm install
```

### 3. リポジトリに置く

コーディングエージェントに頼む。

1. 「agent-harness を導入して」: 保護するブランチと文書のディレクトリ名を尋ね、`context/`、AGENTS.md、CONTRIBUTING.md、文書のテンプレートを写す。
2. 「文書のチェックを動かせるようにして」: textlint を入れ、CONTRIBUTING.md、lefthook、CI にチェックを組み込み、用語の規則を利用者と決める。

写されたファイルをコミットする。以後は利用者のファイルとして編集する。

### 4. apm の配置先を追跡しない

1 の手順で、apm の配置先が `.gitignore` に入り、`apm.yml` に同じ行を足す post-install が入る。マシンごとに 1 度、post-install を信頼させる。

```sh
apm lifecycle trust
```

以後は、パッケージを足して `apm install` すると、配置先が `.gitignore` に足される。clone した後の最初のセッションでは、core のフックが `apm install --frozen` で配置をそろえる。

### Claude Code のプラグインで入れる場合

```text
/plugin marketplace add Fukuemon/agent-harness
/plugin install core@agent-harness
/plugin install docs@agent-harness
```

この方法では、docs のチェックを lefthook と CI から呼べない。

## 更新

`apm.yml` の `<ref>` を変えて `apm install` を実行し、テンプレートとの差分を見る。既にあるファイルは上書きされないので、取り込む変更を手で反映する。

```sh
node .claude/skills/setup-agent-harness/scripts/setup.mjs --diff
```

## 対応するコーディングエージェント

- **Claude Code:** リポジトリのルートで起動する。
- **Codex CLI:** プロジェクトのフックは、利用者が承認するまで動かない。

## ドキュメント

- [PRD](PRD.md): 誰のどの課題を、何で解決するか。
- [Design Doc](design/DesignDoc.md): パッケージの構成、配布の形、共通の方針。
- [CONTRIBUTING.md](CONTRIBUTING.md): 開発の準備と、変更を取り込むまでの手順。

## ライセンス

[MIT](LICENSE)
