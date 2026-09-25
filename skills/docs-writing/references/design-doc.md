# Design Doc の書き方

決定済みの設計だけを書く。過去にどうだったか、なぜ変えたか、どの issue で決めたかは書かない。  
書きたくなったら、それは ADR に起こす判断であり、Design Doc からは ADR へのリンクを、その判断を説明している文の直後に置く。

## 2 つの層

- **全体像:** `design/DesignDoc.md` に 1 つ。構成要素の責務、要素の間の依存、構成要素に共通する方針を書く。
- **機能ごとの設計:** 全体像の構成要素 1 つにつき 1 つ。内部の構成と、処理の流れを書く。
  - 置き場所は `design/features/<機能名>/DesignDoc_<機能名>.md` である。
  - パッケージを作ったら、`packages/<名前>/DesignDoc.md` へ移す。frontmatter の `governs` が同じディレクトリを指し、パッケージを消せば文書も一緒に消える。
- 全体像からは、機能ごとの設計文書へリンクだけを置く。同じ内容を両方に書かない。

目標と非目標は、この設計が提供するものと、意図して作らないものの粒度で書く。PRD の目標は利用者の体験の粒度であり、同じ文を重ねない。  
未決事項は PRD と issue が、検討した選択肢は ADR が持つ。Design Doc には書かない。

## 節の構成

全体像は、次の 8 節を、この順で持つ。

1. Overview。何を作り、誰が使うか。PRD へのリンク。
2. Goals and Non-Goals。この設計が提供するものと、意図して作らないもの。
3. Assumptions and Constraints。依拠する事実と、動かせない条件。
4. Architecture。C4 の L1 の図と、要素の間の関係。
5. Components。要素ごとの責務と、持たないもの。機能ごとの Design Doc へのリンク。複数の要素が共有するものも、ここに置く。
6. Interfaces。導入の方法と、利用者のリポジトリに置くファイル。
7. Cross-Cutting Concerns。すべての要素に共通する決め事。
8. Repository Layout。ディレクトリの木。

機能ごとの設計は、次の 4 節を、この順で持つ。何で確かめるかがあれば、5 節目に「Verification」を足す。

1. Overview。何を担うか。全体像へのリンク。
2. Scope。持つものと、持たないもの。
3. Design。内部の構成と、処理の流れ。小見出しは内容ごとに決める。
4. Interface。置くファイル、読む値のキー、動くフックとチェック。

節の見出しは役割の名前を英語で書き、話題の名前は小見出しに日本語で書く。骨組みは一般の形と対応づけられ、話題は読み手に伝わる語になる。PRD の見出しと同じ扱いである。  
- 出典: [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/)

## frontmatter

Design Doc は frontmatter を持つ。`type` は、全体像が `design-doc`、機能ごとの設計が `feature-design`。  
基本のキーは `packages/core/DesignDoc.md` の frontmatter の節にある。`governs` と `verified_commit` は `design/features/documents/DesignDoc_documents.md` のずれの検出の節にある。  
見出しの下には Owner と Reviewers だけを置く。状態は frontmatter の `status` で持ち、本文に重ねて書かない。

## 図の段階

- 全体像は、C4 モデルの L1 の System Context と、L2 の Container だけを描く。誰が何のために使うかと、主要な実行の単位とデータの流れである。
- 機能ごとの設計は、L3 の Component と、処理の流れを描く。
- シーケンス図は、spec に描く。

## リンク

- spec へリンクしない。spec は issue を閉じるときに削除され、リンクは必ず切れる。
- issue 番号を書いてよいのは、未解決の論点を指すときだけ。解決したら、その記述ごと消す。
