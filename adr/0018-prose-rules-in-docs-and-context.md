# ADR-0018: 機械で判定できない文章の規則は、docs のスキル write-prose と、各リポジトリの context に分けて持つ

## Status

承認

## Context

ADR-0005 は、機械で判定できない文章のルールを、このリポジトリのスキル docs-writing の 1 つにまとめると決めた。  
その後、PRD、Design Doc、ADR の書き方は docs のスキル write-design-docs へ、context の書き方は core のスキル write-harness-context へ移った。

- docs-writing に残った規則の多くは、文書の分割、文と段落、表、図、見出しと用語で、このリポジトリに限らず成り立つ。docs を入れた利用者には届かない。
- 残りは、1 文ごとの改行のような好みに近い規則と、用語の選び方のようなこのリポジトリだけの規則である。
- 利用者のリポジトリにも、そのリポジトリだけの文章の規則がある。置き場は決まっていなかった。

## Decision

ADR-0005 の決定のうち、「機械で判定できないルールは、スキル docs-writing の 1 つにまとめる」と、文章のルールの表の docs-writing の行を、次の 3 点で置き換える。ほかの決定は変えない。

- どの文書にも当てはまる文章の規則は、docs のスキル write-prose が持つ。どの Markdown の文書を書くときにも読み込まれる。
- そのリポジトリだけの文章の規則は、そのリポジトリの `context/conventions.md` の Documents の節が持つ。write-prose は、書く前にこの節を読む。食い違うときは、この節に従う。
- このリポジトリの docs-writing は削除する。好みに近い規則とこのリポジトリだけの規則は、このリポジトリの `context/conventions.md` に移す。

## Considered Options

| 選択肢 | 強み | 弱み |
| --- | --- | --- |
| **採用:** docs の write-prose と、各リポジトリの context に分ける | 一般の規則が利用者に届く。リポジトリごとの規則の置き場が決まり、同じ手順で読まれる | 文章の規則が 2 か所に分かれる。write-prose の本文を読まないと、context の節の意味が分からない |
| write-design-docs の本文に足す | スキルが増えない | PRD、Design Doc、ADR、spec を書くときしか読み込まれない。README や context を書くときに届かない |
| docs-writing を縮めて残す | このリポジトリでは今までどおり自動で読み込まれる | 利用者のリポジトリの規則の置き場が決まらない。このリポジトリだけ別の仕組みになる |

## Consequences

### Positive

- 利用者は、docs を入れるだけで一般の文章の規則を使える。
- 文章の指摘を受けたとき、一般の規則なら write-prose へ、そのリポジトリだけの規則なら `context/conventions.md` へ反映する、と置き場を決められる。

### Negative

- write-prose は、どの文書を書くときにも読み込まれるので、スキルの説明が常にコンテキストを使う。
- 好みに近い規則をこのリポジトリの context に移したので、このリポジトリでは context を読まないと守られない。
