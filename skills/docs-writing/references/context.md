# context の書き方

作業の中で繰り返し参照する規約と事実を書く。技術スタック、コードベースの構造、ツールの扱いが対象である。  
変更をリポジトリへ取り込むまでの手順は `CONTRIBUTING.md` に置き、context には書かない。手順は 1 度覚えれば済み、規約は作業のたびに開くためである。

- 種類ごとに 1 つのファイルにする。`context/<種類>.md`。1 ファイルに収まらない種類は、`context/<種類>.md` に一覧を置いて `context/<種類>/<項目>.md` に分ける。
- 現在の取り決めだけを書く。条件つきの取り決めは、条件を書く。「〜までは〜する。〜の後は〜する」のような形である。
- コードや設定ファイルから読み取れる内容は書かない。どのファイルを読めば分かるかを書く。
- 目次は `context/index.md`。`pnpm check:index --write` が frontmatter から生成する。手で編集しない。
- AGENTS.md からは、目次への参照だけを置く。

## frontmatter

`type` は `context`。`title` と `description` は必須。  
説明している設定ファイルがあれば、`governs` にそのパスを、`verified_commit` に読んで確かめた commit を書く。片方だけは書かない。  
キーの一覧と意味は、`packages/core/DesignDoc.md` の frontmatter の節にある。
