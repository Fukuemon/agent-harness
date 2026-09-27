# ADR の書き方

`adr/template.md` を写して使う。ファイル名は、番号と短い主題だけにする。題を変えても、ファイル名は変えない。

## 節の構成

1. Status。提案、承認、却下、ADR-NNNN に置換、のどれか。語だけを書き、日付は書かない。
2. Context。何を決める必要があるか。決定に関わる制約と事実だけを書く。
3. Decision。何をどうするか。理由を添える。出典は、根拠になる文の直後に置く。
4. Considered Options。選択肢ごとの強みと弱みの表。1 行目に採用した案を「採用:」と付けて書く。
5. Consequences。Positive と Negative に分ける。

見出しは英語で、Nygard と MADR の形に合わせる。確かめた結果があれば、Decision の後に「Verification」を置く。

- 出典: [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- 出典: [MADR](https://adr.github.io/madr/)

## 書き方

- 題は、決定の内容を 1 文で書く。
- Decision を Considered Options より前に置く。読み手は結論から読む。
- 選択肢の表の 1 行目には、採用した案を書く。Decision の節と同じ案であることが、表だけを見ても分かるようにする。
- 未決の ADR は「提案」とし、承認に要る確認があれば「承認の条件」の節を Decision の直後に置く。
- 承認した ADR は書き換えない。決定を変えるときは、新しい ADR を書き、古い ADR の状態を「ADR-NNNN に置換」にする。用語の置き換えは、決定を変えないので、承認した ADR にも適用する。
- 全体で 1、2 ページに収める。
