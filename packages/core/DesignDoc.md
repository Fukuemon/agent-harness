---
type: feature-design
title: core
description: 利用者のリポジトリに固有の知識の置き場を作るパッケージ。値のファイル、context、目次、AGENTS.md、導入のスキル
status: draft
keywords: [core, project.yml, context, index.md, AGENTS.md, setup-agent-harness, frontmatter]
governs: packages/core
verified_commit: unverified
---

# core

## Overview

パッケージ「core」の設計。全体像は [agent-harness Design Doc](../../design/DesignDoc.md) にある。  
利用者のリポジトリに、プロジェクト固有の知識の置き場を作る。機械が読む値は `context/project.yml` に、モデルが読む事実は `context/` の文書に置き、AGENTS.md の指示で目次からたどれるようにする。ほかのパッケージは、この置き場を前提にする。

- ADR-0013: [共通の基盤はパッケージ core に置き、ほかのパッケージはそれを前提にする](../../adr/0013-core-package.md)

## Scope

- 持つもの: 値のファイルの形と schema。context の種類とテンプレート。frontmatter の基本のキーと、目次の生成。AGENTS.md と CONTRIBUTING.md のテンプレート。導入のスキル。context と CONTRIBUTING.md の書き方のスキル。リポジトリの運用の取り決めとして、ブランチとリリースの既定、コミットの規約のスキル、issue と pull request の規則のスキルと form の雛形、コードのコメントの規約のスキルとフック。
  - ADR-0014: [リポジトリの運用の取り決めはパッケージ core に置き、process はプロセスの定義と進み具合だけを持つ](../../adr/0014-operations-in-core.md)
- 分類: プロジェクト固有の知識の入れ物と、リポジトリの運用の取り決め。
- 持たないもの: Design Doc、ADR、spec の構造とチェック。ガードレールの規則。開発プロセスの定義。ほかのパッケージのスクリプトが読み込む共通の処理。

## Design

### 値のファイル

- ファイルは `context/project.yml` の 1 つである。形式は YAML。
- `context/` はリポジトリのルート直下に固定する。値のファイルの場所を値にすると、探す順序が要るためである。ほかの文書のディレクトリ名は、このファイルの値で変える。
- パッケージのスキルとチェックは、このファイルだけを読む。ファイルの中の値を、スキルの本文やチェックの中に写さない。
- スキルが値を要るときは、付属のスクリプトが読んで表示する。モデルに YAML を読ませない。読み飛ばす余地をなくし、足りないキーで確実に止めるためである。

キーは、読むパッケージごとにまとめる。パッケージを外したら、そのキーは要らなくなる。

```yaml
version: 1

# 文書の体系が読む
docs:
  design: design      # 全体像と機能ごとの Design Doc
  adr: adr
  spec: specs         # issue ごとに specs/<issue 番号>-<slug>/ を置く

# ガードレールが読む。規則ごとにキーを持ち、キーがない規則は無効
guardrails:
  protected_branches:
    names: [main]
    direct_commit:
      allow: false
      reason: ""
  forbidden_commands: []
  secrets:
    enabled: true

# 開発プロセスが読む。要求ごとの選択の既定
process:
  defaults:
    processes: [requirements, design, implementation, verification-design, verification, integration, release]
    reflect_at: design      # Design Doc と ADR へ反映する時点。識別子か none
    breakdown_at: design    # タスクへの分解と起票の時点。識別子か none
    review: [requirements, design, integration]
  additional: []            # 利用者が足すプロセス。id、name、purpose、deliverable、done_when を持つ
```

- `version` は schema の版である。必須。
- ほかのキーは、schema の上では任意である。読むパッケージが、自分のキーを必須として扱う。足りないキーがあれば、その値を使う処理は、足りないキーを表示して実行の前に止まる。
- `process.defaults` の各キーに許される値は、開発プロセスの Design Doc が定める。
  - [開発プロセスの Design Doc](../../design/features/process/DesignDoc_process.md)
- 既定の値は、パッケージの中には持たない。テンプレートに埋めて配る。利用者はテンプレートを写した時点で、標準の値を持つ。

### schema と版

