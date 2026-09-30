---
type: context
title: 技術スタック
description: このリポジトリの開発に使うツールの役割とバージョンの所在、バージョンを上げるときの確認、新しいパッケージとスキルの作り始め。バージョンそのものと選んだ理由は書かない
status: stable
governs:
  - mise.toml
  - package.json
  - apm.yml
  - .github/workflows/ci.yml
verified_commit: f75d3803d873194fd9767a539486719f80768619
---

# 技術スタック

## Toolchain

| ツール | 役割 | バージョンが書いてあるファイル |
| --- | --- | --- |
| mise | Node.js、pnpm、uv、microsoft/apm のバージョンの管理。clone した直後は `mise trust` が要る | 固定しない。公式の導入の方法に従う |
| Node.js | チェックとフックのスクリプトの実行環境 | `mise.toml` |
| pnpm | 依存の管理。`pnpm install` が Git のフックも有効にする | `mise.toml` |
| microsoft/apm | スキルとパッケージの配置。mise の pipx のバックエンドで入れる | `mise.toml`。`apm.lock.yaml` の `apm_version` と揃える |
| uv | mise が apm を入れるときに使う | `mise.toml` |
| textlint と prh | 文書の表現のチェック | `package.json` |
| lefthook | Git のフック | `package.json` |
| commitlint | コミットメッセージのチェック | `package.json` |
| yaml と ajv | 値のファイルの読み取りと schema の検証。チェックのスクリプトが使う | `package.json` |
| GitHub Actions | CI。mise で同じバージョンを入れる | `.github/workflows/ci.yml` |

- 利用者に前提とする Node.js のバージョンは、このリポジトリが開発に使うバージョンとは別である。
  - ADR-0012: [チェックとフックのスクリプトは Node.js で書く](../adr/0012-node-runtime.md)
  - ADR-0016: [ツールのバージョンは mise で管理し、テンプレートの既定にする](../adr/0016-mise-for-tool-versions.md)
- チェックのスクリプトが依存してよいライブラリは、yaml と ajv だけである。

## Upgrade Checks

- バージョンを上げたら、`pnpm test`、`pnpm lint:text`、`pnpm lint:packages` を通す。
- textlint の規則（preset-ai-words-ja、prh）は、バージョンで指摘する語が変わる。上げたら全文書に lint を掛け、新しい指摘を言い換える。`--fix` は使わない。
- microsoft/apm は 1.0 より前で、配置の形が変わりうる。上げたら `apm install` の配置先を確かめる。配置先は [スキルの置き場所](skills.md) にある。
- Node.js を上げたら、`mise.toml` の 1 行を変え、CI が通ることを確かめる。

## Scaffolding

- 新しいパッケージは、`packages/core` の構成を写して作る。構成は [全体像の Repository Layout](../design/DesignDoc.md#repository-layout) にある。
- 新しいスキルは、`skills/` か `packages/<名前>/skills/` に `SKILL.md` を置き、`apm.yml` に足して `apm install` する。手順は [スキルの置き場所](skills.md) にある。
- 新しいチェックのスクリプトは、`.mjs` で書き、隣に同じ名前の `.test.mjs` を置く。規則は [コードと文書の規約](conventions.md) と [テスト](testing.md) にある。
