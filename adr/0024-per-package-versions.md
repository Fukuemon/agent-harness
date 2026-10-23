# ADR-0024: パッケージごとにバージョンを上げ、e2e の kit を npm のレジストリで配る

## Status

承認

## Context

ADR-0007 と ADR-0019 で、リポジトリ全体で 1 つのバージョンにし、タグを `v<バージョン>` の形にした。1 つのパッケージだけの変更でも、全パッケージのタグが上がる。  
要求 #131 で、verification、e2e、design-system、screens、docs-site の 5 つのパッケージが足される。e2e のような変化の速いパッケージを足すと、core と docs のタグも上がり続ける。

- 利用者は、マニフェストにパッケージの path とタグを書いて導入する。タグは利用者との契約の一部で、ロックファイルはタグとコミットを記録する。
- Claude Code のプラグインで入れた利用者には、`plugin.json` の `version` が変わるまで更新が届かない。
  - 出典: [Plugin manifest reference の version](https://code.claude.com/docs/en/plugins-reference#version)
- 既存のタグは `v0.1.0` から `v0.2.8` まであり、`.release-please-manifest.json` は `packages` の 1 つのキーで `0.2.8` を持つ。パッケージ global は release-please の対象から外している。
- `.github/workflows/release.yml` は、release-please が作ったリリース用の pull request のブランチで `apm install` を実行し、`apm.lock.yaml` をコミットする。
- e2e の kit は、ブラウザのテストと録画の TypeScript のコードと、テストの書き方の lint の規則を持つ。apm はスキルとフックだけを配置するので、コードは届かない。ADR-0020 の配布の方法に、npm のレジストリはない。

release-please の文書で、次の点を確認した。

- 複数のパッケージを持つ設定では、タグの既定の形は `<component>-v<バージョン>` になる。`include-component-in-tag` を `false` にすると、`v<バージョン>` になる。
- `separate-pull-requests` の既定は `false` で、全パッケージで 1 つのリリース用の pull request を作る。題の既定は `chore: release ${branch}` になる。
- `changelog-path` はパッケージごとに指定し、既定はパッケージのディレクトリの `CHANGELOG.md` になる。
- 前のリリースは、タグの付いたリリースから探す。
  - 出典: [Manifest Driven release-please](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md)

npm の trusted publishing は、GitHub Actions の OIDC で公開し、トークンを要らなくする。

- npm CLI 11.5.1 以上、Node.js 22.14.0 以上、workflow の `id-token: write` の権限、GitHub がホストするランナーが必要。
- 公開のリポジトリから公開すると、設定を足さなくても provenance が付く。
- 信頼する発行元は、npm のパッケージの設定の画面で、リポジトリと workflow のファイル名を指定して登録する。まだ公開していないパッケージに登録できるかは、文書から読み取れなかった。
  - 出典: [Trusted publishing for npm packages](https://docs.npmjs.com/trusted-publishers)

## Decision

次の 5 点を決めた。

- release-please の `packages` を、`packages/<名前>` のパッケージごとに分ける。
  - 各パッケージに `component` としてディレクトリの名前を付け、`include-component-in-tag` を `true` にする。タグは `core-v0.2.9` のような `<名前>-v<バージョン>` の形になる。release-please の既定の形で、区切りの設定が要らない。
  - パッケージごとの `extra-files` で、そのパッケージの `.claude-plugin/plugin.json` の `$.version` を書き換える。`examples/apm.yml` は core の `extra-files` だけに入れ、目印の行は core の 1 行だけにする。`generic` の updater は、目印のある行をすべて同じバージョンで書き換えるためである。
  - 変更履歴は、パッケージごとに `packages/<名前>/CHANGELOG.md` に置く。ルートの `CHANGELOG.md` は `v0.2.8` までの記録として残し、更新しない。
  - リリース用の pull request は、`separate-pull-requests` を `false` のままにして 1 つにまとめる。pull request を分けると、どれも `apm.lock.yaml` を書き換え、1 つをマージするたびにほかの pull request の lock が衝突するためである。
  - パッケージ global は、`packages` に書かないことで対象から外す。
- 番号は、core と docs が今の番号の続きから始める。新しいパッケージは `initial-version` の `0.1.0` から始める。
  - マニフェストに `packages/core` と `packages/docs` を `0.2.8` で書く。
  - 移行のときに、Owner が `v0.2.8` と同じコミットに `core-v0.2.8` と `docs-v0.2.8` のタグとリリースを足す。release-please が各パッケージの前のリリースを見つけられるようにし、利用者がすぐに新しい形のタグを書けるようにするためである。
  - 既存の `v0.1.0` から `v0.2.8` のタグとリリースは、消さずに残す。ADR-0019 のとおり、付け替えもしない。
  - 1.0 に上げるかは、パッケージごとに判断する。2 つ以上の利用者のリポジトリで使い、破壊的な変更が要らなくなったパッケージから上げる。
- 利用者のマニフェストには、パッケージごとにそのパッケージのタグを書く。移行の案内は、README の Installation と Update の節と、ルートの `CHANGELOG.md` の冒頭に置く。
  - 既存の `v0.2.8` を書いたマニフェストは、そのまま動く。新しい形へは、そのパッケージを次に上げるときに書き換えればよい。
  - プラグインのマーケットプレイスは、リポジトリ全体を 1 つの ref で取得する。ref には core のタグを書くよう案内する。そのコミットの時点の各パッケージが、それぞれの `plugin.json` のバージョンで入る。
- e2e の kit は、`packages/e2e/kit/` に置き、npm のレジストリに `@agent-harness/e2e-kit` の名前で公開する。lint の規則も、同じ npm のパッケージに入れる。
  - scope の `@agent-harness` は製品の名前で、利用者が製品の名前で探せる。scope を使うには、npm に `agent-harness` の組織を作る。名前を取れなければ、この ADR を置き換えて名前を決め直す。
  - 公開は、`.github/workflows/release.yml` の中の、e2e のリリースができたときだけ動くジョブで行う。そのジョブだけに `id-token: write` を与え、npm のトークンを secrets に置かない。信頼する発行元には `release.yml` を登録する。
  - まだ公開していないパッケージに信頼する発行元を登録できないときは、最初の 1 回だけ、Owner が手元から 2 要素認証で公開する。この場合も、トークンを secrets に置かない。
- e2e のスキルと kit は、同じ component で同じバージョンにし、同じタグ `e2e-v<バージョン>` で公開する。
  - e2e の `extra-files` で、`kit/package.json` の `$.version` も書き換える。
  - e2e の導入のスキルは、配置された e2e の `plugin.json` の `version` を読み、同じバージョンの kit を入れる。スキルの本文にバージョンの範囲を書いて保守せずに済む。

移行後の `apm.yml` の書き方は、次のとおり。

```yaml
# 移行前
dependencies:
  apm:
    - Fukuemon/agent-harness/packages/core#v0.2.8
    - Fukuemon/agent-harness/packages/docs#v0.2.8

# 移行後
dependencies:
  apm:
    - Fukuemon/agent-harness/packages/core#core-v0.2.9
    - Fukuemon/agent-harness/packages/docs#docs-v0.2.8
    - Fukuemon/agent-harness/packages/e2e#e2e-v0.1.0
```

ADR-0007 の「最初は、リポジトリ全体で 1 つのバージョンにする」の点と、ADR-0009 の「1 つのパッケージの変更でも、全パッケージのタグが上がる」の点を、この ADR で置き換える。  
ADR-0019 のうち、対象の path を `packages` の 1 つにする点、タグを `v<バージョン>` の形にし変更履歴をルートに置く点、書き換えるファイルの点、1.0 に上げる条件の点を、この ADR で置き換える。`docs` の表示、GitHub App のトークン、1.0 より前の上げ方、切り戻しの方法は ADR-0019 のまま変えない。  
ADR-0020 の決定は変えない。コードを届ける方法として、npm のレジストリを足す。

release-please の設定、release workflow、npm の公開のジョブ、README と CONTRIBUTING.md と context の書き換えは、この ADR の後の実装のタスクで行う。

## Considered Options

バージョンの単位の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** パッケージごとに上げる | 変えていないパッケージのタグとバージョンが上がらない。プラグインの利用者にも、変えたパッケージの更新だけが届く | 利用者はパッケージごとにタグを選ぶ。組み合わせの互換は、パッケージ同士が依存しないことで保つ |
| 全体で 1 つのまま | 利用者は 1 つのタグを全パッケージに書ける | パッケージが 7 つになると、1 つの変更で 6 つのパッケージに中身の変わらない更新が届く |
| `linked-versions` で全パッケージの番号をそろえる | 番号を見れば同じ時点の組み合わせと分かる | 変えていないパッケージのタグも上がり、全体で 1 つのままと同じ弱みが残る |

タグの形の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** `<名前>-v<バージョン>` | release-please が何も指定しないときの形で、区切りの設定が要らない | 既存の `v<バージョン>` と形が変わる |
| `<名前>/v<バージョン>` | タグの一覧がパッケージごとに階層で並ぶ | 区切りの設定が要る。`/` を含む ref をマニフェストの書式が受け付けるかを確認していない |
| `v<バージョン>` のまま、パッケージの名前を外す | 利用者の書き方が変わらない | パッケージごとに番号が違うと、同じタグが衝突する |

リリース用の pull request の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** 1 つにまとめる | lock を作り直す手順が今のまま使える。マージの順で lock が衝突しない | 1 つのパッケージだけを先に出すには、ほかの変更が入るのを待つか、まとめて出す |
| パッケージごとに分ける | パッケージごとに出す時期を選べる | どの pull request も `apm.lock.yaml` を書き換え、マージのたびに残りが衝突する |

既存のタグからの移行の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** `v0.2.8` と同じコミットに `<名前>-v0.2.8` を足す | release-please が前のリリースを見つけられる。利用者は全パッケージをすぐに新しい形で書ける | Owner の手作業が 1 度要る |
| `bootstrap-sha` で前のリリースのコミットを指定する | 手作業が要らない | 変えていないパッケージは、次に上げるまで新しい形のタグがない |

npm のパッケージの名前の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** `@agent-harness/e2e-kit` | 製品の名前で探せる。scope の中の名前は衝突しない | npm に `agent-harness` の組織が要り、その名前を取れるかを確認していない |
| `@fukuemon/e2e-kit` | リポジトリの owner と対応が取れる | npm に `fukuemon` のユーザーか組織が要る。製品の名前で探せない |
| scope のない `agent-harness-e2e-kit` | npm の組織が要らない | 名前が長い。似た名前のパッケージと見分けにくい |

スキルと kit のバージョンの合わせ方の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** 同じ component で同じバージョンにし、同じタグで公開する | 合う組み合わせが番号だけで分かる。範囲を保守しない | kit だけの変更でもスキルのバージョンが上がり、その逆も起きる |
| 別の component にし、スキルの本文で kit の範囲を示す | スキルと kit を別の時期に出せる | 範囲を手で保守し、更新を忘れると合わない組み合わせが入る |

## Consequences

### Positive

- 1 つのパッケージだけを変えたリリースで、ほかのパッケージのタグと `plugin.json` のバージョンが上がらない。
- 利用者は、パッケージごとの `CHANGELOG.md` で、入れたパッケージの変更だけを読める。
- e2e の kit を、npm のトークンを secrets に置かずに公開できる。公開した kit には provenance が付く。

### Negative

- 利用者のマニフェストには、パッケージごとに違うタグを書く。どのパッケージの新しいタグがあるかを、パッケージごとに確認する必要がある。
- 1 つのコミットが 2 つのパッケージを変えると、両方の変更履歴に載り、両方のバージョンが上がる。
- プラグインのマーケットプレイスの ref は 1 つなので、パッケージごとに違う時点を選べない。
- npm の公開の前に、Owner が npm のユーザーか組織と、信頼する発行元を用意する。
- release-please が、手で足した `<名前>-v0.2.8` のリリースを前のリリースとして読むかは、実装のタスクで `--dry-run` で確認する。読まないときは、`bootstrap-sha` に切り替える。
