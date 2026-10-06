---
name: create-worktrees
description: 1 つか、一緒に扱う複数のリポジトリに、同じブランチの worktree を worktrunk（wt）でまとめて作り、まとめて消す。「worktree を作って」「この issue の作業場所を用意して」「worktree を片付けて」で読み込む。
---

# create-worktrees

- worktree は worktrunk の `wt` で作り、消す。置き場所は worktrunk のユーザー設定の `worktree-path` が決め、`<repo>/.wt/<branch>`（ブランチ名の `/` は `-` になる）になる。`git worktree add` を直接使うと、置き場所から外れる。
- 作る前に `wt config show` で `worktree-path` を確かめる。ユーザー設定が無いと、worktrunk の既定のリポジトリの隣（`../<repo>.<branch>`）に作られる。設定が無ければ作らず、利用者に伝える。
- `.wt/` の下を手で消さない。
- `wt` はシェルの関数として cd も行う。エージェントのシェルでは `command wt` で本体を呼び、`--no-cd` を付ける。

## 対象とブランチを決める

- 一緒に扱うリポジトリの組、ブランチの名前の規則、起点のブランチは、各リポジトリの AGENTS.md と context に従い、なければ利用者に尋ねる。推測でリポジトリを足さない。
- 依頼から明らかに触らないリポジトリは、外した組を第 1 候補にして尋ねる。文書を触らない仮実装なら、文書のリポジトリを外す。
- リポジトリのパスは、ghq があれば `ghq list` で探す。同じ名前が複数のホストにあるときは、どれを使うかを利用者に確かめる。
- 起点の指定がなければ `origin/HEAD` が指すブランチを使う。作る前に各リポジトリで `git fetch origin` を実行する。

## 作る

- ブランチがローカルか origin にある: `command wt switch <branch> --no-cd`。
- ブランチがない: `command wt switch --create <branch> --base origin/<起点> --no-cd`。`--base` を省くと、ローカルの既定のブランチから切られる。ローカルが origin より遅れていたり、未 push のコミットを持っていたりすると、それを含む。
- 同じブランチの worktree が既にあれば、作らずにそれを返す。
- 依存の導入やローカルの設定の複製は、各リポジトリの worktrunk の hook（`.config/wt.toml`）に任せる。hook の承認を求められたら、利用者に確かめてから `-y` を付ける。
- 環境の起動と切り替えは扱わない。各リポジトリの手順に従う。

## 消す

消す前に、リポジトリごとに次を利用者に示す。

- worktree のパス
- 未コミットの変更の件数（`git -C <worktree> status --porcelain`）
- 起点に含まれていないコミットの数（`git -C <worktree> log --oneline origin/<起点>..HEAD`）
- origin へ push 済みか

判断の基準は次のとおり。

- 未コミットの変更か、起点に含まれていないコミットが 1 件でもあれば、消さない。「コミットして push してから消す」「退避してから消す」「消さない」のどれにするかを尋ねる。
  - squash で取り込まれたブランチのコミットは、起点に含まれない。取り込み済みかを利用者に確かめる。
- すべて 0 件なら、利用者に確かめてから `command wt remove <branch> --foreground` を実行する。ブランチは、取り込み済みのときだけ一緒に消える。ブランチを残すときは `--no-delete-branch` を付ける。
- `--foreground` を付けないと、削除はバックグラウンドで進み、終わりと失敗が分からない。
- `-f`（未コミットの変更ごと消す）と `-D`（取り込まれていないブランチを消す）は、push していない作業を戻せなくする。利用者が明示したときだけ使う。
