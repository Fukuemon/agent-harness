# Design Doc の書き方

決定済みの設計だけを書く。過去にどうだったか、なぜ変えたか、どの issue で決めたかは書かない。  
書きたくなったら、それは ADR に起こす判断であり、Design Doc からは ADR へのリンクを、その判断を説明している文の直後に置く。

## 2 つの層

- **全体像:** `design/DesignDoc.md` に 1 つ。構成要素の責務、要素の間の依存、構成要素に共通する方針を書く。
- **機能ごとの設計:** 全体像の構成要素 1 つにつき 1 つ。内部の構成と、処理の流れを書く。
  - 置き場所は `design/features/<機能名>/DesignDoc_<機能名>.md` である。
  - パッケージを作ったら、`packages/<名前>/DesignDoc.md` へ移す。frontmatter の `governs` が同じディレクトリを指し、パッケージを消せば文書も一緒に消える。
- 全体像からは、機能ごとの設計文書へリンクだけを置く。同じ内容を両方に書かない。

Goals、Non-Goals、Open Questions は PRD が、検討した選択肢は ADR が持つ。Design Doc には書かない。

## frontmatter

Design Doc は frontmatter を持つ。`type` は、全体像が `design-doc`、機能ごとの設計が `feature-design`。  
キーの一覧と意味は、`design/features/documents/DesignDoc_documents.md` の frontmatter の節にある。  
見出しの下には Owner と Reviewers だけを置く。状態は frontmatter の `status` で持ち、本文に重ねて書かない。

## 図の段階

- 全体像は、C4 モデルの L1 の System Context と、L2 の Container だけを描く。誰が何のために使うかと、主要な実行の単位とデータの流れである。
- 機能ごとの設計は、L3 の Component と、処理の流れを描く。
- シーケンス図は、spec に描く。

## リンク

- spec へリンクしない。spec は issue を閉じるときに削除され、リンクは必ず切れる。
- issue 番号を書いてよいのは、未解決の論点を指すときだけ。解決したら、その記述ごと消す。
