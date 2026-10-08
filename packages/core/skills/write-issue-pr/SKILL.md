---
name: write-issue-pr
description: issue を起票するとき、pull request を書くとき、レビューのコメントに返信するときに使う。題と本文の書き方、リンクの示し方、起票前の確認を定める。コミットの作法は write-commit にある。
---

# write-issue-pr

form と雛形は、このスキルの `assets/.github/` と `assets/.gitlab/` にある。導入のスキルが、`context/project.yml` の `hosting` に合う一方を利用者のリポジトリへ写す。ここには、節に何を書くかの判断だけを書く。  
規則は `hosting: github` の呼び方で書く。`hosting` が `gitlab` のリポジトリでは、次のように読み替える。

- pull request は merge request、Draft の pull request は Draft の merge request と読む。
- form は `.gitlab/issue_templates/` の雛形と読む。種類のラベルは、雛形の末尾のクイックアクション `/label ~"type:*"` が付ける。
- sub-issue は、task の雛形の「親の要求」欄に番号を書き、親の要求と関連する issue のリンクで結ぶ。
- `Closes #<番号>` はそのまま使う。既定のブランチへのマージで issue が閉じる点は同じである。

共通の規則はこの本文にある。作業に応じて、次の 1 つだけを開く。

- issue を起票するときは [references/issue.md](references/issue.md)
- pull request を書くときは [references/pull-request.md](references/pull-request.md)

## 共通

- 題は、接頭辞と、完了したときにどうなっているかの 1 文で書く。pull request の題は、対応する issue の題と同じにする。
- 文書と ADR は、パスではなくホスティングサービスの URL で示し、節のアンカーまで付ける。issue と pull request の本文ではパスがリンクにならない。
- 起票の前に、本文を `.ai-out/issues/` か `.ai-out/prs/` にファイルとして置き、利用者の確認を取る。
  - 確認を取る前に、CONTRIBUTING.md の「文書を直すとき」にある文書のチェックを、対象を下書きのファイルに替えて実行する。下書きの置き場はチェックの対象から外れているので、実行しないと指摘が本文に残る。CONTRIBUTING.md に文書のチェックがなければ、実行しない。
  - 語そのものを話題にする箇所が指摘されたら、言い換えずに、その語をコードスパンで囲む。
- コミットのハッシュ、issue と pull request の番号、URL は、コードスパンで囲まない。囲むとホスティングサービスがリンクにしない。
- コミットのハッシュの直前には半角スペースを置く。「。」や「（」の直後に続けるとリンクにならない。「コミット e35d7bc で」のように書く。
- レビューのコメントと返信も、本文と同じ規則で書く。1 段落は 3 文までにし、理由が複数あれば箇条書きにする。改行のない長い段落は読みにくい。
