# PRD の書き方

誰のどの課題を、何で解決するかを書く。実現方法（ツールの名前、ファイルの形式、配置先、schema、コマンド）は書かず、Design Doc と ADR に任せる。  
リポジトリのルートの `PRD.md` に 1 つ置く。導入のスキルが骨組みを写す。

## 節の構成

1. Overview / Problem Statement。何を作るか、なぜ今かを、数段落で書く。
2. Background。なぜ今これが要るかを、主張ごとの節で書く。補足の羅列にしない。
3. Goals。対象の利用者と、提供する体験。
4. Lower-Priority Goals。将来は提供したいが、最初のバージョンでは優先しないもの。
5. Non-Goals。意図して範囲の外にするもの。別の文書が担う話題は Non-Goal ではない。
6. User Stories。場面ごとの節に、困りごとと How Might We を置く。
7. Proposed Solution / Feature Description。提供する体験と機能を、要求の粒度で書く。画面と機能の一覧はここに置き、Design Doc には重ねない。
8. Success Metrics。満たす条件と、確認の方法の組。
9. Milestones。Success Metrics の節の名前で、完了の条件を定める。
10. Open Questions / Risks。未決事項とリスクを分ける。未決事項には、誰がいつまでに判断するかを書き、判断したら消す。リスクには、何が起きるかと備えを書く。

## 規則

- 出典は、根拠になる文の直後に置く。末尾に References の節をまとめない。
- 本文を読めていない出典は使わない。使う場合は、読めていない範囲を書く。
- 見出しの下に状態や更新日を書かない。状態は frontmatter の `status` で持つ。
