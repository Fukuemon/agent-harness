# ADR-0016: ツールの版は mise で管理し、テンプレートの既定にする

## Status

承認

## Context

このリポジトリが要求する Node.js の版は、CONTRIBUTING.md の文にしかなく、機械が読める場所になかった。  
CI は別の場所に版を書いていて、手元と CI の版が揃う保証がなかった。

- ADR-0012 は、利用者に前提とする Node.js の版を定める。このリポジトリ自身が開発に使う版の置き場は、決めていなかった。
- 利用者のリポジトリにも同じ問題がある。CONTRIBUTING.md のテンプレートは、必要なランタイムとツールを書く欄を持つが、版の置き場の既定を示していなかった。
- 版の管理のツールは、Node.js だけを扱うものと、複数のツールを 1 つの設定で扱うものがある。このリポジトリは Node.js と pnpm の 2 つを要求する。

## Decision

次の 3 点を決めた。

- このリポジトリは、Node.js と pnpm の版を `mise.toml` に書き、mise で入れる。CI も mise で同じ版を入れる。
- CONTRIBUTING.md のテンプレートの「開発の準備」は、mise を既定として書く。版の管理に別のツールを使う利用者は、本文を書き換える。
- 利用者に前提とする Node.js の版は、引き続き ADR-0012 が定める。このリポジトリが開発に使う版とは別である。

## Considered Options

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** mise | 複数のツールを 1 つの設定で扱う。CI 用の Action がある。`.node-version` と `.tool-versions` も読める | 利用者に mise の導入を求める。設定ファイルを信頼させる手順がある |
| `.node-version` と corepack | Node.js の管理ツールの多くが読む。追加の導入がない | pnpm の版は corepack が担い、Node.js と別の仕組みになる。corepack は Node.js の同梱から外れる予定がある |
| package.json の `engines` だけ | 追加のファイルがない | 版を宣言するだけで、入れる手段がない。警告を無視できる |
| asdf と `.tool-versions` | 複数のツールを扱う | mise が同じ形式を読み、速い。asdf を選ぶ理由がない |

## Consequences

### Positive

- 手元と CI が同じ版で動く。版を上げる変更が、`mise.toml` の 1 行の差分になる。
- 利用者のリポジトリでも、テンプレートの既定に従えば、版の置き場が揃う。

### Negative

- このリポジトリの開発に mise の導入が要る。
- mise は設定ファイルを信頼させる手順を求める。clone した直後に `mise trust` が要る。
