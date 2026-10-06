---
type: context
title: コードベースの構造
description: パッケージとリポジトリ自身の境界、依存してよい向き、値の置き場、新しいファイルの置き場。コードから読み取れる構造は書かない
status: stable
---

# コードベースの構造

## Module Boundaries

- 境界はパッケージ（`packages/<名前>`）である。core は共通の基盤で、docs と process は 1 つずつ外せる。ガードレールは独立したパッケージにせず、core が持つ。
  - ADR-0013: [共通の基盤はパッケージ core に置き、ほかのパッケージはそれを前提にする](../adr/0013-core-package.md)
  - ADR-0021: [ガードレールは独立したパッケージにせず、規則に関わるパッケージが持つ](../adr/0021-guardrails-in-owning-packages.md)
- パッケージの中には、利用者に届くものだけを置く。このリポジトリ自身の開発に使うもの（`skills/`、`scripts/`、`design/`、`adr/`、`context/`）は、パッケージの外に置く。
- 全体の構成は [全体像の Repository Layout](../design/DesignDoc.md#repository-layout) にある。

## Dependency Rules

- core 以外のパッケージは、core が置いた `context/project.yml` だけを前提にし、互いに依存しない。
- スクリプトは、実行時に他のパッケージのファイルを読まない。YAML の読み込みと schema の検証は、各パッケージが自前で持つ。
- スキルの `scripts/` とパッケージの `scripts/` は、利用者のリポジトリへ写される先が違うので、互いに import しない。同じ処理が要るときは複製し、出力の一致をテストで確かめる。
- 外部のライブラリは、yaml と ajv だけである。
  - ADR-0012: [チェックとフックのスクリプトは Node.js で書く](../adr/0012-node-runtime.md)

## State Ownership

- パッケージは実行時の状態を持たない。利用者ごとの値は、利用者のリポジトリの `context/project.yml` が持つ。パッケージの中に値を持たない。
- このリポジトリ自身の値は、`context/project.yml` にある。

## Placement Rules

- 利用者のリポジトリへ写すテンプレートは、スキルの `assets/` に置く。ルートの `examples/` は、写さずに見せる例だけを置く。
- チェックのスクリプトは `packages/<名前>/scripts/` に、コーディングエージェントのフックが呼ぶスクリプトは `packages/<名前>/hooks/` に置く。どちらに置くかの境界は ADR-0015 にある。
  - ADR-0015: [コーディングエージェントのフックに置くのは、その時点でモデルに行動を求めるものだけにする](../adr/0015-agent-hook-boundary.md)
- このリポジトリ自身だけのチェックは、ルートの `scripts/` に置く。
- パッケージの Design Doc は、パッケージの隣（`packages/<名前>/DesignDoc.md`）に置く。パッケージを作る前は `design/features/` に置く。
