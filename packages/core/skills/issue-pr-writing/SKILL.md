---
name: issue-pr-writing
description: issue を起票するとき、pull request を書くとき、レビューのコメントに返信するときに使う。題と本文の書き方、リンクの示し方、起票前の確認を定める。コミットの作法は git-commit にある。
---

# issue-pr-writing

form と雛形は、このスキルの `assets/.github/` にあり、導入のスキルが利用者のリポジトリへ写す。ここには、節に何を書くかの判断だけを書く。  
共通の規則はこの本文にある。作業に応じて、次の 1 つだけを開く。

- issue を起票するときは [references/issue.md](references/issue.md)
- pull request を書くときは [references/pull-request.md](references/pull-request.md)

## 共通

- 題は、接頭辞と、完了したときにどうなっているかの 1 文で書く。pull request の題は、対応する issue の題と同じにする。
- 文書と ADR は、パスではなくホスティングサービスの URL で示し、節のアンカーまで付ける。issue と pull request の本文ではパスがリンクにならない。
- 起票の前に、本文を `.ai-out/issues/` か `.ai-out/prs/` にファイルとして置き、利用者の確認を取る。
- コミットのハッシュ、issue と pull request の番号、URL は、コードスパンで囲まない。囲むとホスティングサービスがリンクにしない。
- コミットのハッシュの直前には半角スペースを置く。「。」や「（」の直後に続けるとリンクにならない。「コミット e35d7bc で」のように書く。
- レビューのコメントと返信も、本文と同じ規則で書く。1 段落は 3 文までにし、理由が複数あれば箇条書きにする。改行のない長い段落は読みにくい。
