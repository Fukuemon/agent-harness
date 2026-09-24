# ADR の書き方

`adr/template.md` を写して使う。節の順は次のとおり。

1. Status
2. Context
3. Decision
4. Considered Options
5. Consequences。Positive と Negative に分ける

見出しは英語で、Nygard と MADR の形に合わせる。確かめた結果があれば、Decision の後に「Verification」を置く。

- 題は、決定の内容を 1 文で書く。
- Decision を Considered Options より前に置く。読み手は結論から読む。
- 選択肢の表の 1 行目には、採用した案を書く。先頭に「採用:」と付ける。Decision の節と同じ案であることが、表だけを見ても分かるようにする。
- 未決の ADR は「提案」とし、承認に要る確認があれば「承認の条件」の節を Decision の直後に置く。
- 承認した ADR は書き換えない。決定を変えるときは、新しい ADR を書き、古い ADR の状態を「ADR-NNNN に置換」にする。
  - 用語の置き換えは、決定を変えないので、承認した ADR にも適用する。
- ファイル名は、番号と短い主題だけにする。題を変えても、ファイル名は変えない。開いているエディタとリンクが切れる。
- 全体で 1、2 ページに収める。
