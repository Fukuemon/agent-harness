---
name: delegate-orca-workers
description: Orca で、作業を別のセッションに渡すとき、ワーカーを配って取り込みまで回すとき、ワーカーの端末を監視するときの、この端末の取り決めと監視のスクリプト。playbook の delegate-work、coordinate-workers、bound-every-wait を Orca で進めるときと、「セッションを移譲して」「ワーカーを配って」「ワーカーを監視して」で読み込む。
---

# delegate-orca-workers

playbook の delegate-work、coordinate-workers、bound-every-wait は、別のセッションを立ち上げる手段、端末を読む手段、外部の待ちを、ツールに依らない語で書く。  
この端末では、その手段に Orca を使う。  
ここには、Orca のスキル orca-cli と orchestration が持たない、この端末の取り決めと、運用で分かった誤りやすい点だけを書く。

- Orca のコマンドを使う前に、`orca skills get orca-cli` と `orca skills get orchestration` で、入っている Orca に合う手引きを読む。手引きにないフラグは、サブコマンドの `--help` で確認する。
- このスキルが手引きと食い違うときは、手引きに従い、このスキルを fix-global-harness の手順で直す。

## worktree を wt で作ってから Orca に渡す

- `orca worktree create` は、何も指定しないと Orca の置き場所（`.git/wt/` の下）に worktree を作る。この端末の置き場所 `<repo>/.wt/<branch>` から外れるので、worktree を作るためには使わない。
- worktree はスキル create-worktrees で `wt` で作り、絶対パスを Orca に渡す。丸ごと渡すセッション（delegate-work）は 1 行目、監視するワーカー（coordinate-workers）は 2 行目で起動する。

  ```sh
  orca agent launch --agent <id> --worktree path:<worktree の絶対パス> --prompt "<…>" --json
  orca orchestration worker-start --spec "<…>" --worktree path:<worktree の絶対パス> --agent <id> --json
  ```

- `--prompt` と `--spec` には、delegate-work が受け取る側に渡す絶対パス（ワーカーへの指示と、親の引き継ぎのメモ）と、それを読んで従うことを書く。
- wt で作った worktree が `orca worktree list --repo id:<repoId> --json` に出ないときは、次のコマンドで表示してから渡す。

  ```sh
  orca repo set --repo id:<repoId> --external-worktree-visibility show --json
  ```

## 送った入力が入ったかを画面で確認する

- 動いているセッションへの入力は、`orca terminal send --terminal <handle> --text "<…>" --enter --wait-submit <秒> --json` で送る。
- receipt の `accepted: true` は、入力を受け付けたことだけを示す。turn が始まったかは、`--wait-submit` で待った receipt の段階（`turn_started`）で見る。
- Enter が入らず、入力欄に文が残ることがある。送った後に `orca terminal read --terminal <handle> --json` を読む。
  - 入力欄に残った文は `tail` に出ず、`draft` に出る。`draft` が null でなければ、文が残っている。
  - `draft` がない端末では、`--screen` を付けて読み、画面の入力欄で見る。
  - 文が残っていれば、`--text` を付けずに `--enter` だけを送る。文を送り直すと、同じ指示が 2 回入る。
- 送信が途中で失敗したときは、receipt にある `--retry-request <id>` を付けて、同じコマンドを流し直す。

## ワーカーの端末を監視する

coordinate-workers で、上限を過ぎても完了がないワーカーの様子を端末で見るときは、このスキルの `scripts/watch-orca-terminal.mjs` を使う。

- 監視の前に、起動の receipt の `outcome.kind` を見る。`terminal` なら、このスクリプトで読める。
  - `structured`（chat で起動した）なら端末がなく、`orca terminal` では読めない。orchestration で配ったワーカーは、`orca orchestration worker-read --dispatch <id> --source auto --json` で読む。
- 端末の handle は、receipt から取る。`orca agent launch` は `result.outcome.handle`、`orca worktree create --agent` は `result.launch.outcome.handle` にある。見つからなければ `orca terminal list --json` で取る。

