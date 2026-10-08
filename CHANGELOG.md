# Changelog

## [0.2.1](https://github.com/Fukuemon/agent-harness/compare/v0.2.0...v0.2.1) (2026-10-08)


### Features

* **core:** 導入のときにホスティングサービスを選び、GitLab の雛形を写す機能を追加する [#46](https://github.com/Fukuemon/agent-harness/issues/46) ([a85837f](https://github.com/Fukuemon/agent-harness/commit/a85837f16237e02700bc675dc5db93396e7a316c))
* **docs:** write-prose に比喩の動詞、名詞の連続、装飾に頼った文を直す規則を追加する [#65](https://github.com/Fukuemon/agent-harness/issues/65) ([1148025](https://github.com/Fukuemon/agent-harness/commit/11480258e8e384430d471830daddbcd194e84542))


### Bug Fixes

* **core:** --hosting に Object の継承したプロパティの名前を渡すと通る誤りを修正する [#46](https://github.com/Fukuemon/agent-harness/issues/46) ([cba2fe1](https://github.com/Fukuemon/agent-harness/commit/cba2fe1703a5a46bcdd7c75e90b8bd5b857fbd61))
* **core:** 雛形の「環境」と「影響」の文面を利用者のリポジトリ向けに修正する [#46](https://github.com/Fukuemon/agent-harness/issues/46) ([33a0a7a](https://github.com/Fukuemon/agent-harness/commit/33a0a7ad0856e0ef0dae121fe72d8f860f72eb4b))
* **docs:** 「注目すべき点はない」を前置きとして指摘しないよう prh の規則を狭める [#65](https://github.com/Fukuemon/agent-harness/issues/65) ([38c6322](https://github.com/Fukuemon/agent-harness/commit/38c632219921c6c02afa4b251dae557d9a2b0036))
* **docs:** write-prose の比喩の動詞の例を、原文にない原因と効果を補わない言い換えにする [#65](https://github.com/Fukuemon/agent-harness/issues/65) ([68f536e](https://github.com/Fukuemon/agent-harness/commit/68f536ea1ae1651bf7c7de8e588c895eb04e9b0c))

## [0.2.0](https://github.com/Fukuemon/agent-harness/compare/v0.1.0...v0.2.0) (2026-10-07)


### ⚠ BREAKING CHANGES

* **core:** context/project.yml の version を 2 に上げ、guardrails のキーを削除する。

### Features

* **core:** project.yml から guardrails を削除し、version を 2 に上げる [#59](https://github.com/Fukuemon/agent-harness/issues/59) ([7dda7cf](https://github.com/Fukuemon/agent-harness/commit/7dda7cf2a3eb6886249051be614ebe951bf55245))
* **core:** write-issue-pr に、起票の前の下書きへ文書のチェックを掛ける手順を足す [#51](https://github.com/Fukuemon/agent-harness/issues/51) ([df163f1](https://github.com/Fukuemon/agent-harness/commit/df163f1ee49c8fb3a500a7e53f6bf5510092ad4b))
* **core:** 保護するブランチを CONTRIBUTING.md に書く [#59](https://github.com/Fukuemon/agent-harness/issues/59) ([4ae7250](https://github.com/Fukuemon/agent-harness/commit/4ae72500ac6af951c79c8bb3436a09b0c9400214))
* **docs:** C4 の L1 の図を PRD の Landscape に置き、Design Doc からリンクする [#57](https://github.com/Fukuemon/agent-harness/issues/57) ([9096ef6](https://github.com/Fukuemon/agent-harness/commit/9096ef69e3f9e969457137b21128a08198e39fe8))
* **docs:** write-design-docs の PRD の節の構成と粒度の規則を足す [#57](https://github.com/Fukuemon/agent-harness/issues/57) ([021f73a](https://github.com/Fukuemon/agent-harness/commit/021f73a132293673cee3491c0862259524509d43))
* **docs:** write-prose に、無生物主語、意味の保持、言い換えの上限の規則を足す [#50](https://github.com/Fukuemon/agent-harness/issues/50) ([4c41683](https://github.com/Fukuemon/agent-harness/commit/4c4168313b413e133c56274bc78b14ebd651559c))
* **docs:** write-prose の「文と段落」を、「文」と「段落と箇条書き」の節に分けて書き直す [#55](https://github.com/Fukuemon/agent-harness/issues/55) ([ee220ad](https://github.com/Fukuemon/agent-harness/commit/ee220adc00f93e37528b20c8014c3f7dda24f6df))
* **docs:** write-prose の図の節に、視点ごとに分ける規則と縦向きに描く規則を足す [#57](https://github.com/Fukuemon/agent-harness/issues/57) ([3ae305e](https://github.com/Fukuemon/agent-harness/commit/3ae305ec0da5294a310db535a0ed0a7e02295d92))
* **docs:** 文章の規則のテンプレートに、AI が書きがちな語を検出する規則を足す [#49](https://github.com/Fukuemon/agent-harness/issues/49) ([3bb3720](https://github.com/Fukuemon/agent-harness/commit/3bb3720bb1138be09c8725c2ec2803ce0f797244))


### Bug Fixes

* **core:** version 1 の保護ブランチを、導入の更新で引き継ぐ [#59](https://github.com/Fukuemon/agent-harness/issues/59) ([5c22ebc](https://github.com/Fukuemon/agent-harness/commit/5c22ebcb1e8f03c403c3bd14fbe8a53c873bd1e2))
* **core:** コメントのフックを、context/project.yml がないリポジトリでは動かさない [#61](https://github.com/Fukuemon/agent-harness/issues/61) ([b9c0e5e](https://github.com/Fukuemon/agent-harness/commit/b9c0e5e3619678610ec99e519d4a713fe87d3366))
* **core:** スキルに残る、保護ブランチを project.yml から読む記述を直す [#59](https://github.com/Fukuemon/agent-harness/issues/59) ([bb3e14e](https://github.com/Fukuemon/agent-harness/commit/bb3e14ed5cb4d812c6d89d6fcb3c4c7f3bd1fb49))
* **core:** セッションの開始のフックを、context/project.yml がないリポジトリでは動かさない [#61](https://github.com/Fukuemon/agent-harness/issues/61) ([ea9ca8d](https://github.com/Fukuemon/agent-harness/commit/ea9ca8dce68efe736818888093dbebb4b7e57f83))
* **docs:** 「に他なりません」も検出するように、文末の飾りの規則を修正する [#49](https://github.com/Fukuemon/agent-harness/issues/49) ([e2534db](https://github.com/Fukuemon/agent-harness/commit/e2534db8bea694b26abd3a0cd59af89d63083ef9))
* **docs:** PRD の Background、User Stories、Milestones の規則の条件を明確にする [#57](https://github.com/Fukuemon/agent-harness/issues/57) ([e69e249](https://github.com/Fukuemon/agent-harness/commit/e69e249c94b981df492e8b1f3be017c0daf39746))
* **docs:** User Stories の単位を、1 つの目的を果たす一続きの操作に揃える [#57](https://github.com/Fukuemon/agent-harness/issues/57) ([6415eb5](https://github.com/Fukuemon/agent-harness/commit/6415eb5e195b80de9d7171169a68e53df88dceda))
* **docs:** 文書のフックを、context/project.yml がないリポジトリでは動かさない [#61](https://github.com/Fukuemon/agent-harness/issues/61) ([39f5f02](https://github.com/Fukuemon/agent-harness/commit/39f5f02f62b2a3dd492caab6e4646abc2e2e865d))


### Documentation

* **core:** core の範囲に、ガードレールの規則と止める仕組みを足す [#59](https://github.com/Fukuemon/agent-harness/issues/59) ([6e6a14e](https://github.com/Fukuemon/agent-harness/commit/6e6a14e0ccbbc2363d5d25842562dae507aba045))
* **core:** 導入のスキルに、apm を使わずに入れた場合の案内を足す [#61](https://github.com/Fukuemon/agent-harness/issues/61) ([dae34bf](https://github.com/Fukuemon/agent-harness/commit/dae34bfe04a0bf62bca47ffee117a6b9045a4312))
* ガードレールを考え方として扱う形に、PRD と設計を合わせる [#59](https://github.com/Fukuemon/agent-harness/issues/59) ([1f4faf6](https://github.com/Fukuemon/agent-harness/commit/1f4faf6d27c116f2f2205823fa157de6e6bf4493))
* 文書の「寿命」を「ライフサイクル」に言い換える [#57](https://github.com/Fukuemon/agent-harness/issues/57) ([7106fad](https://github.com/Fukuemon/agent-harness/commit/7106fad539234dccab649a7b92006d0ba1e02ee6))

## 0.1.0 (2026-09-30)


### Features

* **core:** 導入と、テンプレートからの更新の取り込みのスキル setup-agent-harness を追加する ([2f70da9](https://github.com/Fukuemon/agent-harness/commit/2f70da984486e692c9f9c818c64aab6210c73333), [ff056eb](https://github.com/Fukuemon/agent-harness/commit/ff056eb3468b3ef9b7841792fd452870e5761fa6), [38d5e09](https://github.com/Fukuemon/agent-harness/commit/38d5e09994d2f9f9b5d7a80fce5936673316a3c1))
* **core:** context とスキルを書くスキル write-context、write-skill を追加する ([0812f33](https://github.com/Fukuemon/agent-harness/commit/0812f339d35886f8fd760091de352b0e6b0e78ca), [71ecf30](https://github.com/Fukuemon/agent-harness/commit/71ecf309b16e3dc022302dc11dfe8712e01a5689))
* **core:** コミット、issue と pull request、コメントの規約のスキル write-commit、write-issue-pr、write-comments と、issue の form と pull request の雛形を追加する ([3c48796](https://github.com/Fukuemon/agent-harness/commit/3c487964986e15a64e6e69319ec2da2e8bb59efc), [8ef11e2](https://github.com/Fukuemon/agent-harness/commit/8ef11e2d0dffad862b7df09a30780fe5abb2a309), [71ecf30](https://github.com/Fukuemon/agent-harness/commit/71ecf309b16e3dc022302dc11dfe8712e01a5689))
* **core:** セッションの開始で、apm の配置と .gitignore をそろえ、消えたスキルの写しを片付けるフックを追加する ([56e73a5](https://github.com/Fukuemon/agent-harness/commit/56e73a515c74ecfb72f3b491b3e97429445581b4), [0f9d80e](https://github.com/Fukuemon/agent-harness/commit/0f9d80e61975952300fd5c69f0fa9430688aa6fc), [334bf33](https://github.com/Fukuemon/agent-harness/commit/334bf3391670647173f47d9e2ed232eb97944e7f))
* **core:** ファイルの編集の後に、足されたコメントと lint の抑制を確かめるよう促すフックを追加する ([d8e9b44](https://github.com/Fukuemon/agent-harness/commit/d8e9b44759874f69e9bb133dbb3d3db4f84e7a66))
* **docs:** 文書のチェックを lefthook と CI に組み込み、用語の規則を決めるスキル setup-design-docs を追加する ([e740713](https://github.com/Fukuemon/agent-harness/commit/e7407136e8e209db01339551b6d9e53ff607edab))
* **docs:** PRD、Design Doc、ADR、spec の書き方とテンプレートのスキル write-design-docs と、文章の規則のスキル write-prose を追加する ([bdf3d30](https://github.com/Fukuemon/agent-harness/commit/bdf3d30a2d47c066af919d749f2c8570fb2300f1), [7b709ab](https://github.com/Fukuemon/agent-harness/commit/7b709abf8d94c9fe7d12d2e35a5ec252ddc65075))
* **docs:** 経緯の混入、リンク切れ、実装とのずれのチェックと、Markdown の編集の後に確かめるよう促すフックを追加する ([82bbc40](https://github.com/Fukuemon/agent-harness/commit/82bbc40b86911b418f0612311e7f10201f08b9f2))
