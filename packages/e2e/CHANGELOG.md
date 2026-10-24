# Changelog

## 0.1.0 (2026-10-24)


### Features

* **e2e:** kit を入れる導入のスキル setup-e2e と、kit のバージョンのファイルを足す [#156](https://github.com/Fukuemon/agent-harness/issues/156) ([ac50f2e](https://github.com/Fukuemon/agent-harness/commit/ac50f2effbdb7907778385bd65fb512ee8fd2f7b))
* **e2e:** パッケージ e2e を追加し、E2E のテストの書き方のスキルを足す [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([5b12200](https://github.com/Fukuemon/agent-harness/commit/5b12200054e46c86e1eb0d5dc49d4a192b0f31b7))
* **e2e:** 録画、エビデンス、ログイン、lint の規則を持つ kit を追加する [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([b1e9a61](https://github.com/Fukuemon/agent-harness/commit/b1e9a61f4d3034345696ef57ec5f9f403eba316e))


### Bug Fixes

* **e2e:** lint の規則の testsDir を正規化し、セレクタの文字列の操作と待ちの判定を直す [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([7c367da](https://github.com/Fukuemon/agent-harness/commit/7c367da83aab2f88f1b27e3a618091f025a522bb))
* **e2e:** setup-e2e の雛形で、設定を読むだけで落ちる import をなくし、変換のツールを確認する [#156](https://github.com/Fukuemon/agent-harness/issues/156) ([8edf923](https://github.com/Fukuemon/agent-harness/commit/8edf923b8902c85e1b22d3a464ee15e95c05e0b0))
* **e2e:** エビデンスのファイル名で、例の値のパスの区切りを置き換える [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([bc15a62](https://github.com/Fukuemon/agent-harness/commit/bc15a626ae8d00fa95bdf505289d47b6fe9c891b))
* **e2e:** エビデンスの配置先の各段で、パスの区切りと . と .. を扱う [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([5ce350f](https://github.com/Fukuemon/agent-harness/commit/5ce350fa9d8a65ae97f9eb675fccaa2439ada280))
* **e2e:** 保存したログインの状態で入れたときも、入れた後の状態を保存し直す [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([ce84668](https://github.com/Fukuemon/agent-harness/commit/ce84668172e56b61bda09a32cd877e1c891a0192))
* **e2e:** 保存した状態で入れないときは、状態を持たないコンテキストでログインし直す [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([f8d15c2](https://github.com/Fukuemon/agent-harness/commit/f8d15c2629b3aa23a4390577106632ec2e86f74f))
* **e2e:** 録画の前に変換のツールを確認し、字幕とカーソルを最上位の文書にだけ出す [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([949e9bd](https://github.com/Fukuemon/agent-harness/commit/949e9bd79259851723a4b1c75028c7e74755cb97))


### Documentation

* **e2e:** Design Doc に、導入のスキルと kit の公開を書く [#156](https://github.com/Fukuemon/agent-harness/issues/156) ([cc1eff5](https://github.com/Fukuemon/agent-harness/commit/cc1eff504f1aad9431870bae775c4b9ffb6a598f))
* **e2e:** E2E の Design Doc に、kit の構成、撮る流れ、ビルドとテストを書く [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([6460ccb](https://github.com/Fukuemon/agent-harness/commit/6460ccb78d6806135b4acba174d0a1c530b47f68))
* **e2e:** lint の規則が止める書き方、kit の入れ方、テストするバージョンを書き直す [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([9c500c8](https://github.com/Fukuemon/agent-harness/commit/9c500c86348edbfc937a7f2b289b0380ca5daadc))
* **e2e:** ログインの保存のテストを飛ばす条件と、ファイル名の置き換えを書く [#150](https://github.com/Fukuemon/agent-harness/issues/150) ([5b1a7e8](https://github.com/Fukuemon/agent-harness/commit/5b1a7e835e224e417a775b0bda58762d878db46b))
* kit の最初の公開の npm login と provenance、公開のジョブの守りを書く [#156](https://github.com/Fukuemon/agent-harness/issues/156) ([0d0ef7f](https://github.com/Fukuemon/agent-harness/commit/0d0ef7f22b8904b9af17ec5ab857e395bbd8a4c7))
