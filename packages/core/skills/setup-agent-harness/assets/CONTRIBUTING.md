# 開発の準備

<!-- 必要なランタイムとツールの名前と版、最初に実行するコマンドを書く。手順は 1 度覚えれば済むものだけにし、繰り返し参照する規約は context/ へリンクする -->

## 文書を直すとき

<!-- 文書のチェックの実行方法を書く。パッケージ docs を入れていれば、そのチェックのコマンド -->

## コミットするとき

<!-- コミットの前に動くチェックと、その直し方を書く -->

- 変更の分け方とメッセージの書き方は、スキル git-commit に従う。

<!-- パッケージ process を入れていなければ、上の行を消して、ここに規則を書く -->

## ブランチとリリース

<!-- 次は既定の運用である。運用が違えば、本文と図を書き換える。保護するブランチの名前は context/project.yml の guardrails.protected_branches と揃える -->

ブランチは、`main`、`develop`、issue ごとの作業用のブランチにする。

- `main` はリリース済みの状態を指す。`develop` は次のリリースに向けて変更を集める。
- 作業用のブランチは `develop` から切る。名前は `feature/<issue 番号>` にし、不具合は `fix/<issue 番号>` にする。`develop` へは、pull request を通して取り込む。
- リリースは、`develop` を `main` へ pull request で取り込み、`main` のコミットにタグを付ける。バージョンはセマンティック バージョニングに従う。
- リリース後の緊急の修正は、`main` から `hotfix/<issue 番号>` を切り、`main` と `develop` の両方へ取り込む。
- `main` と `develop` へ直接コミットしてよいかは、`context/project.yml` の `guardrails.protected_branches.direct_commit` で宣言する。

<!-- 次のバージョンを何から決めるかを書く。コミットメッセージから決めるなら release-please、変更ごとの記述から決めるなら changesets が使える。パッケージ process を入れていれば、リリースのプロセスがこの手順を持つ -->

```mermaid
gitGraph
    commit id: "v1.0.0" tag: "v1.0.0"
    branch develop
    checkout develop
    commit id: "dev-1"
    branch "feature/12"
    checkout "feature/12"
    commit id: "12-1"
    checkout develop
    branch "fix/13"
    checkout "fix/13"
    commit id: "13-1"
    checkout develop
    merge "fix/13" id: "PR #13"
    checkout "feature/12"
    commit id: "12-2"
    checkout develop
    merge "feature/12" id: "PR #12"
    checkout main
    merge develop id: "release" tag: "v1.1.0"
```

## issue と pull request

- 作業は issue から始める。pull request は 1 つの issue に対応させる。
- 題と本文の書き方は、スキル issue-pr-writing に従う。

<!-- パッケージ process を入れていなければ、上の行を消して、ここに規則を書く -->
