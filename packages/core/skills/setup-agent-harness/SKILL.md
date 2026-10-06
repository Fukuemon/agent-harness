---
name: setup-agent-harness
description: agent-harness を利用者のリポジトリに導入するとき、パッケージの更新をテンプレートから取り込むときに使う。context/project.yml、context の 6 種類の骨組みと目次、AGENTS.md、CONTRIBUTING.md、commitlint の設定を置き、コミットのチェックを組み込むかを尋ねる。
---

# setup-agent-harness

テンプレートを写すのは、このスキルの `scripts/setup.mjs` である。モデルが自分で写さない。写し忘れと上書きを防ぐためである。  
スクリプトは、Node.js の 22.12 以上で動き、依存するライブラリはない。

## 初めて導入するとき

1. 利用者に 2 点を尋ねる。答えがなければ既定を使う。
   - 保護するブランチの名前。既定は `main,develop`。`,` で区切る。CONTRIBUTING.md に書かれる。
   - 文書のディレクトリ名。Design Doc、ADR、spec の順で、既定は `design,adr,specs`。
2. リポジトリのルートで、このスキルの `scripts/setup.mjs` を実行する。

```sh
node <このスキルのディレクトリ>/scripts/setup.mjs --branches main,develop --docs design,adr,specs
```

3. スクリプトが表示した「写した」と「飛ばした」の一覧を、利用者にそのまま見せる。既にあるファイルは写されない。`.gitignore` には、`.ai-out/` と、`apm.lock.yaml` にある apm の配置先の行が足される。`.ai-out/` は公開しない作業メモの置き場である。  
   `apm.yml` には、`apm install` の後に配置先の行を足す post-install が足される。利用者に、マシンごとに 1 度 `apm lifecycle trust` を実行するよう伝える。信頼していないと、パッケージを足しても行は足されない。  
   パッケージから消えたスキルとフックの写しは、post-install とセッションの開始のフックが配置先から消し、`.gitignore` の行も消す。
4. 下の「コミットのチェックを動かせるようにする」を行う。
5. 写されたファイルをコミットするよう促す。以後は利用者のファイルであり、パッケージの更新で上書きされない。

context の 6 種類は、すべて `status: draft` の骨組みとして置かれる。中身は、このスキルでは書かない。種類ごとに決まる時期が違うので、決めて書き、更新するのは context を書くスキルの役割である。

## コミットのチェックを動かせるようにする

スクリプトは、コミットのメッセージの形式を持つ `commitlint.config.mjs` を写す。確かめる仕組みは写さないので、入れるかを利用者に尋ねる。  
既にあるファイルを書き換えるときは、差分を利用者に見せてから書く。

1. commitlint を入れるかを尋ねる。入れないなら、ここで終える。写した `commitlint.config.mjs` は消さない。スキル write-commit が形式の規則として読み、導入のスクリプトも次の実行で写し直すためである。
2. commitlint を入れる。パッケージマネージャーは、リポジトリのロックファイルから決める。`package.json` がなければ、作るかを利用者に尋ねる。devDependencies に入れるのは次の 3 つ。
   - @commitlint/cli
   - @commitlint/config-conventional
   - lefthook
3. `lefthook.yml` の `commit-msg` に、`<実行コマンド> commitlint --edit {1}` を足す。`<実行コマンド>` は、手順 2 で決めたパッケージマネージャーで、インストールしたコマンドを実行するものにする。フックの中では、インストールしたコマンドにパスが通っていない。`lefthook.yml` がなければ作る。lefthook のフックが clone した後にも入るよう、`package.json` の `prepare` に `lefthook install` を足す。
4. CI のワークフローがあれば、pull request のコミットを `<実行コマンド> commitlint` で確かめる手順を足す。checkout で Git の履歴を全部取り、基点のブランチから HEAD までを `--from` と `--to` で渡す。
5. CONTRIBUTING.md の「コミットするとき」の節に、commit-msg のフックがメッセージの形式を確かめることを 1 行で書く。
6. 形式に合わないメッセージを commitlint の標準入力に渡し、失敗することを利用者に見せる。

## パッケージを更新したとき

- 2 点の引数は省ける。保護するブランチは既にある CONTRIBUTING.md から、文書のディレクトリ名は `context/project.yml` から引き継ぐ。
- `--diff` は、テンプレートと既存のファイルの差分を表示する。書き換えない。利用者は差分を見て、取り込む変更を手で反映する。まだ写していないファイルがあれば、それも表示する。
- `--force <パス>` は、名指ししたファイルだけをテンプレートで上書きする。上書きの前に差分を表示する。複数のファイルは `--force` を繰り返す。
- 全部を一括で上書きする選択肢はない。context は利用者が書いた内容そのもので、一括の上書きは内容を失う。

```sh
node <このスキルのディレクトリ>/scripts/setup.mjs --diff
node <このスキルのディレクトリ>/scripts/setup.mjs --force CONTRIBUTING.md
```

## 写すもの

- このスキルの `assets/` の全部。`context/project.yml`、AGENTS.md、CONTRIBUTING.md、context の 6 種類（技術スタック、コードベースの構造、コードと文書の規約、テスト、基盤と運用、業務の知識）。見出しの下の 1 行の案内は、何を書くかだけを示す。
- `context/index.md`。写す context と、既にある context の frontmatter から作る。`context/domain/` のような下位のディレクトリも載せ、`status: draft` の文書には印を付ける。
- 業務の知識は、`context/domain.md` が用語と概念の一覧を持ち、状態と遷移、不変条件、禁止事項は概念ごとに `context/domain/<概念>.md` に置く。概念の文書はテンプレートにない。
- ほかのスキルの `assets/`。docs、process のパッケージが配置されていれば、そのテンプレートも写る。
  - パッケージマネージャーで入れた場合は、同じ `skills/` にあるスキルを見る。
  - コーディングエージェントの標準の方法で一覧から入れた場合は、プラグインごとに分かれた置き場から、同じ一覧のプラグインを見る。
