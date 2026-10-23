# Changelog

このファイルは `v0.2.8` までの記録である。以後は、パッケージごとにバージョンを上げ、変更履歴は `packages/<名前>/CHANGELOG.md` に、タグは `<名前>-v<バージョン>` の形で付ける。`apm.yml` の書き換え方は [README の Update](README.md#update) にある。

## [0.2.8](https://github.com/Fukuemon/agent-harness/compare/v0.2.7...v0.2.8) (2026-10-23)


### Bug Fixes

* **docs:** prh のテンプレートで、名詞の前の確かめが要るを確認が必要なと指摘する [#124](https://github.com/Fukuemon/agent-harness/issues/124) ([19eec8d](https://github.com/Fukuemon/agent-harness/commit/19eec8dcf1447fff8ca783505e1349e5ae15319c))
* **docs:** prh のテンプレートの地の規則が、地味と地下を指摘しないようにする [#119](https://github.com/Fukuemon/agent-harness/issues/119) ([aed5822](https://github.com/Fukuemon/agent-harness/commit/aed5822efab732c17a3990c1a0f64021bf8751da))
* **docs:** 確認が必要なと指摘する形に、はず、わけ、英字が続く形を足す [#124](https://github.com/Fukuemon/agent-harness/issues/124) ([9434f0d](https://github.com/Fukuemon/agent-harness/commit/9434f0d01d801e2508cd920ab24ca97ab5acc5a9))

## [0.2.7](https://github.com/Fukuemon/agent-harness/compare/v0.2.6...v0.2.7) (2026-10-23)


### Features

* **docs:** 「確かめる」と画面の「地」を、確認すると背景に揃える規則を足す [#116](https://github.com/Fukuemon/agent-harness/issues/116) ([924591f](https://github.com/Fukuemon/agent-harness/commit/924591f1a827ae76639319d90bc88bca7414ea0d))


### Bug Fixes

* **core:** スキルとテンプレートの本文の「確かめる」を「確認する」にする [#116](https://github.com/Fukuemon/agent-harness/issues/116) ([f7474e0](https://github.com/Fukuemon/agent-harness/commit/f7474e09974e1e8fa5131d202ef6e764a40ef8fa))
* **docs:** 「確かめ」の名詞の規則に、と と も が続く形を足す [#116](https://github.com/Fukuemon/agent-harness/issues/116) ([215bc2f](https://github.com/Fukuemon/agent-harness/commit/215bc2f9ba9956c721dd9a06035d04b923cc283a))
* **docs:** 「確かめる」と「地」の規則を、否定の活用と地図や下地を区別するよう直す [#116](https://github.com/Fukuemon/agent-harness/issues/116) ([2fdb88c](https://github.com/Fukuemon/agent-harness/commit/2fdb88ce0b58fe2e4ddabc55172194dfd45f1fd9))
* **docs:** スキルと Design Doc の本文の「確かめる」を「確認する」にする [#116](https://github.com/Fukuemon/agent-harness/issues/116) ([5ae7040](https://github.com/Fukuemon/agent-harness/commit/5ae70403d94f6b9eeae9cb29159230bab1ef8257))

## [0.2.6](https://github.com/Fukuemon/agent-harness/compare/v0.2.5...v0.2.6) (2026-10-22)


### Features

* **core:** pull request の雛形の表の観点を、条件と期待結果の列に分ける [#111](https://github.com/Fukuemon/agent-harness/issues/111) ([f2f5600](https://github.com/Fukuemon/agent-harness/commit/f2f5600af06e654887df03f3f6cd5b0c8cd49567))
* **core:** write-issue-pr に、運用で迷った場面の規則と、issue の検証の観点の欄を足す [#113](https://github.com/Fukuemon/agent-harness/issues/113) ([9283068](https://github.com/Fukuemon/agent-harness/commit/9283068a9301d7eec8ae7693dd8b953c1457551e))


### Bug Fixes

* **core:** issue の書き方から、ホスティングサービスの名前を外す [#113](https://github.com/Fukuemon/agent-harness/issues/113) ([76eace5](https://github.com/Fukuemon/agent-harness/commit/76eace528f66cd808a584e41520456e9b8efe3ce))
* **core:** write-issue-pr の検証の観点と分けた pull request の規則を、レビューに合わせて直す [#113](https://github.com/Fukuemon/agent-harness/issues/113) ([eaf9775](https://github.com/Fukuemon/agent-harness/commit/eaf9775c861447d3e0f8305f6fd87a10573fb354))

## [0.2.5](https://github.com/Fukuemon/agent-harness/compare/v0.2.4...v0.2.5) (2026-10-22)


### Features

* **core:** pull request の雛形に、検証とエビデンスの節を足す [#108](https://github.com/Fukuemon/agent-harness/issues/108) ([b5044b0](https://github.com/Fukuemon/agent-harness/commit/b5044b0d7ef19f6761342d925c5d655f98df1ef0))

## [0.2.4](https://github.com/Fukuemon/agent-harness/compare/v0.2.3...v0.2.4) (2026-10-21)


### Features

* **core:** テンプレートの文言を技術用語のカタカナ表記に変更する [#102](https://github.com/Fukuemon/agent-harness/issues/102) ([f044113](https://github.com/Fukuemon/agent-harness/commit/f0441131ba94a96d6c7d4b0278133cd52ccced93))
* **docs:** テンプレートの prh.yml に技術用語のカタカナ表記の規則を追加する [#102](https://github.com/Fukuemon/agent-harness/issues/102) ([a2693e3](https://github.com/Fukuemon/agent-harness/commit/a2693e3205eb35e382d72223369a68cb1ee8b105))
* **docs:** 技術用語をカタカナ語や英語のまま書く規則を write-prose に追加する [#102](https://github.com/Fukuemon/agent-harness/issues/102) ([c5aa5dd](https://github.com/Fukuemon/agent-harness/commit/c5aa5dda8a1ba0efbcfcded5263dbf7c2393680c))

## [0.2.3](https://github.com/Fukuemon/agent-harness/compare/v0.2.2...v0.2.3) (2026-10-14)


### Bug Fixes

* **core:** frontmatter は閉じる --- まで見て判定する [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([c181531](https://github.com/Fukuemon/agent-harness/commit/c1815314f0845e0d79dcc470d6dde9426782664f))
* **core:** frontmatter を持たない文書を外すのは、設計文書のディレクトリの資料だけにする [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([50853bb](https://github.com/Fukuemon/agent-harness/commit/50853bbae13faf08199b56fc6612c60f36e55364))
* **core:** setup.mjs が project.yml を YAML の構造で読む [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([d8b605a](https://github.com/Fukuemon/agent-harness/commit/d8b605aaada7be1483a60d7352500fe36c9cfa19))
* **core:** ラベルの一覧を、ページを順に読んで全部集める [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([1a86bed](https://github.com/Fukuemon/agent-harness/commit/1a86bed901f1a302747ecab0c231a235449f0742))
* **core:** 値の途中の引用符を、引用の始まりとして扱わない [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([2fde22a](https://github.com/Fukuemon/agent-harness/commit/2fde22a967c5ff722152be99db636ff7b6dadf6a))
* **core:** 単引用符の中の '' を、引用の終わりとして扱わない [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([f6e67a4](https://github.com/Fukuemon/agent-harness/commit/f6e67a496fad13578ad02fe9cdd15f2535969c47))
* **core:** 機能ごとの DesignDoc_&lt;機能&gt;.md も、frontmatter がなければ失敗にする [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([ac06aed](https://github.com/Fukuemon/agent-harness/commit/ac06aedd48599bdd6ecbb0656384bb2fb8e32d82))
* **core:** 設計文書のディレクトリの、frontmatter を持たない資料を目次に載せない [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([3e547e6](https://github.com/Fukuemon/agent-harness/commit/3e547e62aba787e12ccc91b1eb86a7f7f4cf1a7d))
* **docs:** --exclude の、条件が空の attr: を拒む [#89](https://github.com/Fukuemon/agent-harness/issues/89) ([95fd289](https://github.com/Fukuemon/agent-harness/commit/95fd2897f1de7b3ff0953b79ab15e7e4fddbeee4))
* **docs:** PRD の最初の図の見出しを System Context にする [#92](https://github.com/Fukuemon/agent-harness/issues/92) ([2e6cd3f](https://github.com/Fukuemon/agent-harness/commit/2e6cd3f99f6e314a70006795168778df1ba8e4de))

## [0.2.2](https://github.com/Fukuemon/agent-harness/compare/v0.2.1...v0.2.2) (2026-10-12)


### Features

* **docs:** プロジェクトの語を許す手順と、ADR の一部の置き換えの書き方を足す ([fb5da78](https://github.com/Fukuemon/agent-harness/commit/fb5da7800f77dd2641d32cb444614a2f9ed3a6a6)), closes [#80](https://github.com/Fukuemon/agent-harness/issues/80)
* **docs:** 見出しの語と、CONTRIBUTING.md の案内も、誤検知の手順に回す [#80](https://github.com/Fukuemon/agent-harness/issues/80) ([f435848](https://github.com/Fukuemon/agent-harness/commit/f435848b5117ed19ce1c39525a8e59a8e83277c3))


### Bug Fixes

* **core:** --force で上書きした雛形もラベルをそろえ、merge request の見出しを使う [#81](https://github.com/Fukuemon/agent-harness/issues/81) ([de3a75d](https://github.com/Fukuemon/agent-harness/commit/de3a75df56d930af71cc92cd697dedc9a6168d2a))
* **core:** --separate-git-dir の置き場を bare のリポジトリと区別する [#76](https://github.com/Fukuemon/agent-harness/issues/76) ([d614702](https://github.com/Fukuemon/agent-harness/commit/d614702698d5a28ee718386b115f2e7b17041207))
* **core:** apm.lock.yaml が変わったときに配置し直し、チェックを飛ばしたことを表示する [#79](https://github.com/Fukuemon/agent-harness/issues/79) ([f99313a](https://github.com/Fukuemon/agent-harness/commit/f99313a23ee3d738b93d7016a24e4a7017712c61))
* **core:** setup-agent-harness が worktree と旧形式の project.yml を正しく扱う [#76](https://github.com/Fukuemon/agent-harness/issues/76) ([8172ebc](https://github.com/Fukuemon/agent-harness/commit/8172ebc16654722e816362ba029d8a42dec09f10))
* **core:** setup-agent-harness が写す assets/ を、apm.lock.yaml にあるスキルに絞る [#73](https://github.com/Fukuemon/agent-harness/issues/73) ([1c617e6](https://github.com/Fukuemon/agent-harness/commit/1c617e6cb6be8c9ce2be9478ff1c259423febe7e))
* **core:** setup.mjs --index は、frontmatter が欠けた文書があれば失敗する [#77](https://github.com/Fukuemon/agent-harness/issues/77) ([dcd8bea](https://github.com/Fukuemon/agent-harness/commit/dcd8bea52ed6b85bdb81d8e1847a015e658edfd9))
* **core:** ラベルをそろえるのは写した雛形だけにし、ラベルを全部読む [#81](https://github.com/Fukuemon/agent-harness/issues/81) ([dda6ac7](https://github.com/Fukuemon/agent-harness/commit/dda6ac7b431e9274f38490a0cfb02e5a0081a1bf))
* **core:** リモートがないときは、ラベルをそろえる手順を後に回す [#81](https://github.com/Fukuemon/agent-harness/issues/81) ([282cce3](https://github.com/Fukuemon/agent-harness/commit/282cce3d369d2c5352499c113cfbf9bb5f3143f4))
* **core:** 導入のときに、issue の雛形のラベルを今のラベルにそろえる ([bb2ec1b](https://github.com/Fukuemon/agent-harness/commit/bb2ec1b5954cdc21d33604a06f3f6103ef691f6e)), closes [#81](https://github.com/Fukuemon/agent-harness/issues/81)
* **core:** 後に回したラベルの対応と、節のない CONTRIBUTING.md を扱う [#81](https://github.com/Fukuemon/agent-harness/issues/81) ([5962dac](https://github.com/Fukuemon/agent-harness/commit/5962dac94e0b3f8a61293cde0c674130dfd6a255))
* **core:** 本体の作業ツリーでは、その名前をリポジトリの名前にする [#76](https://github.com/Fukuemon/agent-harness/issues/76) ([3b093f1](https://github.com/Fukuemon/agent-harness/commit/3b093f182935e1e14f01ed2745bbda1c8fe50982))
* **core:** 目次に、コードの隣の Design Doc とルートの PRD を載せる [#77](https://github.com/Fukuemon/agent-harness/issues/77) ([d4c9699](https://github.com/Fukuemon/agent-harness/commit/d4c9699b693a4e0dabee595c496695403bd4948d))
* **core:** 目次を、既にある文書の frontmatter から作る [#73](https://github.com/Fukuemon/agent-harness/issues/73) ([ef0931c](https://github.com/Fukuemon/agent-harness/commit/ef0931c66ca17387323718d28a40340044a82fec))
* **docs:** --exclude のパターンが空の pathspec を拒む [#78](https://github.com/Fukuemon/agent-harness/issues/78) ([568c125](https://github.com/Fukuemon/agent-harness/commit/568c12542ecaef8131b6e9c5c7fcdf16bcc9657b))
* **docs:** --exclude の短い形の pathspec にも exclude を足す [#78](https://github.com/Fukuemon/agent-harness/issues/78) ([35c8642](https://github.com/Fukuemon/agent-harness/commit/35c8642994a917218a6707f6655756f70a2ab1f7))
* **docs:** --exclude の空のパスを拒み、魔法の語を exclude とまとめる [#78](https://github.com/Fukuemon/agent-harness/issues/78) ([09ac795](https://github.com/Fukuemon/agent-harness/commit/09ac7953fff5c109298b65110e2dbf96f93d63b2))
* **docs:** attr: で絞る除外は、パターンがなくても受け付ける [#78](https://github.com/Fukuemon/agent-harness/issues/78) ([a9f4f0e](https://github.com/Fukuemon/agent-harness/commit/a9f4f0e7cd09f86a0634272fdeb4b316a121ea6e))
* **docs:** 文書のチェックが、まだ追跡していない文書を見て、--exclude でパスを外せる [#78](https://github.com/Fukuemon/agent-harness/issues/78) ([559b30c](https://github.com/Fukuemon/agent-harness/commit/559b30c4da694f64a996c357303754d900ac7b1d))
* **docs:** 文書のチェックが、日本語のファイル名の Markdown も読む [#73](https://github.com/Fukuemon/agent-harness/issues/73) ([6333ca6](https://github.com/Fukuemon/agent-harness/commit/6333ca65e21c1c8748f85d79319ba877cb954df2))


### Documentation

* **core:** 目次を作り直す手段を setup.mjs --index にする [#77](https://github.com/Fukuemon/agent-harness/issues/77) ([4f59d26](https://github.com/Fukuemon/agent-harness/commit/4f59d2686bbb3954b96937ba97e1eee5fcdca10c))
* **docs:** CI でサイトの原稿を --exclude で外す手順を書く [#78](https://github.com/Fukuemon/agent-harness/issues/78) ([6830978](https://github.com/Fukuemon/agent-harness/commit/6830978408ba53064dcb7cd48806d9afc47c4146))

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
