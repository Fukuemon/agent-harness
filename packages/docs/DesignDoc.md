---
type: feature-design
title: 文書の体系
description: Design Doc、ADR、spec の種類と寿命、実装とのずれの検出、spec を削除する前の保証、文書のチェック
status: draft
keywords: [Design Doc, ADR, spec, governs, verified_commit, textlint, write-design-docs, write-prose]
governs: packages/docs
verified_commit: unverified
---

# 文書の体系

## Overview

パッケージ「文書の体系」の設計。全体像は [agent-harness Design Doc](../../design/DesignDoc.md) にある。  
設計文書が現在の内容だけを持ち、実装とのずれに気づけ、spec が作業の後に残らないようにする。固有の知識の置き場は core が作り、このパッケージはその上に Design Doc、ADR、spec の形とチェックを足す。

## Scope

- 持つもの: PRD、Design Doc、ADR、spec の構造とテンプレート。画面ごとの UI の設計は持たず、別のスキルが扱う。どの情報をどの文書に書くかのルール。実装とのずれの検出。spec の削除の保証。文書のチェック。
- 分類: 自動チェックと、プロジェクト固有の知識の入れ物。
- 持たないもの: 利用者の知識の中身。内容の正しさの判定。作業を次へ進める制御。context と目次と値のファイル。それらは core が持つ。

## Design

### 文書の種類と寿命

利用者のリポジトリに次の文書を置く。ディレクトリ名は、値のファイルの `docs` で変更できる。

- **PRD:** 誰のどの課題を、何で解決するかを書く。実現方法は書かない。ルートに 1 つ置く。目標、成功の指標、節目、未決事項の置き場である。
- **Design Doc:** 現在の設計だけを書く。全体像と、機能ごとの設計に分ける。
  - 全体像は 1 つの文書に置く。構成要素の責務、要素の間の依存、横断する方針を書く。図は、C4 モデルの L1 の System Context と、L2 の Container だけを描く。
  - 機能ごとの設計は、構成要素 1 つにつき 1 つの文書に置く。内部の構成と処理の流れを書く。図は、L3 の Component と、処理の流れを描く。
  - 機能ごとの設計の置き場所は、設計文書のディレクトリの下か、対象のコードと同じディレクトリである。チェックは両方を見る。コードのディレクトリに `DesignDoc.md` があればそれを使い、なければ設計文書のディレクトリを見る。コードの隣に置くと、`governs` が同じディレクトリを指し、コードを消せば文書も一緒に消える。
  - 分ける基準は、読者、求める行動、更新の頻度、詳細度、食い違ったときの参照先のどれかが違うことである。
- **ADR:** 選択肢を比較して決めた判断とその理由。追記だけを行う。
- **spec:** issue ごとの要求、論点、受け入れ基準、決定の経緯。Git で管理し、issue を閉じる時点で削除する。変更を議論するシーケンス図は spec に描き、決まったら機能ごとの Design Doc へ移す。
  - 要求ごとの開発プロセスの宣言を、YAML として同じ場所に置く。spec と一緒に削除する。
  - レビューを依頼する前に、1 本の HTML へ変換する。最終のセルフレビューが終わった後に行う。
    - ADR-0003: [spec はレビューを依頼する前に 1 本の HTML へ変換し、CI で公開してレビューする](../../adr/0003-spec-review-html.md)
  - 変換した HTML をコミットし、CI が pull request ごとに公開する。レビューする人は、公開された URL を開いて読む。
  - HTML の骨組みは、テンプレートとしてパッケージに持つ。
  - issue を閉じる時点で、HTML も spec と一緒に削除する。

Design Doc、context、ADR は短く保ち、食い違ったときの唯一の参照先にする。  
spec は長くなりやすく、読み手が検証しきれない。残し続けると、どれが正しいか分からなくなる。  
そのため spec は、残す設計を移した後に削除する。

Design Doc、context、ADR から spec へリンクしない。spec は削除されるため、リンクは必ず切れる。  
未解決の論点を指す場合だけ issue 番号を書ける。論点が解決したら、その記述ごと消す。

### 実装とのずれの検出

Design Doc と context の frontmatter に、core の基本のキーに加えて 2 つのキーを持たせる。

| キー | 必須 | 内容 |
| --- | --- | --- |
| `governs` | 任意 | 文書が説明している実装の場所。コードに限らず、設定ファイルも指せる |
| `verified_commit` | 任意 | 最後に実装と比べて確認した commit。未確認なら `unverified` |

`governs` と `verified_commit` は、両方を書くか、両方を省く。  
片方だけの状態は、チェックがエラーにする。  
何も報告せずに対象から外すと、その文書が一覧から抜けたことに気づけないためである。

ずれの一覧は、失敗にしない。範囲の中のコードが変わっても文書が正しいままの場合が日常的にあるからだ。  
失敗にすると、内容を読まずに `verified_commit` だけを進める運用が唯一の現実的な手段になり、チェックが形だけになる。

時間の経過だけで古いとみなす判定も入れない。  
安定した領域に警告が出続け、警告の全体が読まれなくなる。

### テンプレートと書き方のスキル

文章の規則のスキル `write-prose` が、どの文書にも当てはまる規則（文書の分け方、文と段落、表、図、見出しと用語、スキルの本文の長さと分け方）を持つ。そのリポジトリだけの文章の規則は、利用者の `context/conventions.md` の Documents の節に置き、`write-prose` が書く前に読む。一般の規則はパッケージが、そのリポジトリだけの規則は context が持つ。  
書き方のスキル `write-design-docs` が、4 つの文書に何を書き何を書かないか、全体像と機能ごとの分け方、spec を閉じる前に残す設計を移す規則を持つ。節の構成と骨組みは、文書の種類ごとに `references/` に分ける。  
テンプレートは 2 つに分ける。導入のときに 1 度写すものはスキルの `assets/` に置き、core の導入のスキルが写す。文書ごとに新しく作るものは `references/` の骨組みとして持ち、書くときにスキルが写す。導入のときに写すと、使わないファイルが目次に載るためである。