- schema は JSON Schema で書き、`packages/core/schemas/project.schema.json` に置く。ここが原本で、ルートには置かない。YAML は JSON と同じ値の集合なので、YAML を読んでから JSON Schema で検証できる。
- 各パッケージのチェックは、自分が読むキーを、パッケージに同梱した schema で検証してから読む。合わない箇所を報告して止まる。全体の schema は、core の導入のスキルと、このリポジトリの CI が使う。
- schema は、知らないキーを拒否しない。利用者が自分のキーを足せるようにするためである。パッケージが読むキーだけを定める。
- パッケージが読めない形に変えるときは、`version` を上げる。キーの削除と、名前の変更が当たる。キーの追加では上げない。パッケージは読める `version` を宣言し、読めない版のファイルには、版が違うことを表示して止まる。

### context

context は、技術スタックの規約、コードベースの構造とコードの取り決め、テストと運用の取り決め、業務の知識を持つ。現在の取り決めだけを書き、モデルがコードを読んでも分からない事実に限る。

- 変更をリポジトリへ取り込むまでの手順は、CONTRIBUTING.md に置く。準備、ブランチ、コミット、pull request、チェック、リリースである。CONTRIBUTING.md は規約の本文を持たず、context へリンクする。
- テンプレートは、話題ごとに用意する。どれを置くかは利用者が選び、置かない話題の空のファイルは作らない。
- 話題は `context/<話題>.md` の 1 ファイルにする。1 ファイルに収まらない話題は、`context/<話題>.md` に一覧を置いて、`context/<話題>/<項目>.md` に分ける。

| 話題 | 書くこと |
| --- | --- |
| 技術スタック | 採用しているツールと、その版。選んだ理由は ADR にあるので書かない |
| コードベースの構造 | モジュールの境界と、依存してよい向き、状態の置き場。コードから読み取れる構造は書かない |
| コードの規約 | 命名、コメント、共有の設定、自動チェックの除外。lint で検出できる規則は書かない |
| テスト | テストの種類ごとの責務と、実行に要る環境の条件 |
| 基盤と運用 | 環境の種類、デプロイと切り戻しの条件、監視、秘密情報の置き場の方針 |
| 業務の知識 | 用語と、概念ごとの文書の一覧。状態と遷移、不変条件と禁止事項は、概念ごとに `context/domain/<概念>.md` に置く。機能ごとの仕様は spec が持つ |

- テンプレートの節は、モデルがコードを読んでも答えられない問いで作る。「なぜこの境界か」「何を依存させないか」「どの環境で動かすか」である。
- エージェントが必要な context を見つける手掛かりは、目次の `title` と `description` である。`keywords` は補助であり、必須にしない。

### frontmatter と目次

context と Design Doc は frontmatter を持つ。  
この形式は Open Knowledge Format に適合する。同仕様に依存するのは、必須の `type` と、予約されたファイル名の 2 点だけにする。

- ADR-0002: [context を Open Knowledge Format に適合させ、依存は 2 点に絞る](../../adr/0002-context-format.md)
- 出典: [Open Knowledge Format 仕様](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md)

基本のキーは次のとおり。ほかのパッケージは、同仕様が認める独自のキーを足せる。文書の体系が足す `governs` と `verified_commit` がその例である。

| キー | 必須 | 内容 |
| --- | --- | --- |
| `type` | 必須 | 文書の種類 |
| `title` | 必須 | 表示名 |
| `description` | 必須 | 目次に出す 1 行の説明。何が書いてあるかを具体的に書く |
| `status` | 任意 | `draft`、`stable`、`deprecated` のいずれか。省略したら `stable` |
| `keywords` | 任意 | 検索の手掛かり |

目次は `context/index.md` で、`context/` の下位のディレクトリを含む全部と、文書の体系を入れていれば `design/` の frontmatter から生成する。手で編集しない。手書きの更新日も持たない。日付は更新し忘れを検出できないが、commit と履歴の差分は検出できる。

### コーディングエージェントへの接続

