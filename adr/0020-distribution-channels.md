# ADR-0020: パッケージマネージャーを推奨の導入の方法とし、プラグインはコーディングエージェントのスキルとフックだけを届ける

## Status

承認

## Context

ADR-0009 で、パッケージを Claude Code の形式のプラグインにし、導入の方法をパッケージマネージャー、コーディングエージェントの標準の方法、lefthook の 3 つにした。  
どの方法で何が届くかと、利用者にどれを勧めるかは決めていなかった。

- ADR-0017 で、利用者の lefthook と CI は、パッケージマネージャーが利用者のリポジトリに配置したスクリプトを呼ぶことにした。
- プラグインのファイルは、利用者のホームの下のキャッシュに置かれる。パスは利用者のホームとバージョンで変わり、利用者のリポジトリと CI にはない。
- Agent Skills の形式のスキルだけを配る CLI（`npx skills`）でも、このリポジトリのスキルを入れられる。
- 利用者のリポジトリでフックが動くのは、導入のスキルが `context/project.yml` を置いた後を想定している。

## Decision

次の 4 点を決めた。

- パッケージマネージャーを、推奨の導入の方法にする。
  - バージョンをロックファイルで固定でき、lefthook と CI から文書のチェックを呼べるのは、この方法だけである。
- プラグインは、コーディングエージェントのスキルとフックだけを届ける方法として案内する。
  - Claude Code と Codex CLI の両方が、ルートの `.claude-plugin/marketplace.json` から、同じプラグインを入れる。Codex CLI 用のマニフェストは置かない。
  - lefthook と CI の文書のチェックが要る利用者には、パッケージマネージャーを勧める。プラグインのキャッシュを lefthook と CI から呼ぶ仕組みは作らない。
  - Codex CLI の制約を、導入の案内に書く。プラグインは利用者の単位で入り、入れたすべてのリポジトリで有効になる。プロジェクトの単位では有効と無効を切り替えられず、バージョンの固定も共有できない。入れた後に、フックを 1 度承認する。
- フックは、`context/project.yml` がないリポジトリでは何もせずに終わる。
  - Codex CLI のプラグインは、agent-harness を導入していないリポジトリでもフックを動かすためである。
- スキルだけを配る CLI は、スキルだけが届く方法として一行で案内する。フックは届かない。

## Verification

Claude Code 2.1.290、Codex CLI 0.145.0、apm 0.32.0、skills 1.7.0 で、設定のディレクトリを作業用に分けて確かめた。

- Codex CLI は、`codex plugin marketplace add <このリポジトリ>` と `codex plugin add core@agent-harness` で、Claude Code の形式のプラグインを入れた。`hooks/hooks.json` のフックとスキルが読まれた。
- Codex CLI は、フックのコマンドの `${CLAUDE_PLUGIN_ROOT}` を、プラグインのキャッシュのパスに置き換えた。フックのプロセスには `CLAUDE_PLUGIN_ROOT` が渡り、`CLAUDE_PROJECT_DIR` は渡らなかった。作業ディレクトリは、Codex CLI を起動したディレクトリだった。
- Codex CLI の承認は `config.toml` の `hooks.state` に、プラグインとフックの単位で入った。プラグインのバージョンを上げても、承認は保たれた。
- Codex CLI では、プロジェクトの `.codex/config.toml` に `[plugins."<id>"] enabled` を書いても、プラグインを読み込むかは変わらなかった。利用者の設定だけで決まった。入れたプラグインは、マーケットプレイスを持たない別のリポジトリでもフックを動かした。
- Claude Code は、プロジェクトの単位でマーケットプレイスとプラグインを入れると、`.claude/settings.json` に `ref` と `enabledPlugins` を書いた。
  - マーケットプレイスは `claude plugin marketplace add --scope project "Fukuemon/agent-harness#v0.1.0"` で入れた。
  - プラグインは `claude plugin install --scope project core@agent-harness` で入れた。
- apm は、パッケージに `.codex-plugin/plugin.json` を足しても、配置先を変えなかった。
- `npx skills add Fukuemon/agent-harness` は、`packages/*/skills/` の 9 個のスキルを見つけた。タグを指定すると、`skills-lock.json` に `ref` が残った。

## Considered Options

lefthook と CI の文書のチェックを届ける範囲の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** パッケージマネージャーだけで届ける | ADR-0017 の仕組みのまま、追加の取得の手段が要らない | プラグインで入れた利用者は、lefthook と CI のチェックを使えない |
| CI でプラグインを入れ、キャッシュから呼ぶ | プラグインだけで入れた利用者も使える | CI にコーディングエージェントの CLI が要る。キャッシュのパスを探す処理を持つ |
| プラグインの設定の `ref` を読み、このリポジトリを取得して呼ぶ | CI にコーディングエージェントの CLI が要らない | 取得とバージョンの固定を自前で持ち、パッケージマネージャーを作り直すのに近い |

Codex CLI へプラグインを届ける形の選択肢。

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** Claude Code の形式のプラグインと一覧を共有する | マニフェストとバージョンが 1 つで済む | Codex CLI の一覧の表示名やアイコンを指定できない |
| Codex CLI 用のマニフェストと一覧を足す | Codex CLI の表示を指定できる | マニフェストごとにバージョンをそろえる仕組みが要る |

## Consequences

### Positive

- 利用者は、導入の方法ごとに何が届くかを読んでから選べる。
- Codex CLI のプラグインで入れても、agent-harness を導入していないリポジトリの作業を妨げない。
- マニフェストとバージョンを持つファイルが増えない。ADR-0019 のリリースの設定を変えずに済む。

### Negative

- フックに、`context/project.yml` の有無を確かめる処理が加わる。
- 導入のスキル setup-agent-harness と setup-design-docs は、パッケージマネージャーで入れた前提の手順を持つ。プラグインで入れた利用者のために、飛ばす手順を書き分ける必要がある。
- Codex CLI のプラグインの制約は、Codex CLI の変更で変わりうる。確かめたバージョンを `context/coding-agents.md` に残し、上げるたびに確かめ直す。
