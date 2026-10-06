# 全体像の Design Doc の書き方

決定済みの設計だけを書く。過去にどうだったか、なぜ変えたか、どの issue で決めたかは書かない。

## 8 節

次の順で持つ。

1. Overview。何を作り、誰が使うか。要求の文書へのリンク。
2. Goals and Non-Goals。この設計が提供するものと、意図して作らないもの。利用者の体験の粒度ではなく、設計の粒度で書く。
3. Assumptions and Constraints。依拠する事実と、動かせない条件。
4. Architecture。C4 の L2 の図と、要素の間の関係。L1 の図は描かず、PRD の Landscape へリンクする。
5. Components。要素ごとの責務と、持たないもの。機能ごとの Design Doc へのリンク。複数の要素が共有するものもここに置く。
6. Interfaces。導入の方法と、利用者に見えるファイルや API。
7. Cross-Cutting Concerns。すべての要素に共通する決め事。
8. Repository Layout。ディレクトリの木。

節の見出しは役割の名前を英語で書き、話題の名前は小見出しに日本語で書く。骨組みは一般の形と対応づけられ、話題は読み手に伝わる語になる。

- 出典: [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/)

## 図

- C4 モデルの L2 の Container だけを描く。主要な実行の単位とデータの流れである。
- 誰が何のために使うかを示す L1 の System Context は、PRD の Landscape が持つ。PRD は Design Doc より先に書かれ、同じ図を両方に置くと食い違う。
- 内部の構成と処理の流れは、機能ごとの Design Doc に描く。
- 図の直前に、図が示す内容を 1 文で書く。図だけに書かれた決定を作らない。
- 出典: [C4 model](https://c4model.com/)

## 書かないこと

- 目標と非目標に、要求の文書の目標を重ねて書かない。要求は利用者の体験の粒度で、Design Doc は設計の粒度で書く。
- 未決の事項は要求の文書と issue が持ち、検討した選択肢は ADR が持つ。
- spec へリンクしない。issue 番号は未解決の論点を指すときだけ書く。
