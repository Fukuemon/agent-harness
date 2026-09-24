# ADR-0012: チェックとフックのスクリプトは Node.js で書く

## Status

承認

## Context

パッケージのチェックとフックは、利用者のリポジトリの中で動くスクリプトである。  
値のファイルの YAML を読み、JSON Schema で検証し、Git とコーディングエージェントのフックから呼ばれる。  
スクリプトの言語は、利用者に要求するランタイムを決める。

- 文章のチェックの textlint と、Git のフックの lefthook は、Node.js で動く。文書の体系を使う利用者は、既に Node.js を持つ。
- パッケージマネージャーの microsoft/apm は Python で動く。uv の一時実行で常設せずに使える。
- YAML の読み取りと JSON Schema の検証は、Node.js では `yaml` と `ajv`、Python では `PyYAML` と `jsonschema` がある。shell だけでは、`yq` のような外部のコマンドが要る。

## Decision

次の 3 点を決めた。

- チェックとフックのスクリプトは、Node.js で書く。利用者には Node.js の 22.12 以上を前提にする。
- 依存するライブラリは、YAML の読み取りと JSON Schema の検証に限る。
- スクリプトは、引数と終了コードで結果を返す。0 は問題なし、1 は報告あり、2 は設定の誤りである。標準出力は人が読む形、`--json` で機械が読む形にする。

## Considered Options

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** Node.js | textlint と lefthook が既に要求している。ライブラリが揃う | Node.js を持たない利用者には、新しい前提になる |
| Python | apm と同じ。uv で常設せずに動かせる | Node.js と Python の両方を要求することになる |
| shell だけ | ランタイムを要求しない | YAML と JSON Schema の扱いに外部のコマンドが要る。移植性が低い |
| Deno か Bun | 単一のバイナリで配れる | 利用者に新しいランタイムを要求する。lefthook と textlint の前提と重ならない |

## Consequences

### Positive

- 利用者に要求するランタイムが、文書の体系とガードレールで同じになる。
- lefthook のフックから、同じスクリプトを呼べる。

### Negative

- Node.js を持たないリポジトリでは、ガードレールだけを入れる場合も Node.js が要る。
- ライブラリの更新に追従する必要がある。
