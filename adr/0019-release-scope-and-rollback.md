# ADR-0019: packages/ を変えたコミットだけで版を上げ、切り戻しは新しい版で行う

## Status

承認

## Context

ADR-0007 は、release-please でタグを付けることだけを決めた。  
どのコミットで版を上げるか、どのファイルの版を書き換えるか、切り戻しをどうするかは決めていなかった。

- 利用者は、マニフェストにこのリポジトリのタグを書いて導入する。Claude Code のプラグインで入れた利用者には、`plugin.json` の `version` が変わるまで更新が届かない。
  - 出典: [Plugin manifest reference の version](https://code.claude.com/docs/en/plugins-reference#version)
- 版を持つファイルは、`packages/*/.claude-plugin/plugin.json` の 2 つと、マニフェストの例 `examples/apm.yml` の 3 つ。  
  `plugin.json` の版を変えると、`apm install` が `apm.lock.yaml` の `_local/core` と `_local/docs` の `version` も変える。
- `GITHUB_TOKEN` で作った pull request と push では、ほかの workflow が動かない。リリース用の pull request で CI が動かなくなる。
  - 出典: [Triggering a workflow from a workflow](https://docs.github.com/en/actions/using-workflows/triggering-a-workflow#triggering-a-workflow-from-a-workflow)
- 利用者のリポジトリに写したテンプレートは、利用者のファイルになる。版を戻しても、写したファイルは戻らない。

release-please 17.11.2 のソースと、作業用のブランチに対する `release-please release-pr --dry-run --target-branch <ブランチ>` で、次の点を確かめた。

- `--target-branch` を付けると、そのブランチの `release-please-config.json` と `.release-please-manifest.json` を読む。
- `extra-files` の path を `/` で始めると、対象の path の外のファイルを指せる。`json` の updater は指定したキーだけを、`generic` の updater は `x-release-please-version` の目印がある行だけを書き換える。`yaml` の updater はファイル全体を書き直すので、書式が変わる。
- マニフェストが空で `initial-version` があると、最初の版はその値になる。タグがない状態でも `0.1.0` の pull request を出力した。
- 変更履歴が空だと、リリース用の pull request を作らない。`changelog-sections` を指定しないと `docs` が隠れ、`revert` は表示される。
- マージコミットと、`git revert` の既定のメッセージ `Revert "..."` は解析できず、変更履歴にも版にも入らない。
- `docs(context)` のコミットを足したブランチでも、出力する版と変更履歴は変わらなかった。`packages/` の外だけを変えたコミットは対象から外れる。

## Decision

次の 5 点を決めた。

- release-please の対象の path を `packages` にする。
  - `packages/` の下を変えたコミットだけが版を上げる。スキルの本文を直す `docs(core)` も patch を上げる。スキルの本文は利用者に届く中身だからである。
  - `changelog-sections` は既定の値を写し、`docs` の `hidden` だけを外す。`revert` の表示は残す。
  - `include-component-in-tag: false` でタグを `v0.1.0` の形にし、変更履歴はルートの `CHANGELOG.md` に置く。
- 版を書き換えるのは、`plugin.json` の 2 つと `examples/apm.yml` にする。
  - `plugin.json` は `json` の updater で `$.version` を、`examples/apm.yml` は `generic` の updater で目印の行を書き換える。
  - ルートの `apm.yml` は、このリポジトリ自身のマニフェストで、ローカルの path を指すので書き換えない。
  - `apm.lock.yaml` は、`.github/workflows/release.yml` がリリース用の pull request のブランチで `apm install` を実行して作り直し、コミットする。
- リリース用の pull request と lock のコミットは、GitHub App のトークンで作る。`GITHUB_TOKEN` の権限は読み取りのままにする。
- 1.0 より前は、`bump-minor-pre-major` と `bump-patch-for-minor-pre-major` で、破壊的な変更で minor を、それ以外で patch を上げる。
  - 最初の版は `initial-version` で `0.1.0` にする。最初の変更履歴には、それまでに `packages/` を変えたコミットがすべて載る。
  - 1.0 に上げるのは、要求 #1〜#5 がそろい、2 つ以上の利用者のリポジトリで使って、破壊的な変更が要らなくなったときにする。
- 切り戻しは、取り消すコミットを取り込んだ新しい版で行う。タグとリリースは消さず、付け替えもしない。
  - タグは利用者との契約で、利用者のロックファイルはタグとコミットを記録している。付け替えると、同じタグで中身が変わる。
  - 取り消すコミットは `revert(<scope>): <要約>` の形で書く。`Revert "..."` のままだと、取り消しがリリースの対象にならない。

## Considered Options

版を上げるコミットの範囲の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** 対象の path を `packages` にする | 利用者に届く変更だけで版が上がる | `packages/` の外のファイルを書き換えるには、`/` で始まる path が要る |
| 対象の path をルートにする | 設定が短い | README や context の変更でも版が上がり、利用者に中身の変わらない更新が届く |
| パッケージごとに対象と版を分ける | 変えていないパッケージの版が上がらない | ADR-0007 のリポジトリ全体で 1 つの版と食い違う。タグがパッケージごとに分かれ、利用者が組み合わせを選ぶ |

最初の版を `0.1.0` にする方法の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** `initial-version` | 最初のリリースの後も設定を消さずに済む | 最初の変更履歴が長い |
| `release-as` | 版をそのまま指定できる | 最初のリリースの後に消さないと、同じ版を出し続ける |
| `bootstrap-sha` で範囲を絞る | 最初の変更履歴が短い | 範囲に表示するコミットがないと、変更履歴が空になり pull request が作られない |

切り戻しの方法の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** 新しい版で取り消す | 利用者のロックファイルが指す中身が変わらない | 取り消した版もタグとして残る |
| タグとリリースを消す | 誤った版が一覧から消える | そのタグを書いた利用者の導入が失敗する |
| タグを別のコミットへ付け替える | 利用者がマニフェストを変えずに済む | 同じタグで中身が変わり、ロックファイルのコミットと食い違う |

## Consequences

### Positive

- `packages/` の下を変えた pull request を main へ取り込むと、リリース用の pull request が更新される。マージすると、タグ、リリース、`plugin.json` の版がそろう。
- リリース用の pull request でも CI が動き、`apm.lock.yaml` とパッケージの版が合っているかを確かめる。

### Negative

- コミットの type に加え、変更したファイルが `packages/` の下かどうかで、版が上がるかが決まる。`packages/` の外の変更だけを含む pull request では、リリース用の pull request が更新されない。
- GitHub App と secrets の用意が要る。App の秘密鍵を入れ替える作業が、Owner に残る。
- `revert(<scope>):` の形は commitlint では強制していない。`Revert "..."` のまま取り込むと、取り消しが変更履歴に載らない。
