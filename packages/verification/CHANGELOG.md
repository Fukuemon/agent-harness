# Changelog

## [0.2.0](https://github.com/Fukuemon/agent-harness/compare/verification-v0.1.0...verification-v0.2.0) (2026-10-24)


### ⚠ BREAKING CHANGES

* **verification:** attach-evidence は添付の手順を references/ から読まず、context/testing/evidence.md の Attachment のセクションから読む。導入済みの利用者のリポジトリは、examples/verification/ の例を元に Attachment のセクションを書く。

### Bug Fixes

* **verification:** スキルの食い違いを直し、添付の手順を利用者の context に移す [#158](https://github.com/Fukuemon/agent-harness/issues/158) ([0f44b6b](https://github.com/Fukuemon/agent-harness/commit/0f44b6b0caeac1a8b8a4d12ffae9750abe6c42f6))
* **verification:** 検証名を最初の番号で固定し、名前の規則をエージェントが付ける部分に絞る [#158](https://github.com/Fukuemon/agent-harness/issues/158) ([1a73730](https://github.com/Fukuemon/agent-harness/commit/1a737301fdd41c1e1996fa33534dbd1898a608cc))

## 0.1.0 (2026-10-23)


### Features

* **verification:** EARS の要件の主語と表への写し方を design-test-cases にまとめる [#141](https://github.com/Fukuemon/agent-harness/issues/141) ([877c530](https://github.com/Fukuemon/agent-harness/commit/877c5309b5a4869e22e6d74e703dddf0010e43d8))
* **verification:** パッケージ verification を追加し、global の 2 つのスキルを移す [#139](https://github.com/Fukuemon/agent-harness/issues/139) ([da71bd1](https://github.com/Fukuemon/agent-harness/commit/da71bd1463af167edbc28411e5b47d7968567a5c))
* **verification:** 検証の spec、撮影の確認、エビデンスの添付のスキルを追加する [#141](https://github.com/Fukuemon/agent-harness/issues/141) ([1eb2c49](https://github.com/Fukuemon/agent-harness/commit/1eb2c4967ec92571fa136e79bf45dbef564ac66b))


### Bug Fixes

* **verification:** エビデンスの元のファイルを context の取り決めに従って片付ける [#141](https://github.com/Fukuemon/agent-harness/issues/141) ([734a157](https://github.com/Fukuemon/agent-harness/commit/734a1576db331e903a85a5d74121fcde8f6c0d8e))


### Documentation

* verification の 5 つのスキルを Design Doc と一覧に足す [#141](https://github.com/Fukuemon/agent-harness/issues/141) ([cb9b2e3](https://github.com/Fukuemon/agent-harness/commit/cb9b2e35947636ad99674b653bbfb2ed6c0a3b5e))
* **verification:** 検証の Design Doc をパッケージの隣へ移す [#139](https://github.com/Fukuemon/agent-harness/issues/139) ([b159b67](https://github.com/Fukuemon/agent-harness/commit/b159b6743b210b8cd7f01ec42cdf4a943997db21))
