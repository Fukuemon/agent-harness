# Changelog

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
