# context の書き方

作業の中で繰り返し参照する規約と事実を書く。技術スタック、コードベースの構造、ツールの扱いが対象である。  
変更をリポジトリへ取り込むまでの手順は `CONTRIBUTING.md` に置き、context には書かない。手順は 1 度覚えれば済み、規約は作業のたびに開くためである。

- 話題ごとに 1 つのファイルにする。`context/<話題>.md`。
- 現在の取り決めだけを書く。条件つきの取り決めは、条件を書く。「〜までは〜する。〜の後は〜する」のような形である。
- コードや設定ファイルから読み取れる内容は書かない。どのファイルを読めば分かるかを書く。
- 目次は `context/index.md`。ファイルを足したら、題と `description` を 1 行で足す。
- AGENTS.md からは、目次への参照だけを置く。

## frontmatter

`type` は `context`。`title` と `description` は必須。  
説明している設定ファイルがあれば、`governs` にそのパスを、`verified_commit` に読んで確かめた commit を書く。片方だけは書かない。  
キーの一覧と意味は、`design/features/documents/DesignDoc_documents.md` の frontmatter の節にある。