```sh
node {このスキルのディレクトリ}/scripts/watch-orca-terminal.mjs <handle> [--interval <秒>]
```

- 終わらないスクリプトなので、バックグラウンドで流し、出た行を読む。Claude Code では Monitor で流すと、1 行ごとに通知が届く。
  - Monitor の `timeout_ms` の既定は 5 分なので、上限の 1800000（30 分）を渡す。止まったら流し直す。
  - 流し直すと状態が初めからになり、続いている長いコマンドの LONGCMD がもう一度出る。
- HEREDOC と LONGCMD は、Claude Code の端末の、実行中のコマンドの見出し（`Running <説明> · 3m 31s` と、その下の `⎿  $ <コマンド>`）で判定する。Claude Code 2.1.310 で確認した。
  - 見出しもコマンドの本文も出ない表示（Codex CLI のワーカー、終わって `Ran 3 shell commands` に畳んだ表示）では出ない。IDLE と STATUS で見る。
- 間隔の既定は 60 秒。分の閾値は、間隔から読み取りの回数に直して数える。
- 出た行ごとに、次のとおり扱う。
  - `STATUS <状態>`: 端末が running でなくなった。完了の通知か、親の引き継ぎのメモの「進み具合」に足された行があるかを見る。なければ、端末を読んで終わり方を確認する。
  - `HEREDOC`: heredoc を含むコマンドが 3 分を超えた。判定は表示の文字列に依るので、画面で実行中のコマンドが heredoc かを確認する。heredoc なら止まっていると見て、ワーカーに中断させ、スクリプトをファイルに書いてから流し直すよう送る。
  - `LIMIT <行>`: 利用の上限に当たった。行にある再開の時刻を、coordinate-workers のとおり引き継ぎのメモの「進み具合」に書き、ほかの作業を進める。
  - `LONGCMD <分>m`: シェルのコマンドが 8 分を超えた。画面でコマンドを読み、終わる見込みのないものなら、ワーカーに状態を尋ねる。
  - `IDLE <分> <末尾の行>`: 画面が 4 分変わらない。サブエージェントかバックグラウンドのシェルを待つ間は 20 分。画面を読み、入力や確認を待っていないかを見る。
  - `READFAIL <理由>`: 端末を読めない。`terminal_handle_stale` なら、`orca terminal list --json` で handle を引き直し、古い handle の監視を止める。
- 終了コードが 1 なら、引数が誤っているか、`orca` を起動できない。`ORCA_CLI_COMMAND` を渡すときは、実行ファイルのパスだけにする。

## 外部の待ちの上限

bound-every-wait の上限は、この端末では次のとおり。

- Codex の自動レビュー: 20 分。1 分ごとに、pull request の会話のコメントのうち `codex-review-state` を含むものを読む。`code_review.commit_sha` が head と同じで、`status` が `completed` か `failed` なら終わり。

  ```sh
  gh api --paginate repos/<owner>/<repo>/issues/<番号>/comments --jq '.[] | select(.body | test("codex-review-state")) | .body | capture("codex-review-state:v1 (?<s>\\{.*\\}) -->").s | fromjson | .code_review | "\(.commit_sha) \(.status)"'
  ```

  - push の後は、pull request に `@codex review` とコメントして頼み直す。
- `orca terminal wait --for tui-idle` と `orca orchestration check --wait` には、`--timeout-ms` に上限を渡す。上限より長い値を渡さない。

## 取り込みと片付けを別のコマンドにする

coordinate-workers の取り込み、取り込んだ状態の確認、片付けは、次の順に、1 つずつ別のコマンドで流す。`;` で 1 行につながない。取り込みが失敗しても、片付けが動く。

1. リポジトリの CONTRIBUTING.md のマージの方法で、`gh pr merge` を 1 つのコマンドで流す。
2. `gh pr view <番号> --json state` で `MERGED` を確認する。
3. マージ先の CI の結果を見る。
4. スキル create-worktrees で、worktree とブランチを消す。
