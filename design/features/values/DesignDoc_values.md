---
type: feature-design
title: プロジェクトごとの値
description: 利用者のリポジトリに置く値のファイル context/project.yml の場所、形式、キー、schema と検証、版の上げ方
status: draft
keywords: [project.yml, schema, JSON Schema, 値, キー]
---

# プロジェクトごとの値

## 概要

パッケージが共有する、プロジェクトごとの値のファイルの設計。全体像は [agent-harness Design Doc](../../DesignDoc.md) にある。  
利用者のリポジトリごとに違う値を 1 つのファイルに集め、パッケージのスキルとチェックがそこから読む。

## 範囲

- 持つもの: ファイルの場所と形式。キーの一覧。schema と、schema による検証。版の上げ方。テンプレート。
- 持たないもの: 値そのもの。値を読む処理。ツールごとの値。リポジトリの管理や作業ツリーの管理に何を使うかは、利用者が context に書き、モデルが解釈する。

## 設計

### 場所と形式

- ファイルは `context/project.yml` の 1 つである。形式は YAML。
- `context/` はリポジトリのルート直下に固定する。値のファイルの場所を値にすると、探す順序が要るためである。ほかの文書のディレクトリ名は、このファイルの値で変える。
- パッケージのスキルとチェックは、このファイルだけを読む。ファイルの中の値を、スキルの本文やチェックの中に写さない。
- スキルが値を要るときは、付属のスクリプトが読んで表示する。モデルに YAML を読ませない。読み飛ばす余地をなくし、足りないキーで確実に止めるためである。

### キー

キーは、読むパッケージごとにまとめる。パッケージを外したら、そのキーは要らなくなる。

```yaml
version: 1

# 文書の体系が読む
docs:
  design: design      # 全体像と機能ごとの Design Doc
  adr: adr
  spec: specs         # issue ごとに specs/<issue 番号>-<slug>/ を置く

# ガードレールが読む
protected_branches:
  names: [main]
  direct_commit:
    allow: false
    reason: ""

# 開発プロセスが読む。要求ごとに決める 4 つの点の既定
process:
  defaults:
    processes: []       # 行うプロセス
    reflect_at: ""      # Design Doc と ADR へ反映する時点
    breakdown_at: ""    # タスクへの分解と起票の時点
    review: []          # レビューする範囲
```

- `version` は schema の版である。必須。
- ほかのキーは、schema の上では任意である。読むパッケージが、自分のキーを必須として扱う。足りないキーがあれば、その値を使う処理は、足りないキーを表示して実行の前に止まる。
- `process.defaults` の各キーに許される値は、開発プロセスの Design Doc が定める。
  - [開発プロセスの Design Doc](../process/DesignDoc_process.md)
- 既定の値は、パッケージの中には持たない。テンプレートに埋めて配る。利用者はテンプレートを写した時点で、標準の値を持つ。

### schema と検証

- schema は JSON Schema で書き、`schemas/project.schema.json` に置く。YAML は JSON と同じ値の集合なので、YAML を読んでから JSON Schema で検証できる。
- 各パッケージのチェックは、値を読む前にファイル全体を schema で検証する。合わない箇所を報告して止まる。
- schema は、知らないキーを拒否しない。利用者が自分のキーを足せるようにするためである。パッケージが読むキーだけを定める。

### 版

- パッケージが読めない形に変えるときは、`version` を上げる。キーの削除と、名前の変更が当たる。キーの追加では上げない。
- パッケージは、読める `version` を宣言する。読めない版のファイルには、版が違うことを表示して止まる。

## 利用者のリポジトリでの形

- 置くファイル: `context/project.yml`。テンプレートは、文書の体系のスキルの `assets/` から写す。
- 読むパッケージ: 文書の体系が `docs`、ガードレールが `protected_branches`、開発プロセスが `process` を読む。
- 動くチェック: schema による検証。値を読むすべてのチェックの先頭で動く。
