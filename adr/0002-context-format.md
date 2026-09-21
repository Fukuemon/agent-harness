# ADR-0002: context を Open Knowledge Format に適合させ、依存は 2 点に絞る

## 状態

承認

## 背景

Design Doc と context は frontmatter 付きの Markdown で、キーは `type`、`title`、`description`、`keywords`、`governs`、`verified_commit` である。

Open Knowledge Format は、Google Cloud が公開した知識の形式の仕様で、現行は v0.2。

- 必須の項目は `type` だけで、独自のキーの追加を認める。知らないキーや値を理由に文書を拒否してはならないと定める。
  - `SPEC.md:161-207` / [github](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md#L161-L207)
  - `SPEC.md:736-762` / [github](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md#L736-L762)
- 目次の `index.md` と更新履歴の `log.md` をファイル名として予約する。
- 文書の状態を表す `status` の値は `draft`、`stable`、`deprecated` の 3 つ。
  - `SPEC.md:412-422` / [github](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/ad30107c31c06aec8a7d5636e0d1058118604e6f/SPEC.md#L412-L422)

同仕様の運営は弱い。

- commit の作者は 1 人で、リリースと tag がない。
- 公開から約 2 か月で、項目の名前の変更が 2 件あった。
- バージョン番号を上げずに入った互換性のない変更を指摘する issue が、未回答のまま残っている。
  - [互換性のない変更を指摘する issue](https://github.com/GoogleCloudPlatform/open-knowledge-format/issues/24)
- Claude Code と Codex CLI の公式文書に同仕様の記載はなく、どのコーディングエージェントもこの形式のディレクトリを自動では見つけない。

## 決定

次の 3 点を決めた。

- Design Doc と context を同仕様に適合させる。依存するのは、必須の `type` と予約されたファイル名だけにする。
- `governs` と `verified_commit` は独自のキーとして持つ。同仕様の失効日時は使わない。
  - 実装とのずれは、日付よりも commit と履歴の差分のほうが確実に検出できる。
- 文書の状態を持たせるなら、キーは `status`、値は同仕様の 3 つに合わせる。
  - 日本語の独自の値は、同仕様に対応したツールが解釈できない。

## 検討した選択肢


| 選択肢                               | 強み                         | 弱み                             |
| --------------------------------- | -------------------------- | ------------------------------ |
| **採用:** 適合させ、依存を必須の `type` と予約されたファイル名に絞る | 適合のコストがほぼない。仕様の変更の影響を受けにくい | バージョンが上がるたびに、2 点の変更の有無を確認する手間  |
| 適合させない                            | 確認の手間がない                   | 同仕様に対応したツールを将来使う余地を失う          |
| 任意の項目も広く使う                        | 出所、確認の記録、失効日時を標準の形で持てる     | 任意の項目の名前が変わった前例があり、変更のたびに修正が要る |


## 影響

### 良い影響

- Design Doc と context を、同仕様に対応したツールでそのまま読める。
- 同仕様が使われなくなっても、ただの Markdown として残る。

### 悪い影響

- 同仕様のバージョンが上がるたびに、必須の項目と予約されたファイル名の変更の有無を確認する必要がある。
- 既存の文書が日本語の状態の値を使っている場合、移すときに値を置き換える必要がある。
