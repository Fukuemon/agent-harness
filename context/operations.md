---
type: context
title: 基盤と運用
description: このリポジトリが動く場所、配布の条件、正常の判断、切り戻し、秘密情報の方針
status: stable
---

# 基盤と運用

## Environments

- デプロイする環境はない。動く場所は、GitHub Actions と、パッケージを入れた利用者のリポジトリの 2 つである。
- 利用者のリポジトリでは、パッケージマネージャーが `packages/` の中身を配置する。配置の形は [全体像の Interfaces](../design/DesignDoc.md#interfaces) にある。

## Deployment Conditions

- 利用者への配布は、main に付けたタグ `v<バージョン>` と、GitHub のリリースである。
- タグとリリースは release-please が作る。main へ push するたびに `.github/workflows/release.yml` がリリース用の pull request を作るか更新し、その pull request をマージするとタグとリリースができる。
  - ADR-0019: [packages/ を変えたコミットだけでバージョンを上げ、切り戻しは新しいバージョンで行う](../adr/0019-release-scope-and-rollback.md)
- バージョンが上がるのは、`packages/` の下を変えたコミットを取り込んだときだけ。どの変更で minor を上げるかは [CONTRIBUTING.md](../CONTRIBUTING.md#ブランチとリリース) にある。
- リリース用の pull request は、`plugin.json`、`examples/apm.yml`、`apm.lock.yaml` のバージョンと、`CHANGELOG.md` を書き換える。マージの条件は、ほかの pull request と同じく CI が通ることである。
- main へは pull request でだけ取り込む。CI が通り、レビューの指摘に対応していることが条件である。手順は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。

## Health and Monitoring

- 正常の判断は、CI の結果だけである。監視とログはない。

## Rollback

- 切り戻しは、取り消すコミットを main へ取り込み、新しいバージョンとして出す。タグとリリースは消さず、別のコミットへ付け替えもしない。
- 取り消すコミットは `revert(<scope>): <要約>` の形で書く。`git revert` の既定のメッセージ `Revert "..."` は release-please が解析できず、バージョンが上がらない。
- 利用者のリポジトリに写したテンプレートは、バージョンを戻しても戻らない。利用者が `setup.mjs --diff` で差分を見て、手で直す。

## Secrets

- 秘密情報は、GitHub App の Client ID と秘密鍵だけ。GitHub の secrets の `RELEASE_APP_CLIENT_ID` と `RELEASE_APP_PRIVATE_KEY` に置く。
- 使うのは `.github/workflows/release.yml` だけ。リリース用の pull request を作り、そのブランチへ `apm.lock.yaml` をコミットするトークンを発行する。
- App の権限は、このリポジトリの Contents と Pull requests への書き込みだけにする。
- `GITHUB_TOKEN` は、どの workflow でもリポジトリの読み取りだけに使う。
- 値は、ファイルとコミットに書かない。公開しない作業メモは `.ai-out/` に置き、Git で追跡しない。
