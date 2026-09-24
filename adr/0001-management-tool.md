# ADR-0001: 拡張機能のパッケージマネージャーに microsoft/apm を使う

## Status

承認

## Context

agent-harness は、拡張機能の取得、バージョンの固定、配置、更新を自作せず、既存のパッケージマネージャーを 1 つ使う。  
パッケージマネージャーには 3 つを求める。

- マニフェストとロックファイルから同じバージョンを再現できる。
- 環境を変えずに差分を確認できる。
- Claude Code と Codex CLI に配置できる。

導入したいサードパーティの拡張機能には、スキルだけのものと、フックを含むプラグインがある。  
サードパーティの配布元は、特定のパッケージマネージャー向けの設定を持たない。

## Decision

microsoft/apm を使う。理由は 3 つある。

- 導入したいプラグインを、配布元に手を入れずに導入できる選択肢は、これだけである。
  - `docs/src/content/docs/reference/targets-matrix.md:20-26` / [github](https://github.com/microsoft/apm/blob/98616b9430140275a3a7c8fefb25d8d111cecc4e/docs/src/content/docs/reference/targets-matrix.md#L20-L26)
- 保守が 1 人に依存していない。
- 配置の結果がコーディングエージェントの標準のファイルなので、マニフェストを捨てても環境が残る。採用をやめるコストが低い。
  - `docs/src/content/docs/reference/targets-matrix.md:142-149` / [github](https://github.com/microsoft/apm/blob/98616b9430140275a3a7c8fefb25d8d111cecc4e/docs/src/content/docs/reference/targets-matrix.md#L142-L149)

マニフェストは、リポジトリのルートの `apm.yml` である。  
配布元は `owner/repo` の形で書き、`#` の後ろに tag か commit を書いてバージョンを固定する。

```yaml
name: agent-harness
version: 0.1.0
targets: [claude, codex]
dependencies:
  apm:
    - tt-a1i/archify/archify#v2.16.0
    - ./skills/docs-writing
```

## 実機の検証の結果

microsoft/apm の v0.31.0 を、常設のインストールをせずに一時実行で確認した。

- **ロックファイルからの再現: 合格。**
  - マニフェストとロックファイルだけを置いた空のディレクトリで導入し、配置されたファイルがすべて一致した。
  - 再実行では「変更なし」と報告され、ロックファイルも変わらなかった。
- **フックを含むプラグインの動作: 合格。**
  - フックの設定が Claude Code と Codex CLI の設定ファイルへ統合され、フックの中のパスが配置先へ書き換えられた。
  - セッションの開始、プロンプトの送信、ファイルの編集の後の 3 つのフックを持つ試験用のパッケージを配置し、実際のセッションで発火を確かめた。
  - Claude Code では、3 つとも発火した。
  - Codex CLI では、プロジェクトのフックを利用者が信頼するまで発火しない。信頼を与えると、3 つとも発火した。
    - [Codex の設定の公式文書](https://developers.openai.com/codex/llms-full.txt) — 「Project-local hooks load only when the project .codex/ layer is trusted」と書いている
- **管理していないファイルの保持: 合格。**
  - 管理していないスキルと、設定ファイルの中の利用者のキーは、導入と取り外しの後も残った。
  - 取り外しでは、統合したフックだけが設定ファイルから消えた。
- **管理しているファイルへの手の編集: 上書きされる。**
  - 差分の確認は、編集されたファイルを「modified」として報告する。
  - その後の導入は、確認を求めずに元の内容へ戻す。
- **リポジトリ内の自作のスキル: 配置できる。**
  - マニフェストに相対パスで書くと、サードパーティの拡張機能と同じ場所へ配置された。
- **Claude Code での読み込み: 合格。**
  - プロジェクトへ配置したスキルは、実行中の Claude Code のセッションに、利用できるスキルとして現れた。

検証で分かった注意点は 3 つある。

- リポジトリのルートにスキルやプラグインの定義がない配布元は、そのままでは導入できない。リポジトリ内のスキルのディレクトリまでを書く必要がある。
- 公式の案内は、配置されたファイルもコミットするよう勧めている。従うと、サードパーティの拡張機能の本文がリポジトリに入る。
  - `docs/src/content/docs/consumer/install-packages.md:129-137` / [github](https://github.com/microsoft/apm/blob/98616b9430140275a3a7c8fefb25d8d111cecc4e/docs/src/content/docs/consumer/install-packages.md#L129-L137)
- 導入のたびに、GitHub の認証情報を使って、利用者の組織の方針のリポジトリを探しにいく。見つからない場合は警告を出して続行する。
- マニフェストをコミットできないリポジトリでは、きれいには使えない。
  - 関係するファイルを、そのリポジトリの中だけの無視の設定に入れて試した。スキルだけの拡張機能は配置できた。
  - ただし、導入のたびに、Git で管理されている `.gitignore` が書き換えられる。
  - フックを含む拡張機能は、Git で管理されている設定ファイルへ統合されるため、変更を隠せない。

global への配置は確認していない。利用者のホームを変更するためである。

## Considered Options


| 選択肢                    | 強み                                                             | 弱み                                                                                           |
| ---------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **採用:** microsoft/apm          | パッケージマネージャー向けの設定を持たないプラグインも、フックを含めて導入できる。配置の結果がコーディングエージェントの標準のファイル。複数の貢献者 | 1.0 より前。commit は 1 人に集中                                                                      |
| vanillagreencom/kendex | global とプロジェクトのマニフェスト、適用の前の差分の表示、プロジェクトごとの設定値。求めることに最も近い設計     | commit のほぼすべてが 1 人。プラグインは Claude Code で有効と無効の切り替えだけ。フックなどの実行物は、kendex の配置の規約を持つ配布元からしか導入できない |
| dyoshikawa/rulesync    | 規約、スキル、フックを独自の元ファイルから各コーディングエージェントへ生成。ロックファイルあり                      | commit のほぼすべてが 1 人。global の規約の生成は一部のコーディングエージェントだけ                                                 |
| 複数のパッケージマネージャーの併用            | 用途ごとに得意なツールを使える                                                | 同じ置き場所と設定へ書き込み、ロックファイルが複数になる                                                                 |
| 自作                     | 求めることに合わせられる                                                   | 同じ機能を公開のツールが提供している。コーディングエージェントの仕様変更のたびに保守が要る                                                       |


- vanillagreencom/kendex のプラグインへの対応と、実行物を導入できる条件
  - `README.md:50-53` / [github](https://github.com/vanillagreencom/kendex/blob/64929c2f8b7534552b8f6de1f916b3412f9030df/README.md#L50-L53)
  - `docs/authoring/README.md:28` / [github](https://github.com/vanillagreencom/kendex/blob/64929c2f8b7534552b8f6de1f916b3412f9030df/docs/authoring/README.md#L28)
- dyoshikawa/rulesync のロックファイルと、global の構成の範囲
  - `docs/guide/declarative-sources.md:116` / [github](https://github.com/dyoshikawa/rulesync/blob/2dbe02764eae2fb05d643d73eee4d6ffe8546974/docs/guide/declarative-sources.md#L116)
  - `docs/guide/global-mode.md:5` / [github](https://github.com/dyoshikawa/rulesync/blob/2dbe02764eae2fb05d643d73eee4d6ffe8546974/docs/guide/global-mode.md#L5)

比較した時点のリリースは、microsoft/apm が v0.31.0、vanillagreencom/kendex が v5.0.1、dyoshikawa/rulesync が v16.39.0。いずれも MIT。

## Consequences

### Positive

- 配布と再現の仕組みの保守がなくなる。
- マニフェストとロックファイルを Git で管理でき、第三者と CI が同じ構成を再現できる。
- マニフェストを捨てても環境が残るため、後で別のツールへ替えやすい。

### Negative

- 1.0 より前のツールに依存する。仕様が変わる可能性がある。
- Claude Code の標準のプラグインの仕組みを使わないため、Claude Code のプラグインの一覧には表示されない。スキルの名前にプラグインの名前が付かない。
- 配置されたファイルをコミットしない場合、clone の後に導入のコマンドを実行するまで、拡張機能が使えない。
- 管理しているファイルを手で直しても、次の導入で元に戻る。直したい場合は、配布元を fork して指す必要がある。
