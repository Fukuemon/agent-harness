---
type: feature-design
title: 検証
description: パッケージ verification の設計。観点の設計、検証の spec、撮影と確認、pull request へのエビデンスの添付の責務、読むキー、スキルと雛形
status: draft
keywords: [検証, エビデンス, 観点, EARS, 録画]
---

# 検証

## Overview

パッケージ verification は、変更が期待どおりに動くことを、観点の表とエビデンスで pull request の読み手に示すための取り決めと手順を持つ。全体像は [agent-harness Design Doc](../../DesignDoc.md) にある。

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
| attach-evidence | エビデンスを本文の表に入れ、入ったことを確かめる。コメントにある動画を本文へ移す |
| capture-browser-evidence | spec を書かずに、ブラウザを操作して録画とテキストのログを残す |

ホスティングサービスごとの添付の仕方は、スキルの `references/` にサービスごとのファイルで置く。

## Interface

- 読むキー: `verification.evidence_dir`（エビデンスの一時の置き場。既定は `.ai-out/evidence`）。
- 利用者の context: `context/testing/evidence.md`（撮る環境、ログインとテストデータ、撮影の手段、公開の範囲）。
- 写す雛形: `context/testing/evidence.md` の骨組み。pull request の「検証とエビデンス」の表と issue の「検証の観点」の欄は、core の write-issue-pr の雛形が持つ。
