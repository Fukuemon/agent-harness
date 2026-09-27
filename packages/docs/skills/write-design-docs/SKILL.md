---
name: write-design-docs
description: PRD、Design Doc、ADR、spec を書くとき、直すとき、レビューするときに使う。文書ごとに何を書き何を書かないか、全体像と機能ごとの分け方、spec を閉じる前に残す設計を移す規則、文章のチェックの入れ方を定める。
---

# write-design-docs

文書は 4 種類である。PRD は誰のどの課題を何で解決するか、Design Doc は現在の設計、ADR は選択肢を比較して決めた判断、spec は issue ごとの要求と論点を持つ。画面ごとの UI の設計は、別のスキルが扱う。  
種類ごとの節の構成と骨組みは `references/` にある。書く文書の 1 つだけを開く。

- PRD を書くときは [references/prd.md](references/prd.md)
- Design Doc を書くときは [references/design-doc.md](references/design-doc.md)
- ADR を書くときは [references/adr.md](references/adr.md)
- spec を書くときは [references/spec.md](references/spec.md)

文書のディレクトリ名は、`context/project.yml` の `docs` にある。この本文では既定の `design`、`adr`、`specs` で書く。

## 文書の分担

| 文書 | 書くこと | 書かないこと | 寿命 |
| --- | --- | --- | --- |
| PRD | 誰のどの課題を何で解決するか。目標、利用者の物語、提供する機能、成功の指標、節目、未決事項 | 実現方法。ツール、形式、配置先、コマンド | 要求が変わるたびに更新する |
| Design Doc | 現在の設計。構成要素の責務、依存、内部の構成、処理の流れ | 過去の経緯、変更履歴、検討した選択肢、未決の論点、成功の指標 | 実装がある間、更新し続ける |
| ADR | 選択肢を比較して決めた判断と、その理由 | 決定の後の実装の詳細 | 追記だけ。決定を変えるときは新しい ADR を書く |
| spec | issue ごとの要求、受け入れ基準、論点、決定の経緯 | 残す設計。Design Doc と context へ移す | issue を閉じるときに削除する |

- 経緯を書きたくなったら、ADR に起こす。Design Doc からは、その判断を説明する文の直後に ADR へのリンクを置く。
- Design Doc、context、ADR から spec へリンクしない。spec は削除されるので、リンクは必ず切れる。issue 番号は、未解決の論点を指すときだけ書き、解決したらその記述ごと消す。
- 取り決めと契約は context が持ち、構成と処理の流れは Design Doc が持つ。同じ内容を両方に書かない。

## 全体像と機能ごとの Design Doc

- 全体像は、設計文書のディレクトリに 1 つ置く。構成要素の責務、要素の間の依存、共通の方針を書く。図は C4 モデルの L1 と L2 だけを描く。
- 機能ごとの設計は、構成要素 1 つにつき 1 つ置く。内部の構成と処理の流れを書く。図は L3 と処理の流れを描く。現在の流れのシーケンス図はここに描き、変更を議論するシーケンス図は spec に描く。
- 機能ごとの設計の置き場所は、対象のコードと同じディレクトリの `DesignDoc.md` である。コードの隣に置くと、`governs` が同じディレクトリを指し、コードを消せば文書も一緒に消える。コードがまだないときは、設計文書のディレクトリの `features/<機能名>/` に置き、コードができたら隣へ移す。
- 分ける基準は、読者、求める行動、更新の頻度、詳細度、食い違ったときの参照先のどれかが違うことである。
- 全体像からは、機能ごとの設計へリンクだけを置く。同じ内容を両方に書かない。
- 新しく作るときは、`references/` の骨組みを写して見出しを埋める。

## spec を閉じる前に

1. 残す設計を Design Doc と context へ移す。比較して決めた判断は ADR へ移す。
2. spec からしか読めない事実が残っていないことを確かめる。
3. spec のディレクトリを削除する。issue を閉じるときに行い、残さない。

## frontmatter

- Design Doc は frontmatter を持つ。`type` は、全体像が `design-doc`、機能ごとの設計が `feature-design`。`title` と `description` は必須。
- 実装を説明している Design Doc は、`governs` に実装の場所を、`verified_commit` に最後に実装と比べたコミットを書く。両方を書くか、両方を省く。未確認なら `verified_commit: unverified`。
- 状態は `status` で持つ。本文に状態や更新日を書かない。
- キーの一覧は、context の目次の生成が読む基本のキーと同じである。

## 文章のチェック

- 導入のスキルが写した `.textlintrc.json` と `prh.yml` で、textlint を動かす。指摘された語は言い換える。`--fix` は使わない。
- 必要なパッケージは 5 つで、リポジトリの devDependencies に入れる。
  - textlint
  - textlint-rule-preset-ai-words-ja
  - textlint-rule-prh
  - textlint-rule-no-mix-dearu-desumasu
  - textlint-rule-sentence-length
- `prh.yml` の規則は、どのプロジェクトでも成り立つものだけである。プロジェクトの用語の規則は、利用者が `prh.yml` に足す。
- 丁寧語で書くプロジェクトは、`.textlintrc.json` の `preferInBody` と `preferInList` を `ですます` にする。
