---
type: context
title: コードの規約
description: スクリプトとスキルの名前の付け方、コメント、共有の設定の所在、自動チェックの除外。lint で検出できる規則は書かない
status: stable
---

# コードの規約

## Naming

- スクリプトは `<動詞>-<対象>.mjs` にする。`validate-project`、`build-index`、`check-package-names` が例である。テストは同じ名前に `.test.mjs` を付ける。
- パッケージのスキルの名前は、他の拡張機能と重なりにくい語を含める。`setup-agent-harness`、`write-harness-context` が例である。
- ブランチは `feature/<issue 番号>` と `fix/<issue 番号>` にする。規則は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。
- Design Doc と context の節の見出しは、英語の名詞で書く。規則は `skills/docs-writing/SKILL.md` にある。

## Comments

- スキル code-comments に従う。文書コメントは、スクリプトの先頭の使い方と終了コードである。スクリプトは関数を export しないので、文書コメントの有無を確かめる lint は入れていない。
- 実装のコメントで残すのは、自分たちで変えられない外部の制約と、意図して選んだ簡略化の限界の 2 つである。ライセンスの表記は `LICENSE` が持ち、ファイルには書かない。足したコメントは、編集後のフックが確かめるよう促す。
- コメントは日本語で書き、指すものはスキル、ファイル、関数の実際の名前で書く。

## Shared Configuration

- 文書のチェックは `.textlintrc.json` と `prh.yml`。パッケージの本文の固有の名前は `prh-packages.yml`。
- コミットメッセージは `commitlint.config.mjs`。Git のフックは `lefthook.yml`。CI は `.github/workflows/ci.yml`。ツールの版は `mise.toml`。
- 文書の書き方で判断が要る規則は、`skills/docs-writing/SKILL.md` にある。

## Check Exclusions

- textlint の対象は、ルート、`adr/`、`design/`、`packages/`、`context/`、`skills/`、`.github/` の Markdown である。`.ai-out/` は Git で追跡せず、チェックもしない。
- 固有の名前のチェックは、`packages/*/skills/` の Markdown だけに掛ける。パッケージの `DesignDoc.md` はこのリポジトリの開発者が読むので、コーディングエージェントの名前を書いてよい。
- release-please と changesets は、テンプレートに選択肢として示すと決めたので、禁止する語に含めない。
  - ADR-0014: [リポジトリの運用の取り決めはパッケージ core に置き、process はプロセスの定義と進み具合だけを持つ](../adr/0014-operations-in-core.md)
