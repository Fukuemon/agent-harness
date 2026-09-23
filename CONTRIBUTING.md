# 開発の準備

必要なものは、Node.js の 22.12 以上、pnpm、microsoft/apm の 3 つである。

```sh
pnpm install
apm install
```

- `pnpm install` は、Git のフックも有効にする。
- `apm install` は、`apm.yml` に書いたスキルを配置する。配置先と直し方は [スキルの置き場所](context/skills.md) に書いてある。
- microsoft/apm の導入の方法は、公式の案内に従う。
  - 出典: [microsoft/apm](https://github.com/microsoft/apm)
- 常設せずに試す場合は、uv の一時実行が使える。

```sh
uvx --from apm-cli apm install
```

## 文書を直すとき

```sh
pnpm lint:text
```

対象は、ルート、`adr/`、`design/`、`context/`、`skills/` の Markdown である。  
書き方の規則は `skills/docs-writing/SKILL.md` にある。

## コミットするとき

- コミットの前に、ステージした Markdown を textlint でチェックする。
- コミットメッセージは commitlint でチェックする。Conventional Commits の形式に加えて、要約の末尾の句点と、AI の帰属表示を禁止している。
- メッセージの書き方と変更の分け方は `skills/git-commit/SKILL.md` にある。
- ブランチの切り方と main への取り込み方は、[ブランチとリリース](#ブランチとリリース)の節にある。

## ブランチとリリース

ブランチは、main と、issue ごとの作業用のブランチだけにする。

- 設計が固まり、タスクへの分解と実装に移るまでは、main へ直接コミットして push する。
- 実装に移った後は、main へは変更の依頼を通して取り込む。

バージョンは、セマンティック バージョニングに従う。リポジトリ全体で 1 つのバージョンにする。  
バージョンの決定とタグ付けには release-please を使う。コミットメッセージから次のバージョンを決め、リリース用の変更の依頼を作る。

- ADR-0007: [main と作業用のブランチだけで運用し、release-please でタグを付ける](adr/0007-branch-and-release.md)

次の図は、実装に移った後のブランチの構成を示す。main は常にリリースできる状態に保つ。作業用のブランチは main から切り、変更の依頼で main へ戻す。タグは、release-please が main のコミットに付ける。

```mermaid
gitGraph
    commit id: "v0.1.0" tag: "v0.1.0"
    branch "issue-42"
    checkout "issue-42"
    commit id: "42-1"
    checkout main
    branch "issue-43"
    checkout "issue-43"
    commit id: "43-1"
    commit id: "43-2"
    checkout main
    merge "issue-42" id: "PR #42"
    checkout "issue-43"
    commit id: "43-3"
    checkout main
    merge "issue-43" id: "PR #43"
    commit id: "release-please" tag: "v0.2.0"
```

これは、このリポジトリ自身の選択である。利用者のブランチ運用と、バージョンの付け方は、利用者が決める。
