# spec の書き方

spec は、issue ごとの要求、作らないもの、受け入れ基準、論点、決定の経緯、変更の設計、確かめ方を持つ。`specs/<issue 番号>-<短い主題>/` に置き、issue を閉じるときに削除する。  
開発プロセスの宣言を置くときは、同じディレクトリの `process.yml` に書く。

## index.md の骨組み

```markdown
---
type: spec
title: <issue の題>
description: <この spec が扱う要求。1 行>
status: draft
---

# <issue の題>

## Requirements

<!-- 何を、誰のために、どこまで作るか。issue の本文から写さず、issue へリンクする -->

## Non-Goals

<!-- この issue で意図して作らないもの。範囲の境界を示す -->

## Acceptance Criteria

<!-- 満たされたと言える条件。確かめられる形の箇条書き -->

## Open Points

<!-- 決まっていないこと。決まったら Decisions へ移す -->

## Decisions

<!-- 決めたことと理由。選択肢を比較した判断は ADR に起こし、ここからリンクする -->

## Design

<!-- どう作るか。変わるファイル、Interface、データ、エラーの扱い。小見出しは内容ごとに決める -->

### Sequence

<!-- 変更を議論するためのシーケンス図。決まったら機能ごとの Design Doc へ移す -->

## Verification

<!-- 受け入れ基準の項目ごとの確かめ方。自動のテストか、手動の手順か -->

## Carry Over

<!-- issue を閉じる前に移すもの。移す先（Design Doc、context、ADR）ごとに箇条書きにする -->
```

## 書き方

- 節は消さない。行わない作業の節は、空のまま残す。どの節を埋めるかは、開発プロセスの宣言が決める。
- 長くなったら、話題ごとに同じディレクトリの Markdown に分け、`index.md` からリンクする。
- 決定の経緯は spec に書いてよい。Design Doc と context には書かない。
- 残す設計は、issue を閉じる前に、Carry Over に挙げた先へ移す。移した後の spec は削除する。
- Design Doc、context、ADR から spec へリンクしない。
