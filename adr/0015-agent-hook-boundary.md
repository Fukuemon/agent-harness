# ADR-0015: コーディングエージェントのフックに置くのは、その時点でモデルに行動を求めるものだけにする

## Status

承認

## Context

パッケージのチェックは、コーディングエージェントのフック、Git のフック、CI の 3 か所で動かせる。  
目次の生成のチェックを作るときに、文書を編集した後のフックにも置くかどうかが問題になった。

- 目次を読むのは、次のセッションの開始時である。書いている途中のセッションは、自分が足した文書を知っている。
- 編集後のフックは、どのファイルを編集しても動く。対象を絞るには、コーディングエージェントごとに違う入力を読む必要がある。
- Codex CLI では、プロジェクトのフックは利用者が信頼するまで動かない。
- 全体像の Design Doc は、フックは編集もコミットも拒否せず、確かめるよう促す文をコンテキストに追加するに留めると決めている。生成のように、促す文が要らない処理もある。

## Decision

次の 3 点を決めた。

- コーディングエージェントのフックに置くのは、その時点でモデルに行動を求めるものだけにする。取り返しのつかない操作の拒否、コメントを残してよいかの判断の促し、文章の指摘の修正が当たる。
- モデルの行動が要らないものと、コミットの時点で揃えば足りるものは、Git のフックと CI に置く。目次の生成と、整形が当たる。
- コーディングエージェントごとのフックの入力と発火の条件は、確認したバージョンとともに README の対応表に記録する。フックを作るときは、対象のコーディングエージェントの入力の形を確かめてから作る。

## Verification

公式の文書と openai/codex のソースで、文書を編集した後のフックの入力を確かめた。Codex CLI は rust-v0.147.0、microsoft/apm は v0.31.0 の時点である。

| コーディングエージェント | 編集後のイベント | 編集したファイルのパス |
| --- | --- | --- |
| Claude Code | `PostToolUse`。ツール名は `Edit`、`Write`、`MultiEdit` | `tool_input.file_path` |
| Codex CLI | `PostToolUse`。ツール名は `apply_patch` で、`Edit` と `Write` は別名 | ない。`tool_input.command` にパッチの本文があり、1 つのパッチに複数のファイルが入る |
| Cursor | `afterFileEdit` | `file_path` |
| GitHub Copilot | `postToolUse` | 文書にない |
| Windsurf | `post_write_code` | `tool_info.file_path` |
| Kiro | `PostFileSave` | 文書にない。コマンドの文字列に `{{filePath}}` を埋める |

- microsoft/apm は、フックのイベント名をコーディングエージェントごとに書き換えるが、matcher のツール名と入力は書き換えない。Claude Code の形で書いたフックは、Cursor と Windsurf では発火しない。
- 出典: [Claude Code の hooks reference](https://code.claude.com/docs/en/hooks)
- 出典: [Codex CLI の hooks](https://developers.openai.com/codex/hooks.md)
- 出典: [Cursor の hooks](https://cursor.com/docs/agent/hooks)
- 出典: [GitHub Copilot の hooks configuration](https://docs.github.com/en/copilot/reference/hooks-configuration)
- 出典: [Windsurf の hooks](https://docs.devin.ai/desktop/cascade/hooks)
- 出典: [Kiro の hooks](https://kiro.dev/docs/hooks/)

## Considered Options

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** モデルに行動を求めるものだけをコーディングエージェントのフックに置く | 編集のたびに動くフックが減る。コーディングエージェントごとの入力の違いを持ち込む範囲が、行動を求めるフックに限られる | 編集の直後に目次がずれた状態が残る。コミットの前に揃う |
| すべてのチェックを、編集後、pre-commit、CI の 3 か所で動かす | 動く場所が揃い、説明が単純になる | 生成のように促す文が要らない処理まで、編集のたびに動く。対象を絞るには、コーディングエージェントごとの入力を読む必要がある |
| コーディングエージェントのフックを使わず、Git のフックと CI だけにする | コーディングエージェントごとの違いを扱わない | コメントの判断のように、編集の時点でしか促せないものが失われる。ガードレールの拒否が Git のフックだけになる |

## Consequences

### Positive

- パッケージのフックを作るときに、どこに置くかの判断が 1 つの問いになる。その時点でモデルに行動を求めるかどうかである。
- 目次の生成は Git のフックと CI だけで動き、コーディングエージェントごとの入力の違いを扱わない。

### Negative

- 文書の体系のチェックには、文章の指摘のように行動を求めるものと、生成のように求めないものの両方がある。動く場所を、チェックごとに書く必要がある。
- README の対応表に、フックの入力の形の列が増える。
