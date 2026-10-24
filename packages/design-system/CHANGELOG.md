# Changelog

## [0.1.1](https://github.com/Fukuemon/agent-harness/compare/design-system-v0.1.0...design-system-v0.1.1) (2026-10-24)


### Features

* **design-system:** 画面のコードの色の値と基本の段の名前を見つけるチェックの雛形を足す [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([0b0e6f4](https://github.com/Fukuemon/agent-harness/commit/0b0e6f4c389978825e25ba5ac4689786337bbd31))
* **design-system:** 画面を作るときの手順と、トークンと文書の型を足す [#165](https://github.com/Fukuemon/agent-harness/issues/165) ([e6594c2](https://github.com/Fukuemon/agent-harness/commit/e6594c2b1893c343d8d3a8d4655141ab335c321b))


### Bug Fixes

* **design-system:** _ の後ろの色の関数を見つける [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([cdce48b](https://github.com/Fukuemon/agent-harness/commit/cdce48ba9ec9224e39a9067bfc7c9ca04e0f4af5))
* **design-system:** _ の後ろの色を見つけ、閉じないテンプレートの /* で後ろを読み飛ばさない [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([9646927](https://github.com/Fukuemon/agent-harness/commit/9646927f4d0bb3fd299e08f6ae669a0ebfbb08ca))
* **design-system:** URL の // を、コンポーネントのファイルの CSS でもコメントにしない [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([3ca0bef](https://github.com/Fukuemon/agent-harness/commit/3ca0befe49020348b7fd5a13d4f533d1b6372435))
* **design-system:** テンプレートの文字列の ${ } の中のコメントを見ない [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([425bf55](https://github.com/Fukuemon/agent-harness/commit/425bf55c965e03a50a013d967688f9a6db7619f0))
* **design-system:** テンプレートの文字列の中の CSS のコメントを見ない [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([db36d42](https://github.com/Fukuemon/agent-harness/commit/db36d4205003e54bb723dda574d64203f67abfaf))
* **design-system:** 引用符の中の // をコメントにせず、color() を色の関数として見つける [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([db7a592](https://github.com/Fukuemon/agent-harness/commit/db7a5927f90422504f217557141a2105ee437618))
* **design-system:** 後ろに _ が続く 16 進の色を見つける [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([5e3cdc8](https://github.com/Fukuemon/agent-harness/commit/5e3cdc853de0c77093e98bd2023610e2daacd952))
* **design-system:** 画面を作る依頼で読み込まれるようにし、テーマの段が文字と角丸と影で基本の段を参照すると書く [#165](https://github.com/Fukuemon/agent-harness/issues/165) ([21b7f4d](https://github.com/Fukuemon/agent-harness/commit/21b7f4d22ab33f4f623390cfa99e8d704ee2e9ab))
* **design-system:** 色の値のチェックの限界を書き、壊れたリンクで 2 を返す [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([a781e42](https://github.com/Fukuemon/agent-harness/commit/a781e4293d1515cdc95a01b67785bf9230b6c904))
* **design-system:** 色の関数の名前を、大文字と小文字を区別せずに見つける [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([557c1d6](https://github.com/Fukuemon/agent-harness/commit/557c1d6370374f47d954d44b5749ee9cb99ea6c4))


### Documentation

* **design-system:** check-raw-values.mjs のコメントの比喩の動詞を言い換える [#166](https://github.com/Fukuemon/agent-harness/issues/166) ([69275d6](https://github.com/Fukuemon/agent-harness/commit/69275d6a1a608e41870d2ca1955abc24b2b149cc))

## 0.1.0 (2026-10-24)


### Features

* **design-system:** design_system のキーの schema を足す [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([813872e](https://github.com/Fukuemon/agent-harness/commit/813872e8c5cf4580f484503f3b94ae4080e44445))
* **design-system:** パッケージ design-system を追加する [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([34920a8](https://github.com/Fukuemon/agent-harness/commit/34920a8de5654450106e0146927bd017b1f59207))


### Bug Fixes

* **design-system:** --root のブロックを :root より優先する [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([2ee5022](https://github.com/Fukuemon/agent-harness/commit/2ee50229c72dc99ff6446e99d8b634bed53de7e6))
* **design-system:** [@layer](https://github.com/layer) の順で同じ変数の値を決める [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([2af4499](https://github.com/Fukuemon/agent-harness/commit/2af4499c603d5d882e5ee280dda509340abf21b4))
* **design-system:** CSS にない --root のブロックを報告する [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([5da4e55](https://github.com/Fukuemon/agent-harness/commit/5da4e554be42e7e0cd0c6f82332072d863ddbb42))
* **design-system:** CSS のコメントの中の宣言と [@import](https://github.com/import) を読まない [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([f1ad755](https://github.com/Fukuemon/agent-harness/commit/f1ad755dc8894f7334e15a3b1859b1a94a630f11))
* **design-system:** ターゲットの大きさの基準を AAA の値と書く [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([4bfaf19](https://github.com/Fukuemon/agent-harness/commit/4bfaf193b9ad17dab9c6c6ee0c1365b1d2635c55))
* **design-system:** ブロックの最後のセミコロンのない宣言も読む [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([1027b83](https://github.com/Fukuemon/agent-harness/commit/1027b83daaaedca73195985becd99e2609e4ce79))
* **design-system:** 基本の段の条件つきのブロックでチェックを止めない [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([a40c2bc](https://github.com/Fukuemon/agent-harness/commit/a40c2bc611570260c8b49a0dcbae87cedaa2cf0c))
* **design-system:** 条件つきのブロックの中のトークンの宣言を報告する [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([84e6f20](https://github.com/Fukuemon/agent-harness/commit/84e6f209060e88194d717e9c456aba0f8d37fff9))
* **design-system:** 条件と !important とテーマの選び方をカスケードに合わせる [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([cf49a6c](https://github.com/Fukuemon/agent-harness/commit/cf49a6c19e8b438daf65300dc3055d9e5f3bb337))
* **design-system:** 生成のスクリプトのパスの比べ方とコメントの扱いを直す [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([e6c22f4](https://github.com/Fukuemon/agent-harness/commit/e6c22f4b94fed7b6e8ffd9c9d917315584a17573))
* **design-system:** 生成の前に元の CSS のコメントを外す [#147](https://github.com/Fukuemon/agent-harness/issues/147) ([dc4733b](https://github.com/Fukuemon/agent-harness/commit/dc4733bc27abc7867d5ba195e16cf3bc13922ede))


### Documentation

* design-system と screens の Design Doc から ADR-0025 を指す [#163](https://github.com/Fukuemon/agent-harness/issues/163) ([4a53d8c](https://github.com/Fukuemon/agent-harness/commit/4a53d8c6b570a99e8956c08e1e9252b585e3386d))