導入のスキル `setup-design-docs` は、テンプレートが写された後に、プロジェクトごとに違う設定を利用者と決める。textlint のパッケージを入れ、CONTRIBUTING.md の「文書を直すとき」の節と、lefthook と CI にチェックの呼び方を書く。CONTRIBUTING.md のテンプレートは core が持つので、docs は節の中身だけを埋める。core から docs への依存を作らないためである。  
プロジェクトの用語の規則は、コードベース、issue、pull request から候補を集め、利用者と決めて `prh.yml` に足す。issue と pull request の本文は、語を集めるためだけに読み、リポジトリに写さない。

| テンプレート | 置き場 | 内容 |
| --- | --- | --- |
| PRD | `assets/` | 10 節の骨組みと frontmatter |
| 全体像の Design Doc | `assets/` | 8 節の骨組みと frontmatter |
| ADR | `assets/` | `adr/template.md`。Status、Context、Decision、Considered Options、Consequences |
| textlint と prh の設定 | `assets/` | 文章の規則。どのプロジェクトでも成り立つ規則だけを持ち、用語の規則は利用者が足す |
| 機能ごとの Design Doc | `references/` | 4 節の骨組みと frontmatter |
| spec | `references/` | `index.md` の骨組み。`process.yml` は開発プロセスのテンプレートから写す |
| レビュー用の HTML の骨組み | `assets/` | spec の Markdown を 1 本にまとめる枠 |

導入のスキルは、`assets/` の `design/`、`adr/`、`specs/` で始まるパスを、利用者が答えた文書のディレクトリ名に置き換えて写す。

### spec を削除する前の保証

作業を次へ進める制御を持たないため、残す設計を移す機会は、次の 3 つで守る。

- ルールを 1 つ置く。「spec を閉じる前に、残す設計を Design Doc と context へ、比較して決めた判断を ADR へ移す」
- spec の消し忘れのチェックで、削除されていない spec を報告する。
- issue の close をきっかけに、spec のディレクトリを削除する pull request を CI が自動で作る。取り込むかどうかの判断が、移し終えたことの確認になる。自動では削除しない。作るのはチェックではなく CI のワークフローで、GitHub Actions の設定の例を `examples/ci/` に置く。

## Interface

- 置くファイル: PRD、Design Doc、ADR、spec、レビュー用の HTML、textlint と prh の設定。最初の一式は core の導入のスキルが写す。
- 読むスキル: どの文書を書くときも読む `write-prose`、PRD と Design Doc と ADR と spec を書くときの `write-design-docs`、導入のときと用語を足すときの `setup-design-docs`。
- 読む値: `docs` の各ディレクトリ名。
- 動くチェック: 次の表のとおり。
- 動くフック: Markdown の編集の後に、経緯の混入とリンクを確かめるよう促すフック `hooks/check-docs.mjs`。編集は拒否しない。

### チェック

チェックは Node.js のスクリプトで、コマンドとして呼ぶ。終了コードは、0 が問題なし、1 が報告あり、2 が設定の誤りである。  
動く場所は、文書を編集した後のコーディングエージェントのフック、lefthook の `pre-commit`、CI の 3 つである。lefthook の `pre-commit` で動かすのは文章の規則だけである。

| チェック | 内容 | 動く場所 | 失敗の扱い |
| --- | --- | --- | --- |
| 文章の規則 | textlint と prh で、使わない語と文の形を確認する。設定はテンプレートとして写す | 編集後、pre-commit、CI | 失敗 |
| 実装とずれた可能性の一覧 | `verified_commit` より後に `governs` の範囲が変更された文書を一覧する | CI | 失敗にしない。一覧は見直しの作業リスト |
| spec の消し忘れ | close 済みの issue に対応する spec のディレクトリが残っていないかを確認する。issue の状態はホスティングサービスの API で読み、CI の token を使う | CI | 残っているディレクトリを報告 |
| 経緯の混入 | Design Doc と context に、変更履歴の節と解決済みの issue 番号がないかを確認する | 編集後、CI | 変更履歴の見出しは失敗。issue の番号は一覧だけを出す |
| リンク | 文書の中のリンク切れを確認する | 編集後、CI | 失敗 |

チェックのスクリプトは、編集後のフックと一緒に `hooks/` に置き、依存するライブラリを持たない。パッケージマネージャーは `hooks/` だけを利用者のリポジトリへ写し、`scripts/` は写さないためである。経緯の混入とリンクの処理は `hooks/doc-checks.mjs` に 1 つだけ持つ。  
利用者の lefthook と CI は、パッケージマネージャーの配置先にあるスクリプトを呼ぶ。組み込みは導入のスキル `setup-design-docs` が行う。
- ADR-0017: [文書のチェックのスクリプトは hooks/ に置き、利用者の lefthook と CI はパッケージマネージャーの配置先から呼ぶ](../../adr/0017-docs-checks-from-deployed-hooks.md)

issue が閉じているかはネットワークが要るので、番号の一覧だけを出し、閉じているかの判定は CI のタスクで足す。

ネットワークが要るチェックは、CI でだけ動かす。issue の状態を読めない場面では、そのチェックを飛ばして報告する。
