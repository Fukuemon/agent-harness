# PRD の書き方

誰のどの課題を、何で解決するかを書く。実現方法は書かない。

## 節の構成

1. Overview / Problem Statement。何を作るか、なぜ今かを、数段落で書く。
2. Background。なぜ今これが要るかを、主張ごとの節で書く。
3. Goals。対象のユーザーと、提供する体験。
4. Lower-Priority Goals。将来は提供したいが、最初のバージョンでは優先しないもの。
5. Non-Goals。意図して範囲の外にするもの。別の文書が担う話題は Non-Goal ではない。
6. User Stories。場面ごとの節に、困りごとと How Might We を置く。
7. Proposed Solution / Feature Description。提供する体験と機能を、要求の粒度で書く。
8. Success Metrics。満たす条件と、確認の方法の組。
9. Milestones。Success Metrics の節の名前で、完了の条件を定める。
10. Open Questions / Risks。未決事項とリスクを分ける。
11. References。本文で使った出典の一覧。

## 規則

- ツールの名前、ファイルの形式、配置先、schema、コマンドのような実現方法は書かない。Design Doc と ADR が持つ。
- Background は補足の羅列にしない。主張ごとの節で、なぜ今これが要るかを書く。
  - 出典は新しいものを選ぶ。公式の記事とベストプラクティスは、公式の URL で載せる。
  - 本文を読めていない出典は使わない。使う場合は、読めていない範囲を利用者に伝える。
- 未決事項には、誰がいつまでに判断するかを書く。判断したら、その項目を消す。
- リスクには、何が起きるかと、備えを書く。
- 見出しの下の Status、Owner、Reviewers の 3 行を持つ。frontmatter は持たない。
