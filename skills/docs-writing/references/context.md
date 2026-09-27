# context の書き方

作業の中で繰り返し参照する規約と事実を書く。技術スタック、コードベースの構造、ツールの扱いが対象である。  
変更をリポジトリへ取り込むまでの手順は `CONTRIBUTING.md` に置き、context には書かない。手順は 1 度覚えれば済み、規約は作業のたびに開くためである。

種類ごとの決まる時期、確かめること、書かないこと、分け方、`status` の意味は、core のスキルに書いてある。書く前にそのスキルを開く。

- `packages/core/skills/write-harness-context/SKILL.md`

このリポジトリに固有の規則は次の 2 つである。

- 目次は `context/index.md`。`pnpm check:index --write` が frontmatter から生成する。手で編集しない。
- AGENTS.md からは、目次への参照だけを置く。

## frontmatter

`type` は `context`。`title` と `description` は必須。  
説明している設定ファイルがあれば、`governs` にそのパスを、`verified_commit` に読んで確かめた commit を書く。片方だけは書かない。  
キーの一覧と意味は、`packages/core/DesignDoc.md` の frontmatter の節にある。
