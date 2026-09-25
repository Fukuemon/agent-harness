---
name: setup-agent-harness
description: agent-harness を利用者のリポジトリに導入するとき、パッケージの更新をテンプレートから取り込むときに使う。context/project.yml、context の文書と目次、AGENTS.md、CONTRIBUTING.md を置く。
---

# setup-agent-harness

テンプレートを写すのは、このスキルの `scripts/setup.mjs` である。モデルが自分で写さない。写し忘れと上書きを防ぐためである。  
スクリプトは、Node.js の 22.12 以上で動き、依存するライブラリはない。

## 初めて導入するとき

1. 利用者に 3 点を尋ねる。答えがなければ既定を使う。
   - 保護するブランチの名前。既定は `main`。複数なら `,` で区切る。
   - 置く context の話題。`tech-stack`（技術スタック）、`codebase`（コードベースの構造）、`testing`（テスト）、`operations`（基盤と運用）から選ぶ。既定はなし。
   - 文書のディレクトリ名。Design Doc、ADR、spec の順で、既定は `design,adr,specs`。
2. リポジトリのルートで、このスキルの `scripts/setup.mjs` を実行する。

```sh
node <このスキルのディレクトリ>/scripts/setup.mjs --branches main --topics tech-stack,testing --docs design,adr,specs
```

3. スクリプトが表示した「写した」と「飛ばした」の一覧を、利用者にそのまま見せる。既にあるファイルは写されない。
4. 写されたファイルをコミットするよう促す。以後は利用者のファイルであり、パッケージの更新で上書きされない。

## パッケージを更新したとき

- `--diff` は、テンプレートと既存のファイルの差分を表示する。書き換えない。利用者は差分を見て、取り込む変更を手で反映する。
- `--force <パス>` は、名指ししたファイルだけをテンプレートで上書きする。上書きの前に差分を表示する。複数のファイルは `--force` を繰り返す。
- 全部を一括で上書きする選択肢はない。context は利用者が書いた内容そのもので、一括の上書きは内容を失う。

```sh
node <このスキルのディレクトリ>/scripts/setup.mjs --diff
node <このスキルのディレクトリ>/scripts/setup.mjs --force CONTRIBUTING.md
```

## 写すもの

- このスキルの `assets/` の全部。`context/project.yml`、AGENTS.md、CONTRIBUTING.md、選んだ話題の context。
- `context/index.md`。写す context と、既にある context の frontmatter から作る。
- 同じ置き場にあるほかのスキルの `assets/`。docs、process、guardrails のパッケージが配置されていれば、そのテンプレートも写る。
