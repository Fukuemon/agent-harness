# ADR-0007: main と作業用のブランチだけで運用し、release-please でタグを付ける

## Status

承認

## Context

利用者は、パッケージマネージャーのマニフェストに、このリポジトリのタグを書いてバージョンを固定する。  
タグは、利用者との契約の一部である。付け方を運用の都合で変えると、利用者のマニフェストが影響を受ける。

このリポジトリには、デプロイする環境がない。複数のバージョンを同時に保守する予定もない。  
コミットメッセージは、Conventional Commits の形に自動チェックで固定している。

## Decision

次の 4 点を決めた。

- ブランチは、main と、issue ごとの作業用のブランチだけにする。
  - main へは、変更の依頼を通して取り込む。
  - 統合用のブランチと、要件ごとのブランチは置かない。
- バージョンは、セマンティック バージョニングに従う。最初は、リポジトリ全体で 1 つのバージョンにする。
- バージョンの決定とタグ付けには、release-please を使う。
  - コミットメッセージから次のバージョンを決め、リリース用の変更の依頼、タグ、GitHub のリリースを作る。
  - [release-please](https://github.com/googleapis/release-please)
- これは、このリポジトリ自身の選択である。利用者のブランチ運用と、バージョンの付け方は、利用者が決める。
  - 検証用や本番用の環境を持つ製品では、統合用のブランチや要件ごとのブランチが合う場合がある。
  - npm のパッケージを複数持つリポジトリでは、changesets が合う場合がある。

## Considered Options

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** main と作業用のブランチ、release-please | ブランチが少ない。コミットメッセージを、そのままバージョンの元にできる | コミットメッセージの type を誤ると、バージョンも誤る |
| Git Flow。main、統合用のブランチ、作業用のブランチ | 環境ごとの動作の確認や、複数のバージョンの保守に合う | このリポジトリには環境がなく、長く生きるブランチが増えるだけになる |
| changesets | 変更の意図を、コミットより詳しく書ける | 変更のたびに専用のファイルを書く。コミットメッセージと内容が重なる。パッケージごとに `package.json` が要る |
| 手でタグを付ける | 仕組みが要らない | 付け忘れと、バージョンの決め方のぶれが起きる |

- Git Flow の提唱者は、明示的にバージョンを付けるソフトウェアや、複数のバージョンを保守する場合に合うと書いている。
  - [A successful Git branching model](https://nvie.com/posts/a-successful-git-branching-model/) — 冒頭の「Note of reflection」
- changesets は、バージョンをコミットメッセージからではなく、専用のファイルから決める。npm 以外の形式は `package.json` を置いて扱う。
  - [Intro to using changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
  - [Versioning apps](https://github.com/changesets/changesets/blob/main/docs/versioning-apps.md)

## Consequences

### Positive

- 利用者は、タグを見れば変更の大きさが分かる。
- リリースの作業が、変更の依頼を 1 つ取り込むだけになる。

### Negative

- バージョンの正しさが、コミットメッセージの type の正しさに依存する。
- マニフェストの中のバージョンの項目を、release-please に更新させる設定が要る。できるかどうかは確かめていない。
- リポジトリ全体で 1 つのバージョンにするため、1 つのパッケージだけの変更でも、全体のバージョンが上がる。
