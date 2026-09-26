---
name: setup-agent-harness
description: agent-harness を利用者のリポジトリに導入するとき、パッケージの更新をテンプレートから取り込むときに使う。context/project.yml、context の 6 種類の骨組みと目次、AGENTS.md、CONTRIBUTING.md を置く。
---

# setup-agent-harness

テンプレートを写すのは、このスキルの `scripts/setup.mjs` である。モデルが自分で写さない。写し忘れと上書きを防ぐためである。  
スクリプトは、Node.js の 22.12 以上で動き、依存するライブラリはない。

## 初めて導入するとき

1. 利用者に 2 点を尋ねる。答えがなければ既定を使う。
   - 保護するブランチの名前。既定は `main,develop`。`,` で区切る。
   - 文書のディレクトリ名。Design Doc、ADR、spec の順で、既定は `design,adr,specs`。
2. リポジトリのルートで、このスキルの `scripts/setup.mjs` を実行する。

```sh
node <このスキルのディレクトリ>/scripts/setup.mjs --branches main,develop --docs design,adr,specs
```

3. スクリプトが表示した「写した」と「飛ばした」の一覧を、利用者にそのまま見せる。既にあるファイルは写されない。
4. 写されたファイルをコミットするよう促す。以後は利用者のファイルであり、パッケージの更新で上書きされない。

context の 6 種類は、すべて `status: draft` の骨組みとして置かれる。中身は、このスキルでは書かない。種類ごとに決まる時期が違うので、決めて書き、更新するのは context を書くスキルの役割である。

## パッケージを更新したとき

- 2 点の引数は省ける。省いた値は、既にある `context/project.yml` から引き継ぐ。
- `--diff` は、テンプレートと既存のファイルの差分を表示する。書き換えない。利用者は差分を見て、取り込む変更を手で反映する。まだ写していないファイルがあれば、それも表示する。
- `--force <パス>` は、名指ししたファイルだけをテンプレートで上書きする。上書きの前に差分を表示する。複数のファイルは `--force` を繰り返す。
- 全部を一括で上書きする選択肢はない。context は利用者が書いた内容そのもので、一括の上書きは内容を失う。

```sh
node <このスキルのディレクトリ>/scripts/setup.mjs --diff
node <このスキルのディレクトリ>/scripts/setup.mjs --force CONTRIBUTING.md
```

## 写すもの

- このスキルの `assets/` の全部。`context/project.yml`、AGENTS.md、CONTRIBUTING.md、context の 6 種類（技術スタック、コードベースの構造、コードの規約、テスト、基盤と運用、業務の知識）。見出しの下の 1 行の案内は、何を書くかだけを示す。
- `context/index.md`。写す context と、既にある context の frontmatter から作る。`context/domain/` のような下位のディレクトリも載せ、`status: draft` の文書には印を付ける。
- 業務の知識は、`context/domain.md` が用語と概念の一覧を持ち、状態と遷移、不変条件、禁止事項は概念ごとに `context/domain/<概念>.md` に置く。概念の文書はテンプレートにない。
- 同じ置き場にあるほかのスキルの `assets/`。docs、process、guardrails のパッケージが配置されていれば、そのテンプレートも写る。
