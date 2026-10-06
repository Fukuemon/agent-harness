---
type: context
title: コーディングエージェントごとの対応
description: コーディングエージェントごとのスキルの配置先、フックの入力と実行の条件、プラグインで入れたときの条件、確認したバージョン。パッケージの本文に書かない名前ごとの違いは、ここだけが持つ
status: stable
---

# コーディングエージェントごとの対応

パッケージのスキルとフックは、ホスティングサービスとコーディングエージェントの名前を持たない。名前ごとの違いは、この文書だけが持つ。  
フックを作るときは、対象のコーディングエージェントの入力の形と実行の条件を、この文書で確かめる。

## スキルとフックの入力

| コーディングエージェント | スキルの配置先 | 編集後のフックの入力 | 確認したバージョン |
| --- | --- | --- | --- |
| Claude Code | `.claude/skills/` | `tool_input` の `file_path` と `new_string`、`content`、`edits` | 2.1.283 |
| Codex CLI | `.agents/skills/` | `tool_input.command` のパッチの本文 | 0.154.0 |

## フックの実行の条件

- Claude Code は、フックのコマンドに `CLAUDE_PROJECT_DIR` を渡す。サブディレクトリから起動すると、ルートの `.claude/settings.json` のフックは動かなかった。
- Codex CLI は、`CLAUDE_PROJECT_DIR` を設定せず、起動したディレクトリでフックを動かす。コマンドを zsh で動かすので、パイプの最後の `while` の中の `exit` がコマンド全体を終わらせる。
- Codex CLI は、プロジェクトのフックを利用者が承認するまで動かさない。承認はコマンドのハッシュごとで、コマンドを変えると承認し直しになる。
- パッケージマネージャーは、`${CLAUDE_PLUGIN_ROOT}` を含むパスを、Claude Code 用には `${CLAUDE_PROJECT_DIR}` からの絶対パスに、Codex CLI 用には相対パスに書き換える。それ以外のコマンドは、そのまま写す。

## プラグインで入れたときの条件

Claude Code 2.1.290 と Codex CLI 0.145.0 で確かめた。

- どちらも、ルートの `.claude-plugin/marketplace.json` から同じプラグインを入れ、`hooks/hooks.json` とスキルを読む。Codex CLI 用のマニフェストは要らない。
- プラグインのファイルは、利用者のホームの下のキャッシュに置かれる。利用者のリポジトリにはない。
- Codex CLI は、フックのコマンドの `${CLAUDE_PLUGIN_ROOT}` と `${PLUGIN_ROOT}` を、キャッシュのパスに置き換える。フックのプロセスには `CLAUDE_PLUGIN_ROOT` が渡り、`CLAUDE_PROJECT_DIR` は渡らない。
- Codex CLI は、プラグインのフックを利用者が承認するまで動かさない。承認はプラグインとフックの単位で、リポジトリによらない。プラグインのバージョンを上げても、承認は保たれる。
- Codex CLI のプラグインは利用者の単位で入り、入れたすべてのリポジトリでフックが動く。プロジェクトの `.codex/config.toml` の `[plugins."<id>"] enabled` は、読み込むかどうかを変えない。
- Claude Code は、`--scope project` で入れると、プロジェクトの `.claude/settings.json` に書く。マーケットプレイスの `ref` は `extraKnownMarketplaces` に、プラグインは `enabledPlugins` に入る。