- リポジトリのルートに AGENTS.md を置き、context の目次を読む指示を 1 か所だけ書く。「作業を始める前に目次を読み、関係する文書を開く」のように、参照ではなく指示として書く。具体的な指示はよく守られ、説明は守られにくいためである。AGENTS.md はこの指示と禁止事項だけを持ち、ルールの本文は持たない。
- CLAUDE.md は置かない。Claude Code は、作業ディレクトリとその上位に CLAUDE.md がないときだけ AGENTS.md を読むためである。CLAUDE.md を置くプロジェクトでは、CLAUDE.md から AGENTS.md を取り込む。
  - 出典: [Claude Code の memory の文書](https://code.claude.com/docs/en/memory)
- 目次への参照は、取り込みの記法ではなくパスとして書く。取り込みの記法は起動時に展開され、常に読み込まれる量が増える。

### 導入のスキル

導入のスキル `setup-agent-harness` が、固有の知識の置き場と、配置されているパッケージのテンプレートを利用者のリポジトリに置く。

- スキルは、保護ブランチの名前、置く context の話題、文書のディレクトリ名を尋ねる。答えを付属のスクリプトに渡す。
- スクリプトが、スキルの `assets/` のテンプレートを写す。値のファイルのテンプレートもここにある。写したファイルの一覧を表示する。
- 写すのは、`context/project.yml`、選んだ話題の context、`context/index.md`、AGENTS.md、CONTRIBUTING.md である。ほかのパッケージが配置されていれば、そのテンプレート（文書の骨組み、設定のファイル、issue と pull request のテンプレート）も写す。配置されていないパッケージの分は飛ばす。
- 写したファイルは利用者のものになり、パッケージの更新で上書きしない。スクリプトの動作は 3 つである。
  - 既定は、存在しないファイルだけを写し、飛ばしたファイルを一覧で表示する。
  - `--diff` は、テンプレートと既存のファイルの差分を表示する。書き換えない。パッケージを更新したときに、変更を見て手で取り込む。
  - `--force <パス>` は、名指ししたファイルだけをテンプレートで上書きする。上書きの前に差分を表示する。全部を一括で上書きする選択肢は持たない。context は利用者が書いた内容そのもので、一括の上書きは内容を失うためである。

パッケージのスキルの名前は、他の拡張機能と重なりにくい語にする。パッケージマネージャーは、同じ名前のスキルを後から入れた側で警告なしに上書きするためである。

### 書き方のスキル

context、CONTRIBUTING.md、AGENTS.md を書くとき、直すときに読むスキルを持つ。テンプレートの見出しの下の 1 行の案内は「何を書くか」だけを持ち、次の規則はこのスキルが持つ。

- 話題ごとの、書かないこと。コードから読み取れる事実、選んだ理由、機能ごとの仕様、値そのもの。
- 1 ファイルに収まらない話題を、`context/<話題>/<項目>.md` に分ける規則。業務の知識の概念ごとの文書は、States and Transitions、Invariants、Prohibitions の 3 つの節で作る。
- `status` の意味。`draft` は骨組みだけで、読む側は内容を当てにしない。
- CONTRIBUTING.md の各節に何を書き、規約の本文を context へ寄せること。

### 運用の取り決め

- ブランチとリリースの既定は、CONTRIBUTING.md のテンプレートが持つ。`main` と `develop`、issue ごとの作業用のブランチ、`main` のタグでのバージョンである。運用が違う利用者は、本文と図を書き換える。
- コミットの規約とブランチ名の形式は、スキルに書く。メッセージの形式は commitlint のような自動チェックに任せ、スキルには判断が要ることだけを書く。
- issue と pull request の規則はスキルに書き、form と雛形はホスティングサービスの決まりの場所へ写す。
- コードのコメントの規約は、スキルと、ファイルの編集の後のフックで持つ。フックは、コメントが足されたときだけ、残してよいかを確かめるよう促す文をコンテキストに追加する。編集は拒否しない。サブエージェントの中でも動く。
- 次のバージョンを決める手段は、テンプレートに選択肢として示す。利用者が release-please か changesets を選ぶ。

## Interface

- 置くファイル: `context/project.yml`、`context/` の文書と `index.md`、AGENTS.md、CONTRIBUTING.md、issue と pull request の form と雛形。
- 読む値: なし。値を置く側である。
- 動くチェック: 目次の生成。`context/` と `design/` の frontmatter から生成し直し、差分が出たら失敗する。編集後のフックと CI で動く。
- 動くフック: コードのコメントの編集後のフック。
