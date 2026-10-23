---
type: feature-design
title: 検証
description: パッケージ verification の設計。観点の設計、検証の spec、撮影と確認、pull request へのエビデンスの添付の責務、読むキー、スキルと雛形
status: draft
keywords: [検証, エビデンス, 観点, EARS, 録画]
---

# 検証

## Overview

パッケージ verification は、変更が期待どおりに動くことを、観点の表とエビデンスで pull request の読み手に示すための取り決めと手順を持つ。全体像は [agent-harness Design Doc](../../design/DesignDoc.md) にある。

## Scope

- 持つもの
  - 観点の設計（EARS の要件と、条件と期待結果の表）
  - 手動の検証のシナリオから録画の spec を書く手順
  - 撮影と確認（フレーム、コンタクトシート）の手順
  - pull request の本文へのエビデンスの添付と、入ったことの確認
- 持たないもの: 録画とテストのコード（e2e が持つ）、撮影の手段の具体（利用者の context が持つ）、合否の判定（人が行う）。

## Design

### 流れ

1 つの変更で、次の順に進める。

1. 観点を設計する。条件（WHEN / IF）と期待結果（SHALL）の表にし、issue の「検証の観点」と pull request の「検証とエビデンス」の同じ列へ写せる形にする。
2. 観点ごとに、録画の spec を書く。シナリオの文を字幕に写し、1 本の動画に 1 つの観点を撮る。
3. spec を流して撮り、フレームとコンタクトシートで、観点が写っていることを確かめる。判定は人に任せる。
4. エビデンスを pull request の本文の表に入れ、入った数を数える。リポジトリにはコミットしない。

### スキル

| スキル | 担う手順 |
| --- | --- |
| design-test-cases | 実装と仕様を読み、観点とケースを EARS の要件つきで設計する |
| write-verification-spec | シナリオから録画の spec を書く。字幕の規則、改修の前と後を比べる規則 |
| run-verification-scenarios | spec を流して撮り、確かめる。撮る順と、並列で流さない理由 |
| attach-evidence | 観点の設計から添付までを順に進める。エビデンスを本文の表に入れ、入ったことを確かめる。コメントにある動画を本文へ移す |
| capture-browser-evidence | spec を書かずに、ブラウザを操作して録画とテキストのログを残す |

ファイルの置き場は、導入のスキルが `assets/` を全部、利用者のリポジトリへ写すことに合わせて決める。

- 本文の表の書き方とホスティングサービスごとの添付の仕方は、attach-evidence だけが持つ。ほかのスキルは attach-evidence を参照する。
  - 添付の仕方は、`context/project.yml` の `hosting` の値（`github`、`gitlab`）を名前にした `references/` のファイルに置く。スキルは、`hosting` に合う 1 つだけを読む。
- EARS の要件の書き方（条件の形、主語の扱い、表の列への写し方）は、design-test-cases だけが持つ。
- `context/testing/evidence.md` の骨組みは、attach-evidence の `assets/` に置く。導入のスキルが利用者のリポジトリへ写す。
- 撮影の手段の具体は、利用者の `context/testing/evidence.md` が持つ。スキルの `references/` には、どの手段でも間違えやすい点だけを置く。手段ごとの書き方の例は、`examples/verification/` にある。
- 観点の設計の文書の骨組みは、写さずにスキルが読むので `references/` に置く。
- 録画に字幕とカーソルを重ねる雛形のコードは、利用者が選んで写すので、`references/` の下に撮影の手段の名前のディレクトリで置く。e2e の kit が同じ仕組みを配るようになったら消す。
  - ADR-0023: [検証、E2E、デザインシステム、画面仕様書、文書のサイトを関心ごとのパッケージにし、組み合わせは値のファイルのキーで渡す](../../adr/0023-concern-packages.md)

## Interface

- 読むキー: `verification.evidence_dir`（エビデンスの一時の置き場。既定は `.ai-out/evidence`）。
- 利用者の context: `context/testing/evidence.md`。エビデンスを付ける変更、元のファイルの置き場と公開の範囲、撮影の手段、撮る環境、ログインとテストデータ、添付の仕方、検証のシナリオの置き場を持つ。
- 写す雛形: `context/testing/evidence.md` の骨組み。pull request の「検証とエビデンス」の表と issue の「検証の観点」の欄は、core の write-issue-pr の雛形が持つ。
