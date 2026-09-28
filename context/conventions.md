---
type: context
title: コードと文書の規約
description: スクリプトとスキルの名前の付け方、コメント、文書の書き方のうちこのリポジトリだけの規則、共有の設定の所在、自動チェックの除外。lint で検出できる規則は書かない
status: stable
---

# コードと文書の規約

## Naming

- スクリプトは `<動詞>-<対象>.mjs` にする。`validate-project`、`build-index`、`check-package-names` が例である。テストは同じ名前に `.test.mjs` を付ける。
- パッケージのスキルの名前は、他の拡張機能と重なりにくい語を含める。`setup-agent-harness`、`write-harness-context` が例である。
- ブランチは `feature/<issue 番号>` と `fix/<issue 番号>` にする。規則は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。
- Design Doc と context の節の見出しは、英語の名詞で書く。

## Comments

- スキル code-comments に従う。文書コメントは、スクリプトの先頭の使い方と終了コードである。スクリプトは関数を export しないので、文書コメントの有無を確かめる lint は入れていない。
- 実装のコメントで残すのは、自分たちで変えられない外部の制約と、意図して選んだ簡略化の限界の 2 つである。ライセンスの表記は `LICENSE` が持ち、ファイルには書かない。足したコメントは、編集後のフックが確かめるよう促す。
- コメントは日本語で書き、指すものはスキル、ファイル、関数の実際の名前で書く。

## Documents

どの文書にも当てはまる規則は、スキル write-prose にある。ここには、このリポジトリだけの規則を書く。

- 書く前に `pnpm lint:text` を実行する。使わない語と言い換えの一覧は `prh.yml` だけに持ち、文書へ写さない。
- 1 文ごとに行を分ける。続きの文は、行末の半角スペース 2 つで改行する。差分を文の単位で読むためである。
- 「〜し、〜で、〜」と続けない。従属する内容は、入れ子の箇条書きにする。
- パッケージを作ったら、機能ごとの Design Doc を `packages/<名前>/DesignDoc.md` へ移す。
- CONTRIBUTING.md には、変更を取り込むまでの手順だけを書く。規約の本文は書かず、context へリンクする。
- context の目次 `context/index.md` は `pnpm check:index --write` が生成する。手で編集しない。AGENTS.md からは、目次への参照だけを置く。
- スキルの本文は 150 行以内に保つ。`references/` に分けるのは、呼び出しごとに読む部分が違うときと、150 行に近づいたときに限る。同じ作業で全部を読む規則は 1 ファイルに置き、参照は SKILL.md から 1 段だけにする。
  - 出典: [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- 日本語の表記は、Claude Code の日本語の公式文書を基準にする。
  - Claude Code などのツールはコーディングエージェント、拡張機能を取得して配置するツールはパッケージマネージャー、そのツールが読むファイルはマニフェストとロックファイルと書く。
  - フックがモデルへ渡す文章は「コンテキストを追加する」、スキルの本文は「オンデマンドで読み込まれる」と書く。

## Shared Configuration

- 文書のチェックは `.textlintrc.json` と `prh.yml`。パッケージの本文の固有の名前は `prh-packages.yml`。
- コミットメッセージは `commitlint.config.mjs`。Git のフックは `lefthook.yml`。CI は `.github/workflows/ci.yml`。ツールの版は `mise.toml`。
- 文書の書き方で判断が要る規則は、docs のスキル write-prose と、この文書の Documents の節にある。

## Check Exclusions

- textlint の対象は、ルート、`adr/`、`design/`、`packages/`、`context/`、`skills/`、`.github/` の Markdown である。`.ai-out/` は Git で追跡せず、チェックもしない。
- 固有の名前のチェックは、`packages/*/skills/` の Markdown だけに掛ける。パッケージの `DesignDoc.md` はこのリポジトリの開発者が読むので、コーディングエージェントの名前を書いてよい。
- release-please と changesets は、テンプレートに選択肢として示すと決めたので、禁止する語に含めない。
  - ADR-0014: [リポジトリの運用の取り決めはパッケージ core に置き、process はプロセスの定義と進み具合だけを持つ](../adr/0014-operations-in-core.md)
