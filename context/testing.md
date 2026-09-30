---
type: context
title: テスト
description: スクリプトのテストの形と保証、実行に要る環境、置き換えをしない方針、変更に足すテスト
status: stable
---

# テスト

## Test Types and Guarantees

- 種類は 1 つである。`node:test` で書き、スクリプトの隣の `*.test.mjs` に置く。スクリプトを子プロセスで実行し、終了コード、出力、ファイルの結果を確かめる。
- schema のテストは、テンプレートの `project.yml` が schema に合うことと、制約の検出を保証する。
- 導入のスキルと目次のテストは、使い捨てのディレクトリで実行し、2 つの実装（`setup.mjs` と `build-index.mjs`）の出力が一致することを保証する。
- テストの基盤の構成はない。フレームワークは使わない。

## Runtime Requirements

- Node.js（バージョンは `mise.toml`）と git が要る。ネットワークと環境変数は要らない。
- 使い捨てのディレクトリは `os.tmpdir()` に作る。テストは消さない。

## Mocking and Test Data

- 置き換えは使わない。本物のスクリプトを本物のファイルに対して実行する。
- テストのデータは、テストの中で作る。fixtures のディレクトリは持たない。

## Required Tests

- スクリプトを足したら、隣に 1 つのテストファイルを置く。終了コードごとに 1 件は書く。
- レビューで指摘された不具合は、再現するテストを足してから直す。
- pull request の前に `pnpm test` を通す。CI が毎回動かす。
