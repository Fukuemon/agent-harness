# Changelog

## 0.1.0 (2026-09-30)


### ⚠ BREAKING CHANGES

* **core:** core のスキルの名前を変える。git-commit は write-commit、issue-pr-writing は write-issue-pr、code-comments は write-comments、write-harness-context は write-context になる。古い名前を指す文書は直す必要がある。

### Features

* **core:** .ai-out/ を作業メモの置き場にし、導入のスキルが .gitignore に足す [#9](https://github.com/Fukuemon/agent-harness/issues/9) ([88bcf50](https://github.com/Fukuemon/agent-harness/commit/88bcf50f3160903437227bd5f187868794ebc12d))
* **core:** apm の post-install で配置先を .gitignore に足す [#27](https://github.com/Fukuemon/agent-harness/issues/27) ([ff056eb](https://github.com/Fukuemon/agent-harness/commit/ff056eb3468b3ef9b7841792fd452870e5761fa6))
* **core:** apm の配置先を .gitignore に足す [#24](https://github.com/Fukuemon/agent-harness/issues/24) ([74e51ba](https://github.com/Fukuemon/agent-harness/commit/74e51babba83be02d099e82c8ecc7a10aba134f0))
* **core:** clone した直後のセッションで apm の配置をそろえるフックを追加する [#24](https://github.com/Fukuemon/agent-harness/issues/24) ([56e73a5](https://github.com/Fukuemon/agent-harness/commit/56e73a515c74ecfb72f3b491b3e97429445581b4))
* **core:** code-comments を文書コメントと実装のコメントに分ける [#16](https://github.com/Fukuemon/agent-harness/issues/16) ([f3cdae4](https://github.com/Fukuemon/agent-harness/commit/f3cdae4f370277680d5de78a885efb8c3383198e))
* **core:** commitlint の設定のテンプレートを配り、導入で組み込みを尋ねる [#34](https://github.com/Fukuemon/agent-harness/issues/34) ([38d5e09](https://github.com/Fukuemon/agent-harness/commit/38d5e09994d2f9f9b5d7a80fce5936673316a3c1))
* **core:** context の話題にコードの規約と業務の知識を足し、4 話題に問いを足す [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([0269564](https://github.com/Fukuemon/agent-harness/commit/026956491c65121cd8c4af2cc1aa63dc1ef29e6a))
* **core:** context を種類ごとに決めて書き、更新するスキル write-harness-context を追加する [#11](https://github.com/Fukuemon/agent-harness/issues/11) ([0812f33](https://github.com/Fukuemon/agent-harness/commit/0812f339d35886f8fd760091de352b0e6b0e78ca))
* **core:** issue の form と pull request の雛形を core の assets に置く [#16](https://github.com/Fukuemon/agent-harness/issues/16) ([8ef11e2](https://github.com/Fukuemon/agent-harness/commit/8ef11e2d0dffad862b7df09a30780fe5abb2a309))
* **core:** setup.mjs の目次に Design Doc を載せ、生成の関数を build-index.mjs と揃える [#8](https://github.com/Fukuemon/agent-harness/issues/8) ([c406065](https://github.com/Fukuemon/agent-harness/commit/c4060653addfdbb0496e431342f8c21a405ef52b))
* **core:** write-issue-pr の issue の書き方に、タスクの分け方の規則を追加する [#39](https://github.com/Fukuemon/agent-harness/issues/39) ([5143c86](https://github.com/Fukuemon/agent-harness/commit/5143c8623e1ccc89029d1ed3152212d7d8c9da91))
* **core:** スキルを作るときの判断を持つスキル write-skill を足す [#31](https://github.com/Fukuemon/agent-harness/issues/31) ([71ecf30](https://github.com/Fukuemon/agent-harness/commit/71ecf309b16e3dc022302dc11dfe8712e01a5689))
* **core:** テンプレートの既定のブランチ運用を main と develop にする [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([449583c](https://github.com/Fukuemon/agent-harness/commit/449583c84e25dd229d9f57e4363d9af7d135aeef))
* **core:** テンプレートの節に案内のコメントを添え、CONTRIBUTING はスキルを指してリリースの流れを持つ [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([1d6787b](https://github.com/Fukuemon/agent-harness/commit/1d6787bb1b6f92dd4e0966d4e671dd12d4fb0b00))
* **core:** パッケージ core の骨組みと、ルートの marketplace を追加する [#6](https://github.com/Fukuemon/agent-harness/issues/6) ([bfa77e0](https://github.com/Fukuemon/agent-harness/commit/bfa77e09727e050094ea2d9bef6baac57f926f42))
* **core:** 導入のスキル setup-agent-harness と、テンプレートを写すスクリプトを追加する [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([2f70da9](https://github.com/Fukuemon/agent-harness/commit/2f70da984486e692c9f9c818c64aab6210c73333))
* **core:** 導入のスキルが文書のディレクトリ名を置き換え、リポジトリ名を全ファイルで埋める [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([91df8d0](https://github.com/Fukuemon/agent-harness/commit/91df8d080d08ebe8746754349d39fb9da3e5759c))
* **core:** 導入のスキルは context の 6 種類を全部 draft で置き、種類の選択をやめる [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([0a2f9aa](https://github.com/Fukuemon/agent-harness/commit/0a2f9aa4156b513b446923608c397815a27ec2d9))
* **core:** 業務の知識を用語と一覧の 1 ファイルにし、概念ごとの文書を context/domain/ に分ける [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([4381495](https://github.com/Fukuemon/agent-harness/commit/43814954446f9193b78c66cb374967a53db903de))
* **core:** 目次を frontmatter から生成し直すスクリプトと、編集後のフックを追加する [#8](https://github.com/Fukuemon/agent-harness/issues/8) ([1d544f9](https://github.com/Fukuemon/agent-harness/commit/1d544f9ba14181b3e824163664bcdfa94a3552d1))
* **core:** 足されたコメントと lint の抑制を確かめるよう促す編集後のフックを追加する [#16](https://github.com/Fukuemon/agent-harness/issues/16) ([d8e9b44](https://github.com/Fukuemon/agent-harness/commit/d8e9b44759874f69e9bb133dbb3d3db4f84e7a66))
* **core:** 運用の規約のスキル 3 つを core に移し、固有の名前を抜く [#16](https://github.com/Fukuemon/agent-harness/issues/16) ([3c48796](https://github.com/Fukuemon/agent-harness/commit/3c487964986e15a64e6e69319ec2da2e8bb59efc))
* **docs:** パッケージ docs の骨組みと docs のキーの schema を追加する [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([abb1cce](https://github.com/Fukuemon/agent-harness/commit/abb1ccef6b6aa89f463864d748e18650ce924ab4))
* **docs:** 導入のスキル setup-design-docs を追加する [#21](https://github.com/Fukuemon/agent-harness/issues/21) ([e740713](https://github.com/Fukuemon/agent-harness/commit/e7407136e8e209db01339551b6d9e53ff607edab))
* **docs:** 文書のチェック 3 つと、文書を編集した後のフックを追加する [#21](https://github.com/Fukuemon/agent-harness/issues/21) ([82bbc40](https://github.com/Fukuemon/agent-harness/commit/82bbc40b86911b418f0612311e7f10201f08b9f2))
* **docs:** 文章の規則のスキル write-prose を追加し、docs-writing を削除する [#29](https://github.com/Fukuemon/agent-harness/issues/29) ([7b709ab](https://github.com/Fukuemon/agent-harness/commit/7b709abf8d94c9fe7d12d2e35a5ec252ddc65075))
* **docs:** 文章の規則のテンプレートに、バージョンの意味の「版」を検出する規則を足す [#37](https://github.com/Fukuemon/agent-harness/issues/37) ([42b78c7](https://github.com/Fukuemon/agent-harness/commit/42b78c70bfb4a7bb64c9141ee3f4e309b2807d2b))
* **docs:** 書き方のスキル write-design-docs とテンプレートを追加する [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([bdf3d30](https://github.com/Fukuemon/agent-harness/commit/bdf3d30a2d47c066af919d749f2c8570fb2300f1))
* Node.js と pnpm の版を mise.toml に置き、CI も mise で入れる [#9](https://github.com/Fukuemon/agent-harness/issues/9) ([931a10b](https://github.com/Fukuemon/agent-harness/commit/931a10b71ffb95d310971b360d0c7aaf21410347))


### Bug Fixes

* **core:** apm の配置先を、ロックファイルの deployed_files の一覧からだけ読む [#27](https://github.com/Fukuemon/agent-harness/issues/27) ([13989a5](https://github.com/Fukuemon/agent-harness/commit/13989a5ab863b9e32bb7b44ba38968c6531a5e15))
* **core:** build-index.mjs が context/project.yml を yaml で読む [#8](https://github.com/Fukuemon/agent-harness/issues/8) ([c4043c3](https://github.com/Fukuemon/agent-harness/commit/c4043c315cb24f5dbc74b6953c91c07ecf1ef4f3))
* **core:** check-comments が Python の docstring と重複したコメントを見落とさないようにする [#16](https://github.com/Fukuemon/agent-harness/issues/16) ([e472149](https://github.com/Fukuemon/agent-harness/commit/e472149c1fd03a0d0b4f85e11e207113965b3cb7))
* **core:** Codex CLI をサブディレクトリから起動しても、編集後のフックがスクリプトを見つけるようにする [#24](https://github.com/Fukuemon/agent-harness/issues/24) ([6772bee](https://github.com/Fukuemon/agent-harness/commit/6772beef4b6cfe5ad0070079afa0c15d1f21513f))
* **core:** commitlint を実行コマンド付きで呼び、入れない利用者にも設定を残す [#34](https://github.com/Fukuemon/agent-harness/issues/34) ([849901c](https://github.com/Fukuemon/agent-harness/commit/849901c6a51dffed6c3f7274f30573331d147c75))
* **core:** core を apm で入れていないリポジトリでは、セッションの開始で apm install しない [#24](https://github.com/Fukuemon/agent-harness/issues/24) ([12ca3ca](https://github.com/Fukuemon/agent-harness/commit/12ca3cae79f76561022a632011130655f0172537))
* **core:** core をプラグインで入れたときも、post-install が導入のスクリプトを見つけるようにする [#27](https://github.com/Fukuemon/agent-harness/issues/27) ([41d7cd2](https://github.com/Fukuemon/agent-harness/commit/41d7cd28e3c08b69edbc191ebae70e7b0b99c7e7))
* **core:** frontmatter を CRLF と引用符つきの値でも読み、log.md を目次から除く [#8](https://github.com/Fukuemon/agent-harness/issues/8) ([e35d7bc](https://github.com/Fukuemon/agent-harness/commit/e35d7bcb15766b9064c413c8d10a276b3ad00130))
* **core:** marketplace から入れた別のプラグインの assets/ も写す [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([3c3f050](https://github.com/Fukuemon/agent-harness/commit/3c3f05075c9a4fc74b98e57f5389a75fe5edd3e5))
* **core:** setup.mjs が引数を省いたとき、既にある値のファイルと話題を引き継ぐ [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([d5b1f9b](https://github.com/Fukuemon/agent-harness/commit/d5b1f9becaab67230f4c0d706b7c448b25e8795e))
* **core:** setup.mjs が行の形の YAML の配列を読み、--diff で未配置のファイルを差分に数える [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([4d5774f](https://github.com/Fukuemon/agent-harness/commit/4d5774f63e7fda9a66a1a973b49ea54f47af723f))
* **core:** write-issue-pr から、開発プロセスの選択に依存するタスクの分け方の規則を削除する [#39](https://github.com/Fukuemon/agent-harness/issues/39) ([a6a4002](https://github.com/Fukuemon/agent-harness/commit/a6a4002df70c446834fdf98944e746e41b16dbf2))
* **core:** write-skill の表で、止めるフックと促すフックを分け、AGENTS.md の役割を直す [#31](https://github.com/Fukuemon/agent-harness/issues/31) ([a05d331](https://github.com/Fukuemon/agent-harness/commit/a05d33144da0fc9b00e80220fa20b81450d07dfd))
* **core:** スキルの description から YAML で読めない「: 」を除き、テストを足す [#11](https://github.com/Fukuemon/agent-harness/issues/11) ([7b074ed](https://github.com/Fukuemon/agent-harness/commit/7b074eda9adb4ce0e12614047370bc2fa761b3e6))
* **core:** セッションの開始の判定を、ロックファイルの配置先がすべてあるかに変える [#24](https://github.com/Fukuemon/agent-harness/issues/24) ([0f9d80e](https://github.com/Fukuemon/agent-harness/commit/0f9d80e61975952300fd5c69f0fa9430688aa6fc))
* **core:** タスクの接頭辞と ADR の置き場を、既定と合わせた選択の値から決める [#39](https://github.com/Fukuemon/agent-harness/issues/39) ([ffa0553](https://github.com/Fukuemon/agent-harness/commit/ffa05530b5701dbbea0130f175f6e8f02461c408))
* **core:** パッケージから消えたスキルの写しを、post-install とセッションの開始で片付ける [#32](https://github.com/Fukuemon/agent-harness/issues/32) ([334bf33](https://github.com/Fukuemon/agent-harness/commit/334bf3391670647173f47d9e2ed232eb97944e7f))
* **core:** 消えた写しを記録だけから探し、プラグインで入れた core でも片付けを動かす [#32](https://github.com/Fukuemon/agent-harness/issues/32) ([06aa024](https://github.com/Fukuemon/agent-harness/commit/06aa024d5bcee05d6d1f789a8ab327ff2f1a3dcc))
* **docs:** 参照の形のリンク、governs の行末のコメント、履歴にない verified_commit を扱う [#21](https://github.com/Fukuemon/agent-harness/issues/21) ([755d904](https://github.com/Fukuemon/agent-harness/commit/755d9040f0c23cdf2b4153d63a3c1d0e56a9119d))
* pre-commit が書き換えた目次をステージする [#8](https://github.com/Fukuemon/agent-harness/issues/8) ([d9dde7f](https://github.com/Fukuemon/agent-harness/commit/d9dde7f2ddea1efaedc811a2676706e2d060bd32))
* 文書のディレクトリに空、.、.. の区切りを使えないようにする [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([b3623e8](https://github.com/Fukuemon/agent-harness/commit/b3623e8c60b63d9d7ff7d4114288632376dce398))


### Documentation

* context の書き方の規則を write-harness-context に寄せる [#11](https://github.com/Fukuemon/agent-harness/issues/11) ([783e169](https://github.com/Fukuemon/agent-harness/commit/783e169feea4c1ca9ca515e7cf245f91affaba5c))
* **core:** context は取り決めと契約と所在、Design Doc は構成と流れをコードの隣に置くと定める [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([6863c81](https://github.com/Fukuemon/agent-harness/commit/6863c81bc889e07316cf8f09dbf35533f290a0fb))
* **core:** CONTRIBUTING のテンプレートにセマンティック バージョニングと、版を決める手段の案内を足す [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([a5da56b](https://github.com/Fukuemon/agent-harness/commit/a5da56b6f00d7ddf7a9bdf2b35dd373510b5652b))
* **core:** CONTRIBUTING のテンプレートの案内を 1 行ずつにし、process の有無の注記を消す [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([8993fb8](https://github.com/Fukuemon/agent-harness/commit/8993fb8e41181cc84221051e76a8f1771509cfcb))
* **core:** core の Design Doc を packages/core へ移し、textlint の対象に足す [#6](https://github.com/Fukuemon/agent-harness/issues/6) ([462d619](https://github.com/Fukuemon/agent-harness/commit/462d6195b26abb257a4064a8438aec6c946418f1))
* **core:** Tools and Versions の案内から、使わないツールの記述を外す [#7](https://github.com/Fukuemon/agent-harness/issues/7) ([6b6dc7e](https://github.com/Fukuemon/agent-harness/commit/6b6dc7e69e44c0eecceb4388c0e45e8f273b5cf0))
* **core:** スキル、テンプレート、schema の「版」を「バージョン」に揃える [#37](https://github.com/Fukuemon/agent-harness/issues/37) ([6cd07d1](https://github.com/Fukuemon/agent-harness/commit/6cd07d1d335796ff9780c326debc1ff0eb1f50a6))
* **core:** テンプレートの案内の語を write-harness-context と揃える [#11](https://github.com/Fukuemon/agent-harness/issues/11) ([e3c54cc](https://github.com/Fukuemon/agent-harness/commit/e3c54cc7a667f0c41ef645a93aff56ce784f1b3b))
* **core:** フックの登録を追跡し、スクリプトだけを無視する理由を書く [#27](https://github.com/Fukuemon/agent-harness/issues/27) ([1535438](https://github.com/Fukuemon/agent-harness/commit/15354385f8cb59629234f3b083175cb751235a55))
* **core:** レビューに対応したら pull request の本文を直す規則を追加する [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([509a081](https://github.com/Fukuemon/agent-harness/commit/509a08158c7fb0a5981ff66c8d152aeb1788a318))
* **core:** 不具合の form のテンプレートの「版」を「バージョン」に揃える [#38](https://github.com/Fukuemon/agent-harness/issues/38) ([4765589](https://github.com/Fukuemon/agent-harness/commit/4765589adda5918366656d3f83946a3b458067ac))
* **core:** 目次の生成の動きを Design Doc と CONTRIBUTING に書く [#8](https://github.com/Fukuemon/agent-harness/issues/8) ([5ec6e27](https://github.com/Fukuemon/agent-harness/commit/5ec6e27176cfbfe432a248f1d1e5c71b72b9497c))
* **docs:** spec の骨組みに設計、確かめ方、移す先などの 4 節を追加する [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([dbce107](https://github.com/Fukuemon/agent-harness/commit/dbce1073a6bd739f173ae2d884c0b7ce5e87941d))
* **docs:** スキルの本文の規則を write-prose から戻す [#29](https://github.com/Fukuemon/agent-harness/issues/29) ([aca5939](https://github.com/Fukuemon/agent-harness/commit/aca59392a2a7157ed590fbd5621ca9f39ba73c15))
* **docs:** どのリポジトリでも成り立つ規則を、context から write-prose へ移す [#29](https://github.com/Fukuemon/agent-harness/issues/29) ([16fa35f](https://github.com/Fukuemon/agent-harness/commit/16fa35f5bcce30ed2b5852d615fa82d9ca9d1b5f))
* **docs:** 文書の種類に PRD を足し、テンプレートの置き場とシーケンス図の規則を直す [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([30ba23b](https://github.com/Fukuemon/agent-harness/commit/30ba23b891a3cb2fc98a2d280ade32ff81581d67))
* **docs:** 機能ごとの Design Doc の書き方を別のファイルに分ける [#20](https://github.com/Fukuemon/agent-harness/issues/20) ([d504964](https://github.com/Fukuemon/agent-harness/commit/d504964ad4978c69ec4e9c2a63d7fc965dc36d3d))
* コーディングエージェントごとの対応表を context に移す ([95c8597](https://github.com/Fukuemon/agent-harness/commit/95c85975e78d6dc5e636c913b65e26e154d5e812))
* 箇条書きや表を導く文の「である」をやめ、prh で検出する [#29](https://github.com/Fukuemon/agent-harness/issues/29) ([230f517](https://github.com/Fukuemon/agent-harness/commit/230f5173dfaab29d03616e620218296592b41bb7))
* 運用の取り決めのスキルとフックを Design Doc に書き、README に対応表を足す [#16](https://github.com/Fukuemon/agent-harness/issues/16) ([9c199be](https://github.com/Fukuemon/agent-harness/commit/9c199be53977e57cdc7cd380a10751eb6b0b73a0))
* 運用の取り決めを core に置く決定を ADR-0014 に記録し、core と process の設計を直す ([2596d91](https://github.com/Fukuemon/agent-harness/commit/2596d91794ce049ef8d016a6c20461d5292e88dd))
