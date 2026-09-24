# ADR-0009: パッケージは、用途ごとのプラグインとして packages/ の下に置く

## Status

承認

## Context

利用者は、パッケージを 1 つずつ選んで導入し、1 つずつ外せる必要がある。  
1 つのパッケージは、スキル、フック、フックが呼ぶスクリプトを含む場合がある。

パッケージマネージャーの microsoft/apm が受け付ける形は、次のとおりである。

- スキルの集まり。`skills/<名前>/SKILL.md` を並べた形である。
- フックだけの集まり。
- Claude Code の形式のプラグイン。`plugin.json` と、`skills/` や `hooks/` を持つ。中のスキルやフックを取り出して、対象のコーディングエージェントの場所へ配置する。
- Agent Plugins の公式のスキーマを宣言したプラグイン。対象に Copilot を含まない場合は、配置を拒否する。
  - `docs/src/content/docs/reference/package-types.md:10-22` / [github](https://github.com/microsoft/apm/blob/98616b9430140275a3a7c8fefb25d8d111cecc4e/docs/src/content/docs/reference/package-types.md#L10-L22)
  - `docs/src/content/docs/reference/package-types.md:295-299` / [github](https://github.com/microsoft/apm/blob/98616b9430140275a3a7c8fefb25d8d111cecc4e/docs/src/content/docs/reference/package-types.md#L295-L299)

リポジトリの中のサブディレクトリも、配布元として指定できる。

- `README.md:31` / [github](https://github.com/microsoft/apm/blob/98616b9430140275a3a7c8fefb25d8d111cecc4e/README.md#L31)

パッケージには、コーディングエージェント向けでないファイルも関わる。Git のフックの設定、文章やコミットメッセージのチェックの設定、利用者のリポジトリへ写すテンプレートである。  
microsoft/apm が配置するのは、コーディングエージェントが読む場所だけである。リポジトリのルートの設定ファイルは配置しない。

## Decision

次の 5 点を決めた。

- パッケージは、`packages/<名前>/` の下に 1 つずつ置く。形は Claude Code の形式のプラグインにする。
  - `plugin.json`、`skills/`、`hooks/` を持つ。フックが呼ぶスクリプトも、同じディレクトリに置く。
  - Agent Plugins の公式のスキーマは宣言しない。宣言すると、Claude Code と Codex CLI へ配置できなくなる。
- 利用者は、マニフェストに `Fukuemon/agent-harness/packages/<名前>` とタグを書いて導入する。
- パッケージマネージャーを使わない利用者のために、リポジトリのルートに、Claude Code の形式のプラグインの一覧を 1 つ置く。Claude Code と Codex CLI は、どちらもこの一覧からプラグインを導入できる。
  - Codex CLI の公式文書は、Claude Code の形式の一覧とプラグインを読めると書いている。
    - [Codex の公式文書](https://developers.openai.com/codex/llms-full.txt) — プラグインの一覧の形式を定めた節
- Git のフックの設定は、lefthook の `remotes` で配る。利用者は、このリポジトリの URL とタグを、自分の `lefthook.yml` に書く。
  - Git のフックが呼ぶスクリプトは、lefthook の決まりに従い、このリポジトリのルートのディレクトリに置く。
  - `docs/configuration/remotes.md` / [github](https://github.com/evilmartians/lefthook/blob/1e23553eec2392753c5420d348e63a63f517cd45/docs/configuration/remotes.md)
- 利用者のリポジトリへ写すテンプレートは、スキルの `assets/` に置く。スキルが、利用者の求めに応じて写す。

パッケージ同士は依存させない。1 つのパッケージは、ほかのパッケージがなくても動く。

リポジトリの構成は、次のとおりにする。

```text
agent-harness/
├── .claude-plugin/
│   └── marketplace.json        パッケージの一覧
├── packages/
│   └── <パッケージの名前>/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       ├── skills/
│       │   └── <スキルの名前>/
│       │       ├── SKILL.md
│       │       └── assets/     利用者のリポジトリへ写すテンプレート
│       └── hooks/              hooks.json と、フックが呼ぶスクリプト
├── lefthook/
│   └── <パッケージの名前>.yml  lefthook の remotes で配る設定
├── .lefthook/                  Git のフックが呼ぶスクリプト
├── skills/                     このリポジトリの開発に使うスキル
├── adr/
├── PRD.md
├── DesignDoc.md
├── apm.yml
└── apm.lock.yaml
```

- Git のフックが呼ぶスクリプトを `.lefthook/` に置くのは、lefthook の決まりによる。`remotes` で配るスクリプトのディレクトリは、配る側のリポジトリのルートに置く必要がある。

文章とコミットメッセージのチェックの設定の配り方は、この決定の範囲に含めない。  
このリポジトリの開発に使っている `skills/` の 3 つのスキルを、パッケージにするかどうかも、この決定の範囲に含めない。

## Verification

このリポジトリのパッケージを作る前に、公開されているプラグインを代わりに使って確かめた。

- リポジトリのサブディレクトリにある、フックを持つ Claude Code の形式のプラグインを、タグを指定して導入できた。フックの設定とスクリプトが、Claude Code と Codex CLI の両方へ配置された。ロックファイルには、タグ、コミット、サブディレクトリが記録された。
- 同じ形の試験用のプラグインで、配置したフックが Claude Code と Codex CLI のセッションの中で発火することを確かめた。Codex CLI では、利用者がプロジェクトのフックを信頼する必要がある。
- lefthook の `remotes` に、ほかのリポジトリの URL とタグを書くと、そのリポジトリの設定のジョブが読み込まれた。
  - スクリプトを配る場合、スクリプトのディレクトリは、配る側のリポジトリのルートに置く必要がある。`packages/` の下には置けない。
- ルートに Claude Code の形式の一覧を置き、その一覧から、Claude Code と Codex CLI の標準の方法でプラグインを導入できた。どちらでも、フックが発火し、スキルが読み込まれた。
  - Claude Code は、プロジェクトの単位で導入できる。Codex CLI は、利用者の単位で導入する。

## Considered Options

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** `packages/` の下に、用途ごとのプラグインを置く | 1 つずつ選んで導入できる。パッケージマネージャーでも、標準の方法でも導入できる | パッケージの数だけ `plugin.json` を保守する |
| リポジトリ全体を 1 つのプラグインにする | 構成が最も単純 | フックを選んで導入できない。1 つだけ外すことができない |
| microsoft/apm の専用の配置にする。`.apm/` の下にスキルやフックを並べる | スキルやフックを 1 つずつ配置できる | パッケージの本体が、1 つのパッケージマネージャーに依存する |
| パッケージごとにリポジトリを分ける | パッケージごとにバージョンを付けられる | リポジトリの数が増え、共通の変更が複数のリポジトリにまたがる |

## Consequences

### Positive

- 利用者は、必要なパッケージだけをマニフェストに書ける。
- パッケージの本体は、Claude Code の形式のプラグインである。パッケージマネージャーを替えても、作り直さずに済む。

### Negative

- 導入の方法が、パッケージマネージャー、コーディングエージェントの標準の方法、lefthook の 3 つになる。利用者への説明が増える。
- リポジトリ全体で 1 つのバージョンにしているため、1 つのパッケージの変更でも、全パッケージのタグが上がる。
