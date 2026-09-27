---
type: context
title: 基盤と運用
description: このリポジトリが動く場所、配布の条件、正常の判断、切り戻し、秘密情報の方針。リリースの手段は未定
status: draft
---

# 基盤と運用

## Environments

- デプロイする環境はない。動く場所は、GitHub Actions と、パッケージを入れた利用者のリポジトリの 2 つである。
- 利用者のリポジトリでは、パッケージマネージャーが `packages/` の中身を配置する。配置の形は [全体像の Interfaces](../design/DesignDoc.md#interfaces) にある。

## Deployment Conditions

- 利用者への配布は、main のタグである。タグを付ける手段（release-please か changesets）は未定。
- main へは pull request でだけ取り込む。CI が通り、レビューの指摘に対応していることが条件である。手順は [CONTRIBUTING.md](../CONTRIBUTING.md) にある。

## Health and Monitoring

- 正常の判断は、CI の結果だけである。監視とログはない。

## Rollback

- 未定。タグを付ける手段を決めてから書く。

## Secrets

- 秘密情報はない。CI は、リポジトリの読み取り以外の権限を使わない。
- 公開しない作業メモは `.ai-out/` に置き、Git で追跡しない。
