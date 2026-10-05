---
type: context
title: コードと文書の規約
description: スクリプトとスキルの名前の付け方、コメント、文書の書き方のうちこのリポジトリだけの規則、共有の設定の所在、自動チェックの除外。lint で検出できる規則は書かない
status: stable
---

# コードと文書の規約

## Naming

- スクリプトは `<動詞>-<対象>.mjs` にする。`validate-project`、`build-index`、`check-package-names` が例である。テストは同じ名前に `.test.mjs` を付ける。
- スキルの名前と本文の規則は、core のスキル write-skill にある。
- ブランチは `feature/<issue 番号>` と `fix/<issue 番号>` にする。規則は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。
- Design Doc と context の節の見出しは、英語の名詞で書く。

## Comments

- スキル write-comments に従う。文書コメントは、スクリプトの先頭の使い方と終了コードである。スクリプトは関数を export しないので、文書コメントの有無を確かめる lint は入れていない。
- 実装のコメントで残すのは、自分たちで変えられない外部の制約と、意図して選んだ簡略化の限界の 2 つである。ライセンスの表記は `LICENSE` が持ち、ファイルには書かない。足したコメントは、編集後のフックが確かめるよう促す。
- コメントは日本語で書き、指すものはスキル、ファイル、関数の実際の名前で書く。

## Documents

どの文書にも当てはまる規則は、スキル write-prose にある。ここには、このリポジトリだけの規則を書く。

- textlint は `pnpm lint:text` で実行する。
- 公開の issue と pull request には、利用先の個別のリポジトリの名前を書かない。「利用者のリポジトリ」と書く。このリポジトリは公開しているためである。
- context の目次 `context/index.md` は `pnpm check:index --write` が生成する。手で編集しない。AGENTS.md からは、目次への参照だけを置く。
- 日本語の表記は、Claude Code の日本語の公式文書を基準にする。
  - Claude Code などのツールはコーディングエージェント、拡張機能を取得して配置するツールはパッケージマネージャー、そのツールが読むファイルはマニフェストとロックファイルと書く。
  - フックがモデルへ渡す文章は「コンテキストを追加する」、スキルの本文は「オンデマンドで読み込まれる」と書く。

## Shared Configuration

- 文書のチェックは `.textlintrc.json` と `prh.yml`。パッケージの本文の固有の名前は `prh-packages.yml`。
- コミットメッセージは `commitlint.config.mjs`。Git のフックは `lefthook.yml`。CI は `.github/workflows/ci.yml`。ツールのバージョンは `mise.toml`。
- 文書の書き方で判断が要る規則は、docs のスキル write-prose と、この文書の Documents の節にある。

## Check Exclusions

- textlint の対象は、ルート、`adr/`、`design/`、`packages/`、`context/`、`skills/`、`.github/` の Markdown である。`.ai-out/` は Git で追跡せず、チェックもしない。
- ルートの `CHANGELOG.md` は `.textlintignore` で textlint の対象から外す。release-please がコミットの要約から生成し、文の長さや語の規則に合わせられない。
- 固有の名前のチェックは、`packages/*/skills/` の Markdown だけに掛ける。パッケージの `DesignDoc.md` はこのリポジトリの開発者が読むので、コーディングエージェントの名前を書いてよい。
- release-please と changesets は、テンプレートに選択肢として示すと決めたので、禁止する語に含めない。
  - ADR-0014: [リポジトリの運用の取り決めはパッケージ core に置き、process はプロセスの定義と進み具合だけを持つ](../adr/0014-operations-in-core.md)
